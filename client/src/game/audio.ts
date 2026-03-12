// ============================================================
// Fantasy Tower Defense — Web Audio Sound System
// Procedurally generated sound effects using Web Audio API
// No external audio files required
// ============================================================

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  attack = 0.01,
  decay = 0.1,
  pitchEnd?: number
) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (pitchEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(pitchEnd, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch { /* ignore audio errors */ }
}

function playNoise(duration: number, volume = 0.08, filterFreq = 800) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  } catch { /* ignore */ }
}

// ── Sound Effects ──

export const SFX = {
  // Tower attacks
  arrowShoot: () => {
    playTone(800, 0.08, 'sawtooth', 0.08, 0.005, 0.07, 400);
  },

  magicBlast: () => {
    playTone(440, 0.15, 'sine', 0.12, 0.01, 0.12, 880);
    playTone(660, 0.15, 'triangle', 0.06, 0.01, 0.12, 330);
  },

  cannonFire: () => {
    playNoise(0.25, 0.18, 200);
    playTone(80, 0.3, 'sine', 0.15, 0.005, 0.25, 40);
  },

  frostShot: () => {
    playTone(1200, 0.12, 'sine', 0.1, 0.01, 0.1, 600);
    playTone(1500, 0.12, 'triangle', 0.05, 0.01, 0.1, 800);
  },

  lightningStrike: () => {
    playNoise(0.15, 0.2, 3000);
    playTone(200, 0.2, 'sawtooth', 0.12, 0.001, 0.15, 50);
  },

  poisonSpit: () => {
    playTone(300, 0.2, 'sine', 0.08, 0.01, 0.18, 150);
    playTone(450, 0.15, 'triangle', 0.04, 0.01, 0.12);
  },

  ballistaFire: () => {
    playNoise(0.12, 0.12, 600);
    playTone(150, 0.15, 'sawtooth', 0.1, 0.005, 0.12, 80);
  },

  catapultFire: () => {
    playNoise(0.3, 0.2, 150);
    playTone(60, 0.4, 'sine', 0.18, 0.01, 0.35, 30);
  },

  teslaZap: () => {
    playNoise(0.2, 0.22, 4000);
    playTone(100, 0.2, 'square', 0.1, 0.001, 0.15, 50);
  },

  // Enemy events
  enemyDie: () => {
    playTone(200, 0.2, 'sawtooth', 0.1, 0.005, 0.18, 80);
    playNoise(0.15, 0.06, 400);
  },

  bossDie: () => {
    playNoise(0.5, 0.25, 100);
    playTone(80, 0.6, 'sine', 0.2, 0.01, 0.5, 30);
    playTone(160, 0.4, 'sawtooth', 0.1, 0.01, 0.35, 60);
  },

  enemyReachEnd: () => {
    playTone(300, 0.15, 'sine', 0.15, 0.01, 0.12, 150);
    playTone(200, 0.2, 'sine', 0.1, 0.01, 0.18, 100);
  },

  // UI events
  towerPlace: () => {
    playTone(440, 0.1, 'sine', 0.12, 0.01, 0.08, 660);
    playTone(880, 0.08, 'triangle', 0.06, 0.01, 0.06);
  },

  towerUpgrade: () => {
    playTone(523, 0.1, 'sine', 0.12, 0.01, 0.08);
    playTone(659, 0.1, 'sine', 0.1, 0.02, 0.08);
    playTone(784, 0.15, 'sine', 0.12, 0.03, 0.12);
  },

  towerSell: () => {
    playTone(660, 0.08, 'sine', 0.1, 0.01, 0.07, 440);
  },

  goldEarn: () => {
    playTone(880, 0.06, 'sine', 0.08, 0.005, 0.05, 1100);
  },

  waveStart: () => {
    playTone(220, 0.15, 'sawtooth', 0.12, 0.01, 0.12);
    setTimeout(() => playTone(330, 0.15, 'sawtooth', 0.12, 0.01, 0.12), 150);
    setTimeout(() => playTone(440, 0.2, 'sawtooth', 0.14, 0.01, 0.18), 300);
  },

  waveComplete: () => {
    playTone(523, 0.1, 'sine', 0.12, 0.01, 0.08);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12, 0.01, 0.08), 120);
    setTimeout(() => playTone(784, 0.1, 'sine', 0.12, 0.01, 0.08), 240);
    setTimeout(() => playTone(1047, 0.2, 'sine', 0.15, 0.01, 0.18), 360);
  },

  abilityActivate: () => {
    playTone(660, 0.15, 'triangle', 0.15, 0.01, 0.12, 1320);
    playTone(880, 0.15, 'sine', 0.1, 0.02, 0.12, 1760);
  },

  victory: () => {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.3, 'sine', 0.15, 0.01, 0.25), i * 200);
    });
  },

  defeat: () => {
    const notes = [440, 392, 349, 294, 262];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.4, 'sawtooth', 0.12, 0.01, 0.35), i * 250);
    });
  },

  allySpawn: () => {
    playTone(330, 0.12, 'triangle', 0.1, 0.01, 0.1, 550);
  },

  heroSpawn: () => {
    playTone(440, 0.12, 'sine', 0.12, 0.01, 0.1);
    setTimeout(() => playTone(660, 0.12, 'sine', 0.12, 0.01, 0.1), 100);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.14, 0.01, 0.12), 200);
  },

  // Mute/unmute
  muted: false,
  toggle() {
    this.muted = !this.muted;
  },
};

