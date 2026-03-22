import React, { useState, useEffect, useRef, useContext, useCallback, Fragment } from "react";
import { ActionIcon, Avatar, Button, HoverCard, TextInput } from "@mantine/core";
import Picker from "@emoji-mart/react";
import { init } from "emoji-mart";
import Linkify from "react-linkify";
import { SecureLink } from "react-secure-link";
import { CSSTransition, SwitchTransition, TransitionGroup } from "react-transition-group";
import { IconUser } from "@tabler/icons-react";

import styles from "./Chat.module.css";
import {
  formatTimestamp,
  getColorForStringHex,
  getDefaultPicture,
  getOrCreateClientId,
  isEmojiString,
} from "../../utils/utils";
import { UserMenu } from "../UserMenu/UserMenu";
import { MetadataContext } from "../../MetadataContext";

const clientId = getOrCreateClientId();

export const Chat = React.forwardRef((props, ref) => {
  const {
    chat,
    nameMap,
    pictureMap,
    socket,
    scrollTimestamp,
    className,
    getMediaDisplayName,
    hide,
    isChatDisabled,
    owner,
  } = props;

  const context = useContext(MetadataContext);
  const [chatMsg, setChatMsg] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [reactionMenu, setReactionMenuState] = useState({
    isOpen: false,
    selectedMsgId: "",
    selectedMsgTimestamp: "",
    yPosition: 0,
    xPosition: 0,
  });

  const messagesRef = useRef(null);

  // Initialize emoji-mart
  useEffect(() => {
    init({});
  }, []);

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

  const onScroll = useCallback(() => {
    setIsNearBottom(isChatNearBottom());
  }, [isChatNearBottom]);

  // Handle auto-scroll on new messages or visibility change
  useEffect(() => {
    if (scrollTimestamp === 0 || isNearBottom || hide === false) {
      scrollToBottom();
    }
  }, [scrollTimestamp, hide, isNearBottom, scrollToBottom]);

  const setReactionMenu = (isOpen, selectedMsgId, selectedMsgTimestamp, yPosition, xPosition) => {
    setReactionMenuState({
      isOpen,
      selectedMsgId,
      selectedMsgTimestamp,
      yPosition,
      xPosition,
    });
  };

  const handleReactionClick = (value, id, timestamp) => {
    const targetId = id || reactionMenu.selectedMsgId;
    const targetTS = timestamp || reactionMenu.selectedMsgTimestamp;
    const msg = chat.find((m) => m.id === targetId && m.timestamp === targetTS);

    const data = { value, msgId: targetId, msgTimestamp: targetTS };

    if (msg?.reactions?.[value]?.includes(clientId)) {
      socket.emit("CMD:removeReaction", data);
    } else {
      socket.emit("CMD:addReaction", data);
    }
  };

  const sendChatMsg = () => {
    if (!chatMsg || chatMsg.length > 10000) return;
    socket.emit("CMD:chat", chatMsg);
    setChatMsg("");
  };

  const formatMessage = (cmd, msg) => {
    switch (cmd) {
      case "host":
        return <Fragment>changed the video to <span style={{ textTransform: "initial" }}>{getMediaDisplayName(msg)}</span></Fragment>;
      case "playlistAdd":
        return <Fragment>added to the playlist: <span style={{ textTransform: "initial" }}>{getMediaDisplayName(msg)}</span></Fragment>;
      case "seek": return `jumped to ${formatTimestamp(msg)}`;
      case "play": return `started the video at ${formatTimestamp(msg)}`;
      case "pause": return `paused the video at ${formatTimestamp(msg)}`;
      case "playbackRate": return `set the playback rate to ${msg === "0" ? "auto" : `${msg}x`}`;
      case "lock": return `locked the room`;
      case "unlock": return "unlocked the room";
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
        padding: "8px",
        backgroundColor: "rgba(30,30,30,1)",
      }}
    >
      <div className={styles.chatContainer} ref={messagesRef} onScroll={onScroll} style={{ position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {chat.map((msg) => (
            <ChatMessage
              key={msg.timestamp + msg.id}
              className={
                msg.id === reactionMenu.selectedMsgId && msg.timestamp === reactionMenu.selectedMsgTimestamp
                  ? styles.selected
                  : ""
              }
              message={msg}
              pictureMap={pictureMap}
              nameMap={nameMap}
              formatMessage={formatMessage}
              owner={owner}
              socket={socket}
              isChatDisabled={isChatDisabled}
              setReactionMenu={setReactionMenu}
              handleReactionClick={handleReactionClick}
            />
          ))}
        </div>
        {!isNearBottom && (
          <Button size="xs" onClick={scrollToBottom} style={{ position: "sticky", bottom: 0, display: "block", margin: "0 auto" }}>
            Jump to bottom
          </Button>
        )}
      </div>

      {isPickerOpen && (
        <div style={{ position: "absolute", bottom: "60px", zIndex: 1000 }}>
          <Picker
            theme="dark"
            previewPosition="none"
            onEmojiSelect={(emoji) => setChatMsg(prev => prev + emoji.native)}
            onClickOutside={() => setIsPickerOpen(false)}
          />
        </div>
      )}

      <CSSTransition in={reactionMenu.isOpen} timeout={300} classNames="reactionMenu" unmountOnExit>
        <div
          style={{
            position: "fixed",
            zIndex: 2000,
            top: Math.min(reactionMenu.yPosition - 150, window.innerHeight - 450),
            left: reactionMenu.xPosition - 240,
          }}
        >
          <Picker
            theme="dark"
            previewPosition="none"
            perLine={6}
            onClickOutside={() => setReactionMenu(false)}
            onEmojiSelect={(emoji) => {
              handleReactionClick(emoji.native);
              setReactionMenu(false);
            }}
          />
        </div>
      </CSSTransition>

      <TextInput
        style={{ marginTop: "10px" }}
        onKeyDown={(e) => e.key === "Enter" && sendChatMsg()}
        onChange={(e) => setChatMsg(e.target.value)}
        value={chatMsg}
        error={chatMsg.length > 10000}
        disabled={isChatDisabled}
        placeholder={isChatDisabled ? "Chat disabled by owner." : "Enter a message..."}
        rightSection={
          <ActionIcon onClick={() => setTimeout(() => setIsPickerOpen(!isPickerOpen), 100)} disabled={isChatDisabled}>
            <span role="img" aria-label="Emoji">😀</span>
          </ActionIcon>
        }
      />
    </div>
  );
});

const ChatMessage = ({
  message,
  nameMap,
  pictureMap,
  formatMessage,
  socket,
  owner,
  isChatDisabled,
  setReactionMenu,
  handleReactionClick,
  className,
}) => {
  const { user } = useContext(MetadataContext);
  const { id, timestamp, cmd, msg, system, isSub, reactions, videoTS } = message;
  const spellFull = 5;

  return (
    <div className={`${styles.comment} ${className}`} style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative", overflowWrap: "anywhere" }}>
      {id && (
        <Avatar src={pictureMap[id] || getDefaultPicture(nameMap[id], getColorForStringHex(id))} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", fontSize: 14 }}>
          <UserMenu
            displayName={nameMap[id] || id}
            timestamp={timestamp}
            socket={socket}
            userToManage={id}
            isChatMessage
            disabled={!(owner && owner === user?.uid)}
            trigger={
              <div style={{ cursor: "pointer", fontWeight: 700 }} className={isSub ? styles.subscriber : styles.light}>
                {system && "System "}
                {nameMap[id] || id}
              </div>
            }
          />
          <div className={styles.small} style={{ color: "#888" }}>
            {new Date(timestamp).toLocaleTimeString()}
            {videoTS && ` @ ${formatTimestamp(videoTS)}`}
          </div>
        </div>

        <div className={styles.system}>{cmd && formatMessage(cmd, msg)}</div>
        
        {!cmd && (
          <Linkify componentDecorator={(href, text, key) => <SecureLink href={href} key={key}>{text}</SecureLink>}>
            <div className={`${styles.light} ${isEmojiString(msg) ? styles.emoji : ""}`}>
              {msg}
            </div>
          </Linkify>
        )}

        {renderImageString(msg)}

        <div className={styles.commentMenu}>
          <ActionIcon
            disabled={isChatDisabled}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTimeout(() => setReactionMenu(true, id, timestamp, rect.top, rect.right), 100);
            }}
          >
            <span style={{ fontSize: 18 }}>😀</span>
          </ActionIcon>
        </div>

        <TransitionGroup style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
          {Object.keys(reactions ?? {}).map((key) => 
            reactions[key]?.length > 0 && (
              <CSSTransition key={key} timeout={200} classNames="reaction">
                <HoverCard shadow="md" withinPortal>
                  <HoverCard.Target>
                    <div
                      className={`${styles.reactionContainer} ${reactions[key].includes(clientId) ? styles.highlighted : ""}`}
                      onClick={() => handleReactionClick(key, id, timestamp)}
                    >
                      <span>{key}</span>
                      <span className={styles.reactionCounter}>{reactions[key].length}</span>
                    </div>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <div style={{ fontSize: "12px" }}>
                      {reactions[key].slice(0, spellFull).map(uid => nameMap[uid] || "Unknown").join(", ")}
                      {reactions[key].length > spellFull && ` and ${reactions[key].length - spellFull} more`} reacted.
                    </div>
                  </HoverCard.Dropdown>
                </HoverCard>
              </CSSTransition>
            )
          )}
        </TransitionGroup>
      </div>
    </div>
  );
};

export const renderImageString = (input) => {
  if (!input) return null;
  const regex = /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|heic|heif|jfif)\??.*$/gim;
  if (input.match(regex)) {
    return <img style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "4px" }} src={input} alt="Shared" />;
  }
  return null;
};