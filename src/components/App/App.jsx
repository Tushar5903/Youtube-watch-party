import React, { useCallback, useEffect, useState, useRef, useContext } from "react";
import { TextInput, ActionIcon, Tabs, Badge } from "@mantine/core";
import { isYouTube } from "../../utils/utils";
import { Chat } from "../chat/chat";
import { TopBar } from "../TopBar/TopBar";
import { Controls } from "../Controls/Controls";
import { SettingsModal } from "../Settings/SettingsModal";
import { HTML } from "./HTML";
import styles from "./App.module.css";
import { MetadataContext } from "../../MetadataContext";
import { InviteButton } from "../InviteButton/InviteButton";
import {
  IconUser,
  IconSettings,
  IconUsersGroup,
  IconList,
  IconPlayerPlay,
} from "@tabler/icons-react";

window.watchparty = window.watchparty || {
  ourStream: undefined,
  videoRefs: {},
  videoPCs: {},
};

// Extract YouTube video ID from URL
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || u.pathname.split("/").pop();
  } catch {
    return null;
  }
}

export const App = ({ vanity: propsVanity, urlRoomId }) => {
  const context = useContext(MetadataContext);
  const htmlInterfaceRef = useRef(new HTML("leftVideo"));
  const urlInputRef = useRef(null);
  const savedName = window.localStorage.getItem("watchparty-username") || "Guest";

  const [state, setState] = useState({
    roomMedia: "",
    roomPaused: true,
    roomLoop: false,
    chat: [
      {
        id: "system",
        timestamp: Date.now(),
        system: true,
        msg: "Welcome! Paste a video URL to start watching.",
      },
    ],
    nameMap: { system: "System", self: savedName, user1: "Alex" },
    pictureMap: {},
    participants: [{ id: "self" }, { id: "user1" }],
    myName: savedName,
    scrollTimestamp: 0,
    unreadCount: 0,
    currentTab: "chat",
    roomLock: "",
    roomTitle: "",
    roomDescription: "",
    roomTitleColor: "",
    roomPlaybackRate: 1,
    isLiveStream: false,
    settingsModalOpen: false,
    volume: 1,
    muted: false,
    playlist: [],
    owner: undefined,
    vanity: undefined,
    password: undefined,
    mediaPath: undefined,
    isChatDisabled: false,
  });

  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

  const haveLock = useCallback(() => !state.roomLock, [state.roomLock]);

  const getMediaDisplayName = (input) => {
    if (!input) return "";
    if (isYouTube(input)) return "YouTube Video";
    return input.split("/").slice(-1)[0] || input;
  };

  const setMedia = useCallback((url) => {
    const trimmed = url?.trim();
    if (!trimmed) {
      htmlInterfaceRef.current.clearState();
      setState((prev) => ({
        ...prev,
        roomMedia: "",
        roomPaused: true,
      }));
      return;
    }

    if (!isYouTube(trimmed)) {
      htmlInterfaceRef.current.setSrcAndTime(trimmed, 0).then(() => {
        htmlInterfaceRef.current.playVideo();
      });
    }

    setState((prev) => ({
      ...prev,
      roomMedia: trimmed,
      roomPaused: false,
      chat: [
        ...prev.chat,
        {
          id: "system",
          timestamp: Date.now(),
          system: true,
          msg: `▶ Now playing: ${trimmed.split("/").slice(-1)[0] || trimmed}`,
        },
      ],
      scrollTimestamp: Date.now(),
    }));
  }, []);

  const roomTogglePlay = useCallback(() => {
    if (!state.roomMedia) return;
    if (state.roomPaused) {
      if (!isYouTube(state.roomMedia)) htmlInterfaceRef.current.playVideo();
      updateState({ roomPaused: false });
    } else {
      if (!isYouTube(state.roomMedia)) htmlInterfaceRef.current.pauseVideo();
      updateState({ roomPaused: true });
    }
  }, [state.roomMedia, state.roomPaused]);

  const sendChatMsg = useCallback((msg) => {
    if (!msg) return;
    setState((prev) => ({
      ...prev,
      chat: [
        ...prev.chat,
        { id: "self", timestamp: Date.now(), msg },
      ],
      scrollTimestamp: Date.now(),
    }));
  }, []);

  // Dummy player interface for Controls when no real player
  const dummyPlayer = {
    getCurrentTime: () => 0,
    getDuration: () => 0,
    getPlaybackRate: () => state.roomPlaybackRate,
    getTimeRanges: () => [],
    seekVideo: () => {},
    setPlaybackRate: () => {},
    setLoop: () => {},
    setMute: () => {},
    setVolume: () => {},
  };

  const player = state.roomMedia && !isYouTube(state.roomMedia)
    ? htmlInterfaceRef.current
    : dummyPlayer;

  const ytId = state.roomMedia && isYouTube(state.roomMedia)
    ? getYouTubeId(state.roomMedia)
    : null;

  return (
    <React.Fragment>
      <SettingsModal
        modalOpen={state.settingsModalOpen}
        setModalOpen={(val) => updateState({ settingsModalOpen: val })}
        roomLock={state.roomLock}
        setRoomLock={(val) => updateState({ roomLock: val ? "local-user" : "" })}
        socket={null}
        owner={state.owner}
        vanity={state.vanity}
        setVanity={(val) => updateState({ vanity: val })}
        inviteLink={window.location.href}
        password={state.password}
        setPassword={(val) => updateState({ password: val })}
        isChatDisabled={state.isChatDisabled}
        setIsChatDisabled={(val) => updateState({ isChatDisabled: val })}
        clearChat={() => updateState({ chat: [] })}
        roomTitle={state.roomTitle}
        roomDescription={state.roomDescription}
        roomTitleColor={state.roomTitleColor}
        mediaPath={state.mediaPath}
        setMediaPath={(val) => updateState({ mediaPath: val })}
      />

      <TopBar
        roomTitle={state.roomTitle}
        roomDescription={state.roomDescription}
        roomTitleColor={state.roomTitleColor}
      />

      <div
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "#070b14",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Video Player ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: "#000",
          }}
        >
          {/* Video area */}
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              overflow: "hidden",
            }}
          >
            {/* Empty state */}
            {!state.roomMedia && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  padding: "24px",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(56,189,248,0.1)",
                    border: "2px solid rgba(56,189,248,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconPlayerPlay size={36} color="#38bdf8" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "#f1f5f9",
                      fontSize: "22px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    No video playing
                  </div>
                  <div style={{ color: "#475569", fontSize: "14px" }}>
                    Paste a YouTube link or any video URL below
                  </div>
                </div>

                {/* URL input */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    width: "100%",
                    maxWidth: "520px",
                  }}
                >
                  <input
                    ref={urlInputRef}
                    placeholder="https://www.youtube.com/watch?v=... or any .mp4 URL"
                    style={{
                      flex: 1,
                      background: "#111827",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      color: "#f1f5f9",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
                    onBlur={(e) => (e.target.style.borderColor = "#1f2937")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        setMedia(e.target.value.trim());
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    style={{
                      background: "linear-gradient(135deg,#38bdf8,#34d399)",
                      color: "#000",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px 20px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onClick={() => {
                      const val = urlInputRef.current?.value?.trim();
                      if (val) {
                        setMedia(val);
                        urlInputRef.current.value = "";
                      }
                    }}
                  >
                    Play
                  </button>
                </div>

                {/* Quick examples */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {[
                    {
                      label: "🎬 Blender Short Film",
                      url: "https://youtu.be/BKOVzHcjEIo?si=9Q81fxY7cHnoA22W",
                    },
                    {
                      label: "▶ YouTube: Big Buck Bunny",
                      url: "https://youtu.be/NHk7scrb_9I?si=UzjTT79W-eEXYKTD",
                    },
                  ].map((item) => (
                    <button
                      key={item.url}
                      onClick={() => setMedia(item.url)}
                      style={{
                        background: "#111827",
                        border: "1px solid #1f2937",
                        borderRadius: "8px",
                        padding: "7px 16px",
                        color: "#94a3b8",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = "#38bdf8";
                        e.target.style.color = "#38bdf8";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = "#1f2937";
                        e.target.style.color = "#94a3b8";
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* HTML5 video */}
            <video
              id="leftVideo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display:
                  state.roomMedia && !isYouTube(state.roomMedia)
                    ? "block"
                    : "none",
              }}
              playsInline
              onClick={roomTogglePlay}
            />

            {/* YouTube embed */}
            {ytId && (
              <iframe
                key={ytId}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          {/* Controls bar */}
          {state.roomMedia && !isYouTube(state.roomMedia) && (
            <div
              style={{
                background: "#0d1117",
                borderTop: "1px solid #1f2937",
              }}
            >
              <Controls
                video={state.roomMedia}
                paused={state.roomPaused}
                muted={state.muted}
                volume={state.volume}
                subtitled={false}
                currentTime={player.getCurrentTime()}
                duration={player.getDuration()}
                disabled={!haveLock()}
                leaderTime={undefined}
                isPauseDisabled={false}
                playbackRate={state.roomPlaybackRate}
                roomPlaybackRate={state.roomPlaybackRate}
                isYouTube={false}
                isLiveStream={false}
                timeRanges={player.getTimeRanges()}
                loop={state.roomLoop}
                roomTogglePlay={roomTogglePlay}
                roomSeek={(t) => htmlInterfaceRef.current.seekVideo(t)}
                roomSetPlaybackRate={(r) => {
                  updateState({ roomPlaybackRate: r || 1 });
                  htmlInterfaceRef.current.setPlaybackRate(r || 1);
                }}
                roomSetLoop={(l) => {
                  updateState({ roomLoop: l });
                  htmlInterfaceRef.current.setLoop(l);
                }}
                localFullScreen={() => {}}
                localToggleMute={() => {
                  const m = !state.muted;
                  updateState({ muted: m });
                  htmlInterfaceRef.current.setMute(m);
                }}
                localSubtitleModal={() => {}}
                localSeek={(t) => htmlInterfaceRef.current.seekVideo(t)}
                localSetVolume={(v) => {
                  updateState({ volume: v });
                  htmlInterfaceRef.current.setVolume(v);
                }}
                localSetSubtitleMode={() => {}}
                roomPlaylistPlay={() => {}}
                playlist={state.playlist}
              />
            </div>
          )}

          {/* URL bar — shows current video URL, synced */}
          {state.roomMedia && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "8px 12px",
                background: "#0d1117",
                borderTop: "1px solid #1f2937",
                alignItems: "center",
              }}
            >
              <input
                key={state.roomMedia}
                defaultValue={state.roomMedia}
                placeholder="Change video URL..."
                style={{
                  flex: 1,
                  background: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#38bdf8";
                  e.target.select();
                }}
                onBlur={(e) => (e.target.style.borderColor = "#1f2937")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    setMedia(e.target.value.trim());
                  }
                }}
              />
              <button
                onClick={() => setMedia("")}
                style={{
                  background: "#1f2937",
                  color: "#94a3b8",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div
          style={{
            width: "360px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #1f2937",
            background: "#0d1117",
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderBottom: "1px solid #1f2937",
            }}
          >
            <TextInput
              style={{ flex: 1 }}
              value={state.myName}
              placeholder="Your name"
              onChange={(e) => {
                const name = e.target.value;
                updateState({
                  myName: name,
                  nameMap: { ...state.nameMap, self: name },
                });
                window.localStorage.setItem("watchparty-username", name);
              }}
              leftSection={<IconUser size={16} />}
              styles={{
                input: {
                  background: "#111827",
                  border: "1px solid #1f2937",
                  color: "#f1f5f9",
                  fontSize: "13px",
                },
              }}
            />
            <InviteButton />
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => updateState({ settingsModalOpen: true })}
              title="Settings"
            >
              <IconSettings size={18} />
            </ActionIcon>
          </div>

          {/* Tabs */}
          <Tabs
            value={state.currentTab}
            onChange={(tab) =>
              updateState({
                currentTab: tab,
                unreadCount: tab === "chat" ? 0 : state.unreadCount,
              })
            }
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Tabs.List
              style={{
                borderBottom: "1px solid #1f2937",
                padding: "0 8px",
                flexShrink: 0,
              }}
            >
              <Tabs.Tab value="chat" style={{ fontSize: "13px" }}>
                Chat
                {state.unreadCount > 0 && (
                  <Badge size="xs" color="blue" ml={6}>
                    {state.unreadCount}
                  </Badge>
                )}
              </Tabs.Tab>
              <Tabs.Tab value="people" style={{ fontSize: "13px" }}>
                People ({state.participants.length})
              </Tabs.Tab>
              <Tabs.Tab value="playlist" style={{ fontSize: "13px" }}>
                Playlist
              </Tabs.Tab>
            </Tabs.List>

            {/* Chat */}
            <Tabs.Panel
              value="chat"
              style={{
                flex: 1,
                minHeight: 0,
                display: state.currentTab === "chat" ? "flex" : "none",
                flexDirection: "column",
              }}
            >
              <Chat
                chat={state.chat}
                nameMap={state.nameMap}
                pictureMap={state.pictureMap}
                socket={null}
                scrollTimestamp={state.scrollTimestamp}
                hide={false}
                getMediaDisplayName={getMediaDisplayName}
                isChatDisabled={state.isChatDisabled}
                owner={state.owner}
                onSendMsg={sendChatMsg}
              />
            </Tabs.Panel>

            {/* People */}
            <Tabs.Panel
              value="people"
              style={{ flex: 1, overflow: "auto", padding: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {state.participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: "#111827",
                      borderRadius: "10px",
                      border: "1px solid #1f2937",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: p.id === "self" ? "#38bdf8" : "#a78bfa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#000",
                        flexShrink: 0,
                      }}
                    >
                      {(state.nameMap[p.id] || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          color: "#f1f5f9",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {state.nameMap[p.id] || p.id}
                        {p.id === "self" && (
                          <span
                            style={{
                              color: "#38bdf8",
                              fontSize: "11px",
                              marginLeft: 6,
                            }}
                          >
                            (you)
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#475569", fontSize: "12px" }}>
                        In room
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Panel>

            {/* Playlist */}
            <Tabs.Panel
              value="playlist"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#475569",
              }}
            >
              <IconList size={40} />
              <div style={{ fontSize: "14px" }}>Playlist is empty</div>
              <div style={{ fontSize: "12px", color: "#374151" }}>
                Add videos to watch in sequence
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </React.Fragment>
  );
};
