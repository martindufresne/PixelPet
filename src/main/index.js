/**
 * PixelPet / Comnyang - Main Electron Process
 * Cross-platform desktop pet for macOS, Windows, and Linux.
 * Supports Cats & Dogs with authentic pixel art, zero-wobble dragging, and AI agent monitoring.
 */
const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, systemPreferences, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./store');
const InputHook = require('./input-hook');
const AgentServer = require('./agent-server');
const AntigravityMonitor = require('./monitors/antigravity');
const ClaudeMonitor = require('./monitors/claude');
const speciesRegistry = require('../species/registry');

let mainWindow = null;
let tray = null;
let store = null;
let inputHook = null;
let agentServer = null;
let antigravityMonitor = null;
let claudeMonitor = null;
let reminderTimer = null;
let pomodoroTimer = null;
let cursorPollingTimer = null;
let accessibilityPromptShown = false;
let accessibilityRetryTimer = null;

function isAccessibilityGranted() {
  if (process.platform !== 'darwin') return true;
  try {
    return systemPreferences.isTrustedAccessibilityClient(false);
  } catch (e) {
    console.warn('[Accessibility] Check failed:', e.message);
    return false;
  }
}

function openAccessibilitySettings() {
  if (process.platform === 'darwin') {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility').catch(() => {});
  }
}

function requestAccessibilityPermission(showPromptDialog = false) {
  if (process.platform !== 'darwin') return true;

  try {
    // Calling with true triggers macOS system prompt and registers the app in Privacy & Security > Accessibility
    const granted = systemPreferences.isTrustedAccessibilityClient(true);
    if (granted) {
      console.log('[Accessibility] Permission already granted.');
      return true;
    }
  } catch (e) {
    console.warn('[Accessibility] Prompt check failed:', e.message);
  }

  if (showPromptDialog && !accessibilityPromptShown) {
    accessibilityPromptShown = true;
    setTimeout(async () => {
      try {
        const lang = store ? (store.get('language') || 'fr') : 'fr';
        const isFr = lang === 'fr';

        const result = await dialog.showMessageBox({
          type: 'info',
          title: isFr ? 'Autorisation d’accessibilité requise' : 'Accessibility Permission Needed',
          message: isFr ? 'Autorisez PixelPet à réagir au clavier et au défilement' : 'Allow PixelPet to react to typing and scrolling',
          detail: isFr
            ? 'Pour que votre compagnon anime ses pattes quand vous tapez au clavier et déroule son parchemin quand vous scrollez, activez PixelPet dans :\nRéglages Système > Confidentialité et sécurité > Accessibilité.'
            : 'For your pet to animate typing paws and unroll its scroll, enable PixelPet in:\nSystem Settings > Privacy & Security > Accessibility.',
          buttons: [
            isFr ? 'Ouvrir Réglages Système' : 'Open System Settings',
            isFr ? 'Plus tard' : 'Later'
          ],
          defaultId: 0,
          cancelId: 1
        });

        if (result.response === 0) {
          openAccessibilitySettings();
        }
      } catch (err) {
        console.error('[Accessibility] Dialog error:', err.message);
      }
    }, 1200);
  }

  // Poll in the background every 3 seconds to auto-restart the hook as soon as granted
  if (!accessibilityRetryTimer) {
    accessibilityRetryTimer = setInterval(() => {
      if (isAccessibilityGranted()) {
        clearInterval(accessibilityRetryTimer);
        accessibilityRetryTimer = null;
        console.log('[Accessibility] Access granted by user! Re-starting input hook...');
        if (inputHook) inputHook.restart();
        updateTrayMenu();
      }
    }, 3000);
  }

  return false;
}

// In-memory Pomodoro state
const pomodoroState = {
  running: false,
  mode: 'focus', // 'focus' | 'rest'
  remainingSec: 25 * 60,
  focusMin: 25,
  restSec: 5 * 60
};

