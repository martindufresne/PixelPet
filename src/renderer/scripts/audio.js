/**
 * Audio Manager
 * Gère les miaulements, alertes et ronronnements en boucle.
 */
class AudioManager {
  constructor() {
    this.meowSound = new Audio('../../assets/sound/meow.m4a');
    this.alertSound = new Audio('../../assets/sound/meow-alert.m4a');
    this.purrSound = new Audio('../../assets/sound/purring.m4a');

    this.purrSound.loop = true;
    this.volume = 0.5;
    this.isMuted = false;

    this.applyVolume();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol) || 0.5));
    this.applyVolume();
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.isMuted) {
      this.stopPurr();
      this.meowSound.pause();
      this.alertSound.pause();
    }
  }

  applyVolume() {
    this.meowSound.volume = this.volume;
    this.alertSound.volume = this.volume;
    this.purrSound.volume = this.volume;
  }

  playMeow() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.meowSound.currentTime = 0;
      this.meowSound.play().catch(() => {});
    } catch {}
  }

  playAlert() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.alertSound.currentTime = 0;
      this.alertSound.play().catch(() => {});
    } catch {}
  }

  startPurr() {
    if (this.isMuted || this.volume <= 0 || !this.purrSound.paused) return;
    try {
      this.purrSound.currentTime = 0;
      this.purrSound.play().catch(() => {});
    } catch {}
  }

  stopPurr() {
    try {
      this.purrSound.pause();
      this.purrSound.currentTime = 0;
    } catch {}
  }
}

window.audioManager = new AudioManager();
