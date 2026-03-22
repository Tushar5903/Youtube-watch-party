import GuacamoleKeyboard from "./guacamole-keyboard";

/**
 * Creates a Guacamole Keyboard interface instance.
 * * @param {Element|Document} [element] The Element to attach event listeners to.
 * @returns {Object} An object containing key handling methods (press, release, type, reset, listenTo).
 */
const Interface = function (element) {
  const Keyboard = {};

  GuacamoleKeyboard.bind(Keyboard, element)();

  return Keyboard;
};

export default Interface;