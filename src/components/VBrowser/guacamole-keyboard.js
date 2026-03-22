
var Guacamole = Guacamole || {};

/**
 * @constructor
 * @param {Element|Document} [element]
 */
Guacamole.Keyboard = function Keyboard(element) {
  /**
   * @private
   * @type {!Guacamole.Keyboard}
   */
  var guac_keyboard = this;

  /**
   * @private
   * @type {!number}
   */
  var guacKeyboardID = Guacamole.Keyboard._nextID++;

  /**
   * @private
   * @constant
   * @type {!string}
   */
  var EVENT_MARKER = "_GUAC_KEYBOARD_HANDLED_BY_" + guacKeyboardID;

  /**
   * @event
   * @param {!number} keysym
   *
   * @return {!boolean}
   */
  this.onkeydown = null;

  /**
   * @event
   * @param {!number} keysym
   */
  this.onkeyup = null;

  /**
   * @private
   * @type {!Object.<string, boolean>}
   */
  var quirks = {
    /**
     * @type {!boolean}
     */
    keyupUnreliable: false,

    /**
     * @type {!boolean}
     */
    altIsTypableOnly: false,

    /**
     * @type {!boolean}
     */
    capsLockKeyupUnreliable: false,
  };

  if (navigator && navigator.platform) {
    if (navigator.platform.match(/ipad|iphone|ipod/i))
      quirks.keyupUnreliable = true;
    else if (navigator.platform.match(/^mac/i)) {
      quirks.altIsTypableOnly = true;
      quirks.capsLockKeyupUnreliable = true;
    }
  }

  /**
   * @private
   * @constructor
   * @param {KeyboardEvent} [orig]
   *     The relevant DOM keyboard event.
   */
  var KeyEvent = function KeyEvent(orig) {
    /**
     * @private
     * @type {!KeyEvent}
     */
    var key_event = this;

    /**
     * @type {!number}
     */
    this.keyCode = orig ? orig.which || orig.keyCode : 0;

    /**
     * @type {!string}
     */
    this.keyIdentifier = orig && orig.keyIdentifier;

    /**
     * @type {!string}
     */
    this.key = orig && orig.key;

    /**
     * @type {!number}
     */
    this.location = orig ? getEventLocation(orig) : 0;

    /**
     * @type {!Guacamole.Keyboard.ModifierState}
     */
    this.modifiers = orig
      ? Guacamole.Keyboard.ModifierState.fromKeyboardEvent(orig)
      : new Guacamole.Keyboard.ModifierState();

    /**
     * @type {!number}
     */
    this.timestamp = new Date().getTime();

    /**
     * @type {!boolean}
     */
    this.defaultPrevented = false;

    /**
     * @type {number}
     */
    this.keysym = null;

    /**
     * @type {!boolean}
     */
    this.reliable = false;

    /**
     *
     * @return {!number}
     */
    this.getAge = function () {
      return new Date().getTime() - key_event.timestamp;
    };
  };

  /**
   * @private
   * @constructor
   * @augments Guacamole.Keyboard.KeyEvent
   * @param {!KeyboardEvent} orig
   */
  var KeydownEvent = function KeydownEvent(orig) {
    KeyEvent.call(this, orig);

    this.keysym =
      keysym_from_key_identifier(this.key, this.location) ||
      keysym_from_keycode(this.keyCode, this.location);

    /**
     * @type {!boolean}
     */
    this.keyupReliable = !quirks.keyupUnreliable;

    if (this.keysym && !isPrintable(this.keysym)) this.reliable = true;

    if (!this.keysym && key_identifier_sane(this.keyCode, this.keyIdentifier))
      this.keysym = keysym_from_key_identifier(
        this.keyIdentifier,
        this.location,
        this.modifiers.shift,
      );

    if (this.modifiers.meta && this.keysym !== 0xffe7 && this.keysym !== 0xffe8)
      this.keyupReliable = false;
    else if (this.keysym === 0xffe5 && quirks.capsLockKeyupUnreliable)
      this.keyupReliable = false;

    var prevent_alt = !this.modifiers.ctrl && !quirks.altIsTypableOnly;

    var prevent_ctrl = !this.modifiers.alt;

    if (
      (prevent_ctrl && this.modifiers.ctrl) ||
      (prevent_alt && this.modifiers.alt) ||
      this.modifiers.meta ||
      this.modifiers.hyper
    )
      this.reliable = true;

    recentKeysym[this.keyCode] = this.keysym;
  };

  KeydownEvent.prototype = new KeyEvent();

  /**
   *
   * @private
   * @constructor
   * @augments Guacamole.Keyboard.KeyEvent
   * @param {!KeyboardEvent} orig
   */
  var KeypressEvent = function KeypressEvent(orig) {

    KeyEvent.call(this, orig);

    this.keysym = keysym_from_charcode(this.keyCode);

    this.reliable = true;
  };

  KeypressEvent.prototype = new KeyEvent();

  /**
   * @private
   * @constructor
   * @augments Guacamole.Keyboard.KeyEvent
   * @param {!KeyboardEvent} orig
   */
  var KeyupEvent = function KeyupEvent(orig) {
    KeyEvent.call(this, orig);

    this.keysym =
      keysym_from_keycode(this.keyCode, this.location) ||
      keysym_from_key_identifier(this.key, this.location);

    if (!guac_keyboard.pressed[this.keysym])
      this.keysym = recentKeysym[this.keyCode] || this.keysym;

    this.reliable = true;
  };

  KeyupEvent.prototype = new KeyEvent();

  /**
   *
   * @private
   * @type {!KeyEvent[]}
   */
  var eventLog = [];

  /**
   *
   * @private
   * @type {!Object.<number, number[]>}
   */
  var keycodeKeysyms = {
    8: [0xff08], 
    9: [0xff09], 
    12: [0xff0b, 0xff0b, 0xff0b, 0xffb5],
    13: [0xff0d], 
    16: [0xffe1, 0xffe1, 0xffe2], 
    17: [0xffe3, 0xffe3, 0xffe4], 
    18: [0xffe9, 0xffe9, 0xfe03], 
    19: [0xff13],
    20: [0xffe5],
    27: [0xff1b],
    32: [0x0020],
    33: [0xff55, 0xff55, 0xff55, 0xffb9],
    34: [0xff56, 0xff56, 0xff56, 0xffb3],
    35: [0xff57, 0xff57, 0xff57, 0xffb1],
    36: [0xff50, 0xff50, 0xff50, 0xffb7],
    37: [0xff51, 0xff51, 0xff51, 0xffb4],
    38: [0xff52, 0xff52, 0xff52, 0xffb8],
    39: [0xff53, 0xff53, 0xff53, 0xffb6],
    40: [0xff54, 0xff54, 0xff54, 0xffb2],
    45: [0xff63, 0xff63, 0xff63, 0xffb0],
    46: [0xffff, 0xffff, 0xffff, 0xffae],
    91: [0xffe7],
    92: [0xffe8],
    93: [0xff67],
    96: [0xffb0],
    97: [0xffb1], 
    98: [0xffb2], 
    99: [0xffb3], 
    100: [0xffb4],
    101: [0xffb5],
    102: [0xffb6],
    103: [0xffb7],
    104: [0xffb8],
    105: [0xffb9], 
    106: [0xffaa], 
    107: [0xffab], 
    109: [0xffad], 
    110: [0xffae], 
    111: [0xffaf], 
    112: [0xffbe], 
    113: [0xffbf], 
    114: [0xffc0], 
    115: [0xffc1], 
    116: [0xffc2], 
    117: [0xffc3], 
    118: [0xffc4], 
    119: [0xffc5], 
    120: [0xffc6], 
    121: [0xffc7], 
    122: [0xffc8], 
    123: [0xffc9], 
    144: [0xff7f], 
    145: [0xff14], 
    225: [0xfe03], 
  };

  /**
   *
   * @private
   * @type {!Object.<string, number[]>}
   */
  var keyidentifier_keysym = {
    Again: [0xff66],
    AllCandidates: [0xff3d],
    Alphanumeric: [0xff30],
    Alt: [0xffe9, 0xffe9, 0xfe03],
    Attn: [0xfd0e],
    AltGraph: [0xfe03],
    ArrowDown: [0xff54],
    ArrowLeft: [0xff51],
    ArrowRight: [0xff53],
    ArrowUp: [0xff52],
    Backspace: [0xff08],
    CapsLock: [0xffe5],
    Cancel: [0xff69],
    Clear: [0xff0b],
    Convert: [0xff21],
    Copy: [0xfd15],
    Crsel: [0xfd1c],
    CrSel: [0xfd1c],
    CodeInput: [0xff37],
    Compose: [0xff20],
    Control: [0xffe3, 0xffe3, 0xffe4],
    ContextMenu: [0xff67],
    Delete: [0xffff],
    Down: [0xff54],
    End: [0xff57],
    Enter: [0xff0d],
    EraseEof: [0xfd06],
    Escape: [0xff1b],
    Execute: [0xff62],
    Exsel: [0xfd1d],
    ExSel: [0xfd1d],
    F1: [0xffbe],
    F2: [0xffbf],
    F3: [0xffc0],
    F4: [0xffc1],
    F5: [0xffc2],
    F6: [0xffc3],
    F7: [0xffc4],
    F8: [0xffc5],
    F9: [0xffc6],
    F10: [0xffc7],
    F11: [0xffc8],
    F12: [0xffc9],
    F13: [0xffca],
    F14: [0xffcb],
    F15: [0xffcc],
    F16: [0xffcd],
    F17: [0xffce],
    F18: [0xffcf],
    F19: [0xffd0],
    F20: [0xffd1],
    F21: [0xffd2],
    F22: [0xffd3],
    F23: [0xffd4],
    F24: [0xffd5],
    Find: [0xff68],
    GroupFirst: [0xfe0c],
    GroupLast: [0xfe0e],
    GroupNext: [0xfe08],
    GroupPrevious: [0xfe0a],
    FullWidth: null,
    HalfWidth: null,
    HangulMode: [0xff31],
    Hankaku: [0xff29],
    HanjaMode: [0xff34],
    Help: [0xff6a],
    Hiragana: [0xff25],
    HiraganaKatakana: [0xff27],
    Home: [0xff50],
    Hyper: [0xffed, 0xffed, 0xffee],
    Insert: [0xff63],
    JapaneseHiragana: [0xff25],
    JapaneseKatakana: [0xff26],
    JapaneseRomaji: [0xff24],
    JunjaMode: [0xff38],
    KanaMode: [0xff2d],
    KanjiMode: [0xff21],
    Katakana: [0xff26],
    Left: [0xff51],
    Meta: [0xffe7, 0xffe7, 0xffe8],
    ModeChange: [0xff7e],
    NumLock: [0xff7f],
    PageDown: [0xff56],
    PageUp: [0xff55],
    Pause: [0xff13],
    Play: [0xfd16],
    PreviousCandidate: [0xff3e],
    PrintScreen: [0xff61],
    Redo: [0xff66],
    Right: [0xff53],
    RomanCharacters: null,
    Scroll: [0xff14],
    Select: [0xff60],
    Separator: [0xffac],
    Shift: [0xffe1, 0xffe1, 0xffe2],
    SingleCandidate: [0xff3c],
    Super: [0xffeb, 0xffeb, 0xffec],
    Tab: [0xff09],
    UIKeyInputDownArrow: [0xff54],
    UIKeyInputEscape: [0xff1b],
    UIKeyInputLeftArrow: [0xff51],
    UIKeyInputRightArrow: [0xff53],
    UIKeyInputUpArrow: [0xff52],
    Up: [0xff52],
    Undo: [0xff65],
    Win: [0xffe7, 0xffe7, 0xffe8],
    Zenkaku: [0xff28],
    ZenkakuHankaku: [0xff2a],
  };

  /**
   *
   * @private
   * @type {!Object.<number, boolean>}
   */
  var no_repeat = {
    0xfe03: true, 
    0xffe1: true, 
    0xffe2: true, 
    0xffe3: true, 
    0xffe4: true, 
    0xffe5: true, 
    0xffe7: true, 
    0xffe8: true, 
    0xffe9: true, 
    0xffea: true, 
    0xffeb: true, 
    0xffec: true, 
  };

  /**
   *
   * @type {!Guacamole.Keyboard.ModifierState}
   */
  this.modifiers = new Guacamole.Keyboard.ModifierState();

  /**
   *
   * @type {!Object.<number, boolean>}
   */
  this.pressed = {};

  /**
   *
   * @private
   * @type {!Object.<number, boolean>}
   */
  var implicitlyPressed = {};

  /**
   *
   * @private
   * @type {!Object.<number, boolean>}
   */
  var last_keydown_result = {};

  /**
   *
   * @private
   * @type {!Object.<number, number>}
   */
  var recentKeysym = {};

  /**
   *
   * @private
   * @type {number}
   */
  var key_repeat_timeout = null;

  /**
   *
   * @private
   * @type {number}
   */
  var key_repeat_interval = null;

  /**
   *
   * @private
   * @param {number[]} keysyms
   *
   * @param {!number} location
   */
  var get_keysym = function get_keysym(keysyms, location) {
    if (!keysyms) return null;

    return keysyms[location] || keysyms[0];
  };

  /**
   * @param {!number} keysym
   *
   * @returns {!boolean}
   */
  var isPrintable = function isPrintable(keysym) {
    return (
      (keysym >= 0x00 && keysym <= 0xff) || (keysym & 0xffff0000) === 0x01000000
    );
  };

  function keysym_from_key_identifier(identifier, location, shifted) {
    if (!identifier) return null;

    var typedCharacter;

    var unicodePrefixLocation = identifier.indexOf("U+");
    if (unicodePrefixLocation >= 0) {
      var hex = identifier.substring(unicodePrefixLocation + 2);
      typedCharacter = String.fromCharCode(parseInt(hex, 16));
    }

    else if (identifier.length === 1 && location !== 3)
      typedCharacter = identifier;
    else return get_keysym(keyidentifier_keysym[identifier], location);

    if (shifted === true) typedCharacter = typedCharacter.toUpperCase();
    else if (shifted === false) typedCharacter = typedCharacter.toLowerCase();

    var codepoint = typedCharacter.charCodeAt(0);
    return keysym_from_charcode(codepoint);
  }

  function isControlCharacter(codepoint) {
    return codepoint <= 0x1f || (codepoint >= 0x7f && codepoint <= 0x9f);
  }

  function keysym_from_charcode(codepoint) {
    if (isControlCharacter(codepoint)) return 0xff00 | codepoint;

    if (codepoint >= 0x0000 && codepoint <= 0x00ff) return codepoint;

    if (codepoint >= 0x0100 && codepoint <= 0x10ffff)
      return 0x01000000 | codepoint;

    return null;
  }

  function keysym_from_keycode(keyCode, location) {
    return get_keysym(keycodeKeysyms[keyCode], location);
  }

  /**
   * @private
   * @param {!number} keyCode
   *
   * @param {string} keyIdentifier
   *
   * @returns {!boolean}
   */
  var key_identifier_sane = function key_identifier_sane(
    keyCode,
    keyIdentifier,
  ) {

    if (!keyIdentifier) return false;

    var unicodePrefixLocation = keyIdentifier.indexOf("U+");
    if (unicodePrefixLocation === -1) return true;

    var codepoint = parseInt(
      keyIdentifier.substring(unicodePrefixLocation + 2),
      16,
    );
    if (keyCode !== codepoint) return true;

    if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57))
      return true;
    return false;
  };

  /**
   * @param {number} keysym
   *
   * @return {boolean}
   */
  this.press = function (keysym) {

    if (keysym === null) return;

    if (!guac_keyboard.pressed[keysym]) {
      guac_keyboard.pressed[keysym] = true;

      if (guac_keyboard.onkeydown) {
        var result = guac_keyboard.onkeydown(keysym);
        last_keydown_result[keysym] = result;

        window.clearTimeout(key_repeat_timeout);
        window.clearInterval(key_repeat_interval);

        if (!no_repeat[keysym])
          key_repeat_timeout = window.setTimeout(function () {
            key_repeat_interval = window.setInterval(function () {
              guac_keyboard.onkeyup(keysym);
              guac_keyboard.onkeydown(keysym);
            }, 50);
          }, 500);

        return result;
      }
    }

    return last_keydown_result[keysym] || false;
  };

  /**
   * @param {number} keysym
   */
  this.release = function (keysym) {

    if (guac_keyboard.pressed[keysym]) {

      delete guac_keyboard.pressed[keysym];
      delete implicitlyPressed[keysym];

      window.clearTimeout(key_repeat_timeout);
      window.clearInterval(key_repeat_interval);

      if (keysym !== null && guac_keyboard.onkeyup)
        guac_keyboard.onkeyup(keysym);
    }
  };

  /**
   * @param {!string} str
   */
  this.type = function type(str) {
    
    for (var i = 0; i < str.length; i++) {
      var codepoint = str.codePointAt ? str.codePointAt(i) : str.charCodeAt(i);
      var keysym = keysym_from_charcode(codepoint);

      guac_keyboard.press(keysym);
      guac_keyboard.release(keysym);
    }
  };

  
  this.reset = function () {
    for (var keysym in guac_keyboard.pressed)
      guac_keyboard.release(parseInt(keysym));

    eventLog = [];
  };

  /**
   * {@link KeyEvent#modifiers} 
   *
   * @private
   * @param {!string} modifier
   *     The name of the {@link Guacamole.Keyboard.ModifierState} property
   *     being updated.
   *
   * @param {!number[]} keysyms
   *
   * @param {!KeyEvent} keyEvent
   */
  var updateModifierState = function updateModifierState(
    modifier,
    keysyms,
    keyEvent,
  ) {
    var localState = keyEvent.modifiers[modifier];
    var remoteState = guac_keyboard.modifiers[modifier];

    var i;

    if (keysyms.indexOf(keyEvent.keysym) !== -1) return;

    if (remoteState && localState === false) {
      for (i = 0; i < keysyms.length; i++) {
        guac_keyboard.release(keysyms[i]);
      }
    }

    else if (!remoteState && localState) {
      for (i = 0; i < keysyms.length; i++) {
        if (guac_keyboard.pressed[keysyms[i]]) return;
      }

      var keysym = keysyms[0];
      if (keyEvent.keysym) implicitlyPressed[keysym] = true;

      guac_keyboard.press(keysym);
    }
  };

  /**
   * @private
   * @param {!KeyEvent} keyEvent
   */
  var syncModifierStates = function syncModifierStates(keyEvent) {
    updateModifierState(
      "alt",
      [
        0xffe9, 
        0xffea, 
        0xfe03, 
      ],
      keyEvent,
    );

    updateModifierState(
      "shift",
      [
        0xffe1, 
        0xffe2, 
      ],
      keyEvent,
    );

    updateModifierState(
      "ctrl",
      [
        0xffe3, 
        0xffe4, 
      ],
      keyEvent,
    );

    updateModifierState(
      "meta",
      [
        0xffe7, 
        0xffe8, 
      ],
      keyEvent,
    );

    updateModifierState(
      "hyper",
      [
        0xffeb, 
        0xffec, 
      ],
      keyEvent,
    );

    guac_keyboard.modifiers = keyEvent.modifiers;
  };

  /**
   * @private
   * @returns {!boolean}
   */
  var isStateImplicit = function isStateImplicit() {
    for (var keysym in guac_keyboard.pressed) {
      if (!implicitlyPressed[keysym]) return false;
    }

    return true;
  };

  /**
   * @private
   * @return {boolean}
   */
  function interpret_events() {
    var handled_event = interpret_event();
    if (!handled_event) return false;

    var last_event;
    do {
      last_event = handled_event;
      handled_event = interpret_event();
    } while (handled_event !== null);

    if (isStateImplicit()) guac_keyboard.reset();

    return last_event.defaultPrevented;
  }

  /**
   * @private
   * @param {!number} keysym
   */
  var release_simulated_altgr = function release_simulated_altgr(keysym) {
    
    if (!guac_keyboard.modifiers.ctrl || !guac_keyboard.modifiers.alt) return;

    if (keysym >= 0x0041 && keysym <= 0x005a) return;

    if (keysym >= 0x0061 && keysym <= 0x007a) return;

    if (keysym <= 0xff || (keysym & 0xff000000) === 0x01000000) {
      guac_keyboard.release(0xffe3);
      guac_keyboard.release(0xffe4);
      guac_keyboard.release(0xffe9);
      guac_keyboard.release(0xffea);
    }
  };

  /**
   * @private
   * @return {KeyEvent}
   */
  var interpret_event = function interpret_event() {
    
    var first = eventLog[0];
    if (!first) return null;

    if (first instanceof KeydownEvent) {
      var keysym = null;
      var accepted_events = [];

      if (first.keysym === 0xffe7 || first.keysym === 0xffe8) {
        
        if (eventLog.length === 1) return null;

        if (eventLog[1].keysym !== first.keysym) {
          if (!eventLog[1].modifiers.meta) return eventLog.shift();
        }

        else if (eventLog[1] instanceof KeydownEvent) return eventLog.shift();
      }

      if (first.reliable) {
        keysym = first.keysym;
        accepted_events = eventLog.splice(0, 1);
      }

      else if (eventLog[1] instanceof KeypressEvent) {
        keysym = eventLog[1].keysym;
        accepted_events = eventLog.splice(0, 2);
      }

      else if (eventLog[1]) {
        keysym = first.keysym;
        accepted_events = eventLog.splice(0, 1);
      }

      if (accepted_events.length > 0) {
        syncModifierStates(first);

        if (keysym) {
          release_simulated_altgr(keysym);
          var defaultPrevented = !guac_keyboard.press(keysym);
          recentKeysym[first.keyCode] = keysym;

          if (!first.keyupReliable) guac_keyboard.release(keysym);

          for (var i = 0; i < accepted_events.length; i++)
            accepted_events[i].defaultPrevented = defaultPrevented;
        }

        return first;
      }
    }

    else if (first instanceof KeyupEvent && !quirks.keyupUnreliable) {
     
      var keysym = first.keysym;
      if (keysym) {
        guac_keyboard.release(keysym);
        delete recentKeysym[first.keyCode];
        first.defaultPrevented = true;
      }

      
      else {
        guac_keyboard.reset();
        return first;
      }

      syncModifierStates(first);
      return eventLog.shift();
    }

    else return eventLog.shift();

    return null;
  };

  /**
   * @private
   * @param {!KeyboardEvent} e
   *
   * @returns {!number}
   */
  var getEventLocation = function getEventLocation(e) {

    if ("location" in e) return e.location;


    if ("keyLocation" in e) return e.keyLocation;

    return 0;
  };

  /**
   * @param {!Event} e
   *
   * @returns {!boolean}
   */
  var markEvent = function markEvent(e) {
    
    if (e[EVENT_MARKER]) return false;
    
    e[EVENT_MARKER] = true;
    return true;
  };

  /**
   * @param {!(Element|Document)} element
   */
  this.listenTo = function listenTo(element) {

    element.addEventListener(
      "keydown",
      function (e) {

        if (!guac_keyboard.onkeydown) return;

        if (!markEvent(e)) return;

        var keydownEvent = new KeydownEvent(e);

        if (keydownEvent.keyCode === 229) return;

        eventLog.push(keydownEvent);

        if (interpret_events()) e.preventDefault();
      },
      true,
    );

    element.addEventListener(
      "keypress",
      function (e) {

        if (!guac_keyboard.onkeydown && !guac_keyboard.onkeyup) return;

        if (!markEvent(e)) return;

        eventLog.push(new KeypressEvent(e));

        if (interpret_events()) e.preventDefault();
      },
      true,
    );

    element.addEventListener(
      "keyup",
      function (e) {

        if (!guac_keyboard.onkeyup) return;

        if (!markEvent(e)) return;

        e.preventDefault();

        eventLog.push(new KeyupEvent(e));
        interpret_events();
      },
      true,
    );

  };

  if (element) guac_keyboard.listenTo(element);
};

/**
 * @private
 * @type {!number}
 */
Guacamole.Keyboard._nextID = 0;

/**
 * @constructor
 */
Guacamole.Keyboard.ModifierState = function () {
  /**
   * @type {!boolean}
   */
  this.shift = false;

  /**
   * @type {!boolean}
   */
  this.ctrl = false;

  /**
   * @type {!boolean}
   */
  this.alt = false;

  /**
   * @type {!boolean}
   */
  this.meta = false;

  /**
   * @type {!boolean}
   */
  this.hyper = false;
};

/**
 *
 * @param {!KeyboardEvent} e
 *
 * @returns {!Guacamole.Keyboard.ModifierState}
 */
Guacamole.Keyboard.ModifierState.fromKeyboardEvent = function (e) {
  var state = new Guacamole.Keyboard.ModifierState();

  
  state.shift = e.shiftKey;
  state.ctrl = e.ctrlKey;
  state.alt = e.altKey;
  state.meta = e.metaKey;

  
  if (e.getModifierState) {
    state.hyper =
      e.getModifierState("OS") ||
      e.getModifierState("Super") ||
      e.getModifierState("Hyper") ||
      e.getModifierState("Win");
  }

  return state;
};

export default Guacamole.Keyboard;
