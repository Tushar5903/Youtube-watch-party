import React, { useState, useMemo, useCallback } from "react";
import {
  debounce,
  getMediaPathResults,
  getYouTubeResults,
  isHttp,
  isMagnet,
  isYouTube,
} from "../../utils/utils";
import { examples } from "../../utils/example";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import { IconLink, IconX } from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Loader,
} from "@mantine/core";

export const ComboBox = ({
  roomSetMedia,
  playlistAdd,
  roomMedia,
  getMediaDisplayName,
  mediaPath,
  disabled,
}) => {
  const [inputMedia, setInputMedia] = useState(undefined);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search logic
  const doSearch = useCallback(async (value) => {
    setLoading(true);
    const query = value || "";
    let searchResults = examples;

    if (
      query === "" ||
      (query && (isHttp(query) || isMagnet(query)))
    ) {
      if (!value && mediaPath) {
        searchResults = await getMediaPathResults(mediaPath, "");
      }
      if (query) {
        let type = "file";
        if (isYouTube(query)) type = "youtube";
        if (isMagnet(query)) type = "magnet";

        searchResults = [
          {
            name: query,
            type,
            url: query,
            duration: 0,
          },
        ];
      }
    } else {
      const data = await getYouTubeResults(query);
      searchResults = data;
    }

    setItems(searchResults);
    setLoading(false);
  }, [mediaPath]);

  // Use useMemo to ensure the debounced function persists across renders
  const debouncedSearch = useMemo(() => debounce(doSearch), [doSearch]);

  const setMediaAndClose = (value) => {
    roomSetMedia(value);
    setInputMedia(undefined);
    setItems([]);
  };

  const onChange = (value) => {
    setInputMedia(value);
    debouncedSearch(value);
  };

  const renderOption = ({ option }) => {
    const video = items.find((item) => item.url === option.value);
    return (
      <div
        key={option.value}
        onClick={() => setMediaAndClose(option.value)}
        style={{ width: "100%" }}
      >
        {video && (
          <ChatVideoCard
            video={video}
            index={0}
            onPlaylistAdd={playlistAdd}
          />
        )}
      </div>
    );
  };

  const handleFocus = (e) => {
    // Display the real string value when focused
    const displayValue = isHttp(roomMedia) || isMagnet(roomMedia)
      ? roomMedia
      : getMediaDisplayName(roomMedia);
    
    setInputMedia(displayValue);
    
    // Logic equivalent to the original setState callback
    if (!displayValue || isHttp(displayValue) || isMagnet(displayValue)) {
      doSearch(displayValue);
    }
    e.target.select();
  };

  const handleBlur = () => {
    setInputMedia(undefined);
    setItems([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setMediaAndClose(inputMedia ?? "");
      e.target.blur();
    }
  };

  return (
    <Autocomplete
      maxDropdownHeight={400}
      style={{ width: "100%" }}
      disabled={disabled}
      onChange={onChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      rightSection={
        <ActionIcon
          color="red"
          onClick={() => setMediaAndClose("")}
          title="Clear"
        >
          <IconX />
        </ActionIcon>
      }
      leftSection={loading ? <Loader size="sm" /> : <IconLink />}
      placeholder="Enter video file URL, magnet link, YouTube link, or YouTube search term"
      value={
        inputMedia !== undefined
          ? inputMedia
          : getMediaDisplayName(roomMedia)
      }
      renderOption={renderOption}
      data={items.map((item) => item.url)}
      filter={({ options }) => options}
    />
  );
};