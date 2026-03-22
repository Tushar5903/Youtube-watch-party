import EventEmitter from "eventemitter3";
import { OPCODE } from "./data";
import { EVENT } from "./events";

export class BaseClient extends EventEmitter {
  constructor() {
    super();
    this._ws = undefined;
    this._peer = undefined;
    this._channel = undefined;
    this._timeout = undefined;
    this._displayname = undefined;
    this._state = "disconnected";
    this._id = "";
    this._candidates = [];
  }

  get id() {
    return this._id;
  }

  get supported() {
    return (
      typeof RTCPeerConnection !== "undefined" &&
      typeof RTCPeerConnection.prototype.addTransceiver !== "undefined"
    );
  }

  get socketOpen() {
    return (
      typeof this._ws !== "undefined" && this._ws.readyState === WebSocket.OPEN
    );
  }

  get peerConnected() {
    return (
      typeof this._peer !== "undefined" &&
      ["connected", "checking", "completed"].includes(this._state)
    );
  }

  get connected() {
    return this.peerConnected && this.socketOpen;
  }

  connect(url, password, displayname) {
    if (this.socketOpen) {
      this.emit("warn", `attempting to create websocket while connection open`);
      return;
    }

    if (!this.supported) {
      this.onDisconnected(
        new Error(
          "browser does not support webrtc (RTCPeerConnection missing)"
        )
      );
      return;
    }

    this._displayname = displayname;
    this[EVENT.CONNECTING]();

    try {
      this._ws = new WebSocket(
        `${url}?password=${encodeURIComponent(password)}`
      );
      this.emit("debug", `connecting to ${this._ws.url}`);
      this._ws.onmessage = this.onMessage.bind(this);
      this._ws.onerror = (err) => this.onError(err);
      this._ws.onclose = () =>
        this.onDisconnected(new Error("websocket closed"));
      
      this._timeout = window.setTimeout(this.onTimeout.bind(this), 15000);
    } catch (err) {
      this.onDisconnected(err);
    }
  }

