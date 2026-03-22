import toWebVTT from "srt-webvtt";

export class HTML {
  constructor(elId) {
    this.elId = elId;
  }

  getVideoEl = () => {
    return document.getElementById(this.elId);
  };

  getCurrentTime = () => {
    return this.getVideoEl()?.currentTime ?? 0;
  };

  getDuration = () => {
    return this.getVideoEl()?.duration ?? 0;
  };

  isMuted = () => {
    return this.getVideoEl()?.muted ?? false;
  };

  isSubtitled = () => {
    return this.getSubtitleMode() === "showing";
  };

  getPlaybackRate = () => {
    return this.getVideoEl()?.playbackRate ?? 1;
  };

  setPlaybackRate = (rate) => {
    const video = this.getVideoEl();
    if (video) {
      video.playbackRate = rate;
    }
  };

  setSrcAndTime = async (src, time) => {
    const leftVideo = this.getVideoEl();
    if (leftVideo) {
      leftVideo.currentTime = time;
      leftVideo.src = src;
    }
  };

  playVideo = async () => {
    const video = this.getVideoEl();
    if (video) {
      await video.play();
    }
  };

  pauseVideo = () => {
    const video = this.getVideoEl();
    if (video) {
      video.pause();
    }
  };

  seekVideo = (time) => {
    const video = this.getVideoEl();
    if (video) {
      video.currentTime = time;
    }
  };

  shouldPlay = () => {
    const leftVideo = this.getVideoEl();
    return Boolean(leftVideo?.paused || leftVideo?.ended);
  };

  setMute = (muted) => {
    const leftVideo = this.getVideoEl();
    if (leftVideo) {
      leftVideo.muted = muted;
    }
    const audio = document.getElementById("iPhoneAudio");
    if (audio) {
      audio.muted = muted;
    }
  };

  setVolume = (volume) => {
    const video = this.getVideoEl();
    if (video) {
      video.volume = volume;
    }
  };

  getVolume = () => {
    return this.getVideoEl()?.volume ?? 1;
  };

  setSubtitleMode = (mode) => {
    const video = this.getVideoEl();
    if (video) {
      for (let i = 0; i < Math.min(video.textTracks.length, 1); i++) {
        video.textTracks[i].mode =
          mode ??
          (video.textTracks[i].mode === "hidden" ? "showing" : "hidden");
      }
    }
  };

  getSubtitleMode = () => {
    return this.getVideoEl()?.textTracks[0]?.mode ?? "hidden";
  };

  isReady = () => {
    return Boolean(this.getVideoEl());
  };

  clearState = () => {
    const leftVideo = this.getVideoEl();
    if (!leftVideo) return;

    leftVideo.src = "";
    leftVideo.srcObject = null;

    this.setSubtitleMode("hidden");
    leftVideo.innerHTML = "";
  };

  loadSubtitles = async (src) => {
    const leftVideo = this.getVideoEl();
    if (!leftVideo) return;

    leftVideo.innerHTML = "";
    if (src) {
      const response = await fetch(src);
      const buffer = await response.arrayBuffer();
      const url = await toWebVTT(new Blob([buffer]));
      const track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = url;
      leftVideo.appendChild(track);
      if (leftVideo.textTracks[0]) {
        leftVideo.textTracks[0].mode = "showing";
      }
    }
  };

  syncSubtitles = (sharerTime) => {
    const leftVideo = this.getVideoEl();
    if (!leftVideo) return;

    const track = leftVideo.textTracks[0];
    const offset = leftVideo.currentTime - sharerTime;
    
    if (track && track.cues && offset) {
      for (let i = 0; i < track.cues.length; i++) {
        const cue = track.cues[i];
        if (!cue) continue;

        if (!cue.origStart) {
          cue.origStart = cue.startTime;
          cue.origEnd = cue.endTime;
        }
        cue.startTime = cue.origStart + offset;
        cue.endTime = cue.origEnd + offset;
      }
    }
  };

  getTimeRanges = () => {
    const leftVideo = this.getVideoEl();
    const buffers = [];
    if (leftVideo) {
      const rangeCount = leftVideo.buffered.length;
      for (let i = 0; i < rangeCount; i++) {
        buffers.push({
          start: leftVideo.buffered.start(i),
          end: leftVideo.buffered.end(i),
        });
      }
    }
    return buffers;
  };

  setLoop = (loop) => {
    const leftVideo = this.getVideoEl();
    if (leftVideo) {
      leftVideo.loop = loop;
    }
  };
}