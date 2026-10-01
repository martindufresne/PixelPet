/**
 * Claude Code Log / Session Monitor
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeLogMonitor {
  constructor(onStateChange) {
    this._onStateChange = onStateChange;
    this._interval = null;
    this._lastState = null;
    this._lastEventTime = 0;
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => this._poll(), 2000);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _poll() {
    // Check claude session directory if available
    const claudeDir = path.join(os.homedir(), '.claude');
    if (!fs.existsSync(claudeDir)) return;
    // Will be augmented as Claude logs are formatted
  }

  _emit(state, event) {
    if (state === this._lastState && Date.now() - this._lastEventTime < 1000) return;
    this._lastState = state;
    this._lastEventTime = Date.now();
    if (this._onStateChange) {
      this._onStateChange({ agentId: 'claude', state, event });
    }
  }
}

module.exports = ClaudeLogMonitor;
