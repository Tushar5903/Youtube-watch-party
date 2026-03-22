import { BaseClient } from "./base";
import { EVENT } from "./events";

export class NekoClient extends BaseClient {
  login(url, password, displayname) {
    this.connect(url, password, displayname);
  }

  logout() {
    this.disconnect();
  }

  
  [EVENT.RECONNECTING]() {
  }

  [EVENT.CONNECTING]() {
  }

  [EVENT.CONNECTED]() {
    this.emit(EVENT.CONNECTED);
  }

  [EVENT.DISCONNECTED](reason) {
    if (reason) {
      console.warn("NekoClient Disconnected:", reason);
    }
    this.emit(EVENT.DISCONNECTED);
  }

  [EVENT.TRACK](event) {
    const { track, streams } = event;
    this.emit(EVENT.TRACK, track, streams[0]);
  }

  [EVENT.DATA](data) {
    console.log("[DATA RECEIVED]", data);
  }

  
  [EVENT.SYSTEM.DISCONNECT]({ message }) {
    this.onDisconnected(new Error(message));
  }

  
  [EVENT.CONTROL.LOCKED]({ id }) {
  }

  [EVENT.CONTROL.RELEASE]({ id }) {
  }

  [EVENT.CONTROL.GIVE]({ id, target }) {
  }

  [EVENT.CONTROL.CLIPBOARD]({ text }) {
    this.emit(EVENT.CONTROL.CLIPBOARD, text);
  }

  
  [EVENT.SCREEN.CONFIGURATIONS]({ configurations }) {
  }

  [EVENT.SCREEN.RESOLUTION]({ width, height, rate, quality }) {
    this.emit(EVENT.SCREEN.RESOLUTION, { width, height, rate, quality });
  }
}