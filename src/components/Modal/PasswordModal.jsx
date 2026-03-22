import React, { useCallback, useContext, useEffect } from "react";
import { Modal, PasswordInput, ActionIcon } from "@mantine/core";
import { IconKey } from "@tabler/icons-react";
import { addAndSavePassword, serverPath } from "../../utils/utils";
import { MetadataContext } from "../../MetadataContext";

export const PasswordModal = ({ roomId }) => {
  const { user } = useContext(MetadataContext);

  const setPassword = useCallback(() => {
    const password = document.getElementById("roomPassword")?.value;
    if (password) {
      addAndSavePassword(roomId, password);
      window.location.reload();
    }
  }, [roomId]);

  useEffect(() => {
    const checkOwnership = async () => {
      // If a user is logged in, try to see if they own the room 
      // and have the password saved on the server.
      if (user) {
        try {
          // Firebase getIdToken logic removed
          const response = await fetch(
            `${serverPath}/listRooms?uid=${user.uid}`
          );
          
          if (response.ok) {
            const rooms = await response.json();
            const target = rooms.find((r) => r.roomId === roomId);
            if (target?.password) {
              addAndSavePassword(target.roomId, target.password);
              window.location.reload();
            }
          }
        } catch (error) {
          console.error("Failed to fetch room list:", error);
        }
      }
    };
    checkOwnership();
  }, [user, roomId]);

  return (
    <Modal
      onClose={() => {}}
      withCloseButton={false}
      opened
      centered
      size="md"
      title="This room requires a password"
    >
      <PasswordInput
        id="roomPassword"
        placeholder="Enter room password"
        onKeyDown={(e) => e.key === "Enter" && setPassword()}
        rightSection={
          <ActionIcon onClick={setPassword} variant="subtle">
            <IconKey size={16} />
          </ActionIcon>
        }
      />
    </Modal>
  );
};