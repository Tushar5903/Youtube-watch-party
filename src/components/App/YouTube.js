export class YouTube {
  constructor(watchPartyYTPlayer) {
    this.watchPartyYTPlayer = watchPartyYTPlayer;
  }

  clearDashState = () => {};
  setDashState = (player) => {};

  getCurrentTime = () => {
    return this.watchPartyYTPlayer?.getCurrentTime() ?? 0;
  };

  getDuration = () => {
    return this.watchPartyYTPlayer?.getDuration() ?? 0;
  };

  isMuted = () => {
    return this.watchPartyYTPlayer?.isMuted() ?? false;
  };

  isSubtitled = () => {
    // Note: YouTube API track updates are inconsistent, returning false by default as per original logic
    return false;
  };

  getPlaybackRate = () => {
    return this.watchPartyYTPlayer?.getPlaybackRate() ?? 1;
  };

  setPlaybackRate = (rate) => {
    this.watchPartyYTPlayer?.setPlaybackRate(rate);
  };

  setSrcAndTime = async (src, time) => {
    let url = new window.URL(src);
    // Standard link https://www.youtube.com/watch?v=ID
    let videoId = new URLSearchParams(url.search).get("v");
    // Link shortener https://youtu.be/ID
    let altVideoId = src.split("/").slice(-1)[0].split("?")[0];
    
    this.watchPartyYTPlayer?.cueVideoById(videoId || altVideoId, time);
  };

  playVideo = async () => {
    setTimeout(() => {
      console.log("play yt");
      this.watchPartyYTPlayer?.playVideo();
    }, 200);
  };

  pauseVideo = () => {
    this.watchPartyYTPlayer?.pauseVideo();
  };

  seekVideo = (time) => {
    this.watchPartyYTPlayer?.seekTo(time, true);
  };

  shouldPlay = () => {
    return (
      this.watchPartyYTPlayer?.getPlayerState() === window.YT?.PlayerState.PAUSED ||
      this.getCurrentTime() === this.getDuration()
    );
  };

  setMute = (muted) => {
    if (muted) {
      this.watchPartyYTPlayer?.mute();
    } else {
      this.watchPartyYTPlayer?.unMute();
    }
  };

  setVolume = (volume) => {
    this.watchPartyYTPlayer?.setVolume(volume * 100);
  };

  getVolume = () => {
    const volume = this.watchPartyYTPlayer?.getVolume();
    return (volume ?? 0) / 100;
  };

  setSubtitleMode = (mode, lang) => {
    if (mode === "showing") {
      console.log(lang);
      this.watchPartyYTPlayer?.setOption("captions", "reload", true);
      this.watchPartyYTPlayer?.setOption("captions", "track", {
        languageCode: lang ?? "en",
      });
    }
    if (mode === "hidden") {
      this.watchPartyYTPlayer?.setOption("captions", "track", {});
    }
  };

  getSubtitleMode = () => {
    return "hidden";
  };

  isReady = () => {
    return Boolean(this.watchPartyYTPlayer);
  };

  stopVideo = () => {
    this.watchPartyYTPlayer?.stopVideo();
  };

  clearState = () => {
    return;
  };

  loadSubtitles = async (src) => {
    return;
  };

  syncSubtitles = (sharerTime) => {
    return;
  };

  getTimeRanges = () => {
    return [
      {
        start: 0,
        end:
          (this.watchPartyYTPlayer?.getVideoLoadedFraction() ?? 0) *
          this.getDuration(),
      },
    ];
  };

  setLoop = (loop) => {
    this.watchPartyYTPlayer?.setLoop(loop);
  };

  getVideoEl = () => {
    return document.getElementById("leftYt");
  };
}