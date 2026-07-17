// Simple Web Audio API sound synthesizer for Chess

let audioCtx: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function playMoveSound() {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playCaptureSound() {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // A slightly higher, harsher sound for capture
  osc.type = "square";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playCheckSound() {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // A warning sound for check
  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}
