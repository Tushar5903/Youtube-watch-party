/**
 * Event constants for WebSocket and Internal communication.
 */
export const EVENT = {
  // Internal Events
  RECONNECTING: "RECONNECTING",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  TRACK: "TRACK",
  MESSAGE: "MESSAGE",
  DATA: "DATA",

  // Websocket Events
  SYSTEM: {
    INIT: "system/init",
    DISCONNECT: "system/disconnect",
    ERROR: "system/error",
  },
  SIGNAL: {
    OFFER: "signal/offer",
    ANSWER: "signal/answer",
    PROVIDE: "signal/provide",
    CANDIDATE: "signal/candidate",
  },
  MEMBER: {
    LIST: "member/list",
    CONNECTED: "member/connected",
    DISCONNECTED: "member/disconnected",
  },
  CONTROL: {
    LOCKED: "control/locked",
    RELEASE: "control/release",
    REQUEST: "control/request",
    REQUESTING: "control/requesting",
    CLIPBOARD: "control/clipboard",
    GIVE: "control/give",
    KEYBOARD: "control/keyboard",
  },
  CHAT: {
    MESSAGE: "chat/message",
    EMOTE: "chat/emote",
  },
  SCREEN: {
    CONFIGURATIONS: "screen/configurations",
    RESOLUTION: "screen/resolution",
    SET: "screen/set",
  },
  BROADCAST: {
    STATUS: "broadcast/status",
    CREATE: "broadcast/create",
    DESTROY: "broadcast/destroy",
  },
  ADMIN: {
    BAN: "admin/ban",
    KICK: "admin/kick",
    LOCK: "admin/lock",
    UNLOCK: "admin/unlock",
    MUTE: "admin/mute",
    UNMUTE: "admin/unmute",
    CONTROL: "admin/control",
    RELEASE: "admin/release",
    GIVE: "admin/give",
  },
};