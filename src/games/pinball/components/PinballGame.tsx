"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 360;
const HEIGHT = 480;

interface Bumper {
  x: number;
  y: number;
  r: number;
  color: string;
}

function playAudioSynth(type: "bump" | "launch" | "over") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "bump") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else if (type === "launch") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors
  }
}

export function PinballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const ball = useRef({ x: 330, y: 400, vx: 0, vy: 0, r: 8 });
  const bumpers = useRef<Bumper[]>([
    { x: 120, y: 140, r: 24, color: "#f43f5e" },
    { x: 240, y: 140, r: 24, color: "#a855f7" },
    { x: 180, y: 220, r: 28, color: "#00f0ff" },
  ]);

  const keysPressed = useRef<Record<string, boolean>>({});

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_pinball_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Launch Pinball
  const launchBall = useCallback(() => {
    ball.current = { x: 330, y: 400, vx: -1.5, vy: -12, r: 8 };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    playAudioSynth("launch");
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (isPlaying && !isGameOver) {
        const b = ball.current;

        // Apply Gravity
        b.vy += 0.25;
        b.x += b.vx;
        b.y += b.vy;

        // Bounce Walls
        if (b.x - b.r < 10) {
          b.x = 10 + b.r;
          b.vx = Math.abs(b.vx) * 0.9;
        }
        if (b.x + b.r > WIDTH - 10) {
          b.x = WIDTH - 10 - b.r;
          b.vx = -Math.abs(b.vx) * 0.9;
        }
        if (b.y - b.r < 10) {
          b.y = 10 + b.r;
          b.vy = Math.abs(b.vy) * 0.9;
        }

        // Check Bumper Collision
        bumpers.current.forEach((bmp) => {
          const dist = Math.hypot(b.x - bmp.x, b.y - bmp.y);
          if (dist < b.r + bmp.r) {
            const angle = Math.atan2(b.y - bmp.y, b.x - bmp.x);
            b.vx = Math.cos(angle) * 8;
            b.vy = Math.sin(angle) * 8;

            playAudioSynth("bump");
            setScore((sc) => {
              const next = sc + 50;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem("gamehub_pinball_highscore", next.toString());
              }
              return next;
            });
          }
        });

        // Flipper Bounces
        const leftFlipperActive = keysPressed.current["ArrowLeft"] || keysPressed.current["a"];
        const rightFlipperActive = keysPressed.current["ArrowRight"] || keysPressed.current["d"];

        // Left Flipper Area
        if (b.y >= 410 && b.y <= 450 && b.x >= 60 && b.x <= 160) {
          if (leftFlipperActive) {
            b.vy = -11;
            b.vx += 3;
            playAudioSynth("bump");
          }
        }
        // Right Flipper Area
        if (b.y >= 410 && b.y <= 450 && b.x >= 200 && b.x <= 300) {
          if (rightFlipperActive) {
            b.vy = -11;
            b.vx -= 3;
            playAudioSynth("bump");
          }
        }

        // Out of Bounds Bottom (Drain)
        if (b.y > HEIGHT + 20) {
          playAudioSynth("over");
          setIsGameOver(true);
          setIsPlaying(false);
        }
      }

      // Draw Walls Outer Rim
      ctx.strokeStyle = "#3b82f6";
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, WIDTH - 20, HEIGHT - 20);

      // Draw Bumpers
      bumpers.current.forEach((bmp) => {
        ctx.fillStyle = bmp.color;
        ctx.shadowColor = bmp.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bmp.x, bmp.y, bmp.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Flippers
      const lAngle = keysPressed.current["ArrowLeft"] || keysPressed.current["a"] ? -0.3 : 0.3;
      const rAngle = keysPressed.current["ArrowRight"] || keysPressed.current["d"] ? 0.3 : -0.3;

      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 10;

      // Left Flipper
      ctx.save();
      ctx.translate(70, 430);
      ctx.rotate(lAngle);
      ctx.fillRect(0, -6, 75, 12);
      ctx.restore();

      // Right Flipper
      ctx.save();
      ctx.translate(290, 430);
      ctx.rotate(rAngle);
      ctx.fillRect(-75, -6, 75, 12);
      ctx.restore();

      // Draw Ball (Glowing White/Silver)
      if (isPlaying && !isGameOver) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ball.current.x, ball.current.y, ball.current.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPlaying]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-muted">Kỷ lục:</span>
          <span className="font-bold text-amber-400">{highScore}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 sm:text-4xl">
          PINBALL CYBER ARCADE 🕹️
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím Mũi Tên Trái (A) & Phím Mũi Tên Phải (D) điều khiển cần nảy bóng flipper!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-rose-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-rose-400">
          ĐIỂM SỐ: {score}
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
              <Zap size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Pinball Arcade Neon</h2>
            <button
              onClick={launchBall}
              type="button"
              className="mt-6 rounded-xl bg-rose-500 px-6 py-3 font-bold text-white transition hover:bg-rose-400 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            >
              Bắn bóng Pinball 🕹️
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">BÓNG ĐÃ RỚT!</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm: <span className="font-bold text-amber-400 text-lg">{score}</span>
            </p>
            <button
              onClick={launchBall}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-bold text-white transition hover:bg-rose-400 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            >
              <RotateCcw size={18} /> Bắn ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-8 sm:hidden">
        <button
          onClick={() => {
            keysPressed.current["ArrowLeft"] = true;
            setTimeout(() => (keysPressed.current["ArrowLeft"] = false), 200);
          }}
          type="button"
          className="flex h-14 w-28 items-center justify-center rounded-2xl bg-slate-900 text-rose-400 border border-rose-500/40 active:bg-rose-500/20"
        >
          <ArrowLeft size={28} /> FLIPPER TRÁI
        </button>
        <button
          onClick={() => {
            keysPressed.current["ArrowRight"] = true;
            setTimeout(() => (keysPressed.current["ArrowRight"] = false), 200);
          }}
          type="button"
          className="flex h-14 w-28 items-center justify-center rounded-2xl bg-slate-900 text-rose-400 border border-rose-500/40 active:bg-rose-500/20"
        >
          FLIPPER PHẢI <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
}
