"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSudokuStore } from "@/games/sudoku/store";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const CONFETTI_COLORS = ["#f2b84b", "#4fd1c5", "#e8615c", "#f6f3ea"];

export function WinModal({ onPlayAgain }: { onPlayAgain: () => void }) {
  const isComplete = useSudokuStore((s) => s.isComplete);
  const elapsedSeconds = useSudokuStore((s) => s.elapsedSeconds);
  const hintsUsed = useSudokuStore((s) => s.hintsUsed);
  const difficulty = useSudokuStore((s) => s.difficulty);

  return (
    <AnimatePresence>
      {isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute top-0 h-2 w-2 rounded-sm"
                style={{
                  left: `${(i * 37) % 100}%`,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: "110vh", opacity: 0, rotate: 360 }}
                transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 8) * 0.1, ease: "easeIn" }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="relative w-full max-w-sm rounded-2xl bg-surface-hover p-6 text-center shadow-2xl"
          >
            <p className="text-4xl">🎉</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Hoàn thành!</h2>
            <p className="mt-1 text-sm text-muted">Độ khó: {difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung bình" : "Khó"}</p>

            <div className="mt-4 flex justify-center gap-6 font-mono">
              <div>
                <p className="text-xs text-muted">Thời gian</p>
                <p className="text-lg text-foreground">{formatTime(elapsedSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Số hint</p>
                <p className="text-lg text-foreground">{hintsUsed}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onPlayAgain}
              className="mt-6 w-full rounded-lg bg-amber-400 py-2.5 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
            >
              Chơi ván mới
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
