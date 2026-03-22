import React, { lazy, Suspense, useState, useEffect, useRef, useContext, useCallback } from "react";
import { Alert, Loader, Menu, Overlay, Select, Title, ActionIcon, Badge, TextInput, Button } from "@mantine/core";
import io from "socket.io-client";
import {
  formatSpeed,
  iceServers,
  isMobile,
  serverPath,
  testAutoplay,
  openFileSelector,
  getOrCreateClientId,
  getOrCreateSessionId,
  calculateMedian,
  isYouTube,
  isMagnet,
  isHttp,
  isHls,
  isScreenShare,
  isFileShare,
  isVBrowser,
  isDash,
  VIDEO_MAX_HEIGHT_CSS,
  createUuid,
  softWhite,
  getSavedPasswords,
} from "../../utils/utils";
import { generateName } from "../../utils/generateName";
import { Chat } from "../Chat/Chat";
import { TopBar } from "../TopBar/TopBar";
import { VBrowser } from "../VBrowser/VBrowser";
import { VideoChat } from "../VideoChat/VideoChat";
import { getCurrentSettings } from "../Settings/LocalSettings";
import { MultiStreamModal } from "../Modal/MultiStreamModal";
import { ComboBox } from "../ComboBox/ComboBox";
import { SearchComponent } from "../SearchComponent/SearchComponent";
import { Controls } from "../Controls/Controls";
import { VBrowserModal } from "../Modal/VBrowserModal";
import { SettingsModal } from "../Settings/SettingsModal";
import { ErrorModal } from "../Modal/ErrorModal";
import { PasswordModal } from "../Modal/PasswordModal";
import { ScreenShareModal } from "../Modal/ScreenShareModal";
import { FileShareModal } from "../Modal/FileShareModal";
import { SubtitleModal } from "../Modal/SubtitleModal";
import { HTML } from "./HTML";
import { YouTube } from "./YouTube";
import styles from "./App.module.css";
import { MetadataContext } from "../../MetadataContext";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import {
  IconAntennaBars5,
  IconBrowser,
  IconChevronLeft,
  IconChevronRight,
  IconFile,
  IconKeyboardFilled,
  IconList,
  IconScreenShare,
  IconSettings,
  IconUser,
  IconUserScreen,
  IconUsersGroup,
  IconVolume,
  IconX,
} from "@tabler/icons-react";
import { InviteButton } from "../InviteButton/InviteButton";

// Initialize global watchparty object
window.watchparty = window.watchparty || {
  ourStream: undefined,
  videoRefs: {},
  videoPCs: {},
};

const clientId = getOrCreateClientId();
const Debug = lazy(() => import("../Debug/Debug"));

