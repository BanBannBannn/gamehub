"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Bot, User } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRID_SIZE = 15;
type Piece = "B" | "W" | null;

function playAudioSynth(type: "place" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "place") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
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

export function GomokuProGame() {
  const [board, setBoard] = useState<Piece[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  );
  const [turn, setTurn] = useState<"B" | "W">("B");
  const [useBot, setUseBot] = useState<boolean>(true);
  const [winner, setWinner] = useState<"B" | "W" | null>(null);

  const resetGame = useCallback(() => {
    setBoard(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setTurn("B");
    setWinner(null);
  }, []);

  // Check 5 in a row
  const checkWin = (b: Piece[][], r: number, c: number, p: "B" | "W") => {
    const dirs = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Main Diagonal
      [1, -1], // Anti Diagonal
    ];

    for (const [dr, dc] of dirs) {
      let count = 1;

      // Positive dir
      let cr = r + dr;
      let cc = c + dc;
      while (cr >= 0 && cr < GRID_SIZE && cc >= 0 && cc < GRID_SIZE && b[cr][cc] === p) {
        count++;
        cr += dr;
        cc += dc;
      }

      // Negative dir
      cr = r - dr;
      cc = c - dc;
      while (cr >= 0 && cr < GRID_SIZE && cc >= 0 && cc < GRID_SIZE && b[cr][cc] === p) {
        count++;
        cr -= dr;
        cc -= dc;
      }

      if (count >= 5) return true;
    }
    return false;
  };

  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] || winner || (turn === "W" && useBot)) return;

    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = turn;
    setBoard(nextBoard);
    playAudioSynth("place");

    if (checkWin(nextBoard, r, c, turn)) {
      setWinner(turn);
      playAudioSynth("win");
    } else {
      setTurn(turn === "B" ? "W" : "B");
    }
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "W" || !useBot || winner) return;

    const timer = setTimeout(() => {
      const emptyCells: { r: number; c: number }[] = [];
      board.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (!cell) emptyCells.push({ r, c });
        });
      });

      if (emptyCells.length === 0) return;
      const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];

      const nextBoard = board.map((row) => [...row]);
      nextBoard[chosen.r][chosen.c] = "W";
      setBoard(nextBoard);
      playAudioSynth("place");

      if (checkWin(nextBoard, chosen.r, chosen.c, "W")) {
        setWinner("W");
        playAudioSynth("win");
      } else {
        setTurn("B");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [board, turn, useBot, winner]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseBot(true)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              useBot ? "border-amber-600 bg-amber-900/40 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-500"
            }`}
          >
            <Bot size={14} /> Đấu Bot AI
          </button>
          <button
            onClick={() => setUseBot(false)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              !useBot ? "border-amber-600 bg-amber-900/40 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-500"
            }`}
          >
            <User size={14} /> 2 Người
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-amber-300 sm:text-4xl">
          CARO 15 HÀNG GOMOKU PRO 🌾
        </h1>
        <p className="mt-1 text-xs text-amber-200/70 font-mono">
          Bàn cờ Gỗ Nhật Bản 15x15 — nối 5 quân cờ liên tiếp để dành chiến thắng!
        </p>
      </div>

      {/* 15x15 Wooden Board Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-amber-800 bg-gradient-to-b from-amber-950 to-amber-900 p-6 shadow-2xl overflow-x-auto">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-amber-200 min-w-[320px]">
          <span>⬛ Quân Đen: {turn === "B" ? "Lượt bạn" : "Đợi"}</span>
          <span>⚪ Quân Trắng: {turn === "W" ? (useBot ? "Bot..." : "Lượt 2") : "Đợi"}</span>
        </div>

        {/* 15x15 Grid */}
        <div className="grid grid-cols-15 gap-0.5 rounded-2xl border-2 border-amber-800 bg-amber-200 p-2 shadow-inner min-w-[420px]">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={cell !== null || (turn === "W" && useBot)}
                type="button"
                className="flex h-7 w-7 items-center justify-center border border-amber-400/30 transition hover:bg-amber-300/50"
              >
                {cell === "B" && <div className="h-5 w-5 rounded-full bg-slate-950 border border-slate-700 shadow-md" />}
                {cell === "W" && <div className="h-5 w-5 rounded-full bg-white border border-slate-300 shadow-md" />}
              </button>
            ))
          )}
        </div>

        {winner && (
          <div className="font-mono text-base font-extrabold text-amber-300">
            {winner === "B" ? "QUÂN ĐEN THẮNG CUỘC! 🎉" : "QUÂN TRẮNG THẮNG CUỘC! 🎉"}
          </div>
        )}

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-bold text-amber-100 transition hover:bg-amber-500 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Đánh ván mới 🌾
        </button>
      </div>
    </div>
  );
}
