import React from "react";
import { Button, Text } from "@mantine/core";
import { decodeEntities, formatSize } from "../../utils/utils";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";

/**
 * YouTube search result item with "Play" and "Add to Playlist" logic.
 */
export const YouTubeSearchResult = ({ setMedia, playlistAdd, ...result }) => {
  return (
    <div
      onClick={() => setMedia(result.url)}
      style={{ cursor: 'pointer', padding: '4px' }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img 
          style={{ height: "50px", borderRadius: '4px' }} 
          src={result.img} 
          alt={result.name} 
        />
        <IconBrandYoutubeFilled color="red" size={20} />
        <div style={{ flex: 1, fontSize: '14px' }}>
          {decodeEntities(result.name)}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Button
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              playlistAdd(result.url);
            }}
          >
            Add To Playlist
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple media path result for direct file links.
 */
export const MediaPathSearchResult = ({ setMedia, ...result }) => {
  return (
    <div
      onClick={() => setMedia(result.url)}
      key={result.url}
      style={{ cursor: "pointer", padding: "8px", fontSize: '14px' }}
    >
      {result.name}
    </div>
  );
};

/**
 * Stream/Magnet search result displaying size and seeder counts.
 */
export const StreamPathSearchResult = ({ onSelectItem, ...result }) => {
  return (
    <div 
      key={result.url} 
      onClick={() => onSelectItem(result)}
      style={{ cursor: 'pointer', padding: '8px' }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflowWrap: "anywhere",
        }}
      >
        <Text fw={500}>{result.name}</Text>
        <Text size="xs" c="dimmed">
          {typeof result.size === "number"
            ? formatSize(result.size)
            : result.size}
          , {result.seeders} seeds
        </Text>
      </div>
    </div>
  );
};