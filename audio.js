/**
 * ALTUSHKA CLICKER - PROCEDURAL SYNTH AUDIO ENGINE
 * Adaptive sound profiles tailored to each Altushka Evolution Level!
 * Level 1: Gentle acoustic / lo-fi plink
 * Level 2: Pop-punk bubble / energy drink pop
 * Level 3: Grunge overdrive / garage rock clink
 * Level 4: Phonk 808 cowbell / trap transient
 * Level 5: Deep heavy 808 sub bass drop & rave synth
 *
 * Background Music: Melodic Lo-Fi / Darkwave Ambient Synth (Zero harsh drone)
 */

class AltushkaAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.volume = 0.7;
    this.currentLevel = 1; // 1 to 5

    // Altushka Evolution Soundtrack Lineup (Calibrated background volume)
    this.stageTracks = {
      1: { src: 'assets/audio/track_stage1.mp3', title: 'Спокойная мелодия (Серая мышка)', mult: 0.32 },
      2: { src: 'assets/audio/track_stage2.mp3', title: 'cupsize — по барабану', mult: 0.22 },
      3: { src: 'assets/audio/track_stage3.mp3', title: '9mice — narcotic', mult: 0.20 },
      4: { src: 'assets/audio/track_stage4.mp3', title: 'kai angel — mulholland', mult: 0.22 },
      5: { src: 'assets/audio/track_stage5.mp3', title: 'kai angel — babylon', mult: 0.20 }
    };
    this.bgAudio = null;
    this.isMusicPlaying = false;
    this.lastClickSoundTime = 0;

    // Load sound settings from localStorage
    try {
      const savedSettings = localStorage.getItem('altushka_clicker_audio');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.sfxEnabled = parsed.sfxEnabled ?? true;
        this.musicEnabled = parsed.musicEnabled ?? true;
        this.volume = parsed.volume ?? 0.7;
      }
    } catch (e) {
      console.warn('Audio settings read error', e);
    }
  }

  getTrackVolume(level = this.currentLevel) {
    const t = this.stageTracks[level] || this.stageTracks[1];
    return Math.max(0, Math.min(1, this.volume * (t.mult || 0.22)));
  }

  getCurrentTrackTitle() {
    const t = this.stageTracks[this.currentLevel] || this.stageTracks[1];
    return t.title || '';
  }

  setLevel(lvl) {
    const newLvl = Math.max(1, Math.min(5, lvl));
    const changed = this.currentLevel !== newLvl;
    this.currentLevel = newLvl;
    if (changed && this.musicEnabled) {
      this.playStageMusic(this.currentLevel);
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.musicEnabled && (!this.bgAudio || this.bgAudio.paused)) {
      this.playStageMusic(this.currentLevel);
    }
  }

  safeDisconnect(...nodes) {
    nodes.forEach(n => {
      if (n && n.disconnect) {
        try { n.disconnect(); } catch (e) {}
      }
    });
  }

  saveSettings() {
    try {
      localStorage.setItem('altushka_clicker_audio', JSON.stringify({
        sfxEnabled: this.sfxEnabled,
        musicEnabled: this.musicEnabled,
        volume: this.volume
      }));
    } catch (e) {}
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.bgAudio) {
      this.bgAudio.volume = this.getTrackVolume(this.currentLevel);
    }
    this.saveSettings();
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
    }
    this.saveSettings();
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.playStageMusic(this.currentLevel);
    } else {
      this.stopMusic();
    }
    this.saveSettings();
    return this.musicEnabled;
  }

  /**
   * Adaptive Level Click Sound (Throttled for ultra-fast multi-finger tapping)
   */
  playClick(comboMultiplier = 1, isCrit = false) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Prevent Web Audio voice exhaustion during intense trackpad bursts
    if (t - this.lastClickSoundTime < 0.028) {
      return;
    }
    this.lastClickSoundTime = t;

    const mult = Math.min(3.5, comboMultiplier);

    switch (this.currentLevel) {
      case 1:
        this.playLevel1Click(t, mult, isCrit);
        break;
      case 2:
        this.playLevel2Click(t, mult, isCrit);
        break;
      case 3:
        this.playLevel3Click(t, mult, isCrit);
        break;
      case 4:
        this.playLevel4Click(t, mult, isCrit);
        break;
      case 5:
      default:
        this.playLevel5Click(t, mult, isCrit);
        break;
    }
  }

  playLevel1Click(t, mult, isCrit) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isCrit ? 880 : (440 + mult * 40);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.12);

    gain.gain.setValueAtTime(isCrit ? 0.35 : 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.22 : 0.12));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => this.safeDisconnect(osc, gain);
    osc.start(t);
    osc.stop(t + (isCrit ? 0.23 : 0.13));
  }

  playLevel2Click(t, mult, isCrit) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = isCrit ? 700 : (280 + mult * 45);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.14);

    gain.gain.setValueAtTime(isCrit ? 0.4 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => this.safeDisconnect(osc, gain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Level 3: «Гаражная Тусовщица» — Crisp, satisfying bottle/glass clink with warm cider thud (Zero harsh buzz)
   */
  playLevel3Click(t, mult, isCrit) {
    // 1. Crisp high glass clink (satisfying glass bottle strike)
    const oscClink = this.ctx.createOscillator();
    const gainClink = this.ctx.createGain();
    oscClink.type = 'triangle';
    const clinkFreq = isCrit ? 1760 : (1320 + mult * 55);
    oscClink.frequency.setValueAtTime(clinkFreq, t);
    gainClink.gain.setValueAtTime(isCrit ? 0.26 : 0.16, t);
    gainClink.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.11 : 0.075));

    // 2. Warm body pop (resonance of cider bottle)
    const oscThud = this.ctx.createOscillator();
    const gainThud = this.ctx.createGain();
    oscThud.type = 'sine';
    const thudFreq = isCrit ? 240 : (175 + mult * 15);
    oscThud.frequency.setValueAtTime(thudFreq, t);
    oscThud.frequency.exponentialRampToValueAtTime(65, t + 0.08);
    gainThud.gain.setValueAtTime(isCrit ? 0.28 : 0.18, t);
    gainThud.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscClink.connect(gainClink);
    gainClink.connect(this.sfxGain);
    oscThud.connect(gainThud);
    gainThud.connect(this.sfxGain);

    oscClink.onended = () => this.safeDisconnect(oscClink, gainClink);
    oscThud.onended = () => this.safeDisconnect(oscThud, gainThud);

    oscClink.start(t);
    oscClink.stop(t + 0.12);
    oscThud.start(t);
    oscThud.stop(t + 0.09);
  }

  playLevel4Click(t, mult, isCrit) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';

    const root = isCrit ? 587.33 : (392.0 + (mult % 4) * 45);
    osc1.frequency.setValueAtTime(root, t);
    osc2.frequency.setValueAtTime(root * 1.503, t);

    gain.gain.setValueAtTime(isCrit ? 0.28 : 0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.25 : 0.16));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.onended = () => this.safeDisconnect(osc1, osc2, gain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + (isCrit ? 0.26 : 0.17));
    osc2.stop(t + (isCrit ? 0.26 : 0.17));
  }

  playLevel5Click(t, mult, isCrit) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isCrit ? 150 : (105 + mult * 15);
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + (isCrit ? 0.38 : 0.24));

    gain.gain.setValueAtTime(isCrit ? 0.45 : 0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.38 : 0.24));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => this.safeDisconnect(osc, gain);
    osc.start(t);
    osc.stop(t + (isCrit ? 0.39 : 0.25));
  }

  playSpeechPop() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.07);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => this.safeDisconnect(osc, gain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playBuy() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [330, 440, 660].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0.18, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.onended = () => this.safeDisconnect(osc, gain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.11);
    });
  }

  playEventAlert() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [440, 554, 659].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.07);
      gain.gain.setValueAtTime(0.2, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.onended = () => this.safeDisconnect(osc, gain);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.13);
    });
  }

  playEvolution() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.07);
      gain.gain.setValueAtTime(0.25, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.onended = () => this.safeDisconnect(osc, gain);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.36);
    });
  }

  playAchievement() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.onended = () => this.safeDisconnect(osc, gain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.23);
    });
  }

  playFeverStart() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => this.safeDisconnect(osc, gain);
    osc.start(t);
    osc.stop(t + 0.41);
  }

  /**
   * HIGH-FIDELITY STAGE SOUNDTRACK SYSTEM
   * 1: Спокойная гитара / мелодия (Серая мышка)
   * 2: cupsize — по барабану
   * 3: 9mice — narcotic
   * 4: kai angel — mulholland
   * 5: kai angel — babylon
   * Громкость сбалансирована под фон, чтобы не заглушать тапы и эффекты.
   */
  playStageMusic(level = this.currentLevel) {
    if (!this.musicEnabled) return;
    const trackInfo = this.stageTracks[level] || this.stageTracks[1];
    const trackSrc = trackInfo.src;

    if (this.bgAudio && this.bgAudio.getAttribute('data-level') == level && !this.bgAudio.paused) {
      return;
    }

    const oldAudio = this.bgAudio;
    if (oldAudio) {
      // Fade out old track smoothly over 250ms
      try {
        const fadeStep = oldAudio.volume / 10;
        let stepCount = 0;
        const fadeInterval = setInterval(() => {
          stepCount++;
          if (oldAudio.volume > fadeStep) {
            oldAudio.volume = Math.max(0, oldAudio.volume - fadeStep);
          }
          if (stepCount >= 10 || oldAudio.volume <= 0.01) {
            clearInterval(fadeInterval);
            oldAudio.pause();
            oldAudio.currentTime = 0;
          }
        }, 25);
      } catch (e) {
        try { oldAudio.pause(); } catch (err) {}
      }
    }

    try {
      const audio = new Audio(trackSrc);
      audio.loop = true;
      const targetVol = this.getTrackVolume(level);
      audio.volume = targetVol;
      audio.setAttribute('data-level', level);

      this.bgAudio = audio;
      this.isMusicPlaying = true;

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          console.log(`[AudioEngine] 🎵 Саундтрек Уровня ${level}: ${trackInfo.title}`);
        }).catch(err => {
          console.warn('[AudioEngine] Playback awaiting user gesture:', err);
        });
      }
    } catch (e) {
      console.warn('[AudioEngine] Could not load stage audio', e);
    }
  }

  stopMusic() {
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch (e) {}
      this.bgAudio = null;
    }
    this.isMusicPlaying = false;
  }

  startMusic() {
    this.playStageMusic(this.currentLevel);
  }
}

// Global instance
window.audioEngine = new AltushkaAudioEngine();
