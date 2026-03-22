import React, { useState, useCallback, useContext } from "react";
import {
  Button,
  Modal,
  Alert,
  ActionIcon,
  Popover,
  TextInput,
  Badge,
  Switch,
  Loader,
  Text,
  Divider,
} from "@mantine/core";
import { getCurrentSettings, updateSettings } from "./LocalSettings";
import { serverPath } from "../../utils/utils";
import { PermanentRoomModal } from "../Modal/PermanentRoomModal";
import { HexColorPicker } from "react-colorful";
import { MetadataContext } from "../../MetadataContext";
import {
  IconCheck,
  IconDeviceFloppy,
  IconHelpCircle,
  IconPaintFilled,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import styles from "./Settings.modal.css";

const defaultRoomTitleColor = "#FFFFFF";
const roomTitleMaxCharLength = 50;
const roomDescriptionMaxCharLength = 120;

export const SettingsModal = ({
  modalOpen,
  setModalOpen,
  roomLock,
  setRoomLock,
  socket,
  owner,
  vanity,
  setVanity,
  inviteLink: roomLink,
  password,
  setPassword,
  isChatDisabled,
  setIsChatDisabled,
  clearChat,
  roomTitle,
  roomDescription,
  roomTitleColor,
  mediaPath,
  setMediaPath,
}) => {
  const { user, isSubscriber } = useContext(MetadataContext);
  const [updateTS, setUpdateTS] = useState(0);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [validVanity, setValidVanity] = useState(true);
  const [validVanityLoading, setValidVanityLoading] = useState(false);
  const [adminSettingsChanged, setAdminSettingsChanged] = useState(false);
  const [roomTitleInput, setRoomTitleInput] = useState(undefined);
  const [roomDescriptionInput, setRoomDescriptionInput] = useState(undefined);
  const [roomTitleColorInput, setRoomTitleColorInput] = useState("");

  const setRoomState = useCallback(
    async (data) => {
      socket.emit("CMD:setRoomState", {
        ...data,
      });
    },
    [socket]
  );

  const setRoomOwner = useCallback(
    async (data) => {
      socket.emit("CMD:setRoomOwner", {
        ...data,
      });
    },
    [socket]
  );

  const checkValidVanity = useCallback(
    async (input) => {
      if (!input) {
        setValidVanity(true);
        return;
      }
      setValidVanity(false);
      setValidVanityLoading(true);
      try {
        const response = await fetch(serverPath + "/resolveRoom/" + input);
        const data = await response.json();
        setValidVanityLoading(false);
        if (
          data &&
          data.vanity &&
          data.vanity !== roomLink.split("/").slice(-1)[0]
        ) {
          setValidVanity(false);
        } else {
          setValidVanity(true);
        }
      } catch (e) {
        setValidVanityLoading(false);
        setValidVanity(true);
      }
    },
    [roomLink]
  );

  const disableLocking = !user || (roomLock && roomLock !== user?.uid);
  const disableOwning = !user || (owner && owner !== user?.uid);

  return (
    <>
      {permModalOpen && (
        <PermanentRoomModal closeModal={() => setPermModalOpen(false)} />
      )}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        centered
        title="Settings"
      >
        <div>
          <div className={styles.sectionHeader}>Room Settings</div>
          <SettingRow
            toggle
            name="Lock Room"
            description="Only the person who locked the room can control the video."
            checked={!!roomLock}
            disabled={disableLocking && disableOwning}
            onChange={(e) => setRoomLock(e.currentTarget.checked)}
            label={!user ? "requires login" : ""}
          />
          <SettingRow
            toggle
            name="Make Room Permanent"
            description="Prevent this room from expiring. This also unlocks additional room features."
            helpIcon={
              <IconHelpCircle
                onClick={() => setPermModalOpen(true)}
                style={{ cursor: "pointer" }}
              />
            }
            checked={!!owner}
            disabled={disableOwning}
            onChange={(e) => setRoomOwner({ undo: !e.currentTarget.checked })}
            label={!user ? "requires login" : ""}
          />

          <Divider my="lg" />
          <div className={styles.sectionHeader}>Local Settings</div>
          <SettingRow
            toggle
            updateTS={updateTS}
            name="Disable chat notification sound"
            description="Don't play a sound when a chat message is sent while you're on another tab"
            checked={!!getCurrentSettings().disableChatSound}
            disabled={false}
            onChange={(e) => {
              updateSettings(
                JSON.stringify({
                  ...getCurrentSettings(),
                  disableChatSound: e.currentTarget.checked,
                })
              );
              setUpdateTS(Date.now());
            }}
          />
        </div>

        <Divider my="lg" />
        <div className={styles.sectionHeader}>Permanent Room Settings</div>
        {!owner && (
          <Alert color="yellow">
            The room must be permanent to modify these settings.
          </Alert>
        )}
        {owner && owner !== user?.uid && (
          <Alert color="yellow">
            Only the room owner can change permanent room settings.
          </Alert>
        )}
        {owner && owner === user?.uid && (
          <>
            <SettingRow
              toggle={false}
              content={
                <TextInput
                  label="Set Room Password"
                  description="Users must know this password in order to join the room."
                  value={password ?? ""}
                  placeholder="Password"
                  onChange={(e) => {
                    setAdminSettingsChanged(true);
                    setPassword(e.target.value);
                  }}
                />
              }
              disabled={false}
            />
            <SettingRow
              content={
                <TextInput
                  label="Set Room Media Source"
                  description="Set a media source URL to replace the default examples"
                  placeholder="YouTube playlist or link to text list of URLs"
                  value={mediaPath ?? ""}
                  onChange={(e) => {
                    setAdminSettingsChanged(true);
                    setMediaPath(e.target.value);
                  }}
                />
              }
              disabled={false}
            />
            <SettingRow
              toggle
              name="Disable Chat"
              description="Prevent users from sending messages in chat."
              checked={!!isChatDisabled}
              disabled={false}
              onChange={(e) => {
                setAdminSettingsChanged(true);
                setIsChatDisabled(e.currentTarget.checked);
              }}
            />
            <SettingRow
              disabled={false}
              content={
                <div style={{ display: "flex", gap: "14px" }}>
                  <ActionIcon color="red" size="lg" onClick={() => clearChat()}>
                    <IconTrash />
                  </ActionIcon>
                  <div>
                    <Text>Clear Chat</Text>
                    <Text size="xs" c="grey">
                      Delete all existing chat messages
                    </Text>
                  </div>
                </div>
              }
            />
            <SettingRow
              toggle={false}
              disabled={!isSubscriber}
              subOnly={true}
              content={
                <TextInput
                  label="Set Custom Room URL"
                  description="Set a custom URL for this room. Inappropriate names may be revoked."
                  value={vanity ?? ""}
                  disabled={!isSubscriber}
                  onChange={(e) => {
                    setAdminSettingsChanged(true);
                    checkValidVanity(e.target.value);
                    setVanity(e.target.value);
                  }}
                  leftSection="/r/"
                  rightSection={
                    <>
                      {validVanityLoading && <Loader size="xs" />}
                      {validVanity ? (
                        <IconCheck color="green" size={16} />
                      ) : (
                        <IconX color="red" size={16} />
                      )}
                    </>
                  }
                />
              }
            />
            <SettingRow
              toggle={false}
              disabled={!isSubscriber}
              subOnly={true}
              content={
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <TextInput
                    label="Set Room Title, Description & Color"
                    description="Set the room title, description and title color to be displayed in the top bar."
                    value={roomTitleInput ?? roomTitle ?? ""}
                    disabled={!isSubscriber}
                    maxLength={roomTitleMaxCharLength}
                    onChange={(e) => {
                      setAdminSettingsChanged(true);
                      setRoomTitleInput(e.target.value);
                    }}
                    placeholder={`Title (max. ${roomTitleMaxCharLength} characters)`}
                    rightSection={
                      <Popover position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <ActionIcon
                            color={roomTitleColorInput || roomTitleColor || defaultRoomTitleColor}
                            disabled={!isSubscriber}
                          >
                            <IconPaintFilled size={16} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Text fw={500} size="sm" mb={8}>Edit Title Color</Text>
                          <HexColorPicker
                            color={roomTitleColorInput || roomTitleColor || defaultRoomTitleColor}
                            onChange={(color) => {
                              setAdminSettingsChanged(true);
                              setRoomTitleColorInput(color);
                            }}
                          />
                          <div
                            style={{
                              marginTop: 8,
                              paddingLeft: 4,
                              borderLeft: `24px solid ${roomTitleColorInput || roomTitleColor || defaultRoomTitleColor}`,
                            }}
                          >
                            {(roomTitleColorInput || roomTitleColor || defaultRoomTitleColor).toUpperCase()}
                          </div>
                        </Popover.Dropdown>
                      </Popover>
                    }
                  />
                  <TextInput
                    value={roomDescriptionInput ?? roomDescription ?? ""}
                    disabled={!isSubscriber}
                    maxLength={roomDescriptionMaxCharLength}
                    onChange={(e) => {
                      setAdminSettingsChanged(true);
                      setRoomDescriptionInput(e.target.value);
                    }}
                    placeholder={`Description (max. ${roomDescriptionMaxCharLength} characters)`}
                  />
                </div>
              }
            />
            <Button
              style={{ marginTop: "8px" }}
              disabled={!validVanity || !adminSettingsChanged}
              onClick={() => {
                setRoomState({
                  vanity: vanity,
                  password: password,
                  isChatDisabled: isChatDisabled,
                  roomTitle: roomTitleInput ?? roomTitle,
                  roomDescription: roomDescriptionInput ?? roomDescription,
                  roomTitleColor:
                    roomTitleColorInput ||
                    roomTitleColor ||
                    defaultRoomTitleColor,
                  mediaPath: mediaPath,
                });
                setAdminSettingsChanged(false);
              }}
              leftSection={<IconDeviceFloppy />}
            >
              Save Settings
            </Button>
          </>
        )}
      </Modal>
    </>
  );
};

const SettingRow = ({
  name,
  description,
  checked,
  disabled,
  onChange,
  content,
  subOnly,
  helpIcon,
  toggle,
  label,
}) => {
  return (
    <div
      style={{
        display: "flex",
        marginTop: "4px",
        width: "100%",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
        {label && (
          <Badge size="xs" color="red">
            {label}
          </Badge>
        )}
        {subOnly && (
          <Badge size="xs" color="orange" ml={4}>
            Subscriber only
          </Badge>
        )}
      </div>
      <div style={{ flex: 1 }}>
        {toggle && (
          <Switch
            label={name}
            description={description}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
          />
        )}
        {content}
      </div>
      {helpIcon && (
        <div style={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
          {helpIcon}
        </div>
      )}
    </div>
  );
};