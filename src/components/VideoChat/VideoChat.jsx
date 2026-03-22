import React, { useEffect, useCallback, useContext, useState } from "react";
import { ActionIcon, Button } from "@mantine/core";

import {
  formatTimestamp,
  getOrCreateClientId,
  getColorForStringHex,
  getDefaultPicture,
  iceServers,
  softWhite,
} from "../../utils/utils";
import { UserMenu } from "../UserMenu/UserMenu";
import { MetadataContext } from "../../MetadataContext";
import {
  IconDotsVertical,
  IconMicrophone,
  IconScreenShare,
  IconVideo,
  IconX,
} from "@tabler/icons-react";

export const VideoChat = ({
  socket,
  participants,
  pictureMap,
  nameMap,
  tsMap,
  rosterUpdateTS,
  owner,
  getLeaderTime,
}) => {
  const context = useContext(MetadataContext);
  const [localUpdate, setLocalUpdate] = useState(0); // Used to force re-render for stream toggles
  const forceUpdate = () => setLocalUpdate((n) => n + 1);

  const selfId = getOrCreateClientId();

  // --- WebRTC Logic ---

  const sendSignal = useCallback((to, data) => {
    console.log("send", to, data);
    socket.emit("signal", { to, msg: data });
  }, [socket]);

  const handleSignal = useCallback(async (data) => {
    const msg = data.msg;
    const from = data.from;
    const pc = window.watchparty.videoPCs[from];

    if (!pc) return;

    console.log("recv", from, data);
    if (msg.ice !== undefined) {
      pc.addIceCandidate(new RTCIceCandidate(msg.ice));
    } else if (msg.sdp && msg.sdp.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, { sdp: pc.localDescription });
    } else if (msg.sdp && msg.sdp.type === "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
  }, [sendSignal]);

  const getAudioWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    return ourStream && ourStream.getAudioTracks()[0]?.enabled;
  };

  const getVideoWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    return ourStream && ourStream.getVideoTracks()[0]?.enabled;
  };

  const emitUserMute = useCallback(() => {
    socket.emit("CMD:userMute", { isMuted: !getAudioWebRTC() });
  }, [socket]);

  const updateWebRTC = useCallback(() => {
    const ourStream = window.watchparty.ourStream;
    const videoPCs = window.watchparty.videoPCs;
    const videoRefs = window.watchparty.videoRefs;

    if (!ourStream) return;

    const clientIds = new Set(
      participants.filter((p) => p.isVideoChat).map((p) => p.id)
    );

    // Cleanup disconnected users
    Object.entries(videoPCs).forEach(([key, value]) => {
      if (!clientIds.has(key)) {
        value.close();
        delete videoPCs[key];
      }
    });

    participants.forEach((user) => {
      const id = user.id;
      if (!user.isVideoChat || videoPCs[id]) return;

      if (id === selfId) {
        videoPCs[id] = new RTCPeerConnection();
        if (videoRefs[id]) videoRefs[id].srcObject = ourStream;
      } else {
        const pc = new RTCPeerConnection({ iceServers: iceServers() });
        videoPCs[id] = pc;

        ourStream.getTracks().forEach((track) => pc.addTrack(track, ourStream));

        pc.onicecandidate = (event) => {
          if (event.candidate) sendSignal(id, { ice: event.candidate });
        };

        pc.ontrack = (event) => {
          if (videoRefs[id]) videoRefs[id].srcObject = event.streams[0];
        };

        const isOfferer = selfId < id;
        if (isOfferer) {
          pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(id, { sdp: pc.localDescription });
          };
        }
      }
    });
  }, [participants, selfId, sendSignal]);

  const setupWebRTC = async () => {
    // Black frame fallback
    const createBlackTrack = ({ width = 640, height = 480 } = {}) => {
      const canvas = Object.assign(document.createElement("canvas"), { width, height });
      canvas.getContext("2d").fillRect(0, 0, width, height);
      const stream = canvas.captureStream();
      return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let stream = new MediaStream([createBlackTrack()]);

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    } catch (e) {
      console.warn("Camera failed, trying audio only", e);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err) {
        console.warn("Media devices inaccessible", err);
      }
    }

    window.watchparty.ourStream = stream;
    socket.emit("CMD:joinVideo");
    emitUserMute();
    updateWebRTC();
    forceUpdate();
  };

  const stopWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    if (ourStream) {
      ourStream.getTracks().forEach((track) => track.stop());
    }
    window.watchparty.ourStream = undefined;
    
    Object.keys(window.watchparty.videoPCs).forEach((key) => {
      window.watchparty.videoPCs[key].close();
      delete window.watchparty.videoPCs[key];
    });

    socket.emit("CMD:leaveVideo");
    forceUpdate();
  };

  const toggleVideoWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    if (ourStream?.getVideoTracks()[0]) {
      ourStream.getVideoTracks()[0].enabled = !ourStream.getVideoTracks()[0].enabled;
    }
    forceUpdate();
  };

  const toggleAudioWebRTC = () => {
    const ourStream = window.watchparty.ourStream;
    if (ourStream?.getAudioTracks()[0]) {
      ourStream.getAudioTracks()[0].enabled = !ourStream.getAudioTracks()[0].enabled;
    }
    emitUserMute();
    forceUpdate();
  };

  // --- Effects ---

  useEffect(() => {
    socket.on("signal", handleSignal);
    return () => socket.off("signal", handleSignal);
  }, [socket, handleSignal]);

  useEffect(() => {
    updateWebRTC();
  }, [rosterUpdateTS, updateWebRTC]);

  // --- Render logic ---

  const videoChatSize = participants.length > 2 ? 180 : 250;
  const videoChatContentStyle = {
    height: videoChatSize,
    width: videoChatSize,
    objectFit: "cover",
    position: "relative",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px",
        padding: "4px",
      }}
    >
      {participants.map((p) => (
        <div key={p.id} style={{ position: "relative" }}>
          <UserMenu
            displayName={nameMap[p.id] || p.id}
            disabled={!(owner && owner === context.user?.uid)}
            socket={socket}
            userToManage={p.id}
            trigger={
              <IconDotsVertical
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  cursor: "pointer",
                  zIndex: 2,
                  visibility: (owner && owner === context.user?.uid) ? "visible" : "hidden",
                }}
              />
            }
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "4px",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          >
            {p.id === selfId ? (
              !window.watchparty.ourStream ? (
                <Button size="xs" color="purple" onClick={setupWebRTC} leftSection={<IconVideo />}>
                  Join
                </Button>
              ) : (
                <>
                  <Button size="xs" color="red" onClick={stopWebRTC} leftSection={<IconX />}>
                    Leave
                  </Button>
                  <ActionIcon color={getVideoWebRTC() ? "green" : "red"} onClick={toggleVideoWebRTC}>
                    <IconVideo />
                  </ActionIcon>
                  <ActionIcon color={getAudioWebRTC() ? "green" : "red"} onClick={toggleAudioWebRTC}>
                    <IconMicrophone />
                  </ActionIcon>
                </>
              )
            ) : (
              <>
                {p.isVideoChat && <IconVideo color={softWhite} />}
                {p.isVideoChat && <IconMicrophone color={p.isMuted ? "red" : softWhite} />}
              </>
            )}
            {p.isScreenShare && <IconScreenShare color={softWhite} />}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "4px",
              left: "0px",
              width: "100%",
              color: softWhite,
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              zIndex: 1,
            }}
          >
            <div
              style={{
                backdropFilter: "brightness(80%)",
                padding: "4px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                flexBasis: "50%",
              }}
              title={nameMap[p.id] || p.id}
            >
              {nameMap[p.id] || p.id}
            </div>
            <div
              style={{
                backdropFilter: "brightness(60%)",
                padding: "4px",
                flexGrow: 1,
                textAlign: "center",
              }}
            >
              {formatTimestamp(tsMap[p.id] || 0)}
            </div>
          </div>

          {window.watchparty.ourStream && p.isVideoChat ? (
            <video
              ref={(el) => {
                if (el) window.watchparty.videoRefs[p.id] = el;
              }}
              style={{
                ...videoChatContentStyle,
                transform: `scaleX(${p.id === selfId ? "-1" : "1"})`,
              }}
              autoPlay
              muted={p.id === selfId}
            />
          ) : (
            <img
              style={videoChatContentStyle}
              src={pictureMap[p.id] || getDefaultPicture(nameMap[p.id], getColorForStringHex(p.id))}
              alt={p.id}
            />
          )}
        </div>
      ))}
    </div>
  );
};