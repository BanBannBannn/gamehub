"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Pencil, Bot, User } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

type CellValue = "X" | "O" | null;

function playAudioSynth(type: "pencil" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "pencil") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
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
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors
  }
}

export function PaperTicTacToeGame() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [useBot, setUseBot] = useState<boolean>(true);
  const [winner, setWinner] = useState<CellValue | "draw" | null>(null);
  const [xWins, setXWins] = useState<number>(0);
  const [oWins, setOWins] = useState<number>(0);

  const checkWinner = (b: CellValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6],           // Diagonals
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    if (b.every((cell) => cell !== null)) return "draw";
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);
    playAudioSynth("pencil");

    const winResult = checkWinner(nextBoard);
    if (winResult) {
      setWinner(winResult);
      playAudioSynth("win");
      if (winResult === "X") setXWins((w) => w + 1);
      if (winResult === "O") setOWins((w) => w + 1);
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "O" || !useBot || winner) return;

    const timer = setTimeout(() => {
      const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
      if (emptyIndices.length === 0) return;

      const chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const nextBoard = [...board];
      nextBoard[chosen] = "O";
      setBoard(nextBoard);
      playAudioSynth("pencil");

      const winResult = checkWinner(nextBoard);
      if (winResult) {
        setWinner(winResult);
        playAudioSynth("win");
        if (winResult === "O") setOWins((w) => w + 1);
      } else {
        setTurn("X");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [board, turn, useBot, winner]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setWinner(null);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseBot(true)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              useBot ? "border-blue-600 bg-blue-100 text-blue-800" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <Bot size={14} /> Đấu Bot AI
          </button>
          <button
            onClick={() => setUseBot(false)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              !useBot ? "border-blue-600 bg-blue-100 text-blue-800" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <User size={14} /> 2 Người
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-slate-800 sm:text-4xl">
          CARO GIẤY TẬP SỔ TAY 📝
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-mono">
          Giao diện Giấy kẻ ngang nét chì ấm áp phong cách học sinh vintage!
        </p>
      </div>

      {/* Notebook Paper Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-slate-300 bg-[#fcf8f0] p-6 shadow-xl relative overflow-hidden">
        {/* Notebook Ruled Lines Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:100%_28px] opacity-15 pointer-events-none" />

        {/* Score Board */}
        <div className="flex w-full justify-between font-mono text-sm font-bold text-slate-800 relative z-10">
          <span className="text-blue-700">❌ Nét Xanh: {xWins}</span>
          <span className="text-rose-700">⭕ Nét Đỏ: {oWins}</span>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 w-full aspect-square rounded-2xl border-2 border-slate-400 bg-amber-50/60 p-3 relative z-10">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={cell !== null || (turn === "O" && useBot)}
              type="button"
              className="flex items-center justify-center rounded-xl border border-slate-300 bg-white font-mono text-4xl font-extrabold shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              {cell === "X" && <span className="text-blue-600 font-serif">X</span>}
              {cell === "O" && <span className="text-rose-600 font-serif">O</span>}
            </button>
          ))}
        </div>

        {/* Result Message */}
        {winner && (
          <div className="font-mono text-base font-extrabold text-slate-900 relative z-10">
            {winner === "draw" ? "HÒA NHAU NHA! ✏️" : winner === "X" ? "NÉT XANH (X) THẮNG! 🎉" : "NÉT ĐỎ (O) THẮNG! 🎉"}
          </div>
        )}

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white transition hover:bg-slate-700 active:scale-95 shadow-md relative z-10"
        >
          <RotateCcw size={18} /> Vẽ ván mới ✏️
        </button>
      </div>
    </div>
  );
}
