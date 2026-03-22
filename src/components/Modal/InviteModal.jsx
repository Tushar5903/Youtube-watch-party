import React, { useState } from "react";
import { Modal, TextInput, ActionIcon } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";

export const InviteModal = ({ closeInviteModal }) => {
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setInviteLinkCopied(true);
    
    // Optional: Reset the "copied" message after 3 seconds
    setTimeout(() => setInviteLinkCopied(false), 3000);
  };

  return (
    <Modal
      opened
      centered
      onClose={closeInviteModal}
      title="Invite friends and watch together!"
    >
      <TextInput
        label="Copy and share this link:"
        readOnly
        rightSection={
          <ActionIcon onClick={handleCopyInviteLink} color="teal" variant="subtle">
            <IconCopy size={16} />
          </ActionIcon>
        }
        defaultValue={window.location.href}
      />
      {inviteLinkCopied && (
        <div style={{ marginTop: 15 }}>
          <b style={{ color: "green", fontSize: '14px' }}>
            Link copied to clipboard.
          </b>
        </div>
      )}
    </Modal>
  );
};