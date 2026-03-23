import React, { useCallback, useContext, useEffect, useState } from "react";
import { softWhite } from "../../utils/utils";
import { Avatar, Button, Text } from "@mantine/core";
import { LoginModal } from "../Modal/LoginModal";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { ProfileModal } from "../Modal/ProfileModal";
import Announce from "../Announce/Announce";
import appStyles from "../App/App.module.css";
import { MetadataContext } from "../../MetadataContext";
import { IconCirclePlusFilled, IconLogin } from "@tabler/icons-react";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

export async function createRoom(user, openNewTab, video = "") {
  const roomId = generateRoomId();
  const path = "/watch/" + roomId;
  if (openNewTab) {
    window.open(path);
  } else {
    window.location.assign(path);
  }
}

export const NewRoomButton = ({ size, openNewTab }) => {
  const context = useContext(MetadataContext);

  const onClick = useCallback(() => {
    createRoom(context.user, openNewTab);
  }, [context.user, openNewTab]);

  return (
    <Button
      size={size}
      onClick={onClick}
      leftSection={<IconCirclePlusFilled />}
      style={{
        background: "linear-gradient(135deg, #38bdf8, #34d399)",
        color: "#000",
        fontWeight: 700,
        border: "none",
      }}
    >
      New Room
    </Button>
  );
};

export const SignInButton = () => {
  const context = useContext(MetadataContext);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (context.user) {
        try {
          const { getUserImage } = await import("../../utils/utils");
          const img = await getUserImage(context.user);
          setUserImage(img);
        } catch (e) {
          console.warn("Could not fetch user image", e);
        }
      }
    };
    fetchImage();
  }, [context.user]);

  if (context.user) {
    return (
      <div style={{ margin: "4px", minWidth: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Avatar src={userImage} onClick={() => setIsProfileOpen(true)} />
        {isProfileOpen && <ProfileModal userImage={userImage} close={() => setIsProfileOpen(false)} />}
      </div>
    );
  }

  return (
    <React.Fragment>
      {isLoginOpen && <LoginModal closeModal={() => setIsLoginOpen(false)} />}
      <Button variant="subtle" leftSection={<IconLogin />} onClick={() => setIsLoginOpen(true)} style={{ color: "#94a3b8" }}>
        Sign in
      </Button>
    </React.Fragment>
  );
};

export const TopBar = ({ hideNewRoom, hideSignin, roomTitle, roomDescription, roomTitleColor }) => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        padding: "0 16px",
        height: "64px",
        alignItems: "center",
        background: "#0d1117",
        borderBottom: "1px solid #1f2937",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <img style={{ width: "36px", height: "36px" }} src="/logo192.png" alt="Logo" />
        {!roomTitle && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#38bdf8", fontSize: "22px" }}>Watch</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#34d399", fontSize: "22px", marginLeft: "2px" }}>Party</span>
          </div>
        )}
      </a>

      {(roomTitle || roomDescription) && (
        <div style={{ marginLeft: "12px" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: roomTitleColor || softWhite }}>{roomTitle}</div>
          {roomDescription && <Text size="xs" style={{ color: "#94a3b8" }}>{roomDescription}</Text>}
        </div>
      )}

      <Announce />

      <div className={appStyles.mobileStack} style={{ display: "flex", marginLeft: "auto", alignItems: "center", gap: "8px" }}>
        {!hideNewRoom && <NewRoomButton openNewTab={false} />}
        <SubscribeButton />
        {!hideSignin && <SignInButton />}
      </div>
    </div>
  );
};
