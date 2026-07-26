"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIdx: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Thành phố nào là thủ đô của Việt Nam?",
    options: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"],
    correctIdx: 1,
  },
  {
    id: 2,
    question: "Đỉnh núi nào cao nhất Việt Nam?",
    options: ["Fansipan", "Mẫu Sơn", "Bạch Mã", "Langbiang"],
    correctIdx: 0,
  },
  {
    id: 3,
    question: "Hành tinh nào gần Mặt Trời nhất?",
    options: ["Sao Hỏa", "Sao Kim", "Sao Thủy", "Sao Trái Đất"],
    correctIdx: 2,
  },
  {
    id: 4,
    question: "Ai là người phát minh ra bóng đèn dây tóc thương mại?",
    options: ["Nikola Tesla", "Thomas Edison", "Albert Einstein", "Isaac Newton"],
    correctIdx: 1,
  },
];

function playAudioSynth(type: "correct" | "wrong") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "correct") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors
  }
}

export function TriviaQuizGame() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const q = QUESTIONS[currentIdx];
    if (idx === q.correctIdx) {
      playAudioSynth("correct");
      setScore((s) => s + 100);
    } else {
      playAudioSynth("wrong");
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((c) => c + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsEnded(true);
    }
  };

  const resetGame = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setIsEnded(false);
  };

  const q = QUESTIONS[currentIdx];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-muted">Tổng Điểm:</span>
          <span className="font-bold text-amber-400 text-lg">{score}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 sm:text-4xl">
          ĐỐ VUI KẾT NỐI TRÍ TUỆ 🧠
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Thể loại Đố Vui & Giáo Dục — thử thách vốn hiểu biết địa lý, lịch sử và khoa học!
        </p>
      </div>

      {/* Quiz Card Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-sky-500/40 bg-slate-950 p-6 shadow-xl relative">
        {!isEnded ? (
          <>
            <div className="flex w-full justify-between font-mono text-xs font-bold text-sky-400">
              <span>CÂU HỎI {currentIdx + 1} / {QUESTIONS.length}</span>
            </div>

            <h2 className="font-display text-xl font-bold text-white text-center">
              {q.question}
            </h2>

            <div className="grid w-full grid-cols-1 gap-3">
              {q.options.map((opt, idx) => {
                let btnStyle = "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800";
                if (isAnswered) {
                  if (idx === q.correctIdx) btnStyle = "border-emerald-500 bg-emerald-950 text-emerald-300 font-bold";
                  else if (idx === selectedOpt) btnStyle = "border-rose-500 bg-rose-950 text-rose-300";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    type="button"
                    className={`flex items-center justify-between rounded-xl border-2 p-4 font-mono text-sm font-semibold transition active:scale-98 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === q.correctIdx && <CheckCircle2 size={18} className="text-emerald-400" />}
                    {isAnswered && idx === selectedOpt && idx !== q.correctIdx && <XCircle size={18} className="text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <button
                onClick={handleNextQuestion}
                type="button"
                className="mt-2 w-full rounded-xl bg-sky-400 py-3 font-bold text-slate-950 hover:bg-sky-300 active:scale-95 shadow-md"
              >
                Câu hỏi tiếp theo ➡️
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <Trophy size={48} className="text-amber-400" />
            <h2 className="font-display text-2xl font-bold text-white">HOÀN THÀNH BÀI ĐỐ VUI! 🎉</h2>
            <p className="font-mono text-sm text-slate-300">
              Tổng điểm trí tuệ: <span className="font-bold text-amber-400 text-xl">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-4 rounded-xl bg-sky-400 px-6 py-3 font-bold text-slate-950 hover:bg-sky-300 active:scale-95 shadow-md"
            >
              Chơi lại đợt đố mới 🧠
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
