/**
 * Antigravity Log Monitor
 * Surveille les journaux d'Antigravity CLI et Antigravity IDE pour réagir en temps réel.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function getAppDataDir(appName) {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), appName);
}

class AntigravityLogMonitor {
  constructor(onStateChange) {
    this._onStateChange = onStateChange;
    this._interval = null;
    this._tracked = new Map();
    this._startedAtMs = Date.now();
    this._lastState = null;
    this._lastEventTime = 0;
    this._activeAgent = false;
  }

  start() {
    if (this._interval) return;
    this._startedAtMs = Date.now();
    this._poll();
    this._interval = setInterval(() => this._poll(), 1500);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._tracked.clear();
  }

  _logRoots() {
    return [
      path.join(os.homedir(), '.gemini', 'antigravity-cli', 'log'),
      path.join(getAppDataDir('Antigravity IDE'), 'logs'),
      path.join(getAppDataDir('Antigravity'), 'logs')
    ];
  }

  _poll() {
    for (const file of this._getLogFiles()) {
      this._pollFile(file);
    }
    this._cleanStaleFiles();
  }

  _getLogFiles() {
    const list = [];
    const scanDir = (dir, depth) => {
      if (depth > 4 || list.length >= 50) return;
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full, depth + 1);
        } else if (entry.name.endsWith('.log')) {
          try {
            if (Date.now() - fs.statSync(full).mtimeMs <= 600000) {
              list.push(full);
            }
          } catch {}
        }
      }
    };

    for (const root of this._logRoots()) {
      scanDir(root, 0);
    }
    return list;
  }

  _pollFile(filePath) {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return;
    }

    let fileInfo = this._tracked.get(filePath);
    if (!fileInfo) {
      const birth = Number.isFinite(stat.birthtimeMs) ? stat.birthtimeMs : stat.ctimeMs;
      const isNew = Number.isFinite(birth) && birth >= this._startedAtMs - 1500;
      fileInfo = {
        offset: isNew ? 0 : stat.size,
        partial: '',
        lastEventTime: Date.now()
      };
      this._tracked.set(filePath, fileInfo);
    }

    if (stat.size < fileInfo.offset) fileInfo.offset = 0;
    if (stat.size <= fileInfo.offset) return;

    let buf;
    try {
      const fd = fs.openSync(filePath, 'r');
      buf = Buffer.alloc(stat.size - fileInfo.offset);
      fs.readSync(fd, buf, 0, buf.length, fileInfo.offset);
      fs.closeSync(fd);
    } catch {
      return;
    }

    fileInfo.offset = stat.size;
    const lines = (fileInfo.partial + buf.toString('utf8')).split('\n');
    fileInfo.partial = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        this._processLine(line, fileInfo);
      }
    }
  }

  _processLine(line, fileInfo) {
    const text = line.toLowerCase();
    let state = null;
    let event = null;

    if (text.includes('handleuserinput called') || text.includes('sending user message to conversation')) {
      state = 'thinking';
      event = 'user-message';
    } else if (text.includes('streamgeneratecontent') || text.includes('generatecontent')) {
      state = 'working';
      event = 'model-request';
    } else if (text.includes('drip stopped') || text.includes('response complete')) {
      state = 'complete';
      event = 'response-complete';
    } else if (text.includes('shutting down') || text.includes('program exited')) {
      state = 'idle';
      event = 'shutdown';
    }

    if (state) {
      fileInfo.lastEventTime = Date.now();
      if (state === 'complete' && !this._activeAgent) {
        return;
      }
      this._activeAgent = (state === 'thinking' || state === 'working');
      this._emit('antigravity', state, event);

      if (this._activeAgent) {
        if (this._activityTimer) clearTimeout(this._activityTimer);
        this._activityTimer = setTimeout(() => {
          this._activityTimer = null;
          if (this._activeAgent) {
            this._activeAgent = false;
            this._emit('antigravity', 'complete', 'timeout-complete');
            setTimeout(() => {
              this._emit('antigravity', 'idle', 'timeout-idle');
            }, 1800);
          }
        }, 3500);
      }
    }
  }

  _emit(agentId, state, event) {
    if (state === this._lastState && Date.now() - this._lastEventTime < 800) {
      return;
    }
    this._lastState = state;
    this._lastEventTime = Date.now();

    if (this._onStateChange) {
      this._onStateChange({ agentId, state, event });
    }
  }

  _cleanStaleFiles() {
    const now = Date.now();
    for (const [key, val] of this._tracked) {
      if (now - val.lastEventTime > 600000) {
        this._tracked.delete(key);
      }
    }
  }
}

module.exports = AntigravityLogMonitor;