function getActivePattern() {
  const currentSpeciesId = store.get('species') || 'cat';
  const currentPresetId = store.get('preset') || (currentSpeciesId === 'dog' ? 'shiba-dog' : 'calico-cat');

  if (currentSpeciesId === 'dog') {
    const dogSpecies = speciesRegistry.get('dog');
    return dogSpecies.getPresetData(currentPresetId);
  }

  // Cat presets from JSON files
  const presetFile = path.join(__dirname, '..', '..', 'assets', 'presets', `${currentPresetId}.json`);
  if (fs.existsSync(presetFile)) {
    try {
      return JSON.parse(fs.readFileSync(presetFile, 'utf8'));
    } catch (e) {
      console.warn('[Pattern] Failed to read preset JSON:', e.message);
    }
  }

  // Fallback to calico
  const fallbackFile = path.join(__dirname, '..', '..', 'assets', 'presets', 'calico-cat.json');
  if (fs.existsSync(fallbackFile)) {
    try {
      return JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
    } catch {}
  }

  return { baseColor: '#FFFFFF', eyeColor: '#1A1A1A', eyeBgColor: '#FFFFFF' };
}

function broadcastToPet(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const savedPos = store.get('position') || {};
  let x = Number.isInteger(savedPos.x) ? savedPos.x : screenWidth - 320;
  let y = Number.isInteger(savedPos.y) ? savedPos.y : screenHeight - 290;

  // Window size: width 280, height 250 (standard Comnyang dimensions)
  const windowWidth = 280;
  const windowHeight = 250;

  x = Math.max(0, Math.min(x, screenWidth - windowWidth));
  y = Math.max(0, Math.min(y, screenHeight - windowHeight));

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    app.dock && app.dock.hide();
  } else {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    // Send initial configuration to renderer
    const pattern = getActivePattern();
    broadcastToPet('pattern-changed', pattern);

    const speciesId = store.get('species') || 'cat';
    broadcastToPet('species-changed', { species: speciesId });

    const petName = store.get('petName') || (speciesId === 'dog' ? 'PixelDog' : 'Comnyang');
    broadcastToPet('cat-name-changed', { name: petName, showName: true });

    const soundMuted = store.get('soundMuted') || false;
    broadcastToPet('sound-muted', soundMuted);

    const volume = store.get('soundVolume') ?? 0.8;
    broadcastToPet('task-complete-sound-volume', volume);

    const fixedMessage = store.get('fixedMessage') || '';
    if (fixedMessage) broadcastToPet('fixed-message-changed', fixedMessage);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  let iconPath = path.join(__dirname, '..', '..', 'assets', 'trayTemplate.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('PixelPet — Compagnon de Bureau');
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const currentSpeciesId = store.get('species') || 'cat';
  const currentPreset = store.get('preset') || (currentSpeciesId === 'dog' ? 'shiba-dog' : 'calico-cat');
  const currentSpecies = speciesRegistry.get(currentSpeciesId);
  const soundMuted = store.get('soundMuted') || false;

  const speciesSubmenu = speciesRegistry.list().map(s => ({
    label: `${s.icon} ${s.displayName}`,
    type: 'radio',
    checked: s.id === currentSpeciesId,
    click: () => {
      switchSpecies(s.id);
    }
  }));

  const presetsSubmenu = (currentSpecies.presets || []).map(p => ({
    label: p.name,
    type: 'radio',
    checked: p.id === currentPreset,
    click: () => {
      store.set('preset', p.id);
      const pattern = getActivePattern();
      broadcastToPet('pattern-changed', pattern);
      updateTrayMenu();
    }
  }));

  const hasAccessibility = isAccessibilityGranted();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `🐾 ${store.get('petName') || (currentSpeciesId === 'dog' ? 'PixelDog' : 'Comnyang')} (${currentSpecies.displayName})`,
      enabled: false
    },
    ...(process.platform === 'darwin' && !hasAccessibility ? [
      { type: 'separator' },
      {
        label: '⚠️ Activer détection clavier/scroll...',
        click: () => {
          openAccessibilitySettings();
        }
      }
    ] : []),
    { type: 'separator' },
    {
      label: 'Animal',
      submenu: speciesSubmenu
    },
    {
      label: 'Pelage / Motif',
      submenu: presetsSubmenu
    },
    { type: 'separator' },
    {
      label: pomodoroState.running ? '⏸️ Pause Pomodoro' : '▶️ Démarrer Pomodoro',
      click: () => {
        if (pomodoroState.running) pausePomodoro();
        else startPomodoro();
      }
    },
    {
      label: '🔔 Ouvrir les rappels',
      click: () => {
        broadcastToPet('reminder-panel-open');
      }
    },
    {
      label: '🧘 Étirement maintenant',
      click: () => {
        broadcastToPet('do-stretch');
      }
    },
    {
      label: '💧 Boire de l’eau maintenant',
      click: () => {
        broadcastToPet('do-drink');
      }
    },
    { type: 'separator' },
    {
      label: soundMuted ? '🔊 Activer le son' : '🔇 Mode silencieux',
      click: () => {
        const newMuted = !soundMuted;
        store.set('soundMuted', newMuted);
        broadcastToPet('sound-muted', newMuted);
        updateTrayMenu();
      }
    },
    {
      label: '📍 Replacer au coin de l’écran',
      click: () => {
        if (!mainWindow) return;
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        const x = width - 300;
        const y = height - 280;
        mainWindow.setPosition(x, y);
        store.set('position', { x, y });
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function switchSpecies(speciesId) {
  store.set('species', speciesId);
  const newSpecies = speciesRegistry.get(speciesId);
  const defaultPreset = newSpecies.defaultPreset;
  store.set('preset', defaultPreset);

  const defaultName = speciesId === 'dog' ? 'PixelDog' : 'Comnyang';
  store.set('petName', defaultName);

  // Notify renderer
  broadcastToPet('species-changed', { species: speciesId, preset: defaultPreset });
  const pattern = getActivePattern();
  broadcastToPet('pattern-changed', pattern);
  broadcastToPet('cat-name-changed', { name: defaultName, showName: true });

  updateTrayMenu();
}

// Pomodoro Timer Logic
function startPomodoro() {
  pomodoroState.running = true;
  broadcastToPet('pomodoro-state', pomodoroState);
  broadcastToPet('pomodoro-focus-start');
  updateTrayMenu();

  if (pomodoroTimer) clearInterval(pomodoroTimer);
  pomodoroTimer = setInterval(() => {
    if (!pomodoroState.running) return;
    pomodoroState.remainingSec -= 1;

    if (pomodoroState.remainingSec <= 0) {
      const completedMode = pomodoroState.mode;
      if (completedMode === 'focus') {
        pomodoroState.mode = 'rest';
        pomodoroState.remainingSec = pomodoroState.restSec;
      } else {
        pomodoroState.mode = 'focus';
        pomodoroState.remainingSec = pomodoroState.focusMin * 60;
      }
      broadcastToPet('pomodoro-complete', { completedMode });
      broadcastToPet('do-jump');
    }

    broadcastToPet('pomodoro-state', pomodoroState);
  }, 1000);
}

function pausePomodoro() {
  pomodoroState.running = false;
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
  }
  broadcastToPet('pomodoro-state', pomodoroState);
  updateTrayMenu();
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroState.mode = 'focus';
  pomodoroState.remainingSec = pomodoroState.focusMin * 60;
  broadcastToPet('pomodoro-state', pomodoroState);
}

// Reminders Checker (every 30s)
function startReminderChecker() {
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = setInterval(() => {
    const reminders = store.get('reminders') || [];
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;
    const currentDay = now.getDay();

    for (const r of reminders) {
      if (!r.enabled) continue;
      if (r.time === currentTimeStr) {
        if (!r.days || r.days.length === 0 || r.days.includes(currentDay)) {
          broadcastToPet('reminder-triggered', r);
          broadcastToPet('do-jump');
        }
      }
    }
  }, 30000);
}

// Setup IPC handlers
function setupIpc() {
  // 1. Mouse Events Passthrough
  ipcMain.on('set-mouse-events-enabled', (event, enabled) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (enabled) {
        win.setIgnoreMouseEvents(false);
      } else {
        win.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  // 2. Dragging & Stretch Mode
  ipcMain.on('set-stretch-mode', (event, expanded) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;
    const curBounds = win.getBounds();
    const isExpanded = !!expanded;
    const targetHeight = isExpanded ? 450 : 250;

    if (curBounds.height !== targetHeight) {
      win.setBounds({
        x: curBounds.x,
        y: curBounds.y,
        width: 280,
        height: targetHeight
      });
    }
  });

  ipcMain.on('set-hunting-mode', () => {});
  ipcMain.on('set-pet-focusable', (event, focusable) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;
    try {
      win.setFocusable(!!focusable);
      if (focusable) win.focus();
    } catch {}
  });

  ipcMain.on('drag-window', (event, dx, dy) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const [curX, curY] = win.getPosition();
      const deltaX = typeof dx === 'object' ? (dx.dx || 0) : Number(dx || 0);
      const deltaY = typeof dx === 'object' ? (dx.dy || 0) : Number(dy || 0);
      win.setPosition(curX + deltaX, curY + deltaY);
    }
  });

  ipcMain.on('drag-window-to', (event, arg1, arg2, arg3, arg4) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    let screenX, screenY, anchorX, anchorY;
    if (typeof arg1 === 'object' && arg1 !== null) {
      screenX = arg1.screenX;
      screenY = arg1.screenY;
      anchorX = arg1.anchorX;
      anchorY = arg1.anchorY;
    } else {
      screenX = arg1;
      screenY = arg2;
      anchorX = arg3;
      anchorY = arg4;
    }

    const sX = Number(screenX);
    const sY = Number(screenY);
    const aX = Number(anchorX || 140);
    const aY = Number(anchorY || 130);

    if (Number.isFinite(sX) && Number.isFinite(sY)) {
      const curBounds = win.getBounds();
      win.setBounds({
        x: Math.round(sX - aX),
        y: Math.round(sY - aY),
        width: curBounds.width,
        height: curBounds.height
      });
    }
  });

  ipcMain.on('drag-window-ended', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;
    const [x, y] = win.getPosition();
    store.set('position', { x, y });
  });

  ipcMain.on('show-context-menu', () => {
    if (tray) {
      tray.popUpContextMenu();
    }
  });

  ipcMain.on('peek-pet', () => {});
  ipcMain.on('unpeek-pet', () => {});
  ipcMain.on('bring-pet-into-view', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.show();
    }
  });

  // 3. Patterns & Presets
  ipcMain.handle('pattern-get', () => {
    return getActivePattern();
  });

  ipcMain.handle('pattern-presets-get', () => {
    const currentSpeciesId = store.get('species') || 'cat';
    const species = speciesRegistry.get(currentSpeciesId);
    return species.presets || [];
  });

  ipcMain.on('pattern-set', (_event, pattern) => {
    broadcastToPet('pattern-changed', pattern);
  });

  ipcMain.on('pattern-preview', (_event, pattern) => {
    broadcastToPet('pattern-changed', pattern);
  });

  // 4. Pet & User Names
  ipcMain.handle('cat-name-get', () => {
    const currentSpeciesId = store.get('species') || 'cat';
    return store.get('petName') || (currentSpeciesId === 'dog' ? 'PixelDog' : 'Comnyang');
  });

  ipcMain.handle('cat-name-set', (_event, name) => {
    store.set('petName', name);
    broadcastToPet('cat-name-changed', { name, showName: true });
    updateTrayMenu();
    return name;
  });

  ipcMain.handle('cat-name-visible-set', (_event, visible) => {
    store.set('showCatName', visible);
    broadcastToPet('cat-name-changed', { name: store.get('petName'), showName: !!visible });
    return visible;
  });

  ipcMain.handle('cat-name-prompt-shown', () => true);

  ipcMain.handle('user-name-get', () => store.get('userName') || '');
  ipcMain.handle('user-name-set', (_event, name) => {
    store.set('userName', name);
    broadcastToPet('user-name-changed', name);
    return name;
  });

  ipcMain.handle('fixed-message-get', () => store.get('fixedMessage') || '');
  ipcMain.handle('fixed-message-set', (_event, msg) => {
    store.set('fixedMessage', msg);
    broadcastToPet('fixed-message-changed', msg);
    return msg;
  });

  // 5. Sound & Volume
  ipcMain.handle('sound-muted-get', () => store.get('soundMuted') || false);
  ipcMain.handle('sound-muted-set', (_event, muted) => {
    store.set('soundMuted', !!muted);
    broadcastToPet('sound-muted', !!muted);
    updateTrayMenu();
    return !!muted;
  });

  ipcMain.handle('task-complete-sound-volume-get', () => store.get('soundVolume') ?? 0.8);
  ipcMain.handle('task-complete-sound-volume-set', (_event, vol) => {
    store.set('soundVolume', Number(vol));
    broadcastToPet('task-complete-sound-volume', Number(vol));
    return Number(vol);
  });

  // 6. Reminders
  ipcMain.handle('reminders-get', () => store.get('reminders') || []);
  ipcMain.handle('reminder-add', (_event, reminder) => {
    const list = store.get('reminders') || [];
    const newRem = Object.assign({ id: 'rem_' + Date.now(), enabled: true }, reminder);
    list.push(newRem);
    store.set('reminders', list);
    broadcastToPet('reminders-changed', list);
    return newRem;
  });

  ipcMain.handle('reminder-update', (_event, updated) => {
    let list = store.get('reminders') || [];
    list = list.map(r => r.id === updated.id ? Object.assign({}, r, updated) : r);
    store.set('reminders', list);
    broadcastToPet('reminders-changed', list);
    return updated;
  });

  ipcMain.handle('reminder-delete', (_event, id) => {
    let list = store.get('reminders') || [];
    list = list.filter(r => r.id !== id);
    store.set('reminders', list);
    broadcastToPet('reminders-changed', list);
    return id;
  });

  ipcMain.handle('reminder-enabled-set', (_event, { id, enabled }) => {
    let list = store.get('reminders') || [];
    list = list.map(r => r.id === id ? Object.assign({}, r, { enabled: !!enabled }) : r);
    store.set('reminders', list);
    broadcastToPet('reminders-changed', list);
    return enabled;
  });

  // 7. Pomodoro
  ipcMain.handle('pomodoro-get', () => pomodoroState);
  ipcMain.handle('pomodoro-start', () => { startPomodoro(); return pomodoroState; });
  ipcMain.handle('pomodoro-pause', () => { pausePomodoro(); return pomodoroState; });
  ipcMain.handle('pomodoro-reset', () => { resetPomodoro(); return pomodoroState; });
  ipcMain.handle('pomodoro-focus-set', (_event, mins) => {
    pomodoroState.focusMin = Number(mins) || 25;
    if (pomodoroState.mode === 'focus' && !pomodoroState.running) {
      pomodoroState.remainingSec = pomodoroState.focusMin * 60;
    }
    broadcastToPet('pomodoro-state', pomodoroState);
    return pomodoroState;
  });
  ipcMain.handle('pomodoro-rest-set', (_event, secs) => {
    pomodoroState.restSec = Number(secs) || 300;
    if (pomodoroState.mode === 'rest' && !pomodoroState.running) {
      pomodoroState.remainingSec = pomodoroState.restSec;
    }
    broadcastToPet('pomodoro-state', pomodoroState);
    return pomodoroState;
  });

  // 8. Species Management
  ipcMain.handle('species-get', () => store.get('species') || 'cat');
  ipcMain.handle('species-set', (_event, speciesId) => {
    switchSpecies(speciesId);
    return speciesId;
  });
  ipcMain.handle('get-species-list', () => speciesRegistry.list());

  // 9. Language & Free mocks
  ipcMain.handle('language-get', () => store.get('language') || 'en');
  ipcMain.handle('language-set', (_event, lang) => {
    store.set('language', lang);
    broadcastToPet('language-changed', lang);
    return lang;
  });

  ipcMain.handle('license-activate', () => ({ valid: true, plan: 'pro' }));
  ipcMain.handle('license-current', () => ({ valid: true, plan: 'pro' }));
  ipcMain.handle('account-state-get', () => ({ signedIn: true, email: 'local@desktop.pet' }));
  ipcMain.handle('allow-analysis-get', () => false);
  ipcMain.handle('allow-analysis-set', () => false);
  ipcMain.handle('agent-monitoring-get', () => true);
  ipcMain.handle('agent-monitoring-set', () => true);
  ipcMain.handle('update-check', () => ({ available: false }));
  ipcMain.handle('update-download', () => true);
  ipcMain.handle('update-install', () => true);
}

