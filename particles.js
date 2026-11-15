/**
 * NEON VIBE CLICKER - CANVAS VISUAL EFFECTS & PARTICLE SYSTEM
 * Handles ambient floating neon motes, click spark bursts, shockwaves, and fever lightning.
 */

class NeonParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.particles = [];
    this.shockwaves = [];
    this.ambientParticles = [];

    this.quality = 'high'; // 'high', 'medium', 'low'
    this.isFeverActive = false;

    this.colors = [
      '#00f0ff', // Cyan
      '#ff007f', // Pink
      '#ffe600', // Yellow
      '#a855f7', // Purple
      '#00ff88'  // Green
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
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const count = this.quality === 'high' ? 40 : this.quality === 'medium' ? 20 : 8;

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

  /**
   * Spawn a burst of sparkling neon particles at (x, y)
   */
  spawnClickBurst(x, y, isCrit = false) {
    if (this.quality === 'low') return;

    const baseCount = this.quality === 'high' ? (isCrit ? 36 : 20) : (isCrit ? 18 : 10);

    for (let i = 0; i < baseCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isCrit ? 4 : 2.5) + Math.random() * (isCrit ? 8 : 5);
      const color = isCrit
        ? (Math.random() > 0.4 ? '#ffe600' : '#ff007f')
        : this.colors[Math.floor(Math.random() * this.colors.length)];

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        drag: 0.94,
        gravity: 0.12,
        radius: isCrit ? 2 + Math.random() * 3.5 : 1.5 + Math.random() * 2.5,
        color: color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
        glow: isCrit || Math.random() > 0.5
      });
    }

    // Spawn expanding shockwave
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: isCrit ? 140 : 85,
      speed: isCrit ? 6 : 4,
      alpha: 1,
      color: isCrit ? '#ffe600' : '#00f0ff',
      lineWidth: isCrit ? 3 : 2
    });
  }

  /**
   * Render loop
   */
  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Ambient Floating Particles
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.pulseVal += p.pulseSpeed;

      // Wrap around
      if (p.y < -10) p.y = this.height + 10;
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulseVal));

      this.ctx.save();
      this.ctx.globalAlpha = currentAlpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 2. Render Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = sw.alpha;
      this.ctx.strokeStyle = sw.color;
      this.ctx.lineWidth = sw.lineWidth;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = sw.color;
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Render Click Sparks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      if (p.glow) {
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = p.color;
      }
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.loop());
  }
}

// Global particle engine instance
window.neonParticles = new NeonParticleEngine('fx-canvas');
