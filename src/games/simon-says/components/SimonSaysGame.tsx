"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Play, Music } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const BUTTONS = [
  { id: 0, color: "bg-rose-500", activeColor: "bg-rose-300 shadow-[0_0_30px_#f43f5e]", freq: 261.63 }, // C4
  { id: 1, color: "bg-emerald-500", activeColor: "bg-emerald-300 shadow-[0_0_30px_#10b981]", freq: 329.63 }, // E4
  { id: 2, color: "bg-sky-500", activeColor: "bg-sky-300 shadow-[0_0_30px_#0284c7]", freq: 392.00 }, // G4
  { id: 3, color: "bg-amber-400", activeColor: "bg-amber-200 shadow-[0_0_30px_#facc15]", freq: 523.25 }, // C5
];

function playNote(freq: number) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function SimonSaysGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "failed">("idle");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_simon_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Play Sequence
  const playSequence = useCallback((seq: number[]) => {
    setIsPlayingSeq(true);
    let i = 0;

    const interval = setInterval(() => {
      const btnId = seq[i];
      setActiveBtn(btnId);
      playNote(BUTTONS[btnId].freq);

      setTimeout(() => {
        setActiveBtn(null);
      }, 400);

      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setIsPlayingSeq(false), 500);
      }
    }, 700);
  }, []);

  // Start New Round
  const startNextRound = useCallback((currentSeq: number[]) => {
    const nextBtn = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextBtn];
    setSequence(newSeq);
    setUserStep(0);
    playSequence(newSeq);
  }, [playSequence]);

  // Start Game
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    startNextRound([]);
  };

  // Handle User Click
  const handleButtonClick = (btnId: number) => {
    if (isPlayingSeq || gameState !== "playing") return;

    setActiveBtn(btnId);
    playNote(BUTTONS[btnId].freq);
    setTimeout(() => setActiveBtn(null), 250);

    if (btnId === sequence[userStep]) {
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === sequence.length) {
        const nextScore = score + 1;
        setScore(nextScore);
        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem("gamehub_simon_highscore", nextScore.toString());
        }

        setTimeout(() => {
          startNextRound(sequence);
        }, 800);
      }
    } else {
      // Wrong Sequence
      setGameState("failed");
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
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
        <h1 className="font-display text-3xl font-extrabold text-slate-800 sm:text-4xl">
          GHI NHỚ GIAI ĐIỆU SIMON SAYS 🎵
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-mono">
          Lắng nghe và bấm lại đúng chuỗi nốt nhạc & màu sắc đang phát!
        </p>
      </div>

      {/* Vintage Retro Console Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-slate-300">
          <span>CẤP ĐỘ: <span className="text-amber-400 font-extrabold text-base">{score}</span></span>
          <span className={isPlayingSeq ? "text-amber-400 animate-pulse" : "text-emerald-400"}>
            {isPlayingSeq ? "ĐANG PHÁT CHUỖI 🎵" : "LƯỢT BẠN BẤM 👆"}
          </span>
        </div>

        {/* 4 Simon Color Buttons Console Layout */}
        <div className="grid grid-cols-2 gap-4 w-full aspect-square max-w-[280px] rounded-full border-4 border-slate-800 bg-slate-950 p-4 shadow-inner">
          {BUTTONS.map((btn) => (
            <motion.button
              key={btn.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleButtonClick(btn.id)}
              disabled={isPlayingSeq || gameState !== "playing"}
              type="button"
              className={`rounded-2xl transition duration-150 shadow-lg ${
                activeBtn === btn.id ? btn.activeColor : `${btn.color} opacity-80 hover:opacity-100`
              }`}
            />
          ))}
        </div>

        {gameState === "idle" && (
          <button
            onClick={startGame}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-lg"
          >
            <Play size={18} /> Bắt đầu ghi nhớ 🎵
          </button>
        )}

        {gameState === "failed" && (
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-sm font-bold text-rose-400">BẤM SAI NỐT! GAME OVER</span>
            <button
              onClick={startGame}
              type="button"
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-bold text-white transition hover:bg-rose-400 active:scale-95 shadow-lg"
            >
              <RotateCcw size={18} /> Thử lại ván mới 🎵
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
