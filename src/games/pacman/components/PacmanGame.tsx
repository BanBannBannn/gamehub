"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRID_SIZE = 15;
const TILE_SIZE = 24;

// 1: Wall, 0: Dot, 2: Empty, 3: Power Pellet
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 3, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 1, 0, 1, 1, 1],
  [2, 2, 1, 0, 1, 2, 1, 1, 1, 2, 1, 0, 1, 2, 2],
  [1, 1, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

interface Entity {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function playAudioSynth(type: "waka" | "power" | "die") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "waka") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    } else if (type === "power") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
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

export function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [maze, setMaze] = useState<number[][]>(INITIAL_MAZE);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isPowerMode, setIsPowerMode] = useState<boolean>(false);

  const pacmanRef = useRef<Entity>({ x: 7, y: 10, dx: 0, dy: 0 });
  const ghostRef = useRef<Entity>({ x: 7, y: 4, dx: 1, dy: 0 });

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_pacman_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    const freshMaze = INITIAL_MAZE.map((row) => [...row]);
    setMaze(freshMaze);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    setIsPowerMode(false);
    pacmanRef.current = { x: 7, y: 10, dx: 0, dy: 0 };
    ghostRef.current = { x: 7, y: 4, dx: 1, dy: 0 };
    setIsPlaying(true);
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") {
        pacmanRef.current.dx = 0;
        pacmanRef.current.dy = -1;
      }
      if (k === "ArrowDown" || k === "s" || k === "S") {
        pacmanRef.current.dx = 0;
        pacmanRef.current.dy = 1;
      }
      if (k === "ArrowLeft" || k === "a" || k === "A") {
        pacmanRef.current.dx = -1;
        pacmanRef.current.dy = 0;
      }
      if (k === "ArrowRight" || k === "d" || k === "D") {
        pacmanRef.current.dx = 1;
        pacmanRef.current.dy = 0;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main Loop Timer
  useEffect(() => {
    if (!isPlaying || isGameOver || isWon) return;

    const timer = setInterval(() => {
      setMaze((prevMaze) => {
        const nextMaze = prevMaze.map((row) => [...row]);

        // Move Pacman
        const p = pacmanRef.current;
        const nextPx = (p.x + p.dx + GRID_SIZE) % GRID_SIZE;
        const nextPy = (p.y + p.dy + nextMaze.length) % nextMaze.length;

        if (nextMaze[nextPy] && nextMaze[nextPy][nextPx] !== 1) {
          p.x = nextPx;
          p.y = nextPy;

          // Eat Dot
          if (nextMaze[p.y][p.x] === 0) {
            nextMaze[p.y][p.x] = 2;
            playAudioSynth("waka");
            setScore((s) => {
              const newScore = s + 10;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem("gamehub_pacman_highscore", newScore.toString());
              }
              return newScore;
            });
          }
          // Eat Power Pellet
          else if (nextMaze[p.y][p.x] === 3) {
            nextMaze[p.y][p.x] = 2;
            playAudioSynth("power");
            setIsPowerMode(true);
            setTimeout(() => setIsPowerMode(false), 7000);
            setScore((s) => s + 50);
          }
        }

        // Move Ghost AI
        const g = ghostRef.current;
        const possibleDirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ].filter(
          (d) => nextMaze[(g.y + d.dy + nextMaze.length) % nextMaze.length]?.[(g.x + d.dx + GRID_SIZE) % GRID_SIZE] !== 1
        );

        if (possibleDirs.length > 0) {
          const chosen = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
          g.x = (g.x + chosen.dx + GRID_SIZE) % GRID_SIZE;
          g.y = (g.y + chosen.dy + nextMaze.length) % nextMaze.length;
        }

        // Check Pacman <-> Ghost Collision
        if (p.x === g.x && p.y === g.y) {
          if (isPowerMode) {
            playAudioSynth("power");
            g.x = 7;
            g.y = 4;
            setScore((s) => s + 200);
          } else {
            playAudioSynth("die");
            setIsGameOver(true);
            setIsPlaying(false);
          }
        }

        // Check Win Condition (All dots eaten)
        const hasDots = nextMaze.some((row) => row.some((cell) => cell === 0 || cell === 3));
        if (!hasDots) {
          setIsWon(true);
          setIsPlaying(false);
        }

        return nextMaze;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [highScore, isGameOver, isPlaying, isPowerMode, isWon]);

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Maze Grid
    maze.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const x = cIdx * TILE_SIZE;
        const y = rIdx * TILE_SIZE;

        if (cell === 1) {
          // Wall (Blue Glowing Block)
          ctx.fillStyle = "#1e3a8a";
          ctx.strokeStyle = "#3b82f6";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (cell === 0) {
          // Small Dot
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 3) {
          // Power Pellet (Large Glowing Dot)
          ctx.fillStyle = "#f43f5e";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });

    if (isPlaying && !isGameOver) {
      // Draw Pacman (Yellow Circle with Mouth)
      const p = pacmanRef.current;
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.lineTo(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2);
      ctx.fill();

      // Draw Ghost (Red / Blue Vulnerable)
      const g = ghostRef.current;
      ctx.fillStyle = isPowerMode ? "#3b82f6" : "#ef4444";
      ctx.shadowColor = isPowerMode ? "#3b82f6" : "#ef4444";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(g.x * TILE_SIZE + TILE_SIZE / 2, g.y * TILE_SIZE + TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 3, Math.PI, 0);
      ctx.lineTo(g.x * TILE_SIZE + TILE_SIZE - 3, g.y * TILE_SIZE + TILE_SIZE - 2);
      ctx.lineTo(g.x * TILE_SIZE + 3, g.y * TILE_SIZE + TILE_SIZE - 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [isGameOver, isPlaying, isPowerMode, maze]);

  const changeDir = (dx: number, dy: number) => {
    pacmanRef.current.dx = dx;
    pacmanRef.current.dy = dy;
  };

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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 sm:text-4xl">
          PAC-MAN NEON MAZE 👾
        </h1>
        <p className="mt-1 text-xs font-mono text-muted">
          {isPowerMode ? "⚡ SIÊU NĂNG LƯỢNG! ĂN ĐƯỢC CON MA!" : "Phím mũi tên hoặc WASD ăn hết chấm vàng!"}
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-amber-400/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-amber-400">
          ĐIỂM SỐ: {score}
        </div>

        <canvas
          ref={canvasRef}
          width={GRID_SIZE * TILE_SIZE}
          height={INITIAL_MAZE.length * TILE_SIZE}
          className="block rounded-2xl border border-slate-800 bg-slate-900/90"
        />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && !isWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Mê Cung Pac-Man Neon</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            >
              Bắt đầu săn vàng 👾
            </button>
          </div>
        )}

        {/* Game Over / Win Overlay */}
        {(isGameOver || isWon) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className={`font-display text-3xl font-bold ${isWon ? "text-emerald-400" : "text-rose-500"}`}>
              {isWon ? "BẠN ĐÃ CHIẾN THẮNG! 🎉" : "KẾT THÚC VÁN!"}
            </h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm: <span className="font-bold text-amber-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            >
              <RotateCcw size={18} /> Chơi ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex flex-col items-center gap-2 sm:hidden">
        <button onClick={() => changeDir(0, -1)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40">
          <ArrowUp size={24} />
        </button>
        <div className="flex gap-4">
          <button onClick={() => changeDir(-1, 0)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40">
            <ArrowLeft size={24} />
          </button>
          <button onClick={() => changeDir(0, 1)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40">
            <ArrowDown size={24} />
          </button>
          <button onClick={() => changeDir(1, 0)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40">
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
