"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const COLS = 8;
const ROWS = 10;
const BUBBLE_RADIUS = 18;
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#facc15", "#a855f7"];

interface Bubble {
  color: string;
}

function playAudioSynth(type: "shoot" | "pop") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio errors
  }
}

export function BubbleShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [grid, setGrid] = useState<(Bubble | null)[][]>(() => {
    return Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, () =>
        r < 4 ? { color: COLORS[Math.floor(Math.random() * COLORS.length)] } : null
      )
    );
  });

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const shooterAngle = useRef<number>(-Math.PI / 2); // pointing up
  const currentBubbleColor = useRef<string>(COLORS[0]);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_bubble_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Pick Next Color
  const pickNextColor = useCallback(() => {
    currentBubbleColor.current = COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    const newGrid = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, () =>
        r < 4 ? { color: COLORS[Math.floor(Math.random() * COLORS.length)] } : null
      )
    );
    setGrid(newGrid);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    pickNextColor();
    setIsPlaying(true);
  }, [pickNextColor]);

  // Shoot Action
  const shoot = useCallback(() => {
    if (!isPlaying || isGameOver || isWon) return;
    playAudioSynth("shoot");

    // Simple snap to available grid slot
    setGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) => [...row]);

      // Find lowest available spot in middle cols
      let placed = false;
      for (let r = ROWS - 1; r >= 0; r--) {
        const c = 3;
        if (!nextGrid[r][c]) {
          nextGrid[r][c] = { color: currentBubbleColor.current };
          placed = true;
          break;
        }
      }

      if (placed) {
        playAudioSynth("pop");
        setScore((s) => {
          const newScore = s + 30;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("gamehub_bubble_highscore", newScore.toString());
          }
          return newScore;
        });
      }

      return nextGrid;
    });

    pickNextColor();
  }, [highScore, isGameOver, isPlaying, isWon, pickNextColor]);

  // Keyboard Aim Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        shooterAngle.current = Math.max(-Math.PI + 0.3, shooterAngle.current - 0.1);
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        shooterAngle.current = Math.min(-0.3, shooterAngle.current + 0.1);
      }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        shoot();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shoot]);

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Bubbles
    grid.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell) {
          const x = cIdx * (BUBBLE_RADIUS * 2 + 4) + BUBBLE_RADIUS + 12;
          const y = rIdx * (BUBBLE_RADIUS * 2 + 2) + BUBBLE_RADIUS + 10;

          ctx.fillStyle = cell.color;
          ctx.shadowColor = cell.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Highlight shine
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // Draw Cannon Base & Aim Line
    const cannonX = canvas.width / 2;
    const cannonY = canvas.height - 30;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cannonX, cannonY);
    ctx.lineTo(
      cannonX + Math.cos(shooterAngle.current) * 120,
      cannonY + Math.sin(shooterAngle.current) * 120
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Current Cannon Bubble
    if (isPlaying && !isGameOver) {
      ctx.fillStyle = currentBubbleColor.current;
      ctx.shadowColor = currentBubbleColor.current;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [grid, isGameOver, isPlaying]);

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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 sm:text-4xl">
          BẮN BÓNG BUBBLE SHOOTER 🎈
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Dùng phím Mũi Tên Trái/Phải ngắm góc bắn • Phím Space hoặc bấm Nút để Bắn bóng!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-emerald-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-emerald-400">
          ĐIỂM SỐ: {score}
        </div>

        <canvas ref={canvasRef} width={320} height={420} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && !isWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Bắn Bóng Bubble Shooter</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Bắt đầu bắn bóng 🎈
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 sm:hidden">
        <button
          onClick={() => {
            shooterAngle.current = Math.max(-Math.PI + 0.3, shooterAngle.current - 0.2);
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 border border-emerald-500/40"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={shoot}
          type="button"
          className="flex h-12 px-6 items-center justify-center rounded-xl bg-emerald-400 font-bold text-slate-950"
        >
          BẮN BÓNG
        </button>
        <button
          onClick={() => {
            shooterAngle.current = Math.min(-0.3, shooterAngle.current + 0.2);
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 border border-emerald-500/40"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
