/**
 * Global Input Hook using uiohook-napi
 * Captures system-wide keyboard, mouse movement, and scrolling.
 */
let uIOhook = null;
let EventType = null;
try {
  const napi = require('uiohook-napi');
  uIOhook = napi.uIOhook;
  EventType = napi.EventType;
} catch (e) {
  console.warn('[InputHook] uiohook-napi could not be loaded:', e.message);
}

class InputHook {
  constructor({ onMouseMove, onKeyPress, onMouseWheel }) {
    this.onMouseMove = onMouseMove;
    this.onKeyPress = onKeyPress;
    this.onMouseWheel = onMouseWheel;

    this.isRunning = false;
    this.listenersAttached = false;
    this.lastMoveTime = 0;
    this.keyTimestamps = [];
    this.lastWheelTime = 0;
  }

  attachListeners() {
    if (!uIOhook || this.listenersAttached) return;

    // Mouse movement
    uIOhook.on('mousemove', (e) => {
      const now = Date.now();
      // Throttle to ~60fps (16ms) for smooth eye tracking without IPC saturation
      if (now - this.lastMoveTime >= 16) {
        this.lastMoveTime = now;
        if (this.onMouseMove) {
          this.onMouseMove({ x: e.x, y: e.y });
        }
      }
    });

    // Keystroke press
    uIOhook.on('keydown', (e) => {
      const now = Date.now();
      this.keyTimestamps.push(now);

      // Keep timestamps from the last 2 seconds
      while (this.keyTimestamps.length > 0 && now - this.keyTimestamps[0] > 2000) {
        this.keyTimestamps.shift();
      }

      // Keys per second
      const keysPerSecond = this.keyTimestamps.length / 2;

      if (this.onKeyPress) {
        this.onKeyPress({
          timestamp: now,
          keysPerSecond: keysPerSecond,
          isFast: keysPerSecond > 6,
          keycode: e ? (e.keycode || e.rawcode) : undefined
        });
      }
    });

    const handleWheelEvent = (e) => {
      const now = Date.now();
      // Throttle wheel bursts to ~25ms
      if (now - this.lastWheelTime < 25) return;
      this.lastWheelTime = now;

      if (this.onMouseWheel) {
        this.onMouseWheel({
          rotation: (e && typeof e.rotation === 'number') ? e.rotation : 1,
          direction: (e && typeof e.direction === 'number') ? e.direction : 1,
          amount: (e && typeof e.amount === 'number') ? e.amount : 1
        });
      }
    };

    // Both 'wheel' event and raw 'input' event (type 11 = EVENT_MOUSE_WHEEL)
    uIOhook.on('wheel', (e) => handleWheelEvent(e));
    uIOhook.on('input', (e) => {
      if (e && (e.type === 11 || (EventType && e.type === EventType.EVENT_MOUSE_WHEEL))) {
        handleWheelEvent(e);
      }
    });

    this.listenersAttached = true;
  }

  start() {
    if (!uIOhook) {
      console.warn('[InputHook] uiohook-napi is not available.');
      return false;
    }
    if (this.isRunning) return true;

    try {
      this.attachListeners();
      uIOhook.start();
      this.isRunning = true;
      console.log('[InputHook] Global input listener started successfully.');
      return true;
    } catch (err) {
      console.error('[InputHook] Failed to start global hook:', err.message);
      if (process.platform === 'darwin') {
        console.info('[InputHook] Note: On macOS, Accessibility permission is required in System Settings -> Privacy & Security -> Accessibility.');
      }
      return false;
    }
  }

  stop() {
    if (uIOhook && this.isRunning) {
      try {
        uIOhook.stop();
        this.isRunning = false;
        console.log('[InputHook] Global input listener stopped.');
      } catch (err) {
        console.error('[InputHook] Error stopping hook:', err.message);
      }
    }
  }

  restart() {
    console.log('[InputHook] Restarting global input hook...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 250);
  }
}

module.exports = InputHook;
