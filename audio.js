/**
 * NEON VIBE CLICKER - PROCEDURAL SYNTH AUDIO ENGINE
 * Uses Web Audio API for 100% self-contained, latency-free retro-futuristic sound effects
 * No external audio files needed!
 */

class NeonAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.volume = 0.7;

    // Ambient music synth nodes
    this.ambientOscs = [];
    this.ambientLfo = null;
    this.isMusicPlaying = false;

    // Musical scale for combo clicks (Pentatonic Minor / Cyberpunk vibe)
    // A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
    this.comboNotes = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

    // Load sound settings from localStorage
    try {
      const savedSettings = localStorage.getItem('vibe_clicker_audio');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.sfxEnabled = parsed.sfxEnabled ?? true;
        this.musicEnabled = parsed.musicEnabled ?? false;
        this.volume = parsed.volume ?? 0.7;
      }
    } catch (e) {
      console.warn('Audio settings read error', e);
    }
  }

  /**
   * Initializes AudioContext upon user gesture
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      if (this.musicEnabled) {
        this.startMusic();
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('vibe_clicker_audio', JSON.stringify({
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
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    this.saveSettings();
    return this.musicEnabled;
  }

  /**
   * Click Sound - punchy neon pop with pitch scaling based on combo
   */
  playClick(comboLevel = 0, isCrit = false) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Select frequency based on combo level
    const noteIdx = Math.min(this.comboNotes.length - 1, Math.floor(comboLevel));
    let baseFreq = this.comboNotes[noteIdx] || 440;

    if (isCrit) baseFreq *= 1.5;

    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.08);

    // Filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrit ? 8000 : 4500, t);
    filter.frequency.exponentialRampToValueAtTime(1000, t + 0.09);

    // Gain envelope
    const peakGain = isCrit ? 0.45 : 0.28;
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.16 : 0.09));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);

    // If critical hit, add a metallic secondary chime
    if (isCrit) {
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(baseFreq * 2.5, t);
      chimeGain.gain.setValueAtTime(0.2, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.sfxGain);
      chimeOsc.start(t);
      chimeOsc.stop(t + 0.25);
    }
  }

  /**
   * Purchase Upgrade Sound - ascending happy arpeggio chord
   */
  playBuy() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  /**
   * Fever Mode Activated Sound - energetic cyberpunk sweep
   */
  playFever() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(6000, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  /**
   * Lucky Crystal Bonus Sound
   */
  playBonus() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  /**
   * Rebirth / Quantum Leap Sound - huge sub-bass drop and cosmic sweep
   */
  playRebirth() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Sub-bass boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 1.2);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 1.3);

    // Cosmic laser riser
    const riser = this.ctx.createOscillator();
    const riserGain = this.ctx.createGain();
    riser.type = 'sawtooth';
    riser.frequency.setValueAtTime(110, t);
    riser.frequency.exponentialRampToValueAtTime(1200, t + 1.0);
    riserGain.gain.setValueAtTime(0.01, t);
    riserGain.gain.linearRampToValueAtTime(0.35, t + 0.6);
    riserGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(8000, t + 0.9);

    riser.connect(filter);
    filter.connect(riserGain);
    riserGain.connect(this.sfxGain);
    riser.start(t);
    riser.stop(t + 1.2);
  }

  /**
   * Achievement Unlocked Sound
   */
  playAchievement() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [440, 554.37, 659.25, 880]; // A major

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  }

  /**
   * Chill Ambient Synthwave Background Drone
   * Soft, warm detuned low saw/sine pad with subtle LFO filter breathing
   */
  startMusic() {
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const t = this.ctx.currentTime;
    this.musicGain.gain.setValueAtTime(0.001, t);
    this.musicGain.gain.linearRampToValueAtTime(0.18, t + 2); // Smooth fade in

    // Bass root + fifth + octave drone (A1, E2, A2)
    const baseFreqs = [55, 82.41, 110, 164.81];

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.Q.setValueAtTime(2.5, t);

    // LFO to slowly sweep filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, t); // 5 sec sweep cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, t);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);
    this.ambientLfo = lfo;

    filter.connect(this.musicGain);

    this.ambientOscs = baseFreqs.map((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      // Slight detune for analog warmth
      const detune = (idx - 1.5) * 5;
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.12 / baseFreqs.length, t);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(t);
      return osc;
    });
  }

  stopMusic() {
    if (!this.isMusicPlaying || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.linearRampToValueAtTime(0.001, t + 1.2); // Smooth fade out

    setTimeout(() => {
      this.ambientOscs.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.ambientOscs = [];

      if (this.ambientLfo) {
        try { this.ambientLfo.stop(); this.ambientLfo.disconnect(); } catch (e) {}
        this.ambientLfo = null;
      }
      this.isMusicPlaying = false;
    }, 1200);
  }
}

// Global audio instance
window.neonAudio = new NeonAudioEngine();
