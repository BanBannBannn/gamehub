"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Bot, User } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

type Disc = "B" | "W" | null;
const BOARD_SIZE = 8;

function playAudioSynth(type: "flip" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "flip") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
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
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function ReversiClassicGame() {
  const [board, setBoard] = useState<Disc[][]>(() => {
    const b: Disc[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    b[3][3] = "W";
    b[3][4] = "B";
    b[4][3] = "B";
    b[4][4] = "W";
    return b;
  });

  const [turn, setTurn] = useState<"B" | "W">("B");
  const [useBot, setUseBot] = useState<boolean>(true);
  const [bCount, setBCount] = useState<number>(2);
  const [wCount, setWCount] = useState<number>(2);
  const [winner, setWinner] = useState<"B" | "W" | "draw" | null>(null);

  const resetGame = useCallback(() => {
    const b: Disc[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    b[3][3] = "W";
    b[3][4] = "B";
    b[4][3] = "B";
    b[4][4] = "W";
    setBoard(b);
    setTurn("B");
    setBCount(2);
    setWCount(2);
    setWinner(null);
  }, []);

  // Find flippable discs in 8 directions
  const getFlippable = (b: Disc[][], r: number, c: number, player: "B" | "W") => {
    if (b[r][c] !== null) return [];
    const opponent = player === "B" ? "W" : "B";
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    let totalFlippable: { r: number; c: number }[] = [];

    directions.forEach(([dr, dc]) => {
      let cr = r + dr;
      let cc = c + dc;
      const currentPath: { r: number; c: number }[] = [];

      while (cr >= 0 && cr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE && b[cr][cc] === opponent) {
        currentPath.push({ r: cr, c: cc });
        cr += dr;
        cc += dc;
      }

      if (cr >= 0 && cr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE && b[cr][cc] === player && currentPath.length > 0) {
        totalFlippable.push(...currentPath);
      }
    });

    return totalFlippable;
  };

  const makeMove = (r: number, c: number) => {
    if (winner) return;

    const flippable = getFlippable(board, r, c, turn);
    if (flippable.length === 0) return;

    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = turn;
    flippable.forEach((pt) => {
      nextBoard[pt.r][pt.c] = turn;
    });

    setBoard(nextBoard);
    playAudioSynth("flip");

    const bTotal = nextBoard.flat().filter((cell) => cell === "B").length;
    const wTotal = nextBoard.flat().filter((cell) => cell === "W").length;
    setBCount(bTotal);
    setWCount(wTotal);

    const nextTurn = turn === "B" ? "W" : "B";

    // Check if next turn has valid moves
    let hasValidMove = false;
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (getFlippable(nextBoard, i, j, nextTurn).length > 0) hasValidMove = true;
      }
    }

    if (hasValidMove) {
      setTurn(nextTurn);
    } else {
      // Game Over
      if (bTotal > wTotal) setWinner("B");
      else if (wTotal > bTotal) setWinner("W");
      else setWinner("draw");
      playAudioSynth("win");
    }
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "W" || !useBot || winner) return;

    const timer = setTimeout(() => {
      const validMoves: { r: number; c: number; count: number }[] = [];

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const flips = getFlippable(board, r, c, "W");
          if (flips.length > 0) validMoves.push({ r, c, count: flips.length });
        }
      }

      if (validMoves.length === 0) return;
      // Pick move with maximum flips
      validMoves.sort((a, b) => b.count - a.count);
      const choice = validMoves[0];
      makeMove(choice.r, choice.c);
    }, 700);

    return () => clearTimeout(timer);
  }, [board, turn, useBot, winner]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseBot(true)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              useBot ? "border-amber-400 bg-amber-900/40 text-amber-300" : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
          >
            <Bot size={14} /> Đấu Bot AI
          </button>
          <button
            onClick={() => setUseBot(false)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              !useBot ? "border-amber-400 bg-amber-900/40 text-amber-300" : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
          >
            <User size={14} /> 2 Người
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-amber-300 sm:text-4xl">
          CỜ LẬP REVERSI DELUXE ⚪⬛
        </h1>
        <p className="mt-1 text-xs text-slate-300 font-mono">
          Bàn cờ Gỗ mộc thảm xanh rêu — kẹp quân đối phương giữa 2 quân của mình để lật màu!
        </p>
      </div>

      {/* Deluxe Wooden Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-amber-800 bg-emerald-950 p-6 shadow-2xl">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-slate-200">
          <span className="flex items-center gap-2">
            ⬛ Quân Đen ({turn === "B" ? "Lượt bạn" : "Đợi"}): <span className="text-amber-400 font-extrabold text-base">{bCount}</span>
          </span>
          <span className="flex items-center gap-2">
            ⚪ Quân Trắng ({turn === "W" ? (useBot ? "Bot..." : "Lượt 2") : "Đợi"}): <span className="text-amber-400 font-extrabold text-base">{wCount}</span>
          </span>
        </div>

        {/* 8x8 Board Grid */}
        <div className="grid grid-cols-8 gap-1.5 w-full aspect-square max-w-md rounded-2xl border-2 border-emerald-700 bg-emerald-900 p-2.5 shadow-inner">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isValid = getFlippable(board, r, c, turn).length > 0 && (!useBot || turn === "B");
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => makeMove(r, c)}
                  disabled={!isValid}
                  type="button"
                  className="relative flex items-center justify-center rounded-lg border border-emerald-800 bg-emerald-950/60 transition hover:bg-emerald-800/40"
                >
                  {isValid && <div className="h-3 w-3 rounded-full bg-amber-400/50 animate-pulse" />}
                  {cell !== null && (
                    <motion.div
                      initial={{ scale: 0.5, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      className={`h-7 w-7 rounded-full shadow-md ${
                        cell === "B" ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-300"
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {winner && (
          <div className="font-mono text-base font-extrabold text-amber-400">
            {winner === "draw" ? "HÒA NHAU! 🤝" : winner === "B" ? "QUÂN ĐEN THẮNG CUỘC! 🎉" : "QUÂN TRẮNG THẮNG CUỘC! 🎉"}
          </div>
        )}

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-bold text-amber-100 transition hover:bg-amber-500 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Chơi ván mới ⚪⬛
        </button>
      </div>
    </div>
  );
}
