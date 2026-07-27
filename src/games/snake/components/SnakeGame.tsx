"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRID_SIZE = 20;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
interface Point {
  x: number;
  y: number;
}

interface Food extends Point {
  type: "normal" | "golden" | "ghost";
}

function playAudioSynth(type: "eat" | "powerup" | "die") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "eat") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    } else if (type === "powerup") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore audio errors
  }
}

export function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [dir, setDir] = useState<Direction>("UP");
  const [food, setFood] = useState<Food>({ x: 5, y: 5, type: "normal" });
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(110);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);

  const dirRef = useRef<Direction>("UP");
  dirRef.current = dir;

  // Load High score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_snake_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Spawn Food
  const spawnFood = useCallback((currentSnake: Point[]): Food => {
    let newX: number;
    let newY: number;
    while (true) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      if (!currentSnake.some((segment) => segment.x === newX && segment.y === newY)) {
        break;
      }
    }
    const rand = Math.random();
    let type: "normal" | "golden" | "ghost" = "normal";
    if (rand < 0.15) type = "golden";
    else if (rand < 0.3) type = "ghost";

    return { x: newX, y: newY, type };
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDir("UP");
    dirRef.current = "UP";
    setScore(0);
    setSpeed(110);
    setIsGhostMode(false);
    setIsGameOver(false);
    setIsPlaying(true);
    setFood(spawnFood(initialSnake));
  }, [spawnFood]);

  // Main Snake Game Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = dirRef.current;

        if (currentDir === "UP") head.y -= 1;
        if (currentDir === "DOWN") head.y += 1;
        if (currentDir === "LEFT") head.x -= 1;
        if (currentDir === "RIGHT") head.x += 1;

        // Check Wall Collisions (Ghost Mode wraps around)
        if (isGhostMode) {
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
        } else {
          if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            playAudioSynth("die");
            setIsGameOver(true);
            setIsPlaying(false);
            return prevSnake;
          }
        }

        // Check Self Collision
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          playAudioSynth("die");
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check Food Collision
        if (head.x === food.x && head.y === food.y) {
          let points = 1;
          if (food.type === "golden") {
            points = 3;
            playAudioSynth("powerup");
          } else if (food.type === "ghost") {
            setIsGhostMode(true);
            setTimeout(() => setIsGhostMode(false), 5000);
            playAudioSynth("powerup");
          } else {
            playAudioSynth("eat");
          }

          const newScore = score + points;
          setScore(newScore);
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("gamehub_snake_highscore", newScore.toString());
          }

          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [food, highScore, isGameOver, isGhostMode, isPlaying, score, speed, spawnFood]);

  // Handle Keyboard Direction Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      const current = dirRef.current;

      if ((k === "ArrowUp" || k === "w" || k === "W") && current !== "DOWN") setDir("UP");
      if ((k === "ArrowDown" || k === "s" || k === "S") && current !== "UP") setDir("DOWN");
      if ((k === "ArrowLeft" || k === "a" || k === "A") && current !== "RIGHT") setDir("LEFT");
      if ((k === "ArrowRight" || k === "d" || k === "D") && current !== "LEFT") setDir("RIGHT");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const changeDirection = (newDir: Direction) => {
    const current = dirRef.current;
    if (newDir === "UP" && current !== "DOWN") setDir("UP");
    if (newDir === "DOWN" && current !== "UP") setDir("DOWN");
    if (newDir === "LEFT" && current !== "RIGHT") setDir("LEFT");
    if (newDir === "RIGHT" && current !== "LEFT") setDir("RIGHT");
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Top Header */}
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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 sm:text-4xl">
          RẮN SĂN MỒI CYBER NEON 🐍
        </h1>
        <p className="mt-1 text-xs text-cyan-400/80 font-mono uppercase tracking-wider">
          {isGhostMode ? "✨ GHOST MODE ACTIVE! (Xuyên Tường)" : "Dùng phím mũi tên hoặc WASD để di chuyển"}
        </p>
      </div>

      {/* Main Game Arena */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        {/* 20x20 Grid Stage */}
        <div
          className="relative grid bg-slate-900/90 rounded-2xl overflow-hidden"
          style={{
            width: "320px",
            height: "320px",
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {/* Render Snake */}
          {snake.map((seg, idx) => (
            <div
              key={idx}
              style={{
                gridColumnStart: seg.x + 1,
                gridRowStart: seg.y + 1,
              }}
              className={`rounded-sm transition-all ${
                idx === 0
                  ? "bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,1)] z-10"
                  : isGhostMode
                  ? "bg-purple-400/80 shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                  : "bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
              }`}
            />
          ))}

          {/* Render Food */}
          <div
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
            }}
            className={`rounded-full animate-ping ${
              food.type === "golden"
                ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)]"
                : food.type === "ghost"
                ? "bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,1)]"
                : "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)]"
            }`}
          />
        </div>

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Sẵn sàng săn mồi!</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Bắt đầu chơi 🐍
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">KẾT THÚC VÁN!</h2>
            <div className="mt-4 flex flex-col gap-1 font-mono">
              <p className="text-sm text-slate-300">Tổng điểm: <span className="font-bold text-cyan-400 text-lg">{score}</span></p>
              <p className="text-xs text-slate-400">Kỷ lục cao nhất: <span className="font-bold text-amber-400">{highScore}</span></p>
            </div>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Chơi lại ván mới
            </button>
          </div>
        )}
      </div>

      {/* On-screen Mobile D-Pad Controls */}
      <div className="flex flex-col items-center gap-2 sm:hidden">
        <button
          onClick={() => changeDirection("UP")}
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
        >
          <ArrowUp size={24} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection("LEFT")}
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={() => changeDirection("DOWN")}
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
          >
            <ArrowDown size={24} />
          </button>
          <button
            onClick={() => changeDirection("RIGHT")}
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40 active:bg-cyan-500/20"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
