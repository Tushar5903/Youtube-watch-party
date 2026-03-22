import React, { useState } from "react";
import { ActionIcon } from "@mantine/core";
import { InviteModal } from "../Modal/InviteModal";
import { IconUserPlus } from "@tabler/icons-react";

export const InviteButton = () => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      {inviteModalOpen && (
        <InviteModal closeInviteModal={() => setInviteModalOpen(false)} />
      )}
      <ActionIcon
        size="36px"
        color="green"
        variant="filled"
        title="Invite friends"
        onClick={() => setInviteModalOpen(true)}
      >
        <IconUserPlus size={20} />
      </ActionIcon>
    </>
  );
};