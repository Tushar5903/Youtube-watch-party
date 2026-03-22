import React, { useCallback, useContext, useState } from "react";
import { Button } from "@mantine/core";
import { serverPath } from "../../utils/utils";
import { SubscribeModal } from "../Modal/SubscribeModal";
import { MetadataContext } from "../../MetadataContext";
import { IconStarFilled, IconTool } from "@tabler/icons-react";

export const SubscribeButton = () => {
  const { isSubscriber } = useContext(MetadataContext);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  // If we don't know the status yet or they are already a subscriber, hide the button
  if (isSubscriber === undefined || isSubscriber) {
    return null;
  }

  return (
    <>
      {isSubscribeModalOpen && (
        <SubscribeModal closeSubscribe={() => setIsSubscribeModalOpen(false)} />
      )}
      <Button
        leftSection={<IconStarFilled size={16} />}
        color="orange"
        onClick={() => setIsSubscribeModalOpen(true)}
      >
        Subscribe
      </Button>
    </>
  );
};

export const ManageSubButton = () => {
  const { user } = useContext(MetadataContext);

  const onManage = useCallback(async () => {
    if (!user) return;

    try {
      const resp = await fetch(serverPath + "/manageSub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          token: await user.getIdToken(),
          return_url: window.location.href,
        }),
      });

      const session = await resp.json();
      if (session.url) {
        window.location.assign(session.url);
      }
    } catch (error) {
      console.error("Failed to manage subscription:", error);
    }
  }, [user]);

  return (
    <Button 
      leftSection={<IconTool size={16} />} 
      color="orange" 
      onClick={onManage}
    >
      Manage Subscription
    </Button>
  );
};