
/**
 * @typedef {Object} WebSocketMessage
 * @property {string} event - The event name
 */

/**
 * @typedef {Object} SystemInitPayload
 * @property {boolean} implicit_hosting
 * @property {Object.<string, string>} locks
 */

/**
 * @typedef {Object} SystemMessagePayload
 * @property {string} title
 * @property {string} message
 */

/**
 * @typedef {Object} SignalProvidePayload
 * @property {string} id
 * @property {boolean} lite
 * @property {RTCIceServer[]} ice
 * @property {string} sdp
 */

/**
 * @typedef {Object} SignalOfferPayload
 * @property {string} sdp
 */

/**
 * @typedef {Object} SignalAnswerPayload
 * @property {string} sdp
 * @property {string} displayname
 */

/**
 * @typedef {Object} SignalCandidatePayload
 * @property {string} data
 */

/**
 * @typedef {Object} MemberListPayload
 * @property {Object[]} members
 */

/**
 * @typedef {Object} MemberDisconnectPayload
 * @property {string} id
 */

/**
 * @typedef {Object} ControlPayload
 * @property {string} id
 */

/**
 * @typedef {Object} ControlTargetPayload
 * @property {string} id
 * @property {string} target
 */

/**
 * @typedef {Object} ControlClipboardPayload
 * @property {string} text
 */

/**
 * @typedef {Object} ControlKeyboardPayload
 * @property {string} [layout]
 * @property {boolean} [capsLock]
 * @property {boolean} [numLock]
 * @property {boolean} [scrollLock]
 */

/**
 * @typedef {Object} ChatPayload
 * @property {string} id
 * @property {string} content
 */

/**
 * @typedef {Object} EmotePayload
 * @property {string} id
 * @property {string} emote
 */


/**
 * @typedef {Object} ScreenResolutionPayload
 * @property {string} [id]
 * @property {number} width
 * @property {number} height
 * @property {number} rate
 */

/**
 * @typedef {Object} ScreenConfigurationsPayload
 * @property {Object[]} configurations
 */