/**
 * Background music is generated at runtime with the Web Audio API, the same
 * approach src/game/sfx.ts uses for sound effects. This keeps the game
 * network-free with zero third-party audio licensing to track (see
 * CREDITS.md) and works offline on iPhone Safari once unlocked by a tap.
 */
import { getAudioContext } from "./sfx";

const KEY = "geo-racer:music-on";
const STEP_SECONDS = 0.42;
// Bright G major pentatonic — adventurous and kid-friendly, loops cleanly.
const SCALE = [392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
const PATTERN = [0, 2, 4, 2, 1, 3, 5, 3, 4, 2, 1, 0];

let on = loadPref();
let masterGain: GainNode | null = null;
let schedulerHandle: number | null = null;
let stepIndex = 0;
let nextNoteTime = 0;

function loadPref(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function savePref(value: boolean): void {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}

export function isMusicOn(): boolean {
  return on;
}

function ensureGraph(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.045;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

function playNote(ctx: AudioContext, gainNode: GainNode, freq: number, time: number, duration: number): void {
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, time);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(1, time + 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  osc.connect(noteGain);
  noteGain.connect(gainNode);
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function scheduleAhead(): void {
  const ctx = getAudioContext();
  if (!ctx || !on) return;
  const gainNode = ensureGraph(ctx);
  while (nextNoteTime < ctx.currentTime + 1.0) {
    const freq = SCALE[PATTERN[stepIndex % PATTERN.length]];
    playNote(ctx, gainNode, freq, nextNoteTime, STEP_SECONDS * 0.9);
    if (stepIndex % 4 === 0) {
      playNote(ctx, gainNode, freq / 2, nextNoteTime, STEP_SECONDS * 1.8);
    }
    stepIndex += 1;
    nextNoteTime += STEP_SECONDS;
  }
}

function start(): void {
  const ctx = getAudioContext();
  if (!ctx || schedulerHandle) return;
  ensureGraph(ctx);
  stepIndex = 0;
  nextNoteTime = ctx.currentTime + 0.1;
  scheduleAhead();
  schedulerHandle = window.setInterval(scheduleAhead, 250);
}

function stop(): void {
  if (schedulerHandle) {
    window.clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}

export function setMusicOn(value: boolean): void {
  on = value;
  savePref(value);
  if (value) start();
  else stop();
}

export function toggleMusic(): boolean {
  setMusicOn(!on);
  return on;
}

/** iOS Safari only unlocks audio inside a real user gesture, so resume lazily on first tap. */
if (on && typeof window !== "undefined") {
  const resumeOnGesture = () => {
    start();
    window.removeEventListener("pointerdown", resumeOnGesture);
  };
  window.addEventListener("pointerdown", resumeOnGesture, { once: true });
}
