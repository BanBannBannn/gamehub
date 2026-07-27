"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, Target, ArrowUp, ArrowDown } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 480;
const HEIGHT = 380;
const TOTAL_ARROWS = 5;

function playAudioSynth(type: "shoot" | "bullseye") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
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

export function ArcheryGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [arrowsLeft, setArrowsLeft] = useState<number>(TOTAL_ARROWS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const aimY = useRef<number>(HEIGHT / 2);
  const wind = useRef<number>(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_archery_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    aimY.current = HEIGHT / 2;
    wind.current = Math.floor(Math.random() * 9) - 4; // -4 to +4 wind
    setScore(0);
    setArrowsLeft(TOTAL_ARROWS);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  // Shoot Arrow
  const shootArrow = useCallback(() => {
    if (!isPlaying || isGameOver || arrowsLeft <= 0) return;
    playAudioSynth("shoot");

    // Distance from Target Center (HEIGHT / 2 + wind)
    const targetY = HEIGHT / 2 + wind.current * 4;
    const diff = Math.abs(aimY.current - targetY);

    let pts = 0;
    if (diff < 10) {
      pts = 100; // Bullseye
      playAudioSynth("bullseye");
    } else if (diff < 25) {
      pts = 60;
    } else if (diff < 45) {
      pts = 30;
    } else if (diff < 70) {
      pts = 10;
    }

    setScore((s) => {
      const next = s + pts;
      if (next > highScore) {
        setHighScore(next);
        localStorage.setItem("gamehub_archery_highscore", next.toString());
      }
      return next;
    });

    const nextArrows = arrowsLeft - 1;
    setArrowsLeft(nextArrows);

    if (nextArrows <= 0) {
      setIsGameOver(true);
      setIsPlaying(false);
    } else {
      // Change Wind for next shot
      wind.current = Math.floor(Math.random() * 9) - 4;
    }
  }, [arrowsLeft, highScore, isGameOver, isPlaying]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") aimY.current = Math.max(40, aimY.current - 8);
      if (e.key === "ArrowDown" || e.key === "s") aimY.current = Math.min(HEIGHT - 40, aimY.current + 8);
      if (e.key === " ") {
        e.preventDefault();
        shootArrow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shootArrow]);

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Target Rings on Right Side
      const tX = WIDTH - 60;
      const tY = HEIGHT / 2;

      // Outer Red Ring
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(tX, tY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Middle Blue Ring
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(tX, tY, 45, 0, Math.PI * 2);
      ctx.fill();

      // Inner Yellow Bullseye Ring
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(tX, tY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Center Dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(tX, tY, 8, 0, Math.PI * 2);
      ctx.fill();

      if (isPlaying && !isGameOver) {
        // Draw Bow & Crosshair (Left side)
        ctx.strokeStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;

        // Bow Line
        ctx.beginPath();
        ctx.arc(40, aimY.current, 35, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // Crosshair Indicator at Aim Position
        ctx.strokeStyle = "#facc15";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(tX, aimY.current, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, isPlaying]);

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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 sm:text-4xl">
          BẮN CUNG TARGET MASTER 🎯
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím W / S nâng hạ ngắm • Phím Space hoặc bấm Nút để Thả dây cung!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="mb-2 flex w-full justify-between font-mono text-sm font-bold">
          <div className="text-cyan-400">TÊN CÒN LẠI: {arrowsLeft} / {TOTAL_ARROWS}</div>
          <div className="text-amber-400">
            SỨC GIÓ: {wind.current > 0 ? `+${wind.current} ➡️` : wind.current < 0 ? `${wind.current} ⬅️` : "0 🛑"}
          </div>
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Target size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Bắn Cung Archery Master</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Bắt đầu giương cung 🎯
            </button>
          </div>
        )}

        {/* End Game Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-amber-400">HOÀN THÀNH 5 MŨI TÊN! 🎉</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm đạt được: <span className="font-bold text-cyan-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Bắn ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 sm:hidden">
        <button
          onClick={() => (aimY.current = Math.max(40, aimY.current - 15))}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40"
        >
          <ArrowUp size={24} />
        </button>
        <button
          onClick={shootArrow}
          type="button"
          className="flex h-12 px-6 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950"
        >
          THẢ TÊN 🎯
        </button>
        <button
          onClick={() => (aimY.current = Math.min(HEIGHT - 40, aimY.current + 15))}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40"
        >
          <ArrowDown size={24} />
        </button>
      </div>
    </div>
  );
}
