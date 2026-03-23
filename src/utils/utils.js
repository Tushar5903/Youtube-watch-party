import canAutoplay from "can-autoplay";

// Safe config fallback
const config = {
  VITE_SERVER_HOST: import.meta.env?.VITE_SERVER_HOST || "",
  NODE_ENV: import.meta.env?.MODE || "development",
};

// MD5 fallback for Gravatar
const MD5 = {
  hash: (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, "0");
  },
};

// cyrb53 hash inline
const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export function formatTimestamp(input, zeroTime) {
  if (input === null || input === undefined || input === false || Number.isNaN(input) || input === Infinity) {
    return "";
  }
  if (zeroTime) {
    return new Date((zeroTime + input) * 1000).toLocaleTimeString();
  }
  let hours = Math.abs(Math.trunc(Number(input) / 3600));
  let minutes = Math.abs(Math.trunc(Number(input) / 60) % 60).toString().padStart(2, "0");
  let seconds = Math.abs(Math.trunc(Number(input) % 60)).toString().padStart(2, "0");
  return `${Number(input) < 0 ? "-" : ""}${hours ? `${hours}:` : ""}${minutes}:${seconds}`;
}

export function formatSpeed(input) {
  if (input >= 1000000) return (input / 1000000).toFixed(2) + " MB/s";
  if (input >= 1000) return (input / 1000).toFixed(0) + " KB/s";
  return input + " B/s";
}

export function formatSize(input) {
  if (input >= 1000000000) return (input / 1000000000).toFixed(2) + " GB";
  if (input >= 1000000) return (input / 1000000).toFixed(2) + " MB";
  if (input >= 1000) return (input / 1000).toFixed(0) + " KB";
  return input + " B";
}

export const colorMappings = {
  red: "B03060",
  orange: "FE9A76",
  yellow: "FFD700",
  olive: "32CD32",
  green: "016936",
  teal: "008080",
  blue: "0E6EB8",
  violet: "EE82EE",
  purple: "B413EC",
  pink: "FF1493",
  brown: "A52A2A",
  grey: "A0A0A0",
};

export const softWhite = "whitesmoke";

let colorCache = {};
export function getColorForString(id) {
  let colors = Object.keys(colorMappings);
  if (colorCache[id]) return colors[colorCache[id]];
  colorCache[id] = Math.abs(cyrb53(id)) % colors.length;
  return colors[colorCache[id]];
}

export function getColorForStringHex(id) {
  return colorMappings[getColorForString(id)];
}

export const isYouTube = (input) =>
  input.startsWith("https://www.youtube.com/") || input.startsWith("https://youtu.be/");

export const isHttp = (input) => input.startsWith("http");
export const isMagnet = (input) => input.startsWith("magnet:");
export const isHls = (input) => input.includes(".m3u8");
export const isDash = (input) => input.includes(".mpd");
export const isMpegTs = (input) => input.includes(".mpegts");
export const isScreenShare = (input) => input.startsWith("screenshare://");
export const isFileShare = (input) => input.startsWith("fileshare://");
export const isVBrowser = (input) => input.startsWith("vbrowser://");

export async function testAutoplay() {
  const result = await canAutoplay.video();
  return result.result;
}

export function decodeEntities(input) {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

export const debounce = (callback, wait = 500) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
};

export const getDefaultPicture = (name, background = "a0a0a0") => {
  return `https://ui-avatars.com/api/?name=${name}&background=${background}&size=256&color=ffffff`;
};

export const isMobile = () => window.screen.width <= 600;

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export const serverPath =
  config.VITE_SERVER_HOST ||
  `${window.location.protocol}//${
    config.NODE_ENV === "development"
      ? `${window.location.hostname}:8080`
      : window.location.host
  }`;

export const iceServers = () => [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:5.161.207.54:3478", username: "username", credential: "password" },
  { urls: "turn:5.161.49.183:3478", username: "username", credential: "password" },
  { urls: "turn:135.181.147.65:3478", username: "username", credential: "password" },
  { urls: "turn:5.78.83.26:3478", username: "username", credential: "password" },
  { urls: "turn:5.223.48.157:3478", username: "username", credential: "password" },
];

export async function getMediaPathResults(mediaPath, query) {
  let results = [];
  if (mediaPath.startsWith("https://www.youtube.com/playlist?list=")) {
    const playlistID = mediaPath.split("https://www.youtube.com/playlist?list=")[1];
    const response = await fetch(serverPath + "/youtubePlaylist/" + playlistID);
    results = await response.json();
  } else {
    const response = await fetch(mediaPath);
    const text = await response.text();
    results = text.split("\n").map((line) => ({ url: line, name: line, duration: 0, type: "file" }));
  }
  return results.filter((res) => res.url);
}

export async function getStreamPathResults(streamPath, query) {
  const response = await fetch(
    streamPath + `/${query ? "search" : "top"}?q=` + encodeURIComponent(query)
  );
  const data = await response.json();
  return data.map((d, i) => ({ ...d, url: d.magnet ?? String(i) }));
}

export async function getYouTubeResults(query) {
  const response = await fetch(serverPath + "/youtube?q=" + encodeURIComponent(query));
  const data = await response.json();
  return data.map((d) => ({ ...d, type: "youtube" }));
}

export async function openFileSelector(accept) {
  return new Promise((resolve) => {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    if (accept) inputElement.accept = accept;
    inputElement.addEventListener("change", () => resolve(inputElement.files));
    inputElement.dispatchEvent(new MouseEvent("click"));
  });
}

export function getOrCreateClientId() {
  let clientId = window.localStorage.getItem("watchparty-clientid");
  if (!clientId) {
    clientId = createUuid();
    window.localStorage.setItem("watchparty-clientid", clientId);
  }
  return clientId;
}

export function getOrCreateSessionId() {
  let sessionId = window.localStorage.getItem("watchparty-sessionid");
  if (!sessionId) {
    sessionId = createUuid();
    window.localStorage.setItem("watchparty-sessionid", sessionId);
  }
  return sessionId;
}

export function addAndSavePassword(roomId, password) {
  const newPasswords = { ...getSavedPasswords(), [roomId]: password };
  window.localStorage.setItem("watchparty-passwords", JSON.stringify(newPasswords));
}

export function getSavedPasswords() {
  try {
    const savedPasswordsString = window.localStorage.getItem("watchparty-passwords") ?? "{}";
    return JSON.parse(savedPasswordsString);
  } catch (e) {
    console.warn("[ALERT] Could not parse saved passwords");
    return {};
  }
}

export async function getUserImage(user) {
  if (!user) return null;
  const hash = user.email ? MD5.hash(user.email) : "";
  if (user.email) {
    const gravatar = `https://www.gravatar.com/avatar/${hash}?d=404&s=256`;
    const response = await fetch(gravatar);
    if (response.ok) return gravatar;
  }
  if (user.photoURL) return user.photoURL + "?height=256&width=256";
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

export function createUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : uuidv4();
}

export function calculateMedian(array) {
  if (array.length >= 1) {
    const sorted = [...array].sort((a, b) => a - b);
    if (sorted.length % 2 === 0) {
      return (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    }
    return sorted[(sorted.length - 1) / 2];
  }
  return 0;
}

export const getFileName = (input) => input.split("/").slice(-1)[0];

export const isEmojiString = (input) => {
  return /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g.test(
    input ?? ""
  );
};

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

export const VIDEO_MAX_HEIGHT_CSS = "calc(100vh - 64px - 36px - 36px - 4px - 4px - 4px - 32px)";