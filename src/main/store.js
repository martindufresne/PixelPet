/**
 * Store / Settings persistence
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULTS = {
  species: 'cat',
  preset: 'calico-cat',
  petName: 'Comnyang',
  userName: 'Humain',
  fixedMessage: '',
  soundMuted: false,
  soundVolume: 0.5,
  language: 'fr',
  pomodoro: {
    focusMin: 25,
    restMin: 5
  },
  reminders: [
    {
      id: 'water-default',
      time: '14:30',
      repeat: 'daily',
      days: [1, 2, 3, 4, 5],
      message: "Un verre d'eau pour rester en forme !",
      enabled: true
    },
    {
      id: 'stretch-default',
      time: '16:00',
      repeat: 'daily',
      days: [1, 2, 3, 4, 5],
      message: "On s'étire un peu le dos !",
      enabled: true
    }
  ],
  position: { x: null, y: null }
};

class Store {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'comnyang-config.json');
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return Object.assign({}, DEFAULTS, JSON.parse(raw));
      }
    } catch (e) {
      console.warn('[Store] Could not read config, using defaults:', e.message);
    }
    return Object.assign({}, DEFAULTS);
  }

  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[Store] Failed to write config:', e.message);
    }
  }

  get(key) {
    return this.data[key] !== undefined ? this.data[key] : DEFAULTS[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
    return this.data;
  }

  update(patch) {
    this.data = Object.assign({}, this.data, patch);
    this.save();
    return this.data;
  }

  getAll() {
    return Object.assign({}, this.data);
  }
}

module.exports = Store;