// Wrap all SFX to respect mute
const originalSFX = { ...SFX };
Object.keys(SFX).forEach(key => {
  if (typeof (SFX as Record<string, unknown>)[key] === 'function' && key !== 'toggle') {
    const original = (originalSFX as Record<string, unknown>)[key] as () => void;
    (SFX as Record<string, unknown>)[key] = () => {
      if (!SFX.muted) original();
    };
  }
});

// ============================================================
// PROCEDURAL AMBIENT MUSIC SYSTEM
// Uses Web Audio API oscillators — no external files
// ============================================================

class AmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private timeouts: number[] = [];
  private oscillators: OscillatorNode[] = [];
  private intervalId: number | null = null;
  private _volume = 0.3;

  get volume() { return this._volume; }
  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume * 0.15, this.ctx!.currentTime, 0.1);
    }
  }

  start() {
    if (this.isPlaying) return;
    try {
      this.ctx = getCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume * 0.15;
      this.masterGain.connect(this.ctx.destination);

      this.isPlaying = true;
      this.playLoop();
    } catch { /* ignore */ }
  }

  stop() {
    this.isPlaying = false;
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.oscillators.forEach(o => {
      try { o.stop(); } catch { /* ignore */ }
    });
    this.oscillators = [];
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch { /* ignore */ }
      this.masterGain = null;
    }
  }

  private playLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Fantasy chord progressions in minor key
    const chords = [
      [130.81, 155.56, 196.00], // Cm
      [116.54, 146.83, 174.61], // Bb
      [103.83, 130.81, 155.56], // Ab
      [116.54, 138.59, 174.61], // Bb (sus)
      [130.81, 164.81, 196.00], // C major (resolution)
      [110.00, 130.81, 164.81], // Am
      [98.00,  123.47, 146.83], // G
      [116.54, 146.83, 174.61], // Bb
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      // Pad sound — long sustained tones
      for (const freq of chord) {
        this.playPadNote(freq, 4.0);
        // Add octave doubling softly
        this.playPadNote(freq * 2, 4.0, 0.4);
      }

      // Occasional melody note
      if (Math.random() > 0.4) {
        const melodyDelay = Math.random() * 2000;
        const t = setTimeout(() => {
          if (!this.isPlaying) return;
          const melodyNotes = [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 523.25];
          const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
          this.playMelodyNote(note, 1.5 + Math.random());
        }, melodyDelay);
        this.timeouts.push(t as unknown as number);
      }

      // Low drone
      if (chordIndex % 4 === 1) {
        this.playDrone(chord[0] / 2, 8.0);
      }
    };

    playChord();
    this.intervalId = setInterval(playChord, 4000) as unknown as number;
  }

  private playPadNote(freq: number, duration: number, volMult = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;
      // Slight detuning for warmth
      osc.detune.value = (Math.random() - 0.5) * 10;

      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      const vol = 0.6 * volMult;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime + duration - 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.1);
      this.oscillators.push(osc);

      osc.onended = () => {
        const idx = this.oscillators.indexOf(osc);
        if (idx >= 0) this.oscillators.splice(idx, 1);
      };
    } catch { /* ignore */ }
  }

  private playMelodyNote(freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.1);
      this.oscillators.push(osc);

      osc.onended = () => {
        const idx = this.oscillators.indexOf(osc);
        if (idx >= 0) this.oscillators.splice(idx, 1);
      };
    } catch { /* ignore */ }
  }

  private playDrone(freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2.0);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime + duration - 2.0);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.1);
      this.oscillators.push(osc);

      osc.onended = () => {
        const idx = this.oscillators.indexOf(osc);
        if (idx >= 0) this.oscillators.splice(idx, 1);
      };
    } catch { /* ignore */ }
  }
}

export const Music = new AmbientMusic();
