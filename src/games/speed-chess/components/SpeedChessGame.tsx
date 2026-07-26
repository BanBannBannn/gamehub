"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Clock, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const INITIAL_TIME = 180; // 3 minutes per player

function playAudioSynth(type: "move" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "move") {
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

export function SpeedChessGame() {
  const [p1Time, setP1Time] = useState<number>(INITIAL_TIME);
  const [p2Time, setP2Time] = useState<number>(INITIAL_TIME);
  const [activeTurn, setActiveTurn] = useState<"P1" | "P2">("P1");
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || winner) return;

    const timer = setInterval(() => {
      if (activeTurn === "P1") {
        setP1Time((t) => {
          if (t <= 1) {
            setWinner("Bot AI thắng (Hết giờ)");
            return 0;
          }
          return t - 1;
        });
      } else {
        setP2Time((t) => {
          if (t <= 1) {
            setWinner("Bạn thắng (Hết giờ)");
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTurn, isStarted, winner]);

  const resetGame = () => {
    setP1Time(INITIAL_TIME);
    setP2Time(INITIAL_TIME);
    setActiveTurn("P1");
    setIsStarted(false);
    setWinner(null);
  };

  const makeMove = () => {
    if (!isStarted) setIsStarted(true);
    if (winner) return;

    playAudioSynth("move");
    const nextTurn = activeTurn === "P1" ? "P2" : "P1";
    setActiveTurn(nextTurn);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Zap size={16} className="text-amber-400" />
          <span className="text-muted">Tốc độ:</span>
          <span className="font-bold text-amber-400">3 Phút Blitz</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 sm:text-4xl">
          CỜ VUA TỐC ĐỘ SPEED CHESS ♔
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Đồng hồ đếm ngược 3 phút — bấm đổi lượt sau mỗi nước đi cờ!
        </p>
      </div>

      {/* Speed Clock Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-amber-500/40 bg-slate-950 p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        {/* Opponent Clock (Top) */}
        <div className="flex w-full justify-between items-center rounded-2xl bg-slate-900 p-4 border border-slate-800">
          <span className="font-mono text-sm font-bold text-slate-300">🔵 BOT AI (ĐỐI THỦ)</span>
          <span className={`font-mono text-2xl font-extrabold ${activeTurn === "P2" ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
            {formatTime(p2Time)}
          </span>
        </div>

        {/* Action Button Stage */}
        <button
          onClick={makeMove}
          disabled={!!winner}
          type="button"
          className={`h-40 w-full rounded-2xl border-4 font-mono text-2xl font-extrabold shadow-xl transition active:scale-95 flex flex-col items-center justify-center gap-2 ${
            activeTurn === "P1"
              ? "border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/30"
              : "border-slate-700 bg-slate-900 text-slate-400"
          }`}
        >
          {activeTurn === "P1" ? "BẤM ĐỂ ĐỔI LƯỢT ĐẦU CỜ ♔" : "ĐỢI BOT AI ĐI CỜ..."}
        </button>

        {/* Player Clock (Bottom) */}
        <div className="flex w-full justify-between items-center rounded-2xl bg-slate-900 p-4 border border-slate-800">
          <span className="font-mono text-sm font-bold text-amber-400">🔴 BẠN (QUÂN TRẮNG)</span>
          <span className={`font-mono text-2xl font-extrabold ${activeTurn === "P1" ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
            {formatTime(p1Time)}
          </span>
        </div>

        {winner && (
          <div className="font-mono text-lg font-extrabold text-amber-400">
            {winner}
          </div>
        )}

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white transition hover:bg-slate-700 active:scale-95 border border-slate-700"
        >
          <RotateCcw size={18} /> Đặt lại ván mới ♔
        </button>
      </div>
    </div>
  );
}
