"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 360;
const HEIGHT = 480;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 70;
const LANES = [60, 160, 260];

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  speed: number;
  color: string;
}

function playAudioSynth(type: "boost" | "crash") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "boost") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function CyberRacerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentLane, setCurrentLane] = useState<number>(1); // middle lane
  const [distance, setDistance] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const laneRef = useRef<number>(1);
  laneRef.current = currentLane;

  const obstacles = useRef<Obstacle[]>([]);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_racer_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    setCurrentLane(1);
    laneRef.current = 1;
    obstacles.current = [];
    setDistance(0);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  // Change Lane
  const moveLeft = useCallback(() => {
    setCurrentLane((l) => Math.max(0, l - 1));
  }, []);

  const moveRight = useCallback(() => {
    setCurrentLane((l) => Math.min(2, l + 1));
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    let roadOffsetY = 0;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Road Surface
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Moving Lane Divider Lines
      roadOffsetY = (roadOffsetY + 6) % 40;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 3;

      // Lane 1 divider
      ctx.beginPath();
      ctx.moveTo(120, -40 + roadOffsetY);
      ctx.lineTo(120, HEIGHT + 40);
      ctx.stroke();

      // Lane 2 divider
      ctx.beginPath();
      ctx.moveTo(240, -40 + roadOffsetY);
      ctx.lineTo(240, HEIGHT + 40);
      ctx.stroke();

      ctx.setLineDash([]);

      if (isPlaying && !isGameOver) {
        // Increment Distance
        setDistance((d) => {
          const next = d + 1;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem("gamehub_racer_highscore", next.toString());
          }
          return next;
        });

        // Spawn Traffic Cars
        spawnTimer++;
        if (spawnTimer > 30) {
          spawnTimer = 0;
          const laneIdx = Math.floor(Math.random() * 3);
          const colors = ["#ef4444", "#a855f7", "#3b82f6"];
          obstacles.current.push({
            id: Math.random(),
            lane: laneIdx,
            y: -80,
            speed: 5 + Math.random() * 2,
            color: colors[laneIdx],
          });
        }

        // Move Traffic & Check Collision
        const pX = LANES[laneRef.current];
        const pY = HEIGHT - CAR_HEIGHT - 20;

        obstacles.current.forEach((obs) => {
          obs.y += obs.speed;

          // Check Collision with Player Car
          const oX = LANES[obs.lane];
          if (
            Math.abs(pX - oX) < CAR_WIDTH - 5 &&
            obs.y + CAR_HEIGHT >= pY &&
            obs.y <= pY + CAR_HEIGHT
          ) {
            playAudioSynth("crash");
            setIsGameOver(true);
            setIsPlaying(false);
          }
        });

        // Filter off-screen cars
        obstacles.current = obstacles.current.filter((o) => o.y < HEIGHT + 80);
      }

      // Draw Player Cyber Car (Glowing Cyan/Emerald)
      const playerX = LANES[currentLane];
      const playerY = HEIGHT - CAR_HEIGHT - 20;

      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.fillRect(playerX - CAR_WIDTH / 2, playerY, CAR_WIDTH, CAR_HEIGHT);

      // Car Windshield & Lights
      ctx.fillStyle = "#090d16";
      ctx.shadowBlur = 0;
      ctx.fillRect(playerX - CAR_WIDTH / 2 + 6, playerY + 12, CAR_WIDTH - 12, 18);

      ctx.fillStyle = "#facc15";
      ctx.fillRect(playerX - CAR_WIDTH / 2 + 4, playerY + 2, 8, 4);
      ctx.fillRect(playerX + CAR_WIDTH / 2 - 12, playerY + 2, 8, 4);

      // Draw Obstacle Cars
      obstacles.current.forEach((obs) => {
        const obsX = LANES[obs.lane];
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(obsX - CAR_WIDTH / 2, obs.y, CAR_WIDTH, CAR_HEIGHT);

        ctx.fillStyle = "#090d16";
        ctx.shadowBlur = 0;
        ctx.fillRect(obsX - CAR_WIDTH / 2 + 6, obs.y + CAR_HEIGHT - 30, CAR_WIDTH - 12, 18);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentLane, highScore, isGameOver, isPlaying]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-muted">Kỷ lục:</span>
          <span className="font-bold text-amber-400">{highScore}m</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 sm:text-4xl">
          ĐUA XE CYBER RACER 🏎️
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím Mũi Tên Trái/Phải hoặc A/D để né xe ngược chiều trên đường đua Cyber!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-cyan-400">
          QUÃNG ĐƯỜNG: {distance}m
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Đua Xe Cyber Racer</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Nhấn ga xuất phát 🏎️
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">VA CHẠM XE!</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Quãng đường hoàn thành: <span className="font-bold text-cyan-400 text-lg">{distance}m</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Đua lại ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-6 sm:hidden">
        <button
          onClick={moveLeft}
          type="button"
          className="flex h-14 w-24 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
        >
          <ArrowLeft size={28} />
        </button>
        <button
          onClick={moveRight}
          type="button"
          className="flex h-14 w-24 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
        >
          <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
}
