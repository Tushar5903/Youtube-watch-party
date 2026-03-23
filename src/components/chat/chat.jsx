import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { ActionIcon, Avatar, Button, TextInput } from "@mantine/core";
import Linkify from "react-linkify";
import { SecureLink } from "react-secure-link";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import styles from "./Chat.module.css";
import {
  formatTimestamp,
  getColorForStringHex,
  getDefaultPicture,
  getOrCreateClientId,
  isEmojiString,
} from "../../utils/utils";
import { MetadataContext } from "../../MetadataContext";

const clientId = getOrCreateClientId();

export const Chat = React.forwardRef((props, ref) => {
  const {
    chat = [],
    nameMap = {},
    pictureMap = {},
    socket,
    scrollTimestamp,
    className,
    getMediaDisplayName,
    hide,
    isChatDisabled,
    owner,
    onSendMsg,
  } = props;

  const [chatMsg, setChatMsg] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  const isChatNearBottom = useCallback(() => {
    if (!messagesRef.current) return true;
    const { scrollHeight, scrollTop, offsetHeight } = messagesRef.current;
    return scrollHeight - scrollTop - offsetHeight < 50;
  }, []);

  useEffect(() => {
    if (scrollTimestamp === 0 || isNearBottom || hide === false) {
      scrollToBottom();
    }
  }, [scrollTimestamp, hide, isNearBottom, scrollToBottom]);

  const sendChatMsg = () => {
    if (!chatMsg || chatMsg.length > 10000) return;
    if (socket) {
      socket.emit("CMD:chat", chatMsg);
    } else if (onSendMsg) {
      onSendMsg(chatMsg);
    }
    setChatMsg("");
  };

  const formatMessage = (cmd, msg) => {
    const displayName = getMediaDisplayName ? getMediaDisplayName(msg) : msg;
    switch (cmd) {
      case "host": return `changed the video to ${displayName}`;
      case "playlistAdd": return `added to the playlist: ${displayName}`;
      case "seek": return `jumped to ${formatTimestamp(msg)}`;
      case "play": return `started the video at ${formatTimestamp(msg)}`;
      case "pause": return `paused the video at ${formatTimestamp(msg)}`;
      case "playbackRate": return `set the playback rate to ${msg === "0" ? "auto" : `${msg}x`}`;
      case "lock": return `locked the room`;
      case "unlock": return `unlocked the room`;
      default: return cmd;
    }
  };

  return (
    <div
      className={className}
      style={{
        display: hide ? "none" : "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        background: "#0d1117",
      }}
    >
      {/* Messages list */}
      <div
        ref={messagesRef}
        onScroll={() => setIsNearBottom(isChatNearBottom())}
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "12px 12px 4px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {chat.map((msg, i) => (
          <ChatMessage
            key={msg.timestamp + (msg.id || i)}
            message={msg}
            pictureMap={pictureMap}
            nameMap={nameMap}
            formatMessage={formatMessage}
            owner={owner}
            socket={socket}
            isChatDisabled={isChatDisabled}
          />
        ))}

        {!isNearBottom && (
          <Button
            size="xs"
            onClick={scrollToBottom}
            style={{ alignSelf: "center", position: "sticky", bottom: 0 }}
          >
            Jump to bottom
          </Button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #1f2937", flexShrink: 0 }}>
        <TextInput
          onKeyDown={(e) => e.key === "Enter" && sendChatMsg()}
          onChange={(e) => setChatMsg(e.target.value)}
          value={chatMsg}
          error={chatMsg.length > 10000}
          disabled={isChatDisabled}
          placeholder={isChatDisabled ? "Chat disabled by owner." : "Send a message..."}
          styles={{
            input: {
              background: "#111827",
              border: "1px solid #1f2937",
              color: "#f1f5f9",
              borderRadius: "8px",
              fontSize: "13px",
            },
          }}
          rightSection={
            <ActionIcon
              onClick={sendChatMsg}
              disabled={isChatDisabled || !chatMsg}
              color="blue"
              variant="subtle"
            >
              ➤
            </ActionIcon>
          }
        />
      </div>
    </div>
  );
});

const ChatMessage = ({
  message,
  nameMap = {},
  pictureMap = {},
  formatMessage,
  socket,
  owner,
  isChatDisabled,
}) => {
  const { user } = useContext(MetadataContext);
  const { id, timestamp, cmd, msg, system, isSub, reactions, videoTS } = message;

  const displayName = nameMap[id] || id || "Unknown";
  const avatarSrc = pictureMap[id] || getDefaultPicture(displayName, getColorForStringHex(id || "x"));
  const isSystem = system || !id || id === "system";

  if (isSystem) {
    return (
      <div
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "2px 0",
        }}
      >
        {cmd ? formatMessage(cmd, msg) : msg}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-start",
        padding: "4px 6px",
        borderRadius: "8px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <Avatar
        src={avatarSrc}
        size={32}
        radius="xl"
        style={{ flexShrink: 0, marginTop: "2px" }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + time */}
        <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "2px" }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: "13px",
              color: isSub ? "#34d399" : "#e2e8f0",
            }}
          >
            {displayName}
          </span>
          <span style={{ fontSize: "11px", color: "#475569" }}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {videoTS ? ` @ ${formatTimestamp(videoTS)}` : ""}
          </span>
        </div>

        {/* System command */}
        {cmd && (
          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {formatMessage(cmd, msg)}
          </div>
        )}

        {/* Regular message */}
        {!cmd && msg && (
          <Linkify
            componentDecorator={(href, text, key) => (
              <SecureLink href={href} key={key} style={{ color: "#38bdf8" }}>
                {text}
              </SecureLink>
            )}
          >
            <div
              style={{
                fontSize: isEmojiString(msg) ? "24px" : "14px",
                color: "#cbd5e1",
                lineHeight: 1.5,
                overflowWrap: "anywhere",
              }}
            >
              {msg}
            </div>
          </Linkify>
        )}

        {/* Inline image */}
        {renderImageString(msg)}

        {/* Reactions */}
        {reactions && Object.keys(reactions).length > 0 && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
            {Object.keys(reactions).map((key) =>
              reactions[key]?.length > 0 ? (
                <div
                  key={key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    background: reactions[key].includes(clientId)
                      ? "rgba(56,189,248,0.2)"
                      : "rgba(255,255,255,0.08)",
                    border: reactions[key].includes(clientId)
                      ? "1px solid rgba(56,189,248,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                    fontSize: "13px",
                    cursor: "pointer",
                    gap: "4px",
                  }}
                  onClick={() => {
                    if (socket) {
                      const data = { value: key, msgId: id, msgTimestamp: timestamp };
                      if (reactions[key].includes(clientId)) {
                        socket.emit("CMD:removeReaction", data);
                      } else {
                        socket.emit("CMD:addReaction", data);
                      }
                    }
                  }}
                >
                  <span>{key}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{reactions[key].length}</span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const renderImageString = (input) => {
  if (!input) return null;
  const regex = /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|heic|heif|jfif)\??.*$/gim;
  if (input.match(regex)) {
    return (
      <img
        style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", objectFit: "cover" }}
        src={input}
        alt="Shared"
      />
    );
  }
  return null;
};
