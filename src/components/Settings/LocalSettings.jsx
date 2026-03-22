import React from "react";

export function getDefaultSettings() {
  return {};
}


export function getCurrentSettings() {
  const setting = window.localStorage.getItem("watchparty-setting");
  try {
    let settings = validateSettingsString(setting);
    if (!settings) {
      return {};
    }
    return settings;
  } catch (e) {
    console.warn(e);
    return getDefaultSettings();
  }
}

export function validateSettingsString(setting) {
  if (!setting) {
    return {};
  }

  if (setting[0] !== "{") {
    throw new Error("failed to parse settings, using defaults");
  }

  return JSON.parse(setting);
}

export function updateSettings(newSetting) {
  window.localStorage.setItem("watchparty-setting", newSetting);
}