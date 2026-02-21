const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function ensureContext(): void {
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume: number = 0.15,
  freqEnd?: number,
): void {
  ensureContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.1): void {
  ensureContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const sfx = {
  laser(): void {
    playTone(880, 0.1, 'square', 0.1, 220);
  },

  pickup(): void {
    playTone(520, 0.05, 'sine', 0.12);
    setTimeout(() => playTone(780, 0.08, 'sine', 0.12), 50);
  },

  damage(): void {
    playNoise(0.15, 0.15);
    playTone(120, 0.2, 'sawtooth', 0.1, 40);
  },

  explosion(): void {
    playNoise(0.3, 0.2);
    playTone(80, 0.3, 'sine', 0.15, 20);
  },

  cook(): void {
    playTone(330, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(440, 0.08, 'sine', 0.1), 80);
    setTimeout(() => playTone(660, 0.12, 'sine', 0.1), 160);
  },

  click(): void {
    playTone(660, 0.04, 'square', 0.06);
  },

  missionEnd(): void {
    playTone(440, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(550, 0.15, 'sine', 0.1), 150);
    setTimeout(() => playTone(660, 0.25, 'sine', 0.12), 300);
  },

  defeat(): void {
    playTone(440, 0.2, 'sawtooth', 0.1);
    setTimeout(() => playTone(330, 0.2, 'sawtooth', 0.1), 200);
    setTimeout(() => playTone(220, 0.4, 'sawtooth', 0.12), 400);
  },

  victory(): void {
    playTone(523, 0.12, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 120);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.1), 240);
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.12), 360);
  },
};