  disconnect() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }

    if (this._ws) {
      this._ws.onmessage = () => {};
      this._ws.onerror = () => {};
      this._ws.onclose = () => {};

      try {
        this._ws.close();
      } catch (err) {}

      this._ws = undefined;
    }

    if (this._channel) {
      this._channel.onmessage = () => {};
      this._channel.onerror = () => {};
      this._channel.onclose = () => {};

      try {
        this._channel.close();
      } catch (err) {}

      this._channel = undefined;
    }

    if (this._peer) {
      this._peer.onconnectionstatechange = () => {};
      this._peer.onsignalingstatechange = () => {};
      this._peer.oniceconnectionstatechange = () => {};
      this._peer.ontrack = () => {};

      try {
        this._peer.close();
      } catch (err) {}

      this._peer = undefined;
    }

    this._state = "disconnected";
    this._displayname = undefined;
    this._id = "";
  }

  sendData(event, data) {
    if (!this.connected) {
      this.emit("warn", `attempting to send data while disconnected`);
      return;
    }

    let buffer;
    let payload;
    
    switch (event) {
      case "mousemove":
        buffer = new ArrayBuffer(7);
        payload = new DataView(buffer);
        payload.setUint8(0, OPCODE.MOVE);
        payload.setUint16(1, 4, true);
        payload.setUint16(3, data.x, true);
        payload.setUint16(5, data.y, true);
        break;
      case "wheel":
        buffer = new ArrayBuffer(7);
        payload = new DataView(buffer);
        payload.setUint8(0, OPCODE.SCROLL);
        payload.setUint16(1, 4, true);
        payload.setInt16(3, data.x, true);
        payload.setInt16(5, data.y, true);
        break;
      case "keydown":
      case "mousedown":
        buffer = new ArrayBuffer(11);
        payload = new DataView(buffer);
        payload.setUint8(0, OPCODE.KEY_DOWN);
        payload.setUint16(1, 8, true);
        payload.setBigUint64(3, BigInt(data.key), true);
        break;
      case "keyup":
      case "mouseup":
        buffer = new ArrayBuffer(11);
        payload = new DataView(buffer);
        payload.setUint8(0, OPCODE.KEY_UP);
        payload.setUint16(1, 8, true);
        payload.setBigUint64(3, BigInt(data.key), true);
        break;
      default:
        this.emit("warn", `unknown data event: ${event}`);
    }

    if (typeof buffer !== "undefined" && this._channel) {
      this._channel.send(buffer);
    }
  }

  sendMessage(event, payload) {
    if (!this.connected) {
      this.emit("warn", `attempting to send message while disconnected`);
      return;
    }
    this.emit(
      "debug",
      `sending event '${event}' ${payload ? `with payload: ` : ""}`,
      payload
    );
    this._ws.send(JSON.stringify({ event, ...payload }));
  }

  async createPeer(lite, servers) {
    this.emit("debug", `creating peer`);
    if (!this.socketOpen) {
      this.emit(
        "warn",
        `attempting to create peer with no websocket: `,
        this._ws ? `state: ${this._ws.readyState}` : "no socket"
      );
      return;
    }

    if (this.peerConnected) {
      this.emit("warn", `attempting to create peer while connected`);
      return;
    }

    if (lite !== true) {
      this._peer = new RTCPeerConnection({
        iceServers: servers,
      });
    } else {
      this._peer = new RTCPeerConnection();
    }

    this._peer.onconnectionstatechange = () => {
      this.emit(
        "debug",
        `peer connection state changed`,
        this._peer ? this._peer.connectionState : undefined
      );
    };

    this._peer.onsignalingstatechange = () => {
      this.emit(
        "debug",
        `peer signaling state changed`,
        this._peer ? this._peer.signalingState : undefined
      );
    };

    this._peer.oniceconnectionstatechange = () => {
      this._state = this._peer.iceConnectionState;

      this.emit(
        "debug",
        `peer ice connection state changed: ${this._peer.iceConnectionState}`
      );

      switch (this._state) {
        case "checking":
          if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
          }
          break;
        case "connected":
          this.onConnected();
          break;
        case "disconnected":
          this[EVENT.RECONNECTING]();
          break;
        case "failed":
          this.onDisconnected(new Error("peer failed"));
          break;
        case "closed":
          this.onDisconnected(new Error("peer closed"));
          break;
      }
    };

    this._peer.ontrack = this.onTrack.bind(this);

    this._peer.onicecandidate = (event) => {
      if (!event.candidate) {
        this.emit("debug", `sent all local ICE candidates`);
        return;
      }

      const init = event.candidate.toJSON();
      this.emit("debug", `sending local ICE candidate`, init);

      this._ws.send(
        JSON.stringify({
          event: EVENT.SIGNAL.CANDIDATE,
          data: JSON.stringify(init),
        })
      );
    };

    this._peer.onnegotiationneeded = async () => {
      this.emit("warn", `negotiation is needed`);

      const d = await this._peer.createOffer();
      await this._peer.setLocalDescription(d);

      this._ws.send(
        JSON.stringify({
          event: EVENT.SIGNAL.OFFER,
          sdp: d.sdp,
        })
      );
    };

    this._channel = this._peer.createDataChannel("data");
    this._channel.onerror = this.onError.bind(this);
    this._channel.onmessage = this.onData.bind(this);
    this._channel.onclose = () =>
      this.onDisconnected(new Error("peer data channel closed"));
  }

  async setRemoteOffer(sdp) {
    if (!this._peer) {
      this.emit("warn", `attempting to set remote offer while disconnected`);
      return;
    }

    await this._peer.setRemoteDescription({ type: "offer", sdp });

    for (const candidate of this._candidates) {
      await this._peer.addIceCandidate(candidate);
    }
    this._candidates = [];

    try {
      const d = await this._peer.createAnswer();

      // add stereo=1 to answer sdp to enable stereo audio for chromium
      d.sdp = d.sdp?.replace(
        /(stereo=1;)?useinbandfec=1/,
        "useinbandfec=1;stereo=1"
      );

      this._peer.setLocalDescription(d);

      this._ws.send(
        JSON.stringify({
          event: EVENT.SIGNAL.ANSWER,
          sdp: d.sdp,
          displayname: this._displayname,
        })
      );
    } catch (err) {
      this.emit("error", err);
    }
  }

  async setRemoteAnswer(sdp) {
    if (!this._peer) {
      this.emit("warn", `attempting to set remote answer while disconnected`);
      return;
    }

    await this._peer.setRemoteDescription({ type: "answer", sdp });
  }

  async onMessage(e) {
    const payloadWithEvent = JSON.parse(e.data);
    const { event, ...payload } = payloadWithEvent;

    this.emit(
      "debug",
      `received websocket event ${event} ${payload ? `with payload: ` : ""}`,
      payload
    );

    if (event === EVENT.SIGNAL.PROVIDE) {
      const { sdp, lite, ice, id } = payload;
      this._id = id;
      await this.createPeer(lite, ice);
      await this.setRemoteOffer(sdp);
      return;
    }

    if (event === EVENT.SIGNAL.OFFER) {
      const { sdp } = payload;
      await this.setRemoteOffer(sdp);
      return;
    }

    if (event === EVENT.SIGNAL.ANSWER) {
      const { sdp } = payload;
      await this.setRemoteAnswer(sdp);
      return;
    }

    if (event === EVENT.SIGNAL.CANDIDATE) {
      const { data } = payload;
      const candidate = JSON.parse(data);
      if (this._peer) {
        this._peer.addIceCandidate(candidate);
      } else {
        this._candidates.push(candidate);
      }
      return;
    }

    if (typeof this[event] === "function") {
      this[event](payload);
    } else {
      this[EVENT.MESSAGE](event, payload);
    }
  }

  onData(e) {
    this[EVENT.DATA](e.data);
  }

  onTrack(event) {
    this.emit(
      "debug",
      `received ${event.track.kind} track from peer: ${event.track.id}`,
      event
    );
    const stream = event.streams[0];
    if (!stream) {
      this.emit(
        "warn",
        `no stream provided for track ${event.track.id}(${event.track.label})`
      );
      return;
    }
    this[EVENT.TRACK](event);
  }

  onError(event) {
    this.emit("error", event.error || event);
  }

  onConnected() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }

    if (!this.connected) {
      this.emit("warn", `onConnected called while being disconnected`);
      return;
    }

    this.emit("debug", `connected`);
    this[EVENT.CONNECTED]();
  }

  onTimeout() {
    this.emit("debug", `connection timeout`);
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }
    this.onDisconnected(new Error("connection timeout"));
  }

  onDisconnected(reason) {
    this.disconnect();
    this.emit("debug", `disconnected:`, reason);
    this[EVENT.DISCONNECTED](reason);
  }

  [EVENT.MESSAGE](event, payload) {
    this.emit("warn", `unhandled websocket event '${event}':`, payload);
  }

  // Placeholder "abstract" methods
  [EVENT.RECONNECTING]() { throw new Error("Method not implemented"); }
  [EVENT.CONNECTING]() { throw new Error("Method not implemented"); }
  [EVENT.CONNECTED]() { throw new Error("Method not implemented"); }
  [EVENT.DISCONNECTED](reason) { throw new Error("Method not implemented"); }
  [EVENT.TRACK](event) { throw new Error("Method not implemented"); }
  [EVENT.DATA](data) { throw new Error("Method not implemented"); }
}