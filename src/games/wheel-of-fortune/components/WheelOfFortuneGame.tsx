"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, DollarSign, Disc } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const PRIZES = [100, 200, 500, 1000, 2000, 5000, 10000, 0];
const SLICE_ANGLE = (Math.PI * 2) / PRIZES.length;

function playAudioSynth(type: "tick" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "tick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
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

export function WheelOfFortuneGame() {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [totalPrize, setTotalPrize] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const extraSpins = 5 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const newRotation = rotation + extraSpins + randomAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const actualAngle = (360 - (newRotation % 360)) % 360;
      const prizeIdx = Math.floor(actualAngle / (360 / PRIZES.length));
      const prize = PRIZES[prizeIdx];

      setLastWin(prize);
      setTotalPrize((p) => p + prize);
      playAudioSynth("win");
    }, 3500);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <DollarSign size={18} className="text-amber-400" />
          <span className="text-muted">Tổng Thưởng:</span>
          <span className="font-bold text-amber-400 text-lg">${totalPrize}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 sm:text-4xl">
          VÒNG QUAY MAY MẮN WHEEL OF FORTUNE 🎡
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Thể loại Party / May Mắn — quay vòng bánh xe rinh tiền thưởng cực lớn!
        </p>
      </div>

      {/* Wheel Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-amber-500/40 bg-slate-950 p-6 shadow-xl relative">
        {/* Pointer */}
        <div className="z-20 text-3xl text-amber-400 animate-bounce -mb-4">
          🔻
        </div>

        {/* Wheel Disk */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3.5, ease: "easeOut" }}
          className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-400 font-mono text-xl font-extrabold text-white shadow-2xl relative overflow-hidden"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300 bg-slate-950 text-amber-400 shadow-inner z-10">
            <Disc size={36} className={isSpinning ? "animate-spin" : ""} />
          </div>
        </motion.div>

        {lastWin !== null && !isSpinning && (
          <div className="font-mono text-base font-extrabold text-amber-400">
            {lastWin > 0 ? `BẠN QUAY TRÚNG THƯỞNG +$${lastWin}! 🎉` : "QUAY VÀO Ô 0Đ 💸"}
          </div>
        )}

        <button
          onClick={spinWheel}
          disabled={isSpinning}
          type="button"
          className="w-full max-w-xs rounded-xl bg-amber-400 py-3 font-bold text-slate-950 hover:bg-amber-300 active:scale-95 shadow-md"
        >
          {isSpinning ? "Đang quay may mắn..." : "Quay vòng quay 🎡"}
        </button>
      </div>
    </div>
  );
}
