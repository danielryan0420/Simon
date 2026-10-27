/**
 * All sound effects are synthesized at runtime via the Web Audio API.
 * No audio files are bundled (see CREDITS.md) — this keeps the game
 * network-free and license-free while still giving punchy arcade feedback.
 */
let ctx: AudioContext | null = null;
let muted = loadMuted();

function loadMuted(): boolean {
  try {
    return localStorage.getItem("geo-racer:muted") === "1";
  } catch {
    return false;
  }
}

/** Shared AudioContext, also used by music.ts so iOS Safari only needs one gesture unlock. */
export function getAudioContext(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  return getAudioContext();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem("geo-racer:muted", value ? "1" : "0");
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  startGain = 0.2,
  delay = 0
): void {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(startGain, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function sweep(
  fromFreq: number,
  toFreq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainLevel = 0.2
): void {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), t0 + duration);
  gain.gain.setValueAtTime(gainLevel, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noiseBurst(duration: number, gainLevel = 0.15): void {
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainLevel, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  source.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export function playClick(): void {
  tone(880, 0.08, "triangle", 0.12);
}

export function playLaunch(): void {
  sweep(220, 880, 0.35, "sawtooth", 0.1);
  noiseBurst(0.3, 0.06);
}

export function playPerfect(): void {
  tone(523, 0.15, "sine", 0.2);
  tone(659, 0.15, "sine", 0.18, 0.08);
  tone(784, 0.25, "sine", 0.2, 0.16);
}

export function playGreat(): void {
  tone(523, 0.12, "sine", 0.18);
  tone(698, 0.2, "sine", 0.18, 0.08);
}

export function playGood(): void {
  tone(440, 0.15, "sine", 0.16);
}

export function playMiss(): void {
  sweep(300, 120, 0.3, "sawtooth", 0.12);
}

export function playCombo(streak: number): void {
  const base = 440 + Math.min(streak, 10) * 40;
  tone(base, 0.12, "square", 0.08);
}

export function playLevelUp(): void {
  tone(523, 0.12, "sine", 0.2);
  tone(659, 0.12, "sine", 0.2, 0.1);
  tone(784, 0.12, "sine", 0.2, 0.2);
  tone(1046, 0.3, "sine", 0.22, 0.3);
}

export function playUiOpen(): void {
  sweep(440, 660, 0.1, "triangle", 0.1);
}

export function playAchievement(): void {
  tone(660, 0.1, "sine", 0.18);
  tone(880, 0.1, "sine", 0.18, 0.09);
  tone(1320, 0.28, "sine", 0.2, 0.18);
}
