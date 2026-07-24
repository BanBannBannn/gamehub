"use client";

/**
 * Âm thanh hiệu ứng nhẹ, sinh bằng WebAudio (không cần file asset) — chơi
 * offline được, không tải thêm gì. Tôn trọng cờ tắt tiếng lưu ở localStorage.
 */

export type SoundType = "move" | "capture" | "win" | "lose" | "click" | "notify";

const MUTE_KEY = "gamehub:muted";

let audioCtx: AudioContext | null = null;

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

export function getMuted(): boolean {
  return isMuted();
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** 1 nốt đơn giản. */
function beep(freq: number, durationMs: number, type: OscillatorType = "sine", gain = 0.08, delayMs = 0) {
  const ac = ctx();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
}

const RECIPES: Record<SoundType, () => void> = {
  click: () => beep(320, 60, "triangle", 0.05),
  move: () => beep(440, 70, "triangle", 0.06),
  capture: () => beep(220, 110, "square", 0.05),
  notify: () => {
    beep(660, 90, "sine", 0.06);
    beep(880, 90, "sine", 0.06, 90);
  },
  win: () => {
    beep(523, 120, "sine", 0.07);
    beep(659, 120, "sine", 0.07, 110);
    beep(784, 200, "sine", 0.07, 220);
  },
  lose: () => {
    beep(392, 150, "sine", 0.06);
    beep(294, 250, "sine", 0.06, 140);
  },
};

export function playSound(type: SoundType): void {
  if (isMuted()) return;
  try {
    const ac = ctx();
    if (ac?.state === "suspended") void ac.resume();
    RECIPES[type]();
  } catch {
    // WebAudio bị chặn (chưa có tương tác người dùng...) — bỏ qua im lặng.
  }
}