// Background Services: Global Input & AI Agent Monitors
function setupServices() {
  function getCursorDelta(cursorX, cursorY) {
    if (!mainWindow || mainWindow.isDestroyed()) return { dx: 0, dy: 0, x: cursorX, y: cursorY };
    const bounds = mainWindow.getBounds();
    const faceCenterX = bounds.x + bounds.width / 2;
    const faceCenterY = bounds.y + 130; // 80px cat-top + 50px (half of 100px pet size)
    return {
      dx: Math.round(cursorX - faceCenterX),
      dy: Math.round(cursorY - faceCenterY),
      x: cursorX,
      y: cursorY
    };
  }

  let lastCursorDelta = null;
  cursorPollingTimer = null;

  function pollCursor() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const pt = screen.getCursorScreenPoint();
      const delta = getCursorDelta(pt.x, pt.y);
      if (!lastCursorDelta || lastCursorDelta.dx !== delta.dx || lastCursorDelta.dy !== delta.dy) {
        lastCursorDelta = delta;
        broadcastToPet('cursor-pos', delta);
      }
    } catch {}
    const dist = lastCursorDelta ? Math.hypot(lastCursorDelta.dx, lastCursorDelta.dy) : 100;
    const delay = dist <= 300 ? 50 : 100;
    cursorPollingTimer = setTimeout(pollCursor, delay);
  }
  pollCursor();

  // 1. Global Input Hook (Forward to authentic Comnyang channels)
  inputHook = new InputHook({
    onMouseMove: ({ x, y }) => {
      const delta = getCursorDelta(x, y);
      lastCursorDelta = delta;
      broadcastToPet('cursor-pos', delta);
      broadcastToPet('global-mouse-move', delta);
    },
    onKeyPress: (data) => {
      broadcastToPet('key-pressed');
      broadcastToPet('global-key-press', data);
    },
    onMouseWheel: (data) => {
      broadcastToPet('mouse-wheel', data);
      broadcastToPet('global-mouse-wheel', data);
    }
  });
  inputHook.start();

  // Helper for agent state handling
  function handleAgentEvent(stateData) {
    if (!stateData) return;
    const { state, agent, agentId } = stateData;
    const currentAgent = agent || agentId || 'antigravity';

    if (state === 'working' || state === 'thinking') {
      broadcastToPet('ai-task-state', { state: 'thinking', agent: currentAgent, agentId: currentAgent });
    } else if (state === 'complete' || state === 'done') {
      broadcastToPet('ai-task-state', { state: 'idle', agent: currentAgent, agentId: currentAgent });
      broadcastToPet('ai-task-complete', { agent: currentAgent, agentId: currentAgent });
      broadcastToPet('do-jump');
    } else {
      broadcastToPet('ai-task-state', { state: 'idle', agent: currentAgent, agentId: currentAgent });
    }
  }

  // 2. HTTP Agent Server (127.0.0.1:23456/agent-state)
  agentServer = new AgentServer({
    onAgentState: handleAgentEvent
  });
  agentServer.start();

  // 3. Antigravity Log Monitor
  antigravityMonitor = new AntigravityMonitor(handleAgentEvent);
  antigravityMonitor.start();

  // 4. Claude Log Monitor
  claudeMonitor = new ClaudeMonitor(handleAgentEvent);
  claudeMonitor.start();

  // 5. Reminders Schedule Checker
  startReminderChecker();

  // 6. Check macOS Accessibility permissions for global input listener
  if (process.platform === 'darwin') {
    const granted = isAccessibilityGranted();
    if (!granted) {
      console.log('[Accessibility] Accessibility permission not granted yet. Prompting user...');
      requestAccessibilityPermission(true);
    } else {
      console.log('[Accessibility] Accessibility permission is already active.');
    }
  }
}

app.whenReady().then(() => {
  store = new Store();
  setupIpc();
  createWindow();
  createTray();
  setupServices();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (accessibilityRetryTimer) clearInterval(accessibilityRetryTimer);
  if (inputHook) inputHook.stop();
  if (agentServer) agentServer.stop();
  if (antigravityMonitor) antigravityMonitor.stop();
  if (claudeMonitor) claudeMonitor.stop();
  if (reminderTimer) clearInterval(reminderTimer);
  if (pomodoroTimer) clearInterval(pomodoroTimer);
  if (cursorPollingTimer) clearTimeout(cursorPollingTimer);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