export const App = ({ vanity: propsVanity, urlRoomId }) => {
  const context = useContext(MetadataContext);
  
  // --- State Management ---
  const [state, setState] = useState({
    status: "starting",
    roomMedia: "",
    roomSubtitle: "",
    roomPaused: false,
    roomLoop: false,
    participants: [],
    rosterUpdateTS: Date.now(),
    chat: [],
    playlist: [],
    tsMap: {},
    nameMap: {},
    pictureMap: {},
    myName: window.localStorage.getItem("watchparty-username") ?? "",
    myPicture: "",
    loading: true,
    scrollTimestamp: 0,
    unreadCount: 0,
    fullScreen: false,
    controlsTimestamp: 0,
    isAutoPlayable: true,
    downloaded: 0,
    total: 0,
    speed: 0,
    connections: 0,
    fileSelection: [],
    overlayMsg: "",
    isErrorAuth: false,
    vBrowserResolution: "1280x720@30",
    vBrowserQuality: "1",
    isVBrowserLarge: false,
    nonPlayableMedia: false,
    currentTab: new URLSearchParams(window.location.search).get("tab") ?? "chat",
    isVBrowserModalOpen: false,
    isScreenShareModalOpen: false,
    isFileShareModalOpen: false,
    isSubtitleModalOpen: false,
    isMultiSelectModalOpen: false,
    roomLock: "",
    controller: "",
    roomId: "",
    errorMessage: "",
    successMessage: "",
    warningMessage: "",
    isChatDisabled: false,
    showChatColumn: isMobile() ? true : Boolean(Number(window.localStorage.getItem("watchparty-showchatcolumn") ?? "1")),
    showPeopleColumn: false,
    owner: undefined,
    vanity: undefined,
    password: undefined,
    inviteLink: "",
    roomTitle: "",
    roomDescription: "",
    roomTitleColor: "",
    mediaPath: undefined,
    roomPlaybackRate: 0,
    isLiveStream: false,
    settingsModalOpen: false,
    uploadController: undefined,
  });

  // --- Refs for non-reactive instances ---
  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const ytInterfaceRef = useRef(new YouTube(null));
  const htmlInterfaceRef = useRef(new HTML("leftVideo"));
  const localStreamRef = useRef(null);
  const isLocalFileRef = useRef(false);
  const publisherConnsRef = useRef({});
  const consumerConnRef = useRef(null);
  const mediasoupPubSocketRef = useRef(null);
  const mediasoupSubSocketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const progressUpdaterRef = useRef(null);
  const ytDebounceRef = useRef(true);

  // Helper to get active player
  const getPlayer = useCallback(() => {
    return isYouTube(state.roomMedia) ? ytInterfaceRef.current : htmlInterfaceRef.current;
  }, [state.roomMedia]);

  // --- Utility Functions ---
  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const getInviteLink = (vanity) => {
    if (vanity) return `${window.location.origin}/r/${vanity}`;
    return `${window.location.origin}/watch${state.roomId}`;
  };

  const haveLock = () => {
    if (!state.roomLock) return true;
    return context.user?.uid === state.roomLock;
  };

  // --- Socket & Initialization ---
  const join = async (roomId) => {
    const password = getSavedPasswords()[roomId] ?? "";
    const response = await fetch(serverPath + "/resolveShard" + roomId);
    const shard = Number(await response.text()) || "";
    
    const socket = io(serverPath + roomId, {
      transports: ["websocket"],
      query: { clientId, password, shard, roomId: roomId.slice(1) },
      auth: { sessionId: getOrCreateSessionId() },
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      updateState({ status: "connected", overlayMsg: "", errorMessage: "", successMessage: "", warningMessage: "" });
      const name = state.myName || (await generateName());
      updateState({ myName: name });
      socket.emit("CMD:name", name);
      window.localStorage.setItem("watchparty-username", name);
    });

    socket.on("REC:host", (data) => {
      // Replaces original REC:host logic
      updateState({
        roomMedia: data.video || "",
        roomPaused: data.paused,
        roomSubtitle: data.subtitle,
        roomLoop: data.loop,
        roomPlaybackRate: data.playbackRate,
        loading: Boolean(data.video),
        controller: data.controller,
      });
      // Logic for loading players, WebTorrent, HLS, Dash would follow here...
    });

    socket.on("REC:chat", (data) => {
      if (!getCurrentSettings().disableChatSound && !data.system) {
        new Audio("/clearly.mp3").play();
      }
      setState(prev => ({
        ...prev,
        chat: [...prev.chat.slice(-99), data],
        scrollTimestamp: Date.now(),
        unreadCount: prev.currentTab === "chat" ? prev.unreadCount : prev.unreadCount + 1
      }));
    });

    // ... Other socket listeners (REC:tsMap, roster, etc.) follow similar pattern
  };

  // --- Lifecycle ---
  useEffect(() => {
    const init = async () => {
      let roomId = "/" + urlRoomId;
      if (propsVanity) {
        const resp = await fetch(serverPath + "/resolveRoom/" + propsVanity);
        if (resp.ok) {
          const data = await resp.json();
          roomId = data.roomId;
        }
      }
      updateState({ roomId });
      join(roomId);
    };

    const handleKeydown = (e) => {
      if (!document.activeElement || document.activeElement.tagName === "BODY") {
        if (e.key === " ") {
          e.preventDefault();
          // roomTogglePlay logic
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);
    heartbeatRef.current = setInterval(() => fetch(serverPath + "/ping"), 600000);
    
    testAutoplay().then(can => updateState({ isAutoPlayable: can }));
    init();

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearInterval(heartbeatRef.current);
      clearInterval(progressUpdaterRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [urlRoomId, propsVanity]);

  // --- Rendering Helpers ---
  const getMediaDisplayName = (input) => {
    if (!input) return "";
    if (isYouTube(input)) return input;
    if (input.startsWith("screenshare://")) return "Shared Screen";
    return input;
  };

  // --- Handlers ---
  const roomTogglePlay = () => {
    if (!haveLock()) return;
    const player = getPlayer();
    const shouldPlay = player.shouldPlay();
    if (shouldPlay) {
      socketRef.current.emit("CMD:play");
    } else {
      socketRef.current.emit("CMD:pause");
    }
  };

  return (
    <React.Fragment>
      {state.status === "starting" && (
        <Overlay className={styles.flexCenter}>
          <Title order={2}>Loading...</Title>
        </Overlay>
      )}

      {/* Modals */}
      <SettingsModal 
        modalOpen={state.settingsModalOpen} 
        setModalOpen={(val) => updateState({ settingsModalOpen: val })}
        roomLock={state.roomLock}
        socket={socketRef.current}
        // ... other props
      />

      {!state.fullScreen && (
        <TopBar
          roomTitle={state.roomTitle}
          roomDescription={state.roomDescription}
          roomTitleColor={state.roomTitleColor}
        />
      )}

      <div className={styles.mobileStack} style={{ margin: "0 8px", display: "flex", columnGap: "32px" }}>
        <div className={state.fullScreen ? styles.fullHeightColumnFullscreen : styles.fullHeightColumn}>
          
          {/* Main Player Area */}
          <div style={{ flexGrow: 1, position: "relative" }}>
            <div className={styles.playerContainer}>
              <video
                id="leftVideo"
                style={{ width: "100%", maxHeight: VIDEO_MAX_HEIGHT_CSS }}
                playsInline
                onClick={roomTogglePlay}
              />
              <div id="leftYt" className={styles.videoContent} />
            </div>
          </div>

          {state.roomMedia && (
            <Controls
              video={state.roomMedia}
              paused={state.roomPaused}
              // ... other control props mapping state to player methods
            />
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: state.showChatColumn ? 400 : 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <TextInput
              flex={1}
              value={state.myName}
              onChange={(e) => updateState({ myName: e.target.value })}
              leftSection={<IconUser />}
            />
            <InviteButton />
          </div>
          
          <Chat
            chat={state.chat}
            nameMap={state.nameMap}
            socket={socketRef.current}
            ref={chatRef}
            hide={!state.showChatColumn}
          />
        </div>
      </div>
    </React.Fragment>
  );
};