import React, { useContext } from "react";
import { Menu } from "@mantine/core";
import { MetadataContext } from "../../MetadataContext";
import { IconBan, IconTrashFilled, IconX } from "@tabler/icons-react";

export const UserMenu = ({
  socket,
  userToManage,
  trigger,
  displayName,
  disabled,
  timestamp,
  isChatMessage,
}) => {
  const { user } = useContext(MetadataContext);

  return (
    <Menu
      closeOnItemClick
      closeOnClickOutside
      disabled={disabled}
      trigger="click"
      position="bottom-start"
      withinPortal
    >
      <Menu.Target>{trigger}</Menu.Target>
      
      <Menu.Dropdown>
        {displayName && <Menu.Label>{displayName}</Menu.Label>}
        
        {isChatMessage && (
          <Menu.Item
            leftSection={<IconX size={14} />}
            onClick={() => {
              socket.emit("CMD:deleteChatMessages", {
                author: userToManage,
                timestamp: timestamp,
              });
            }}
          >
            Delete Message
          </Menu.Item>
        )}

        <Menu.Item
          leftSection={<IconTrashFilled size={14} />}
          onClick={() => {
            socket.emit("CMD:deleteChatMessages", {
              author: userToManage,
            });
          }}
        >
          Delete User's Messages
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IconBan size={14} />}
          onClick={() => {
            socket.emit("CMD:kickUser", {
              userToBeKicked: userToManage,
            });
          }}
        >
          Kick User
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};