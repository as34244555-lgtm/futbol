"use client";

let ctx: AudioContext | null = null;
const MUTE_KEY = "liga-nova-mute";

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function isMuted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(next: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    if (next) window.speechSynthesis?.cancel();
  }
}

export async function unlockAudio() {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") await ac.resume().catch(() => undefined);
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, start = 0) {
  const ac = audio();
  if (!ac || isMuted()) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain = 0.04, start = 0) {
  const ac = audio();
  if (!ac || isMuted()) return;
  const n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(ac.destination);
  src.start(ac.currentTime + start);
}

export function playWhistle() {
  tone(1680, 0.18, "square", 0.05);
  tone(1480, 0.22, "square", 0.04, 0.16);
}

export function playKick() {
  tone(140, 0.12, "sine", 0.09);
  noise(0.08, 0.03);
}

export function playCrowd() {
  noise(1.4, 0.035);
  tone(220, 0.6, "triangle", 0.015);
}

export function playGoalCrowd() {
  noise(1.8, 0.07);
  tone(392, 0.35, "sawtooth", 0.04);
  tone(523, 0.5, "triangle", 0.035, 0.12);
  tone(784, 0.7, "sine", 0.03, 0.22);
}

export function shoutGoal() {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance("Gooool!");
    u.lang = "tr-TR";
    u.rate = 0.72;
    u.pitch = 1.12;
    u.volume = 1;
    window.speechSynthesis?.speak(u);
  } catch {
    /* speech optional */
  }
}

export function playByEvent(type: string) {
  if (type === "goal") {
    playGoalCrowd();
    shoutGoal();
    return;
  }
  if (type === "shot" || type === "chance") {
    playKick();
    return;
  }
  if (type === "whistle" || type === "kickoff") playWhistle();
}
