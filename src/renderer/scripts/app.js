/**
 * PixelCat / Comnyang - Main Renderer Application
 * Connecte les entrées globales, les agents IA, la physique du drag et l'interface utilisateur.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[PixelCat] Initializing renderer application...');

  const api = window.pixelPetAPI;
  if (!api) {
    console.error('[PixelCat] pixelPetAPI is not defined in window.');
    return;
  }

  // 1. Initialiser les sous-systèmes
  window.petRenderer.init();

  // 2. Charger la configuration
  const config = await api.getConfig();
  window.i18n.setLang(config.language || 'fr');
  window.audioManager.setVolume(config.soundVolume !== undefined ? config.soundVolume : 0.5);
  window.audioManager.setMuted(!!config.soundMuted);

  window.pomodoroTimer.init(config);
  window.remindersManager.init(config);

  // Charger le motif et l'animal actuel
  const speciesId = config.species || 'cat';
  const presetId = config.preset || 'calico-cat';
  await window.petRenderer.loadPreset(speciesId, presetId);

  // Message fixe éventuel au-dessus de la tête
  if (config.fixedMessage) {
    window.remindersManager.speak(config.fixedMessage);
  }

  // 3. Écoute des entrées globales du système
  api.onGlobalMouseMove((data) => {
    window.eyeTracker.updateCursor(data.x, data.y);
  });

  api.onGlobalKeyPress((data) => {
    window.motionManager.handleKeyPress(data);
  });

  api.onGlobalMouseWheel(() => {
    window.motionManager.handleMouseWheel();
  });

  window.eyeTracker.onFastMovement = () => {
    window.motionManager.triggerHunting();
  };

  // 4. Écoute des états des Agents IA (Antigravity, Claude Code, Cursor, etc.)
  api.onAgentState((data) => {
    console.log('[PixelCat] Agent event received:', data);
    const state = data.state;

    if (state === 'thinking' || state === 'working') {
      document.body.classList.add('thinking');
      window.motionManager.recordActivity();
    } else if (state === 'complete') {
      document.body.classList.remove('thinking');
      window.motionManager.playJumpSequence(true);
      window.remindersManager.speak(window.i18n.t('agentComplete'));
    } else if (state === 'idle' || state === 'error') {
      document.body.classList.remove('thinking');
    }
  });

  // 5. Commandes depuis la barre des tâches / Tray menu
  api.onPetCommand(async (cmd) => {
    console.log('[PixelCat] Tray command:', cmd);
    switch (cmd.action) {
      case 'change-species':
        const newSpecies = await api.getSpecies(cmd.species);
        await window.petRenderer.loadPreset(cmd.species, newSpecies.defaultPreset);
        window.audioManager.playMeow();
        break;

      case 'change-preset':
        const curConfig = await api.getConfig();
        await window.petRenderer.loadPreset(curConfig.species || 'cat', cmd.preset);
        break;

      case 'toggle-pomodoro':
        window.pomodoroTimer.toggle();
        break;

      case 'toggle-reminders':
        window.remindersManager.togglePanel();
        break;

      case 'trigger-stretch':
        window.motionManager.playStretchSequence();
        break;

      case 'trigger-drink':
        window.motionManager.playDrinkSequence();
        break;

      case 'set-muted':
        window.audioManager.setMuted(cmd.muted);
        break;
    }
  });

  // 6. Gestion du Mouse Click-through & Dragging
  setupMouseInteractions(api);

  console.log('[PixelCat] Ready!');
});

function setupMouseInteractions(api) {
  const dragHandle = document.getElementById('drag-handle');
  let isPointerDown = false;
  let startX = 0;
  let startY = 0;
  let isDraggingWindow = false;

  // Click-through management: enable clicks only when cursor is over interactive areas
  const interactiveElements = [
    dragHandle,
    document.getElementById('reminder-clock-btn'),
    document.getElementById('reminder-panel'),
    document.getElementById('cat-speech-bubble')
  ];

  for (const el of interactiveElements) {
    if (!el) continue;
    el.addEventListener('mouseenter', () => {
      api.setIgnoreMouseEvents(false);
    });
    el.addEventListener('mouseleave', () => {
      if (!isPointerDown) {
        api.setIgnoreMouseEvents(true, { forward: true });
      }
    });
  }

  // Initial click-through state
  api.setIgnoreMouseEvents(true, { forward: true });

  // Dragging and Mochi stretch
  dragHandle.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
      isPointerDown = true;
      startX = e.screenX;
      startY = e.screenY;
      isDraggingWindow = false;

      window.motionManager.startDrag(e.clientY);
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPointerDown) {
      // Petting detection: moving cursor over cat's head triggers purr
      const rect = dragHandle.getBoundingClientRect();
      const inHeadArea = (
        e.clientX >= rect.left + 30 &&
        e.clientX <= rect.right - 30 &&
        e.clientY >= rect.top + 20 &&
        e.clientY <= rect.top + 70
      );
      if (inHeadArea) {
        window.motionManager.startPurring();
      }
      return;
    }

    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    if (Math.hypot(dx, dy) > 3) {
      isDraggingWindow = true;
      startX = e.screenX;
      startY = e.screenY;
      api.dragWindow(dx, dy);
    }

    window.motionManager.updateDrag(e.clientY);
  });

  window.addEventListener('mouseup', (e) => {
    if (isPointerDown) {
      isPointerDown = false;
      window.motionManager.endDrag();
      if (!isDraggingWindow) {
        // Quick click on the pet: meow!
        window.audioManager.playMeow();
        window.motionManager.recordActivity();
      }
      isDraggingWindow = false;
      api.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  // Right click on pet opens context menu
  dragHandle.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    api.showContextMenu();
  });
}
