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
