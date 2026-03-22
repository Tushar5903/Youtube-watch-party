import React, { useState, useEffect, useRef, useCallback } from "react";
import { EVENT } from "./events";
import { NekoClient } from "./client";
import GuacamoleKeyboard from "./keyboard";
import config from "../../config";
import { VIDEO_MAX_HEIGHT_CSS } from "../../utils/utils";
import { Button } from "@mantine/core";
import { IconClipboard, IconKeyboardFilled } from "@tabler/icons-react";

const KeyTable = {
  XK_ISO_Level3_Shift: 0xfe03, // AltGr
  XK_Mode_switch: 0xff7e, // Character set switch
  XK_Control_L: 0xffe3, // Left control
  XK_Control_R: 0xffe4, // Right control
  XK_Meta_L: 0xffe7, // Left meta
  XK_Meta_R: 0xffe8, // Right meta
  XK_Alt_L: 0xffe9, // Left alt
  XK_Alt_R: 0xffea, // Right alt
  XK_Super_L: 0xffeb, // Left super
  XK_Super_R: 0xffec, // Right super
};

const hasMacOSKbd = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

export const VBrowser = ({
  username,
  password,
  hostname,
  controlling: propsControlling,
  resolution,
  setResolution,
  quality,
  setQuality,
  doPlay,
  isMobile,
}) => {
  const [dummyValue, setDummyValue] = useState("");
  
  // Refs for non-reactive instance variables
  const clientRef = useRef(new NekoClient());
  const keyboardRef = useRef(GuacamoleKeyboard());
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const videoRef = useRef(null);
  
  // Instance state tracked via refs to avoid unnecessary re-renders during high-frequency events (mouse/keys)
  const metaRef = useRef({
    focused: false,
    controlling: propsControlling,
    activeKeys: new Set(),
    width: 1280,
    height: 720,
    rate: 30,
    scroll: 1,
    scrollInvert: true
  });

  const keyMap = (key) => {
    if (hasMacOSKbd()) {
      switch (key) {
        case KeyTable.XK_Meta_L: return KeyTable.XK_Control_L;
        case KeyTable.XK_Super_L: return KeyTable.XK_Alt_L;
        case KeyTable.XK_Super_R: return KeyTable.XK_Super_L;
        case KeyTable.XK_Alt_L: return KeyTable.XK_Mode_switch;
        case KeyTable.XK_Alt_R: return KeyTable.XK_ISO_Level3_Shift;
        default: return key;
      }
    }
    return key;
  };

  const takeControl = useCallback(() => {
    const $client = clientRef.current;
    if ($client.connected) {
      $client.sendMessage(EVENT.ADMIN.CONTROL);
      $client.sendMessage(EVENT.CONTROL.CLIPBOARD, { text: "" });
    } else {
      $client.once(EVENT.CONNECTED, () => {
        $client.sendMessage(EVENT.ADMIN.CONTROL);
        $client.sendMessage(EVENT.CONTROL.CLIPBOARD, { text: "" });
      });
    }
  }, []);

  const changeResolution = useCallback((resString, q) => {
    const split = resString.split(/x|@/);
    clientRef.current.sendMessage(EVENT.SCREEN.SET, {
      width: Number(split[0]),
      height: Number(split[1]),
      rate: Number(split[2]),
      quality: Number(q),
    });
  }, []);

  const onMousePos = (e) => {
    const { width, height } = metaRef.current;
    const rect = overlayRef.current.getBoundingClientRect();
    clientRef.current.sendData("mousemove", {
      x: Math.round((width / rect.width) * (e.clientX - rect.left)),
      y: Math.round((height / rect.height) * (e.clientY - rect.top)),
    });
  };

  // Main setup effect
  useEffect(() => {
    const $client = clientRef.current;
    const $keyboard = keyboardRef.current;
    const url = `${window.location.protocol.replace("http", "ws")}//${hostname}/ws`;

    const keepAlive = setInterval(() => $client.sendMessage("chat/message"), 30000);

    $client.on(EVENT.CONNECTED, () => {
      if (metaRef.current.controlling) takeControl();
    });

    $client.on(EVENT.DISCONNECTED, () => {
      $client.login(url, password, username);
    });

    $client.on(EVENT.SCREEN.RESOLUTION, (data) => {
      metaRef.current.width = data.width;
      metaRef.current.height = data.height;
      metaRef.current.rate = data.rate;
      setResolution(`${data.width}x${data.height}@${data.rate}`);
      setQuality(String(data.quality));
    });

    $client.on(EVENT.TRACK, async (track, stream) => {
      const video = document.getElementById("leftVideo");
      if (video) {
        video.src = "";
        video.srcObject = stream;
      }
      if (stream.getTracks().length === 1 && track.kind === "audio") {
        const audio = document.getElementById("iPhoneAudio");
        if (audio) {
          audio.srcObject = new MediaStream([track]);
          audio.play();
        }
      }
      await doPlay();
    });

    $client.on(EVENT.CONTROL.CLIPBOARD, (clipboard) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(clipboard);
      }
    });

    if (config.NODE_ENV === "development") {
      $client.on("debug", (e, data) => console.log(e, data));
    }

    $client.login(url, password, username);

    // Keyboard configuration
    $keyboard.onkeydown = (key) => {
      if (!metaRef.current.focused || !metaRef.current.controlling) return true;
      clientRef.current.sendData("keydown", { key: keyMap(key) });
      return false;
    };

    $keyboard.onkeyup = (key) => {
      if (!metaRef.current.focused || !metaRef.current.controlling) return;
      clientRef.current.sendData("keyup", { key: keyMap(key) });
    };

    $keyboard.listenTo(overlayRef.current);

    return () => {
      clearInterval(keepAlive);
      $client.removeAllListeners();
      $client.logout();
    };
  }, [hostname, password, username, takeControl, doPlay, setResolution, setQuality]);

  // Handle prop changes (componentDidUpdate equivalent)
  useEffect(() => {
    metaRef.current.controlling = propsControlling;
    if (propsControlling) takeControl();
  }, [propsControlling, takeControl]);

  useEffect(() => {
    changeResolution(resolution, quality);
  }, [resolution, quality, changeResolution]);

  // Event handlers
  const onWheel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!metaRef.current.controlling) return;
    onMousePos(e);

    let x = e.deltaX * (metaRef.current.scrollInvert ? -1 : 1);
    let y = e.deltaY * (metaRef.current.scrollInvert ? -1 : 1);
    
    x = Math.min(Math.max(x, -metaRef.current.scroll), metaRef.current.scroll);
    y = Math.min(Math.max(y, -metaRef.current.scroll), metaRef.current.scroll);

    clientRef.current.sendData("wheel", { x, y });
  };

  const onFocus = async (e) => {
    if (propsControlling) {
      if (navigator.clipboard?.readText) {
        try {
          const text = await navigator.clipboard.readText();
          clientRef.current.sendMessage(EVENT.CONTROL.CLIPBOARD, { text });
        } catch (err) {
          console.warn(err);
        }
      }
      clientRef.current.sendMessage(EVENT.CONTROL.KEYBOARD, {
        capsLock: e.getModifierState("CapsLock"),
        numLock: e.getModifierState("NumLock"),
        scrollLock: e.getModifierState("ScrollLock"),
      });
    }
  };

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, display: "flex", gap: "4px", zIndex: 10 }}>
        {isMobile && propsControlling && (
          <>
            <Button 
              onClick={() => document.getElementById("dummy")?.focus()} 
              leftSection={<IconKeyboardFilled />}
            >
              Open Keyboard
            </Button>
            <Button 
              onClick={() => {
                clientRef.current.sendData("keydown", { key: 65507 });
                clientRef.current.sendData("keydown", { key: 118 });
                clientRef.current.sendData("keyup", { key: 65507 });
                clientRef.current.sendData("keyup", { key: 118 });
              }} 
              leftSection={<IconClipboard />}
            >
              Paste
            </Button>
          </>
        )}
      </div>

      <div id="leftVideoParent" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
        <div 
          ref={containerRef} 
          style={{ position: "relative", width: "100%", height: document.getElementById("leftVideo")?.clientHeight }}
        >
          <video playsInline ref={videoRef} id="leftVideo" style={{ position: "absolute", top: 0, left: 0, width: "100%" }} />
          
          <div
            ref={overlayRef}
            id="leftOverlay"
            tabIndex={0}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              scrollbarWidth: "none",
              outline: "none"
            }}
            onWheel={onWheel}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onContextMenu={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseMove={(e) => metaRef.current.controlling && onMousePos(e)}
            onMouseDown={(e) => {
              if (!metaRef.current.controlling) return;
              e.stopPropagation(); e.preventDefault();
              onMousePos(e);
              clientRef.current.sendData("mousedown", { key: e.button + 1 });
            }}
            onMouseUp={(e) => {
              if (!metaRef.current.controlling) return;
              e.stopPropagation(); e.preventDefault();
              onMousePos(e);
              clientRef.current.sendData("mouseup", { key: e.button + 1 });
            }}
            onMouseEnter={(e) => {
              if (!metaRef.current.controlling) return;
              overlayRef.current.focus();
              onFocus(e);
              metaRef.current.focused = true;
            }}
            onMouseLeave={() => {
              if (!metaRef.current.controlling) return;
              overlayRef.current.blur();
              metaRef.current.focused = false;
              keyboardRef.current.reset();
            }}
          />
          <audio id="iPhoneAudio" />
          
          <input
            type="text"
            id="dummy"
            value={dummyValue}
            autoComplete="off"
            style={{ position: "absolute", left: 0, top: 0, height: 0, opacity: 0 }}
            onFocus={() => { metaRef.current.focused = true; setDummyValue(""); }}
            onBlur={() => { metaRef.current.focused = false; setDummyValue(""); }}
            onKeyDown={(e) => {
              e.nativeEvent.preventDefault();
              if (e.key !== "Unidentified") {
                const target = document.getElementById("leftOverlay");
                target?.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
                target?.dispatchEvent(new KeyboardEvent("keyup", { key: e.key }));
              }
            }}
            onBeforeInput={(e) => {
              e.nativeEvent.preventDefault();
              const target = document.getElementById("leftOverlay");
              target?.dispatchEvent(new KeyboardEvent("keydown", { 
                key: e.data, 
                shiftKey: e.data === e.data.toUpperCase() 
              }));
              target?.dispatchEvent(new KeyboardEvent("keyup", { key: e.data }));
            }}
          />
        </div>
      </div>
    </>
  );
};