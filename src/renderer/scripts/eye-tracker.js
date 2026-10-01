/**
 * Eye Tracker
 * Calcule l'angle et la distance vers le curseur de la souris pour animer les pupilles
 * et le visage du pet en temps réel.
 */
class EyeTracker {
  constructor() {
    this.lastX = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.velocity = 0;
    this.onFastMovement = null;
  }

  updateCursor(screenX, screenY) {
    const now = performance.now();
    const dt = Math.max(1, now - this.lastTime);

    // Calculate mouse speed
    const dist = Math.hypot(screenX - this.lastX, screenY - this.lastY);
    this.velocity = (dist / dt) * 16; // scaled velocity

    this.lastX = screenX;
    this.lastY = screenY;
    this.lastTime = now;

    // Trigger hunting if mouse moves rapidly
    if (this.velocity > 35 && this.onFastMovement) {
      this.onFastMovement(this.velocity);
    }

    // Orient pupils in active SVG
    this.orientPupils(screenX, screenY);
  }

  orientPupils(screenX, screenY) {
    const idleObj = document.getElementById('pet-idle');
    if (!idleObj) return;

    const doc = idleObj.contentDocument;
    if (!doc) return;

    const rect = idleObj.getBoundingClientRect();
    const petScreenX = window.screenX + rect.left + rect.width / 2;
    const petScreenY = window.screenY + rect.top + rect.height / 2;

    const dx = screenX - petScreenX;
    const dy = screenY - petScreenY;

    // Max pupil movement radius in pixels
    const maxRadius = 1.8;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(maxRadius, Math.hypot(dx, dy) * 0.015);

    const pupilX = Math.cos(angle) * distance;
    const pupilY = Math.sin(angle) * distance;

    const pupilLeft = doc.querySelector('.pupil-left');
    const pupilRight = doc.querySelector('.pupil-right');

    if (pupilLeft) {
      pupilLeft.style.transform = `translate(${pupilLeft.dataset.baseX || 0}px, ${pupilLeft.dataset.baseY || 0}px) translate(${pupilX.toFixed(2)}px, ${pupilY.toFixed(2)}px)`;
    }
    if (pupilRight) {
      pupilRight.style.transform = `translate(${pupilRight.dataset.baseX || 0}px, ${pupilRight.dataset.baseY || 0}px) translate(${pupilX.toFixed(2)}px, ${pupilY.toFixed(2)}px)`;
    }

    // Face subtle tilt
    const face = doc.getElementById('face-js');
    if (face) {
      const tilt = Math.max(-2.5, Math.min(2.5, dx * 0.008));
      face.setAttribute('transform', `translate(${(pupilX * 0.4).toFixed(2)} ${(pupilY * 0.3).toFixed(2)}) rotate(${tilt.toFixed(2)} 16 16)`);
    }
  }
}

window.eyeTracker = new EyeTracker();
