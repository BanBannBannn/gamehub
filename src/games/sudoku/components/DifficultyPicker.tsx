"use client";

import { Difficulty } from "@/games/sudoku/engine";
import { motion } from "framer-motion";

const OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Dễ", desc: "Phù hợp người mới, nhiều ô gợi ý sẵn" },
  { value: "medium", label: "Trung bình", desc: "Cần suy luận nhiều bước hơn" },
  { value: "hard", label: "Khó", desc: "Thử thách thực sự, ít ô cho sẵn" },
];

export function DifficultyPicker({ onPick }: { onPick: (d: Difficulty) => void }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Sudoku</h1>
        <p className="mt-2 text-sm text-muted">Chọn độ khó để bắt đầu ván chơi mới.</p>
      </div>
      <div className="grid w-full gap-3">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-xl border border-border-hover bg-surface-hover/60 p-4 text-left transition hover:border-amber-400 hover:bg-surface-hover active:scale-[0.98]"
          >
            <p className="font-display text-lg font-semibold text-foreground group-hover:text-amber-400">
              {opt.label}
            </p>
            <p className="text-sm text-muted">{opt.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
