import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, Avatar, HoverCard, Text } from "@mantine/core";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { serverPath } from "../../utils/utils";
import { ManageSubButton } from "../SubscribeButton/SubscribeButton";
import config from "../../config";
import { MetadataContext } from "../../MetadataContext";
import {
  IconBrandDiscordFilled,
  IconBrandGravatar,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconKeyFilled,
  IconLogout,
  IconTrashFilled,
} from "@tabler/icons-react";

export const ProfileModal = ({ close, userImage }) => {
  const context = useContext(MetadataContext);
  
  const [resetDisabled, setResetDisabled] = useState(false);
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [linkedDiscord, setLinkedDiscord] = useState(null);

  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      if (!context.user) return;
      
      try {
        const token = await context.user.getIdToken() || "";
        const response = await fetch(
          serverPath +
            "/linkAccount?" +
            new URLSearchParams({
              uid: context.user.uid || "",
              token,
            })
        );
        const data = await response.json();
        const discordAccount = data.find((d) => d.kind === "discord");
        setLinkedDiscord(discordAccount);
      } catch (error) {
        console.error("Failed to fetch linked accounts:", error);
      }
    };

    fetchLinkedAccounts();
  }, [context.user]);

  const onSignOut = () => {
    firebase.auth().signOut();
    window.localStorage.removeItem("watchparty-loginname");
    window.location.reload();
  };

  const resetPassword = async () => {
    try {
      if (context.user?.email) {
        await firebase.auth().sendPasswordResetEmail(context.user.email);
        setResetDisabled(true);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const verifyEmail = async () => {
    try {
      if (context.user) {
        await context.user.sendEmailVerification();
        setVerifyDisabled(true);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const deleteAccount = async () => {
    try {
      const token = await context.user?.getIdToken();
      await fetch(serverPath + "/deleteAccount", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: context.user?.uid, token }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const authDiscord = () => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=1071707916719095908&redirect_uri=${encodeURIComponent(
      config.VITE_OAUTH_REDIRECT_HOSTNAME
    )}%2Fdiscord%2Fauth&response_type=token&scope=identify`;
    
    window.open(
      url,
      "_blank",
      "toolbar=0,location=0,menubar=0,width=450,height=900"
    );
  };

  const deleteDiscord = async () => {
    try {
      const token = await context.user?.getIdToken();
      await fetch(serverPath + "/linkAccount", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: context.user?.uid,
          token,
          kind: "discord",
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Error unlinking Discord:", error);
    }
  };

  return (
    <Modal opened onClose={close} centered>
      {/* Delete Confirmation Nested Modal */}
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Your Account"
      >
        <p>Are you sure you want to delete your account? This can't be undone.</p>
        <p>
          Note: If you have an active subscription, deleting your account will
          NOT automatically cancel it and you will need to contact
          support@watchparty.me to cancel.
        </p>
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <Button color="red" onClick={deleteAccount}>
            Yes, Delete
          </Button>
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
            No, Keep it
          </Button>
        </div>
      </Modal>

      {/* Main Profile Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <Avatar src={userImage} />
        {context.user?.email}
        {context.user?.emailVerified && (
          <IconCircleCheckFilled
            title="This email is verified"
            color="green"
            size={18}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          margin: "10px",
        }}
      >
        <Button
          component="a"
          leftSection={<IconBrandGravatar />}
          href="https://gravatar.com"
          target="_blank"
          color="blue"
        >
          Edit Gravatar
        </Button>

        <Button
          disabled={context.user?.emailVerified || verifyDisabled}
          leftSection={<IconCircleCheck />}
          color="purple"
          onClick={verifyEmail}
        >
          Verify Email
        </Button>

        {context.isSubscriber && <ManageSubButton />}

        {linkedDiscord ? (
          <Button
            leftSection={<IconBrandDiscordFilled />}
            color="red"
            onClick={deleteDiscord}
          >
            Unlink Discord {linkedDiscord.accountname}#
            {linkedDiscord.discriminator}
          </Button>
        ) : (
          <HoverCard width={280} shadow="md">
            <HoverCard.Target>
              <Button
                leftSection={<IconBrandDiscordFilled />}
                color="orange"
                onClick={authDiscord}
              >
                Link Discord Account
              </Button>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <Text size="sm">
                Link your Discord account to automatically receive your
                Subscriber role if you're subscribed.
              </Text>
            </HoverCard.Dropdown>
          </HoverCard>
        )}

        <Button
          disabled={resetDisabled}
          leftSection={<IconKeyFilled />}
          color="green"
          onClick={resetPassword}
        >
          Reset Password
        </Button>

        <Button
          leftSection={<IconTrashFilled />}
          color="red"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          Delete Account
        </Button>

        <Button variant="light" leftSection={<IconLogout />} onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </Modal>
  );
};