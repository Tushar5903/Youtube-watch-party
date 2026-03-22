import React from "react";

export const DEFAULT_STATE = {
  user: null,
  isSubscriber: false,
  streamPath: null,
  convertPath: null,
  beta: false,
};

export const MetadataContext = React.createContext(DEFAULT_STATE);