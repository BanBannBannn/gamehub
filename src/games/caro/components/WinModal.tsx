"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCaroStore } from "@/games/caro/store";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const CONFETTI_COLORS = ["#f2b84b", "#4fd1c5", "#e8615c", "#f6f3ea"];

export function WinModal({ onPlayAgain }: { onPlayAgain: () => void }) {
  const winner = useCaroStore((s) => s.winner);
  const isDraw = useCaroStore((s) => s.isDraw);
  const mode = useCaroStore((s) => s.mode);
  const humanPlayer = useCaroStore((s) => s.humanPlayer);
  const elapsedSeconds = useCaroStore((s) => s.elapsedSeconds);
  const hintsUsed = useCaroStore((s) => s.hintsUsed);

  const isOpen = Boolean(winner) || isDraw;
  const humanWon = winner && mode === "ai" && winner.winner === humanPlayer;
  const humanLost = winner && mode === "ai" && winner.winner !== humanPlayer;

  let title = "Hoà!";
  let emoji = "🤝";
  if (winner) {
    if (mode === "hotseat") {
      title = winner.winner === 1 ? "X thắng!" : "O thắng!";
      emoji = "🎉";
    } else if (humanWon) {
      title = "Bạn thắng!";
      emoji = "🎉";
    } else if (humanLost) {
      title = "Máy thắng!";
      emoji = "😵";
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!humanLost && (
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
          )}

          <motion.div
            initial={{ scale: 0.9, y: 12, opacity: 0, x: 0 }}
            animate={
              humanLost
                ? { scale: 1, y: 0, opacity: 1, x: [0, -8, 8, -6, 6, 0] }
                : { scale: 1, y: 0, opacity: 1 }
            }
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="relative w-full max-w-sm rounded-2xl bg-ink-800 p-6 text-center shadow-2xl"
          >
            <p className="text-4xl">{emoji}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-paper-100">{title}</h2>

            <div className="mt-4 flex justify-center gap-6 font-mono">
              <div>
                <p className="text-xs text-ink-400">Thời gian</p>
                <p className="text-lg text-paper-100">{formatTime(elapsedSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Số hint</p>
                <p className="text-lg text-paper-100">{hintsUsed}</p>
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
