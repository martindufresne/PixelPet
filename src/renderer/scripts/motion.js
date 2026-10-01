/**
 * Motion & State Machine
 * Gère l'ensemble des mouvements (pétrissage clavier, surchauffe, chasse, ronronnement, saut, étirements, sommeil).
 */
class MotionManager {
  constructor() {
    this.currentPose = 'idle';
    this.pawToggle = false;
    this.pressTimeout = null;
    this.scrollTimeout = null;
    this.huntingTimeout = null;
    this.sleepTimeout = null;
    this.purrTimeout = null;
    this.jumpTimers = [];

    this.heat = 0;
    this.heatInterval = null;

    this.isDragging = false;
    this.dragStartY = 0;
    this.stretchRatio = 1;

    this.initSleepTimer();
    this.initHeatDecay();
  }

  setPose(pose) {
    this.currentPose = pose;
    document.body.dataset.pose = pose;
  }

  // --- 1. Clavier & Pétrissage (Kneading) ---
  handleKeyPress({ keysPerSecond, isFast }) {
    this.recordActivity();

    // Toggle alternating paw
    this.pawToggle = !this.pawToggle;
    this.setPose(this.pawToggle ? 'press-left' : 'press-right');

    clearTimeout(this.pressTimeout);
    this.pressTimeout = setTimeout(() => {
      if (this.currentPose.startsWith('press-')) {
        this.setPose('idle');
      }
    }, 180);

    // Heat accumulation
    this.heat = Math.min(1, this.heat + 0.12);
    if (isFast || this.heat > 0.6) {
      document.body.classList.add('overheat');
      document.body.setAttribute('data-heat-steam', '1');
      document.body.style.setProperty('--steam-opacity', String(Math.min(1, (this.heat - 0.3) * 1.5)));
    }
  }

  initHeatDecay() {
    this.heatInterval = setInterval(() => {
      if (this.heat > 0) {
        this.heat = Math.max(0, this.heat - 0.05);
        document.body.style.setProperty('--steam-opacity', String(Math.max(0, (this.heat - 0.3) * 1.5)));
        if (this.heat <= 0.3) {
          document.body.classList.remove('overheat');
          document.body.removeAttribute('data-heat-steam');
        }
      }
    }, 150);
  }

  // --- 2. Défilement / Papier toilette (Scroll Unroll) ---
  handleMouseWheel() {
    this.recordActivity();
    if (this.currentPose.startsWith('jump-') || this.currentPose.startsWith('stretch-')) return;

    this.setPose('scroll-unroll');
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      if (this.currentPose === 'scroll-unroll') {
        this.setPose('idle');
      }
    }, 380);
  }

  // --- 3. Mode Chasse (Mouse Hunt) ---
  triggerHunting() {
    if (this.currentPose !== 'idle') return;
    this.recordActivity();

    const idleObj = document.getElementById('pet-idle');
    const doc = idleObj ? idleObj.contentDocument : null;
    if (doc && doc.documentElement) {
      doc.documentElement.classList.add('hunting');
    }

    clearTimeout(this.huntingTimeout);
    this.huntingTimeout = setTimeout(() => {
      if (doc && doc.documentElement) {
        doc.documentElement.classList.remove('hunting');
      }
    }, 1100);
  }

  // --- 4. Caresses & Ronronnement (Purring) ---
  startPurring() {
    this.recordActivity();
    document.body.classList.add('purring');

    const idleObj = document.getElementById('pet-idle');
    const doc = idleObj ? idleObj.contentDocument : null;
    if (doc && doc.documentElement) {
      doc.documentElement.classList.add('purring');
    }

    window.audioManager.startPurr();

    clearTimeout(this.purrTimeout);
    this.purrTimeout = setTimeout(() => this.stopPurring(), 500);
  }

  stopPurring() {
    document.body.classList.remove('purring');
    const idleObj = document.getElementById('pet-idle');
    const doc = idleObj ? idleObj.contentDocument : null;
    if (doc && doc.documentElement) {
      doc.documentElement.classList.remove('purring');
    }
    window.audioManager.stopPurr();
  }

  // --- 5. Saut de joie (Agent Done Jump / Alert) ---
  playJumpSequence(withMeow = true) {
    this.recordActivity();
    this.jumpTimers.forEach(t => clearTimeout(t));
    this.jumpTimers = [];

    if (withMeow) {
      window.audioManager.playMeow();
    }

    const steps = [
      { pose: 'jump-start', delay: 0 },
      { pose: 'jump-ing', delay: 150 },
      { pose: 'jump-start', delay: 420 },
      { pose: 'jump-ing', delay: 580 },
      { pose: 'jump-start', delay: 850 },
      { pose: 'idle', delay: 1050 }
    ];

    for (const step of steps) {
      this.jumpTimers.push(setTimeout(() => {
        this.setPose(step.pose);
      }, step.delay));
    }
  }

  // --- 6. Étirements (Stretch) ---
  playStretchSequence() {
    this.recordActivity();
    this.setPose('stretch-default');
    window.audioManager.playMeow();

    setTimeout(() => {
      this.setPose('stretch-ing');
    }, 800);

    setTimeout(() => {
      this.setPose('stretch-end');
    }, 2200);

    setTimeout(() => {
      this.setPose('idle');
    }, 3200);
  }

  // --- 7. Boire de l'eau (Drinking) ---
  playDrinkSequence() {
    this.recordActivity();
    const idleObj = document.getElementById('pet-idle');
    const doc = idleObj ? idleObj.contentDocument : null;
    if (doc && doc.documentElement) {
      doc.documentElement.classList.add('drinking');
    }
    window.audioManager.playMeow();

    setTimeout(() => {
      if (doc && doc.documentElement) {
        doc.documentElement.classList.remove('drinking');
      }
    }, 3000);
  }

  // --- 8. Sommeil (Inactivity Sleep) ---
  recordActivity() {
    if (document.body.classList.contains('sleeping')) {
      document.body.classList.remove('sleeping');
      const idleObj = document.getElementById('pet-idle');
      const doc = idleObj ? idleObj.contentDocument : null;
      if (doc && doc.documentElement) {
        doc.documentElement.classList.remove('idle-sleep');
      }
    }
    this.initSleepTimer();
  }

  initSleepTimer() {
    clearTimeout(this.sleepTimeout);
    // After 45 seconds of total inactivity, sleep
    this.sleepTimeout = setTimeout(() => {
      if (this.currentPose === 'idle') {
        document.body.classList.add('sleeping');
        const idleObj = document.getElementById('pet-idle');
        const doc = idleObj ? idleObj.contentDocument : null;
        if (doc && doc.documentElement) {
          doc.documentElement.classList.add('idle-sleep');
        }
      }
    }, 45000);
  }

  // --- 9. Mochi Drag & Stretch Physics ---
  startDrag(clientY) {
    this.isDragging = true;
    this.dragStartY = clientY;
    document.body.classList.add('dragging');
  }

  updateDrag(clientY) {
    if (!this.isDragging) return;
    const dy = this.dragStartY - clientY;
    // Stretch vertically when pulled up
    if (dy > 0) {
      const stretch = 1 + Math.min(0.6, dy * 0.007);
      const squash = 1 / Math.sqrt(stretch);
      document.body.style.setProperty('--stretch-y', stretch.toFixed(2));
      document.body.style.setProperty('--stretch-x', squash.toFixed(2));
    }
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('dragging');
    document.body.style.removeProperty('--stretch-y');
    document.body.style.removeProperty('--stretch-x');
  }
}

window.motionManager = new MotionManager();
