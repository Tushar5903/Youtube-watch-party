import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@mantine/core";
import styles from "./Announce.module.css";
import config from "../../config";

const GITHUB_REPO = "howardchung/watchparty-announcements";

const Announce = () => {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const update = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/search/issues?" +
            new URLSearchParams({
              q: `repo:${GITHUB_REPO} label:${
                config.NODE_ENV === "development" ? "test" : "release"
              }`,
              order: "desc",
              page: "1",
              per_page: "1",
            })
        );
        
        const data = await response.json();
        const top = data?.items?.[0];

        // Check if the announcement hasn't been dismissed and is less than 7 days old
        if (
          top?.number > Number(localStorage.getItem("announcement-dismiss")) &&
          new Date(top.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ) {
          setAnnouncement(top);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      }
    };
    
    update();
  }, []);

  const onDismiss = useCallback((value) => {
    localStorage.setItem("announcement-dismiss", value.toString());
    setAnnouncement(null);
  }, []);

  if (!announcement) {
    return null;
  }

  return (
    <div className={styles.announce}>
      <pre style={{ whiteSpace: "pre-wrap" }}>{announcement.body}</pre>
      <aside>
        <Button color="blue" onClick={() => onDismiss(announcement.number)}>
          Dismiss
        </Button>
      </aside>
    </div>
  );
};

export default Announce;