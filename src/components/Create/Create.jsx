import React, { useContext, useRef, useEffect } from "react";
import { createRoom } from "../TopBar/TopBar";
import { Loader } from "@mantine/core";
import { MetadataContext } from "../../MetadataContext";

export const Create = () => {
  const { user } = useContext(MetadataContext);
  const buttonEl = useRef(null);

  useEffect(() => {
    // Automatically trigger the hidden button click after 1 second
    const timer = setTimeout(() => {
      buttonEl.current?.click();
    }, 1000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    const videoUrl = new URLSearchParams(window.location.search).get("video");
    
    createRoom(
      user,
      false,
      videoUrl || ""
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Loader size="xl" />
      <div style={{ marginTop: "16px", fontWeight: 500 }}>
        Creating room. . .
      </div>
      
      {/* Hidden button used to trigger createRoom logic */}
      <button
        style={{ display: "none" }}
        ref={buttonEl}
        onClick={handleCreate}
      />
    </div>
  );
};