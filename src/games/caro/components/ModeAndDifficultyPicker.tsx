"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Difficulty, GameMode } from "@/games/caro/engine";
import { Bot, Users } from "lucide-react";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Dễ", desc: "Máy đánh khá ngẫu nhiên, phù hợp người mới" },
  { value: "medium", label: "Trung bình", desc: "Máy biết tấn công và chặn cơ bản" },
  { value: "hard", label: "Khó", desc: "Máy tính toán vài nước trước, khó thắng" },
];

export function ModeAndDifficultyPicker({
  onStart,
}: {
  onStart: (mode: GameMode, difficulty: Difficulty) => void;
}) {
  const [mode, setMode] = useState<GameMode | null>(null);

  if (mode === null) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-paper-100">Caro</h1>
          <p className="mt-2 text-sm text-ink-400">Chọn cách bạn muốn chơi.</p>
        </div>
        <div className="grid w-full gap-3">
          <motion.button
            type="button"
            onClick={() => setMode("ai")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4 text-left transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              <Bot size={22} />
            </span>
            <span>
              <p className="font-display text-lg font-semibold text-paper-100 group-hover:text-amber-400">
                Chơi với máy
              </p>
              <p className="text-sm text-ink-400">Chọn độ khó cho đối thủ AI</p>
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onStart("hotseat", "medium")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4 text-left transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/15 text-teal-400">
              <Users size={22} />
            </span>
            <span>
              <p className="font-display text-lg font-semibold text-paper-100 group-hover:text-amber-400">
                2 người chơi
              </p>
              <p className="text-sm text-ink-400">Rủ bạn chơi cùng trên máy này</p>
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-paper-100">Chọn độ khó</h1>
        <p className="mt-2 text-sm text-ink-400">Bạn sẽ đi quân X, máy đi quân O.</p>
      </div>
      <div className="grid w-full gap-3">
        {DIFFICULTY_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onStart("ai", opt.value)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-xl border border-ink-700 bg-ink-800/60 p-4 text-left transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
          >
            <p className="font-display text-lg font-semibold text-paper-100 group-hover:text-amber-400">
              {opt.label}
            </p>
            <p className="text-sm text-ink-400">{opt.desc}</p>
          </motion.button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setMode(null)}
        className="text-sm text-ink-400 hover:text-paper-100"
      >
        ← Quay lại chọn chế độ
      </button>
    </div>
  );
}
