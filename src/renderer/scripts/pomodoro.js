/**
 * Pomodoro Focus Timer
 * Alterne cycles de concentration et de pause avec affichage dans la bulle.
 */
class PomodoroTimer {
  constructor() {
    this.focusMin = 25;
    this.restMin = 5;
    this.remainingSec = this.focusMin * 60;
    this.isRunning = false;
    this.mode = 'focus'; // 'focus' | 'break'
    this.interval = null;
    this.bubbleEl = document.getElementById('cat-speech-bubble');
  }

  init(config = {}) {
    if (config.pomodoro) {
      this.focusMin = config.pomodoro.focusMin || 25;
      this.restMin = config.pomodoro.restMin || 5;
      this.remainingSec = this.focusMin * 60;
    }
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();

    this.interval = setInterval(() => {
      if (this.remainingSec > 0) {
        this.remainingSec--;
        this.render();
      } else {
        this.onSessionComplete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.render();
  }

  reset() {
    this.pause();
    this.mode = 'focus';
    this.remainingSec = this.focusMin * 60;
    this.hide();
  }

  onSessionComplete() {
    this.pause();
    window.motionManager.playJumpSequence(true);

    if (this.mode === 'focus') {
      this.mode = 'break';
      this.remainingSec = this.restMin * 60;
      this.showNotification(window.i18n.t('pomodoroBreak'));
    } else {
      this.mode = 'focus';
      this.remainingSec = this.focusMin * 60;
      this.showNotification(window.i18n.t('pomodoroFocus'));
    }
  }

  showNotification(msg) {
    if (!this.bubbleEl) return;
    document.body.setAttribute('data-speech', '1');
    this.bubbleEl.innerHTML = `<div>${msg}</div>`;
    setTimeout(() => {
      if (!this.isRunning) {
        document.body.removeAttribute('data-speech');
      }
    }, 4000);
  }

  render() {
    if (!this.bubbleEl) return;
    document.body.setAttribute('data-speech', '1');

    const m = Math.floor(this.remainingSec / 60);
    const s = this.remainingSec % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const modeLabel = this.mode === 'focus' ? '🎯' : '☕';

    this.bubbleEl.innerHTML = `
      <div class="pomodoro-badge">
        <span>${modeLabel}</span>
        <span class="pomodoro-time">${timeStr}</span>
        <button type="button" class="pomodoro-btn" id="pomo-toggle-btn">${this.isRunning ? '⏸' : '▶'}</button>
        <button type="button" class="pomodoro-btn" id="pomo-reset-btn">↺</button>
      </div>
    `;

    document.getElementById('pomo-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    document.getElementById('pomo-reset-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.reset();
    });
  }

  hide() {
    document.body.removeAttribute('data-speech');
  }
}

window.pomodoroTimer = new PomodoroTimer();
