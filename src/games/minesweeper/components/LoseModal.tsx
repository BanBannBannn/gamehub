import { motion, AnimatePresence } from "framer-motion";
import { Bomb } from "lucide-react";
import { useMinesweeperStore } from "@/games/minesweeper/store";

export function LoseModal({ onPlayAgain }: { onPlayAgain: () => void }) {
  const status = useMinesweeperStore((s) => s.status);
  const isOpen = status === "lost";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1, 
              scale: 1, 
              y: 0,
              x: [0, -10, 10, -10, 10, -5, 5, 0] // Shake effect
            }}
            transition={{
              x: { duration: 0.5, ease: "easeInOut" }
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-coral-500/20 text-coral-500">
              <Bomb size={32} />
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground">Bạn đã đạp trúng mìn!</h2>
            <p className="mt-2 text-center text-sm text-muted">
              Cẩn thận hơn ở lần thử tiếp theo nhé.
            </p>

            <button
              autoFocus
              onClick={onPlayAgain}
              className="mt-6 w-full rounded-xl bg-coral-500 py-3 font-medium text-white transition hover:bg-coral-600 active:scale-[0.98]"
            >
              Chơi lại
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
