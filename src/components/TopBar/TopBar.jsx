import React, { useCallback, useContext, useState, useEffect } from "react";
import { serverPath, getUserImage, softWhite } from "../../utils/utils";
import { ActionIcon, Avatar, Button, Menu, Text } from "@mantine/core";
import { LoginModal } from "../Modal/LoginModal";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { ProfileModal } from "../Modal/ProfileModal";
import Announce from "../Announce/Announce";
import appStyles from "../App/App.module.css";
import { MetadataContext } from "../../MetadataContext";
import {
  IconBrandDiscord,
  IconBrandGithub,
  IconCirclePlusFilled,
  IconDatabase,
  IconLogin,
  IconTrash,
} from "@tabler/icons-react";

export async function createRoom(user, openNewTab, video = "") {
  const uid = user?.uid;
  // Note: Firebase getIdToken removed. 
  // If using a custom backend, you may need to pass a different auth header here.
  const response = await fetch(serverPath + "/createRoom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      video,
    }),
  });
  
  const data = await response.json();
  const { name } = data;
  
  if (openNewTab) {
    window.open("/watch" + name);
  } else {
    window.location.assign("/watch" + name);
  }
}

/**
 * New Room Button Component
 */
export const NewRoomButton = ({ size, openNewTab }) => {
  const context = useContext(MetadataContext);
  
  const onClick = useCallback(async () => {
    await createRoom(context.user, openNewTab);
  }, [context.user, openNewTab]);

  return (
    <Button
      size={size}
      onClick={onClick}
      leftSection={<IconCirclePlusFilled />}
    >
      New Room
    </Button>
  );
};

/**
 * Sign In Button Component
 */
export const SignInButton = () => {
  const context = useContext(MetadataContext);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (context.user) {
        const img = await getUserImage(context.user);
        setUserImage(img);
      }
    };
    fetchImage();
  }, [context.user]);

  if (context.user) {
    return (
      <div
        style={{
          margin: "4px",
          minWidth: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Avatar
          src={userImage}
          onClick={() => setIsProfileOpen(true)}
        />
        {isProfileOpen && (
          <ProfileModal
            userImage={userImage}
            close={() => setIsProfileOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <React.Fragment>
      {isLoginOpen && (
        <LoginModal closeModal={() => setIsLoginOpen(false)} />
      )}
      <Button
        leftSection={<IconLogin />}
        onClick={() => setIsLoginOpen(true)}
      >
        Sign in
      </Button>
    </React.Fragment>
  );
};

/**
 * List Rooms Button Component
 */
export const ListRoomsButton = () => {
  const context = useContext(MetadataContext);
  const [rooms, setRooms] = useState([]);

  const refreshRooms = useCallback(async () => {
    if (context.user) {
      const response = await fetch(
        serverPath + `/listRooms?uid=${context.user.uid}`
      );
      setRooms(await response.json());
    }
  }, [context.user]);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const deleteRoom = async (roomId) => {
    if (context.user) {
      await fetch(
        serverPath + `/deleteRoom?uid=${context.user.uid}&roomId=${roomId}`,
        { method: "DELETE" }
      );
      setRooms((prev) => prev.filter((room) => room.roomId !== roomId));
      refreshRooms();
    }
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button
          color="gray"
          onClick={refreshRooms}
          leftSection={<IconDatabase />}
        >
          My rooms
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {rooms.length === 0 && (
          <Menu.Item disabled>You have no permanent rooms.</Menu.Item>
        )}
        {rooms.map((room) => (
          <Menu.Item
            key={room.roomId}
            component="a"
            href={room.vanity ? "/r/" + room.vanity : "/watch" + room.roomId}
          >
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{ flex: 1 }}>
                <Text size="sm">
                  {room.vanity ? `/r/${room.vanity}` : `/watch${room.roomId}`}
                </Text>
                <Text size="xs" color="dimmed">
                  {room.roomId}
                </Text>
              </div>
              <ActionIcon
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteRoom(room.roomId);
                }}
                color="red"
                variant="subtle"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </div>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

/**
 * Main TopBar Component
 */
export const TopBar = ({
  hideNewRoom,
  hideSignin,
  hideMyRooms,
  roomTitle,
  roomDescription,
  roomTitleColor,
}) => {
  const context = useContext(MetadataContext);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        padding: "4px 8px",
        rowGap: "8px",
        alignItems: "center",
      }}
    >
      <a href="/" style={{ display: "flex" }}>
        <img
          style={{ width: "56px", height: "56px" }}
          src="/logo192.png"
          alt="Logo"
        />
      </a>

      {roomTitle || roomDescription ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            margin: "0 10px",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              lineHeight: "30px",
              color: roomTitleColor || softWhite,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {roomTitle?.toUpperCase()}
          </div>
          <Text size="sm">{roomDescription}</Text>
        </div>
      ) : (
        <a href="/" style={{ display: "flex", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#2185d0",
                fontSize: "30px",
              }}
            >
              Watch
            </div>
            <div
              style={{
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#21ba45",
                fontSize: "30px",
                marginLeft: "4px",
              }}
            >
              Party
            </div>
          </div>
        </a>
      )}

      <Announce />

      <div
        className={appStyles.mobileStack}
        style={{
          display: "flex",
          marginLeft: "auto",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <ActionIcon
            component="a"
            color="gray"
            size="lg"
            href="https://discord.gg/3rYj5HV"
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
          >
            <IconBrandDiscord />
          </ActionIcon>
          <ActionIcon
            component="a"
            color="gray"
            size="lg"
            href="https://github.com/howardchung/watchparty"
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
          >
            <IconBrandGithub />
          </ActionIcon>
        </div>
        {!hideNewRoom && <NewRoomButton openNewTab />}
        {!hideMyRooms && context.user && <ListRoomsButton />}
        <SubscribeButton />
        {!hideSignin && <SignInButton />}
      </div>
    </div>
  );
};