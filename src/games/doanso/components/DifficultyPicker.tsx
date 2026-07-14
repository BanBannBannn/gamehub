"use client";

import { motion } from "framer-motion";
import { Difficulty, DIFFICULTY_LENGTH, DIFFICULTY_REFERENCE_TURNS } from "@/games/doanso/engine";

const OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Dễ", desc: `${DIFFICULTY_LENGTH.easy} chữ số — tham khảo ~${DIFFICULTY_REFERENCE_TURNS.easy} lượt` },
  { value: "medium", label: "Trung bình", desc: `${DIFFICULTY_LENGTH.medium} chữ số — tham khảo ~${DIFFICULTY_REFERENCE_TURNS.medium} lượt` },
  { value: "hard", label: "Khó", desc: `${DIFFICULTY_LENGTH.hard} chữ số — tham khảo ~${DIFFICULTY_REFERENCE_TURNS.hard} lượt` },
];

export function DifficultyPicker({ onPick }: { onPick: (d: Difficulty) => void }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-paper-100">Đoán số</h1>
        <p className="mt-2 text-sm text-ink-400">
          Hệ thống chọn 1 dãy số bí mật, các chữ số khác nhau đôi một. Bạn cần suy luận để tìm ra
          trong ít lượt nhất.
        </p>
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
            className="group rounded-xl border border-ink-700 bg-ink-800/60 p-4 text-left transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
          >
            <p className="font-display text-lg font-semibold text-paper-100 group-hover:text-amber-400">
              {opt.label}
            </p>
            <p className="text-sm text-ink-400">{opt.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
