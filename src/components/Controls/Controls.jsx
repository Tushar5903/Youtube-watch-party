import React, { useMemo, useState } from "react";
import { Badge, Button, Menu, Progress, Slider } from "@mantine/core";
import { formatTimestamp, softWhite } from "../../utils/utils";
import styles from "./Controls.module.css";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconCheck,
  IconRepeat,
  IconBadgeCc,
  IconVolumeOff,
  IconVolume,
  IconTheater,
  IconMaximize,
  IconPlayerSkipForwardFilled,
} from "@tabler/icons-react";

export const Controls = ({
  duration,
  video,
  paused,
  muted,
  volume,
  subtitled,
  currentTime,
  disabled,
  leaderTime,
  isPauseDisabled,
  playbackRate,
  roomPlaybackRate,
  isYouTube,
  isLiveStream,
  timeRanges,
  loop,
  roomTogglePlay,
  roomSeek,
  roomSetPlaybackRate,
  roomSetLoop,
  localFullScreen,
  localToggleMute,
  localSubtitleModal,
  localSeek,
  localSetVolume,
  localSetSubtitleMode,
  roomPlaylistPlay,
  playlist,
}) => {
  const [hoverState, setHoverState] = useState({
    hoverTimestamp: 0,
    hoverPos: 0,
  });
  const [showTimestamp, setShowTimestamp] = useState(false);

  const getEnd = () => duration;
  const getStart = () => 0;
  const getLength = () => getEnd() - getStart();
  const getCurrent = () => currentTime;
  const getPercent = () => (getCurrent() - getStart()) / getLength();

  const zeroTime = useMemo(
    () => Math.floor(Date.now() / 1000) - duration,
    [video, Boolean(duration)]
  );

  const onMouseOver = () => setShowTimestamp(true);
  const onMouseOut = () => setShowTimestamp(false);

  const onMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const max = rect.width;
    const pct = x / max;
    const target = getStart() + pct * getLength();
    if (pct >= 0) {
      setHoverState({ hoverTimestamp: target, hoverPos: pct });
    }
  };

  const behindThreshold = 10;
  const behindTime =
    !isLiveStream && leaderTime && leaderTime < Infinity
      ? leaderTime - currentTime
      : getEnd() - getCurrent();
  const isBehind = behindTime > behindThreshold;

  const buffers = timeRanges.map(({ start, end }) => {
    const buffStartPct = (start / getLength()) * 100;
    const buffLengthPct = ((end - start) / getLength()) * 100;
    return (
      <div
        key={start}
        style={{
          position: "absolute",
          height: "8px",
          backgroundColor: "grey",
          left: buffStartPct + "%",
          width: buffLengthPct + "%",
          bottom: "0em",
          zIndex: 0,
          pointerEvents: "none",
        }}
      ></div>
    );
  });

  const playPauseProps = {
    onClick: () => roomTogglePlay(),
    className: ` ${styles.action}`,
    disabled: disabled || isPauseDisabled,
  };

  return (
    <div className={styles.controls}>
      {paused ? (
        <IconPlayerPlayFilled {...playPauseProps} />
      ) : (
        <IconPlayerPauseFilled {...playPauseProps} />
      )}

      {playlist.length > 0 && (
        <IconPlayerSkipForwardFilled
          title="Skip to next"
          className={styles.action}
          onClick={() => roomPlaylistPlay(0)}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Button
          size="compact-xs"
          color={isBehind ? "blue" : "grey"}
          title="Sync"
          onClick={() => {
            if (isLiveStream) {
              roomSeek(duration);
            } else {
              localSeek();
            }
          }}
        >
          Sync
        </Button>
      </div>

      <div className={` ${styles.text}`}>
        {formatTimestamp(getCurrent(), isLiveStream ? zeroTime : undefined)}
      </div>

      <Progress.Root
        radius="0px"
        onClick={(e) => {
          if (!disabled && e) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const max = rect.width;
            const pct = x / max;
            let target = getLength() * pct;
            roomSeek(target);
          }
        }}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        onMouseMove={onMouseMove}
        style={{
          flexGrow: 1,
          marginTop: 0,
          marginBottom: 0,
          position: "relative",
          minWidth: "50px",
          overflow: "visible",
          cursor: "pointer",
        }}
      >
        <Progress.Section
          style={{ pointerEvents: "none", zIndex: 1 }}
          value={getPercent() * 100}
        />
        {buffers}
        {getLength() < Infinity && showTimestamp && (
          <Badge
            style={{
              position: "absolute",
              bottom: "10px",
              left: `calc(${hoverState.hoverPos * 100 + "%"})`,
              transform: "translate(-50%)",
              display: "inline-block",
            }}
          >
            {formatTimestamp(
              hoverState.hoverTimestamp,
              isLiveStream ? zeroTime : undefined
            )}
          </Badge>
        )}
      </Progress.Root>

      <div className={` ${styles.text}`}>{formatTimestamp(getEnd())}</div>

      {isLiveStream && (
        <Badge size="xs" color="red">
          LIVE
        </Badge>
      )}

      <Menu disabled={disabled}>
        <Menu.Target>
          <div
            className={`${styles.text} ${styles.action}`}
            style={{
              backgroundColor: "rgba(100,100,100, 0.6)",
              fontSize: 10,
              borderRadius: "4px",
              padding: "2px",
            }}
          >
            {playbackRate?.toFixed(2)}x
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          {[
            { key: "Auto", text: "Auto", value: 0 },
            { key: "0.25", text: "0.25x", value: 0.25 },
            { key: "0.5", text: "0.5x", value: 0.5 },
            { key: "1", text: "1x", value: 1 },
            { key: "1.5", text: "1.5x", value: 1.5 },
            { key: "2", text: "2x", value: 2 },
            { key: "3", text: "3x", value: 3 },
          ].map((item) => (
            <Menu.Item
              key={item.key}
              onClick={() => roomSetPlaybackRate(item.value)}
              rightSection={
                roomPlaybackRate === item.value ? <IconCheck /> : null
              }
            >
              {item.text}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <IconRepeat
        onClick={() => {
          if (!disabled) {
            roomSetLoop(!loop);
          }
        }}
        className={` ${styles.action}`}
        title="Loop"
        color={loop ? "green" : softWhite}
      />

      {isYouTube ? (
        <Menu shadow="md">
          <Menu.Target>
            <IconBadgeCc className={styles.action} />
          </Menu.Target>
          <Menu.Dropdown>
            {[
              { key: "hidden", text: "Off", value: "hidden" },
              { key: "en", text: "English", value: "showing" },
              { key: "es", text: "Spanish", value: "showing" },
            ].map((item) => (
              <Menu.Item
                key={item.key}
                onClick={() => localSetSubtitleMode(item.value, item.key)}
              >
                {item.text}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <IconBadgeCc
          onClick={() => localSubtitleModal()}
          className={` ${styles.action}`}
          title="Captions"
          color={subtitled ? "green" : softWhite}
        />
      )}

      <IconTheater
        onClick={() => localFullScreen(false)}
        className={` ${styles.action}`}
        title="Theater Mode"
      />

      <IconMaximize
        onClick={() => localFullScreen(true)}
        className={` ${styles.action}`}
        title="Fullscreen"
      />

      {muted ? (
        <IconVolumeOff
          onClick={() => localToggleMute()}
          className={` ${styles.action}`}
        />
      ) : (
        <IconVolume
          onClick={() => localToggleMute()}
          className={` ${styles.action}`}
        />
      )}

      <div style={{ width: "100px" }}>
        <Slider
          defaultValue={volume}
          disabled={muted}
          min={0}
          max={1}
          step={0.01}
          onChangeEnd={(value) => localSetVolume(value)}
        />
      </div>
    </div>
  );
};