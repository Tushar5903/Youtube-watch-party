import "@mantine/core/styles.css";
import "./index.css";

import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

import { App } from "./components/App/App";
import { Home } from "./components/Home/Home";
import { Privacy, Terms, FAQ } from "./components/Pages/Pages";
import { TopBar } from "./components/TopBar/TopBar";
import { Footer } from "./components/Footer/Footer";
import { softWhite } from "./utils/utils";
import { Create } from "./components/Create/Create";
import { DEFAULT_STATE, MetadataContext } from "./MetadataContext";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  white: softWhite,
});

const Debug = lazy(() => import("./components/Debug/Debug"));

// Redirect old-style URLs
if (window.location.hash && window.location.pathname === "/") {
  const hashRoomId = window.location.hash.substring(1);
  window.location.href = "/watch/" + hashRoomId;
}

const WatchWrapper = () => {
  const { roomId } = useParams();
  return <App urlRoomId={roomId} />;
};

const VanityWrapper = () => {
  const { vanity } = useParams();
  return <App vanity={vanity} />;
};

export const WatchParty = () => {
  const [state, setState] = useState({
    ...DEFAULT_STATE,
    isSubscriber: true,
  });

  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      <MetadataContext.Provider value={state}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <React.Fragment>
                  <TopBar hideNewRoom />
                  <Home />
                  <Footer />
                </React.Fragment>
              }
            />

            <Route path="/create" element={<Create />} />

            <Route path="/watch/:roomId" element={<WatchWrapper />} />

            <Route path="/r/:vanity" element={<VanityWrapper />} />

            <Route
              path="/terms"
              element={
                <>
                  <TopBar />
                  <Terms />
                  <Footer />
                </>
              }
            />

            <Route
              path="/privacy"
              element={
                <>
                  <TopBar />
                  <Privacy />
                  <Footer />
                </>
              }
            />

            <Route
              path="/faq"
              element={
                <>
                  <TopBar />
                  <FAQ />
                  <Footer />
                </>
              }
            />

            <Route
              path="/debug"
              element={
                <>
                  <TopBar />
                  <Suspense fallback={null}>
                    <Debug />
                  </Suspense>
                  <Footer />
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      </MetadataContext.Provider>
    </MantineProvider>
  );
};