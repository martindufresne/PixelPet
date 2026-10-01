/**
 * Reminders Manager
 * Gère les alertes programmées et le panneau de rappels santé.
 */
class RemindersManager {
  constructor() {
    this.reminders = [];
    this.panelEl = document.getElementById('reminder-panel');
    this.listEl = document.getElementById('reminder-list');
    this.bubbleEl = document.getElementById('cat-speech-bubble');
    this.clockBtn = document.getElementById('reminder-clock-btn');
    this.closeBtn = document.getElementById('reminder-close-btn');

    this.lastTriggerMinute = null;
    this.interval = null;

    this.bindEvents();
  }

  init(config = {}) {
    this.reminders = config.reminders || [];
    this.renderList();
    this.startClock();
  }

  bindEvents() {
    this.clockBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    this.closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel(false);
    });

    document.getElementById('btn-quick-water')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.motionManager.playDrinkSequence();
      this.speak(window.i18n.t('drinkPrompt', ''));
    });

    document.getElementById('btn-quick-stretch')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.motionManager.playStretchSequence();
      this.speak(window.i18n.t('stretchPrompt', ''));
    });
  }

  togglePanel(open) {
    const shouldOpen = open !== undefined ? open : !this.panelEl.classList.contains('open');
    if (shouldOpen) {
      this.panelEl.classList.add('open');
    } else {
      this.panelEl.classList.remove('open');
    }
  }

  renderList() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';

    for (const r of this.reminders) {
      const item = document.createElement('div');
      item.className = 'reminder-item';
      item.innerHTML = `
        <div>
          <strong>${r.time}</strong> — <span>${r.message}</span>
        </div>
        <div class="reminder-actions">
          <button type="button" class="btn-sm" data-id="${r.id}">${r.enabled ? '🔔' : '🔕'}</button>
        </div>
      `;
      this.listEl.appendChild(item);
    }
  }

  startClock() {
    this.interval = setInterval(() => this.check(), 20000);
    this.check();
  }

  check() {
    const now = new Date();
    const currentMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = now.getDay();

    if (this.lastTriggerMinute === currentMin) return;

    for (const r of this.reminders) {
      if (!r.enabled) continue;
      if (r.time === currentMin) {
        if (!r.days || r.days.includes(day)) {
          this.triggerReminder(r);
          this.lastTriggerMinute = currentMin;
          break;
        }
      }
    }
  }

  triggerReminder(r) {
    window.audioManager.playAlert();
    window.motionManager.playJumpSequence(false);
    this.speak(r.message);
  }

  speak(text) {
    if (!this.bubbleEl) return;
    document.body.setAttribute('data-speech', '1');
    this.bubbleEl.textContent = text;

    setTimeout(() => {
      if (!window.pomodoroTimer.isRunning) {
        document.body.removeAttribute('data-speech');
      }
    }, 5000);
  }
}

window.remindersManager = new RemindersManager();
