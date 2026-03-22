import React, { useState, useContext, useCallback, useMemo, useRef } from "react";
import {
  debounce,
  getYouTubeResults,
  getStreamPathResults,
} from "../../utils/utils";
import { Loader, Select } from "@mantine/core";
import {
  YouTubeSearchResult,
  StreamPathSearchResult,
} from "../SearchResult/SearchResult";
import { MetadataContext } from "../../MetadataContext";
import { IconBrandYoutubeFilled, IconMovie } from "@tabler/icons-react";

export const SearchComponent = ({
  setMedia,
  playlistAdd,
  type,
  setShowMultiSelect,
  setFileSelection,
  disabled,
}) => {
  const context = useContext(MetadataContext);
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputMedia, setInputMedia] = useState("");
  
  // Use a ref for the timestamp to track the latest request without triggering re-renders
  const lastResultTimestamp = useRef(Date.now());

  const doSearch = useCallback(async (value) => {
    const query = value || "";
    setInputMedia(query);
    setLoading(true);

    let searchResults = [];
    const timestamp = Date.now();

    if (type === "youtube") {
      searchResults = await getYouTubeResults(query);
    } else if (type === "stream" && context.streamPath) {
      searchResults = await getStreamPathResults(context.streamPath, query);
    }

    // Only update if this request is newer than the last successful update
    if (timestamp > lastResultTimestamp.current) {
      setResults(searchResults);
      setLoading(false);
      lastResultTimestamp.current = timestamp;
    }
  }, [type, context.streamPath]);

  // Use useMemo to ensure the debounced function persists across renders
  const debouncedSearch = useMemo(() => debounce(doSearch, 500), [doSearch]);

  const onSelectItem = async (result) => {
    setShowMultiSelect(true);
    try {
      const response = await fetch(
        `${context.streamPath}/data?torrent=${encodeURIComponent(result.magnet)}`
      );
      const metadata = await response.json();
      
      const multiStreamSelection = metadata.files.map((file, i) => ({
        ...file,
        url: `${context.streamPath}/stream?torrent=${encodeURIComponent(result.magnet)}&fileIndex=${i}`,
      }));
      
      setFileSelection(multiStreamSelection);
    } catch (error) {
      console.error("Failed to fetch stream metadata:", error);
    }
  };

  const renderOption = ({ option }) => {
    const result = results.find((r) => r.url === option.value);
    
    if (!result) {
      return <div>{option.label}</div>;
    }

    if (type === "youtube") {
      return (
        <YouTubeSearchResult
          key={result.url}
          {...result}
          setMedia={setMedia}
          playlistAdd={playlistAdd}
        />
      );
    }

    return (
      <StreamPathSearchResult
        key={result.url}
        onSelectItem={onSelectItem}
        {...result}
      />
    );
  };

  const placeholder = type === "youtube" ? "Search YouTube" : "Search or enter magnet";
  const icon = type === "youtube" ? <IconBrandYoutubeFilled /> : <IconMovie />;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSelectItem({
        magnet: inputMedia,
        type: "magnet",
        url: "",
        name: "",
        duration: 0,
      });
    }
  };

  return (
    <Select
      maxDropdownHeight={400}
      searchable
      leftSection={loading ? <Loader size="sm" /> : icon}
      placeholder={placeholder}
      onSearchChange={debouncedSearch}
      onKeyDown={handleKeyDown}
      value={inputMedia}
      onFocus={() => doSearch()}
      disabled={disabled}
      data={results.map((r) => r.url)}
      renderOption={renderOption}
      comboboxProps={{ width: 400, position: "bottom-start" }}
      filter={({ options }) => options}
    />
  );
};