"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Grid } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

function playAudioSynth(type: "slide" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "slide") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
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

export function SlidingPuzzleGame() {
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  // Initialize Solvable Puzzle
  const initBoard = useCallback(() => {
    const total = gridSize * gridSize;
    const initial = Array.from({ length: total - 1 }, (_, i) => i + 1);
    initial.push(0); // 0 is empty

    // Randomize by making valid random moves
    const current = [...initial];
    let emptyIdx = total - 1;

    for (let i = 0; i < 200; i++) {
      const validMoves: number[] = [];
      const row = Math.floor(emptyIdx / gridSize);
      const col = emptyIdx % gridSize;

      if (row > 0) validMoves.push(emptyIdx - gridSize);
      if (row < gridSize - 1) validMoves.push(emptyIdx + gridSize);
      if (col > 0) validMoves.push(emptyIdx - 1);
      if (col < gridSize - 1) validMoves.push(emptyIdx + 1);

      const target = validMoves[Math.floor(Math.random() * validMoves.length)];
      [current[emptyIdx], current[target]] = [current[target], current[emptyIdx]];
      emptyIdx = target;
    }

    setBoard(current);
    setMoves(0);
    setIsWon(false);
  }, [gridSize]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Click to Slide Tile
  const handleTileClick = (index: number) => {
    if (isWon) return;

    const emptyIdx = board.indexOf(0);
    const tileRow = Math.floor(index / gridSize);
    const tileCol = index % gridSize;
    const emptyRow = Math.floor(emptyIdx / gridSize);
    const emptyCol = emptyIdx % gridSize;

    const isAdjacent =
      (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
      (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow);

    if (isAdjacent) {
      const nextBoard = [...board];
      [nextBoard[emptyIdx], nextBoard[index]] = [nextBoard[index], nextBoard[emptyIdx]];
      setBoard(nextBoard);
      setMoves((m) => m + 1);
      playAudioSynth("slide");

      // Check Win (1, 2, 3, ... 0)
      const solved = nextBoard.every((val, i) => (i === nextBoard.length - 1 ? val === 0 : val === i + 1));
      if (solved) {
        setIsWon(true);
        playAudioSynth("win");
      }
    }
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridSize(3)}
            type="button"
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              gridSize === 3 ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-border bg-surface text-muted"
            }`}
          >
            3x3 (Dễ)
          </button>
          <button
            onClick={() => setGridSize(4)}
            type="button"
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              gridSize === 4 ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-border bg-surface text-muted"
            }`}
          >
            4x4 (15-Puzzle)
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 sm:text-4xl">
          XẾP HÌNH TRƯỢT 15-PUZZLE 🧩
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Bấm ô cạnh ô trống để trượt các ô số về đúng thứ tự từ 1 đến {gridSize * gridSize - 1}!
        </p>
      </div>

      {/* Stage */}
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-muted">
          <span>KÍCH THƯỚC: {gridSize}x{gridSize}</span>
          <span className="text-amber-400">NƯỚC ĐI: {moves}</span>
        </div>

        {/* Sliding Grid */}
        <div
          className="grid gap-2 w-full aspect-square rounded-2xl bg-slate-900 p-3"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {board.map((val, idx) => (
            <motion.button
              key={idx}
              layout
              onClick={() => handleTileClick(idx)}
              disabled={val === 0}
              type="button"
              className={`flex items-center justify-center rounded-xl font-mono text-2xl font-extrabold shadow-md transition ${
                val === 0
                  ? "bg-transparent border-2 border-dashed border-slate-700/50 cursor-default opacity-20"
                  : "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 hover:scale-102 active:scale-95 shadow-amber-500/20"
              }`}
            >
              {val !== 0 && val}
            </motion.button>
          ))}
        </div>

        <button
          onClick={initBoard}
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Trộn lại ván mới 🎲
        </button>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {isWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-amber-400/40 bg-surface p-6 text-center shadow-2xl"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
                <Trophy size={36} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                BẠN ĐÃ GIẢI XONG! 🎉
              </h2>
              <p className="mt-2 text-sm text-muted font-mono">
                Số nước trượt hoàn thành: <span className="font-extrabold text-amber-400 text-lg">{moves}</span>
              </p>

              <button
                onClick={initBoard}
                type="button"
                className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
              >
                Chơi lại ván mới 🎲
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
