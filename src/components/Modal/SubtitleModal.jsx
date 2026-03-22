import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  Switch,
  Title,
  TextInput,
  ActionIcon,
  Divider,
} from "@mantine/core";
import { openFileSelector, serverPath } from "../../utils/utils";
import { MetadataContext } from "../../MetadataContext";
import {
  IconDownload,
  IconSearch,
  IconUpload,
  IconX,
} from "@tabler/icons-react";

export const SubtitleModal = ({
  closeModal,
  roomSubtitle,
  haveLock,
  roomMedia,
  socket,
  getMediaDisplayName,
  setSubtitleMode,
  getSubtitleMode,
}) => {
  const context = useContext(MetadataContext);

  // Initialize state
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [titleQuery, setTitleQuery] = useState(
    getMediaDisplayName(roomMedia).split("/").slice(-1)[0]
  );

  // componentDidMount equivalent
  useEffect(() => {
    const fetchMetadata = async () => {
      if (roomMedia.includes("/stream?torrent=magnet")) {
        const re = /&fileIndex=(\d+)$/;
        const match = re.exec(roomMedia);
        if (match && match[1]) {
          const fileIndex = match[1];
          try {
            // Fetch title from the data endpoint
            const response = await fetch(roomMedia.replace("/stream", "/data"));
            const data = await response.json();
            if (data?.files?.[fileIndex]?.name) {
              setTitleQuery(data.files[fileIndex].name);
            }
          } catch (error) {
            console.error("Error fetching subtitle metadata:", error);
          }
        }
      }
    };
    fetchMetadata();
  }, [roomMedia]);

  const uploadSubtitle = async () => {
    const files = await openFileSelector(".srt,.vtt");
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", async (event) => {
      const subData = event.target?.result;
      try {
        const resp = await fetch(serverPath + "/subtitle", {
          method: "POST",
          body: subData,
          headers: { "Content-Type": "text/plain" },
        });
        const json = await resp.json();
        socket.emit("CMD:subtitle", serverPath + "/subtitle/" + json.hash);
      } catch (error) {
        console.error("Error uploading subtitle:", error);
      }
    });
    reader.readAsText(file);
  };

  const handleSearch = async (isByTitle) => {
    setLoading(true);
    const endpoint = isByTitle
      ? `/searchSubtitles?title=${encodeURIComponent(titleQuery)}`
      : `/searchSubtitles?url=${encodeURIComponent(roomMedia)}`;

    try {
      const resp = await fetch(serverPath + endpoint);
      const json = await resp.json();
      setSearchResults(json);
    } catch (error) {
      console.error("Subtitle search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened
      onClose={closeModal}
      centered
      title="Subtitles"
      size="50rem"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Switch
          checked={getSubtitleMode() === "showing"}
          label="Toggle subtitles for myself"
          onChange={() => setSubtitleMode()}
        />
        
        <Divider my="lg" />
        <Title order={6}>Room subtitles</Title>
        
        <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
          <TextInput
            placeholder="Subtitle URL"
            value={roomSubtitle || ""}
            disabled={!haveLock()}
            onChange={(e) => socket.emit("CMD:subtitle", e.target.value)}
            rightSection={
              <ActionIcon
                color="red"
                disabled={!haveLock()}
                onClick={() => socket.emit("CMD:subtitle", "")}
              >
                <IconX size={16} />
              </ActionIcon>
            }
          />
          
          <Button
            color="violet"
            onClick={uploadSubtitle}
            disabled={!haveLock()}
            leftSection={<IconUpload />}
          >
            Upload (.srt / .vtt)
          </Button>
          
          <Divider my="lg" />
          <Title order={6}>OpenSubtitles</Title>
          
          <TextInput
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            disabled={!haveLock()}
            rightSectionWidth={230}
            rightSection={
              <div style={{ display: "flex", gap: "4px", paddingRight: "4px" }}>
                <Button
                  loading={loading}
                  color="green"
                  disabled={!haveLock()}
                  onClick={() => handleSearch(true)}
                  leftSection={<IconSearch size={14} />}
                  size="xs"
                >
                  By title
                </Button>
                <Button
                  loading={loading}
                  color="blue"
                  disabled={!haveLock()}
                  onClick={() => handleSearch(false)}
                  leftSection={<IconSearch size={14} />}
                  size="xs"
                >
                  By hash
                </Button>
              </div>
            }
          />
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
            {searchResults.map((result) => (
              <div key={result.id} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <ActionIcon
                  disabled={!haveLock()}
                  onClick={async () => {
                    const resp = await fetch(
                      serverPath + "/downloadSubtitles?file_id=" + result.attributes.files[0]?.file_id
                    );
                    const data = await resp.json();
                    socket.emit("CMD:subtitle", serverPath + data.link);
                  }}
                >
                  <IconDownload size={16} />
                </ActionIcon>
                <span style={{ fontSize: "14px" }}>{result.attributes.release}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};