"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

const SHAPES = [
  // I
  { shape: [[1, 1, 1, 1]], color: "#00f0ff" },
  // J
  { shape: [[1, 0, 0], [1, 1, 1]], color: "#3b82f6" },
  // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: "#f97316" },
  // O
  { shape: [[1, 1], [1, 1]], color: "#facc15" },
  // S
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#22c55e" },
  // T
  { shape: [[0, 1, 0], [1, 1, 1]], color: "#a855f7" },
  // Z
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#ef4444" },
];

function playSynth(type: "drop" | "clear" | "over") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "drop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    } else if (type === "clear") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
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

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Current Piece State
  const pieceRef = useRef<{
    matrix: number[][];
    color: string;
    x: number;
    y: number;
  }>({
    matrix: SHAPES[0].shape,
    color: SHAPES[0].color,
    x: 3,
    y: 0,
  });

  const gridRef = useRef<string[][]>(grid);
  gridRef.current = grid;

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_tetris_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Spawn New Piece
  const spawnPiece = useCallback(() => {
    const p = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    pieceRef.current = {
      matrix: p.shape,
      color: p.color,
      x: Math.floor((COLS - p.shape[0].length) / 2),
      y: 0,
    };

    // Check Immediate Game Over
    if (checkCollision(pieceRef.current.matrix, pieceRef.current.x, pieceRef.current.y, gridRef.current)) {
      setIsGameOver(true);
      setIsPlaying(false);
      playSynth("over");
    }
  }, []);

  // Collision Detection
  const checkCollision = (matrix: number[][], offsetX: number, offsetY: number, currentGrid: string[][]) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && currentGrid[newY][newX] !== "") return true;
        }
      }
    }
    return false;
  };

  // Lock Piece into Grid & Clear Lines
  const lockPiece = useCallback(() => {
    const { matrix, color, x, y } = pieceRef.current;
    const newGrid = gridRef.current.map((row) => [...row]);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (y + r >= 0 && y + r < ROWS && x + c >= 0 && x + c < COLS) {
            newGrid[y + r][x + c] = color;
          }
        }
      }
    }

    // Check & Clear Full Lines
    let clearedCount = 0;
    const filteredGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell !== "");
      if (isFull) clearedCount++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(""));
    }

    if (clearedCount > 0) {
      playSynth("clear");
      setLines((prev) => prev + clearedCount);
      setScore((prev) => {
        const added = clearedCount * 100 * clearedCount;
        const newScore = prev + added;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("gamehub_tetris_highscore", newScore.toString());
        }
        return newScore;
      });
    } else {
      playSynth("drop");
    }

    setGrid(filteredGrid);
    gridRef.current = filteredGrid;
    spawnPiece();
  }, [highScore, spawnPiece]);

  // Move Piece
  const move = useCallback(
    (dx: number, dy: number) => {
      if (!isPlaying || isGameOver) return;
      const { matrix, x, y } = pieceRef.current;
      if (!checkCollision(matrix, x + dx, y + dy, gridRef.current)) {
        pieceRef.current.x += dx;
        pieceRef.current.y += dy;
      } else if (dy > 0) {
        lockPiece();
      }
    },
    [isGameOver, isPlaying, lockPiece]
  );

  // Rotate Piece
  const rotate = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    const { matrix, x, y } = pieceRef.current;
    const rotated = matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
    if (!checkCollision(rotated, x, y, gridRef.current)) {
      pieceRef.current.matrix = rotated;
    }
  }, [isGameOver, isPlaying]);

  // Reset Game
  const resetGame = useCallback(() => {
    const empty = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
    setGrid(empty);
    gridRef.current = empty;
    setScore(0);
    setLines(0);
    setIsGameOver(false);
    setIsPlaying(true);
    spawnPiece();
  }, [spawnPiece]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      if (e.key === "ArrowLeft" || e.key === "a") move(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") move(1, 0);
      if (e.key === "ArrowDown" || e.key === "s") move(0, 1);
      if (e.key === "ArrowUp" || e.key === "w") rotate();
      if (e.key === " ") {
        // Hard Drop
        e.preventDefault();
        while (!checkCollision(pieceRef.current.matrix, pieceRef.current.x, pieceRef.current.y + 1, gridRef.current)) {
          pieceRef.current.y += 1;
        }
        lockPiece();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameOver, isPlaying, lockPiece, move, rotate]);

  // Game Loop Interval
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const interval = setInterval(() => {
      move(0, 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isGameOver, isPlaying, move]);

  // Render Canvas Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    // Draw Fixed Blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      }
    }

    // Draw Active Piece
    if (isPlaying && !isGameOver) {
      const { matrix, color, x, y } = pieceRef.current;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            ctx.fillRect((x + c) * BLOCK_SIZE + 1, (y + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }
    }
  }, [grid, isGameOver, isPlaying]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Top Navigation */}
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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-400 sm:text-4xl">
          TETRIS NEON ARCADE 🧱
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím Mũi Tên Trái/Phải di chuyển • Phím Mũi Tên Lên xoay khối • Space xả nhanh!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-purple-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <div className="flex gap-6">
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="block rounded-xl border border-slate-800 bg-slate-900/90"
          />

          {/* Side Info Panel */}
          <div className="flex flex-col justify-between py-2 font-mono text-xs">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
                <span className="text-[10px] text-slate-400">ĐIỂM SỐ</span>
                <p className="font-bold text-amber-400 text-lg">{score}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
                <span className="text-[10px] text-slate-400">HÀNG ĐÃ XÓA</span>
                <p className="font-bold text-cyan-400 text-lg">{lines}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Xếp gạch Neon!</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-purple-500 px-6 py-3 font-bold text-white transition hover:bg-purple-400 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              Bắt đầu ngay 🧱
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">KẾT THÚC VÁN!</h2>
            <div className="mt-4 flex flex-col gap-1 font-mono">
              <p className="text-sm text-slate-300">Tổng điểm: <span className="font-bold text-amber-400 text-lg">{score}</span></p>
              <p className="text-xs text-slate-400">Hàng đã xóa: <span className="font-bold text-cyan-400">{lines}</span></p>
            </div>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-bold text-white transition hover:bg-purple-400 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <RotateCcw size={18} /> Chơi ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-2 sm:hidden">
        <button onClick={() => move(-1, 0)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40">
          <ArrowLeft size={20} />
        </button>
        <button onClick={rotate} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40">
          <RotateCw size={20} />
        </button>
        <button onClick={() => move(0, 1)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40">
          <ArrowDown size={20} />
        </button>
        <button onClick={() => move(1, 0)} type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40">
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
