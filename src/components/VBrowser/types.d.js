/**
 * @typedef {Object} Member
 * @property {string} id - Unique identifier for the member.
 * @property {string} displayname - The name shown in the UI.
 * @property {boolean} admin - Whether the user has admin privileges.
 * @property {boolean} muted - Whether the user's audio is muted.
 * @property {boolean} [connected] - (Optional) Connection status.
 * @property {boolean} [ignored] - (Optional) Whether the local user is ignoring this member.
 */

/**
 * @typedef {Object.<string, ScreenConfiguration>} ScreenConfigurations
 */

/**
 * @typedef {Object} ScreenConfiguration
 * @property {number} width - Horizontal resolution.
 * @property {number} height - Vertical resolution.
 * @property {Object.<string, number>} rates - A map of available refresh rates.
 */

/**
 * @typedef {Object} ScreenResolution
 * @property {number} width - Current width.
 * @property {number} height - Current height.
 * @property {number} rate - Current refresh rate.
 * @property {number} quality - Current stream quality setting.
 */