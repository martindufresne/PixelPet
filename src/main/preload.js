/**
 * Preload Script for PixelPet / Comnyang
 * Exposes both authentic Comnyang electronAPI and multi-species pixelPetAPI
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Global input & cursor
  onCursorPos: (cb) => ipcRenderer.on('cursor-pos', (_event, data) => cb(data)),
  onKeyPressed: (cb) => ipcRenderer.on('key-pressed', () => cb()),
  onMouseWheel: (cb) => ipcRenderer.on('mouse-wheel', (_event, data) => cb(data)),

  // Motions
  onDoStretch: (cb) => ipcRenderer.on('do-stretch', () => cb()),
  onCancelStretch: (cb) => ipcRenderer.on('cancel-stretch', () => cb()),
  onDoDrink: (cb) => ipcRenderer.on('do-drink', () => cb()),
  onCancelDrink: (cb) => ipcRenderer.on('cancel-drink', () => cb()),
  onDoJump: (cb) => ipcRenderer.on('do-jump', () => cb()),

  // Share recording
  onShareRecord: (cb) => ipcRenderer.on('share-record', () => cb()),
  onShareCaptureCancel: (cb) => ipcRenderer.on('share-capture-cancel', () => cb()),
  shareCaptureOptions: (opts) => ipcRenderer.invoke('share-capture-options', opts),
  shareCaptureStarted: () => ipcRenderer.invoke('share-capture-started'),
  shareCaptureOverlayHide: () => ipcRenderer.invoke('share-capture-overlay-hide'),
  shareVideoSave: (opts) => ipcRenderer.invoke('share-video-save', opts),
  shareErrorDialog: (err) => ipcRenderer.invoke('share-error-dialog', err),

  // Names & messages
  onCatNameEdit: (cb) => ipcRenderer.on('cat-name-edit', (_event, data) => cb(data)),
  onCatNameChanged: (cb) => ipcRenderer.on('cat-name-changed', (_event, data) => cb(data)),
  catNameGet: () => ipcRenderer.invoke('cat-name-get'),
  catNameSet: (name) => ipcRenderer.invoke('cat-name-set', name),
  catNameVisibleSet: (visible) => ipcRenderer.invoke('cat-name-visible-set', visible),
  catNamePromptShown: () => ipcRenderer.invoke('cat-name-prompt-shown'),

  userNameGet: () => ipcRenderer.invoke('user-name-get'),
  userNameSet: (name) => ipcRenderer.invoke('user-name-set', name),
  onUserNameEdit: (cb) => ipcRenderer.on('user-name-edit', (_event, data) => cb(data)),
  onUserNameChanged: (cb) => ipcRenderer.on('user-name-changed', (_event, data) => cb(data)),

  fixedMessageGet: () => ipcRenderer.invoke('fixed-message-get'),
  fixedMessageSet: (msg) => ipcRenderer.invoke('fixed-message-set', msg),
  onFixedMessageEdit: (cb) => ipcRenderer.on('fixed-message-edit', (_event, data) => cb(data)),
  onFixedMessageChanged: (cb) => ipcRenderer.on('fixed-message-changed', (_event, data) => cb(data)),

  // Pet size
  onPetSizeChanged: (cb) => ipcRenderer.on('pet-size-changed', (_event, data) => cb(data)),

  // AI Task & Agents
  onAiTaskComplete: (cb) => ipcRenderer.on('ai-task-complete', (_event, data) => cb(data)),
  onAiTaskState: (cb) => ipcRenderer.on('ai-task-state', (_event, data) => cb(data)),
  onAiTaskNotification: (cb) => ipcRenderer.on('ai-task-notification', (_event, data) => cb(data)),
  agentMonitoringGet: (agent) => ipcRenderer.invoke('agent-monitoring-get', agent),
  agentMonitoringSet: (agent, enabled) => ipcRenderer.invoke('agent-monitoring-set', agent, enabled),

  // Reminders
  remindersGet: () => ipcRenderer.invoke('reminders-get'),
  reminderAdd: (reminder) => ipcRenderer.invoke('reminder-add', reminder),
  reminderUpdate: (reminder) => ipcRenderer.invoke('reminder-update', reminder),
  reminderDelete: (id) => ipcRenderer.invoke('reminder-delete', id),
  reminderEnabledSet: (opts) => ipcRenderer.invoke('reminder-enabled-set', opts),
  onRemindersChanged: (cb) => ipcRenderer.on('reminders-changed', (_event, data) => cb(data)),
  onReminderTriggered: (cb) => ipcRenderer.on('reminder-triggered', (_event, data) => cb(data)),
  onReminderPanelOpen: (cb) => ipcRenderer.on('reminder-panel-open', () => cb()),
  onReminderSettingsChanged: (cb) => ipcRenderer.on('reminder-settings-changed', (_event, data) => cb(data)),

  // Pomodoro
  pomodoroGet: () => ipcRenderer.invoke('pomodoro-get'),
  pomodoroStart: () => ipcRenderer.invoke('pomodoro-start'),
  pomodoroPause: () => ipcRenderer.invoke('pomodoro-pause'),
  pomodoroReset: () => ipcRenderer.invoke('pomodoro-reset'),
  pomodoroFocusSet: (mins) => ipcRenderer.invoke('pomodoro-focus-set', mins),
  pomodoroRestSet: (secs) => ipcRenderer.invoke('pomodoro-rest-set', secs),
  onPomodoroFocusEdit: (cb) => ipcRenderer.on('pomodoro-focus-edit', (_event, data) => cb(data)),
  onPomodoroRestEdit: (cb) => ipcRenderer.on('pomodoro-rest-edit', (_event, data) => cb(data)),
  onPomodoroState: (cb) => ipcRenderer.on('pomodoro-state', (_event, data) => cb(data)),
  onPomodoroComplete: (cb) => ipcRenderer.on('pomodoro-complete', (_event, data) => cb(data)),
  onPomodoroFocusStart: (cb) => ipcRenderer.on('pomodoro-focus-start', () => cb()),
  onCancelPomodoroMotion: (cb) => ipcRenderer.on('cancel-pomodoro-motion', () => cb()),

  // Sound & Volume
  taskCompleteSoundVolumeGet: () => ipcRenderer.invoke('task-complete-sound-volume-get'),
  taskCompleteSoundVolumeSet: (vol) => ipcRenderer.invoke('task-complete-sound-volume-set', vol),
  onTaskCompleteSoundVolume: (cb) => ipcRenderer.on('task-complete-sound-volume', (_event, data) => cb(data)),
  soundMutedGet: () => ipcRenderer.invoke('sound-muted-get'),
  soundMutedSet: (muted) => ipcRenderer.invoke('sound-muted-set', muted),
  onSoundMuted: (cb) => ipcRenderer.on('sound-muted', (_event, data) => cb(data)),

  // Window & Dragging
  dragWindow: (dx, dy) => ipcRenderer.send('drag-window', dx, dy),
  dragWindowTo: (screenX, screenY, anchorX, anchorY) => ipcRenderer.send('drag-window-to', screenX, screenY, anchorX, anchorY),
  dragWindowEnded: () => ipcRenderer.send('drag-window-ended'),
  peekPet: (edge) => ipcRenderer.send('peek-pet', edge),
  unpeekPet: () => ipcRenderer.send('unpeek-pet'),
  bringPetIntoView: () => ipcRenderer.send('bring-pet-into-view'),
  onPetPeekState: (cb) => ipcRenderer.on('pet-peek-state', (_event, data) => cb(data)),
  setMouseEventsEnabled: (enabled) => ipcRenderer.send('set-mouse-events-enabled', enabled),
  setPetFocusable: (focusable) => ipcRenderer.send('set-pet-focusable', focusable),
  showContextMenu: (opts) => ipcRenderer.send('show-context-menu', opts),
  setStretchMode: (mode) => ipcRenderer.send('set-stretch-mode', mode),
  setHuntingMode: (mode) => ipcRenderer.send('set-hunting-mode', mode),

  // Patterns & Presets
  patternGet: () => ipcRenderer.invoke('pattern-get'),
  patternPreview: (pattern) => ipcRenderer.send('pattern-preview', pattern),
  patternSet: (pattern) => ipcRenderer.send('pattern-set', pattern),
  patternPresetsGet: () => ipcRenderer.invoke('pattern-presets-get'),
  patternCustomPresetSave: (preset) => ipcRenderer.invoke('pattern-custom-preset-save', preset),
  patternCustomPresetDelete: (id) => ipcRenderer.invoke('pattern-custom-preset-delete', id),
  patternCustomPresetRename: (opts) => ipcRenderer.invoke('pattern-custom-preset-rename', opts),
  patternCustomPresetsExport: () => ipcRenderer.invoke('pattern-custom-presets-export'),
  patternCustomPresetsImport: () => ipcRenderer.invoke('pattern-custom-presets-import'),
  patternConfirmClearAll: () => ipcRenderer.invoke('pattern-confirm-clear-all'),
  patternConfirmDeletePreset: (id) => ipcRenderer.invoke('pattern-confirm-delete-preset', id),
  patternConfirmDiscardChanges: () => ipcRenderer.invoke('pattern-confirm-discard-changes'),
  onPatternChanged: (cb) => ipcRenderer.on('pattern-changed', (_event, data) => cb(data)),
  onPatternPresetsChanged: (cb) => ipcRenderer.on('pattern-presets-changed', () => cb()),
  openPatternEditor: () => ipcRenderer.send('open-pattern-editor'),
  openMappingEditor: () => ipcRenderer.send('open-mapping-editor'),
  mappingLoad: () => ipcRenderer.invoke('mapping-load'),
  mappingSave: (data) => ipcRenderer.invoke('mapping-save', data),
  svgLoad: (name) => ipcRenderer.invoke('svg-load', name),

  // License & Account (Free offline mock)
  licenseActivate: () => ipcRenderer.invoke('license-activate'),
  licenseCurrent: () => ipcRenderer.invoke('license-current'),
  accountStateGet: () => ipcRenderer.invoke('account-state-get'),
  accountGoogleLogin: () => ipcRenderer.invoke('account-google-login'),
  accountSignOut: () => ipcRenderer.invoke('account-sign-out'),
  accountUnlinkLicense: () => ipcRenderer.invoke('account-unlink-license'),
  accountLinkLicense: () => ipcRenderer.invoke('account-link-license'),
  accountLinkLegacyLicense: () => ipcRenderer.invoke('account-link-legacy-license'),
  accountReconnect: () => ipcRenderer.invoke('account-reconnect'),
  accountOpenLinkWindow: () => ipcRenderer.invoke('account-open-link-window'),
  accountNudgeDismissedDateGet: () => ipcRenderer.invoke('account-nudge-dismissed-date-get'),
  accountNudgeDismissedDateSet: (val) => ipcRenderer.invoke('account-nudge-dismissed-date-set', val),
  onAccountFlow: (cb) => ipcRenderer.on('account-flow', (_event, data) => cb(data)),
  openLandingPage: () => ipcRenderer.invoke('open-landing-page'),
  openLicenseResetPage: () => ipcRenderer.invoke('open-license-reset-page'),
  onLicenseError: (cb) => ipcRenderer.on('license-error', (_event, data) => cb(data)),

  // Update & Analytics & State
  updateCheck: () => ipcRenderer.invoke('update-check'),
  updateDownload: () => ipcRenderer.invoke('update-download'),
  updateInstall: () => ipcRenderer.invoke('update-install'),
  onUpdateState: (cb) => ipcRenderer.on('update-state', (_event, data) => cb(data)),
  allowAnalysisGet: () => ipcRenderer.invoke('allow-analysis-get'),
  allowAnalysisSet: (val) => ipcRenderer.invoke('allow-analysis-set', val),
  analyticsCapture: () => Promise.resolve(),
  networkOnline: () => {},
  networkStatus: () => {},

  // Language
  languageGet: () => ipcRenderer.invoke('language-get'),
  languageSet: (lang) => ipcRenderer.invoke('language-set', lang),
  onLanguageChanged: (cb) => ipcRenderer.on('language-changed', (_event, data) => cb(data)),

  // Species Extensions
  speciesGet: () => ipcRenderer.invoke('species-get'),
  speciesSet: (id) => ipcRenderer.invoke('species-set', id),
  onSpeciesChanged: (cb) => ipcRenderer.on('species-changed', (_event, data) => cb(data))
});

contextBridge.exposeInMainWorld('pixelPetAPI', {
  onGlobalMouseMove: (cb) => ipcRenderer.on('cursor-pos', (_event, data) => cb(data)),
  onGlobalKeyPress: (cb) => ipcRenderer.on('key-pressed', () => cb()),
  onGlobalMouseWheel: (cb) => ipcRenderer.on('mouse-wheel', (_event, data) => cb(data)),
  onAgentState: (cb) => ipcRenderer.on('ai-task-state', (_event, data) => cb(data)),
  onPetCommand: (cb) => ipcRenderer.on('pet-command', (_event, data) => cb(data)),
  setIgnoreMouseEvents: (ignore, opts) => ipcRenderer.send('set-mouse-events-enabled', !ignore),
  dragWindow: (dx, dy) => ipcRenderer.send('drag-window', dx, dy),
  dragWindowTo: (screenX, screenY, anchorX, anchorY) => ipcRenderer.send('drag-window-to', screenX, screenY, anchorX, anchorY),
  savePosition: (x, y) => ipcRenderer.send('save-position', { x, y }),
  bringToFront: () => ipcRenderer.send('bring-pet-into-view'),
  showContextMenu: (opts) => ipcRenderer.send('show-context-menu', opts),
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (patch) => ipcRenderer.invoke('update-config', patch),
  getSpeciesList: () => ipcRenderer.invoke('get-species-list'),
  getSpecies: (id) => ipcRenderer.invoke('get-species', id),
  getPresetData: (speciesId, presetId) => ipcRenderer.invoke('get-preset-data', { speciesId, presetId }),
  getAssetPath: (subPath) => ipcRenderer.invoke('get-asset-path', subPath)
});
