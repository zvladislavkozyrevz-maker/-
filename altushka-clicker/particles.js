/**
 * ALTUSHKA CLICKER - GOTHIC & NEON CANVAS PARTICLE SYSTEM
 * Handles ambient floating gothic sparkles, purple spark bursts, shockwaves, and fever lightning.
 */

class AltushkaParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.particles = [];
    this.shockwaves = [];
    this.ambientParticles = [];
    this.lastBurstTime = 0;

    this.quality = 'high'; // 'high', 'medium', 'low'
    this.isFeverActive = false;

    // Altushka Gothic & Neon palette: Purple, Magenta, Violet, Toxic Green, Cyan
    this.colors = [
      '#a855f7', // Purple
      '#f43f5e', // Hot Magenta / Red
      '#c084fc', // Bright Lilac
      '#e879f9', // Pinkish violet
      '#4ade80', // Toxic Monster green
      '#38bdf8'  // Cold cyan
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initAmbientParticles();
    this.loop();
  }

  setQuality(q) {
    this.quality = q;
    this.initAmbientParticles();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const count = this.quality === 'high' ? 45 : this.quality === 'medium' ? 22 : 8;

    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        radius: 1 + Math.random() * 2.5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        alpha: 0.2 + Math.random() * 0.5,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseVal: Math.random() * Math.PI
      });
    }
  }

  spawnClickBurst(x, y, isCrit = false) {
    if (this.quality === 'low') return;

    const now = performance.now();
    if (now - this.lastBurstTime < 35) return;
    this.lastBurstTime = now;

    // Strict cap on active particles to keep 60 FPS during fast tapping
    if (this.particles.length > 85) {
      this.particles.splice(0, 25);
    }

    const baseCount = this.quality === 'high' ? (isCrit ? 22 : 12) : (isCrit ? 12 : 6);

    for (let i = 0; i < baseCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isCrit ? 4.5 : 2.5) + Math.random() * (isCrit ? 5 : 3.5);

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: isCrit ? (2 + Math.random() * 3) : (1.5 + Math.random() * 2),
        color: isCrit ? '#f43f5e' : this.colors[Math.floor(Math.random() * this.colors.length)],
        alpha: 1,
        decay: 0.025 + Math.random() * 0.035,
        gravity: 0.06
      });
    }

    if (this.shockwaves.length < 5) {
      this.shockwaves.push({
        x: x,
        y: y,
        radius: 8,
        maxRadius: isCrit ? 100 : 55,
        alpha: 0.85,
        color: isCrit ? '#f43f5e' : '#a855f7',
        speed: isCrit ? 6 : 4
      });
    }
  }

  setFever(active) {
    this.isFeverActive = active;
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Ambient floating particles
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.pulseVal += p.pulseSpeed;

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulseVal));
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = currentAlpha;
      this.ctx.fill();
    }

    // 2. Click particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
    }

    // 3. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.035;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = sw.color;
      this.ctx.lineWidth = 2.5;
      this.ctx.globalAlpha = sw.alpha;
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }
}

// Global instance
window.particleEngine = new AltushkaParticleEngine('fx-canvas');
