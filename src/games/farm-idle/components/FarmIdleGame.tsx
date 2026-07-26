"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Coins, Sprout, Droplets, ShoppingBag } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

interface CropPlot {
  id: number;
  cropName: string;
  icon: string;
  growTime: number; // in seconds
  progress: number;
  ready: boolean;
  yieldValue: number;
  watered: boolean;
}

function playAudioSynth(type: "water" | "harvest") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "water") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore audio errors
  }
}

export function FarmIdleGame() {
  const [coins, setCoins] = useState<number>(100);
  const [plots, setPlots] = useState<CropPlot[]>([
    { id: 1, cropName: "Cà chua", icon: "🍅", growTime: 5, progress: 0, ready: false, yieldValue: 25, watered: true },
    { id: 2, cropName: "Dưa hấu", icon: "🍉", growTime: 8, progress: 0, ready: false, yieldValue: 50, watered: true },
    { id: 3, cropName: "Bắp ngô", icon: "🌽", growTime: 10, progress: 0, ready: false, yieldValue: 75, watered: true },
    { id: 4, cropName: "Dâu tây", icon: "🍓", growTime: 12, progress: 0, ready: false, yieldValue: 100, watered: true },
  ]);

  // Crop growth tick loop
  useEffect(() => {
    const timer = setInterval(() => {
      setPlots((prevPlots) =>
        prevPlots.map((plot) => {
          if (plot.ready || !plot.watered) return plot;
          const nextProg = plot.progress + 1;
          if (nextProg >= plot.growTime) {
            return { ...plot, progress: plot.growTime, ready: true };
          }
          return { ...plot, progress: nextProg };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Harvest Crop
  const harvest = (id: number) => {
    const plot = plots.find((p) => p.id === id);
    if (!plot || !plot.ready) return;

    playAudioSynth("harvest");
    setCoins((c) => c + plot.yieldValue);

    setPlots((prevPlots) =>
      prevPlots.map((p) => (p.id === id ? { ...p, progress: 0, ready: false, watered: false } : p))
    );
  };

  // Water Crop
  const waterCrop = (id: number) => {
    const plot = plots.find((p) => p.id === id);
    if (!plot || plot.watered) return;

    playAudioSynth("water");
    setPlots((prevPlots) => prevPlots.map((p) => (p.id === id ? { ...p, watered: true } : p)));
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Coins size={18} className="text-amber-400" />
          <span className="text-muted">Tiền Nông Nại:</span>
          <span className="font-bold text-amber-400 text-lg">${coins}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-emerald-800 sm:text-4xl">
          NÔNG TRẠI FARM IDLE TYCOON 🌾
        </h1>
        <p className="mt-1 text-xs text-emerald-700 font-mono">
          Thể loại Mô Phỏng Quản Lý / Idle — tưới nước, thu hoạch nông sản và làm giàu!
        </p>
      </div>

      {/* Farm Grid Stage */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-4 rounded-3xl border-4 border-amber-800 bg-emerald-950 p-6 shadow-2xl">
        {plots.map((plot) => (
          <div
            key={plot.id}
            className="flex flex-col items-center justify-between rounded-2xl border-2 border-emerald-700 bg-amber-900/60 p-4 text-center shadow-md min-h-[180px]"
          >
            <div className="flex w-full justify-between items-center font-mono text-xs text-amber-200">
              <span>{plot.cropName}</span>
              <span className="text-amber-400 font-bold font-mono">+${plot.yieldValue}</span>
            </div>

            <div className="text-5xl my-2 animate-bounce">{plot.icon}</div>

            {/* Growth Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${(plot.progress / plot.growTime) * 100}%` }}
              />
            </div>

            {/* Actions */}
            {plot.ready ? (
              <button
                onClick={() => harvest(plot.id)}
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2 font-bold text-slate-950 hover:bg-amber-300 active:scale-95 shadow-md"
              >
                <ShoppingBag size={16} /> Thu hoạch nông sản 🌾
              </button>
            ) : !plot.watered ? (
              <button
                onClick={() => waterCrop(plot.id)}
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2 font-bold text-white hover:bg-sky-400 active:scale-95 shadow-md"
              >
                <Droplets size={16} /> Tưới nước cho cây 💧
              </button>
            ) : (
              <span className="mt-3 text-xs font-mono text-emerald-300">Đang lớn ({plot.growTime - plot.progress}s)...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
