import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { useMinesweeperStore } from "@/games/minesweeper/store";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function WinModal({ onPlayAgain }: { onPlayAgain: () => void }) {
  const status = useMinesweeperStore((s) => s.status);
  const elapsedSeconds = useMinesweeperStore((s) => s.elapsedSeconds);
  const hintsUsed = useMinesweeperStore((s) => s.hintsUsed);
  const { width, height } = useWindowSize();

  const isOpen = status === "won";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-500">
              <PartyPopper size={32} />
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground">Chiến thắng!</h2>
            <p className="mt-2 text-center text-sm text-muted">
              Bạn đã mở toàn bộ ô an toàn.
            </p>

            <div className="mt-6 flex w-full flex-col gap-2 rounded-xl bg-surface-hover p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Thời gian</span>
                <span className="font-medium text-foreground">{elapsedSeconds} giây</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Gợi ý đã dùng</span>
                <span className="font-medium text-foreground">{hintsUsed}</span>
              </div>
            </div>

            <button
              autoFocus
              onClick={onPlayAgain}
              className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
            >
              Chơi ván khác
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
