"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSolitaireStore } from "../store";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import Link from "next/link";
import { Trophy } from "lucide-react";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function WinModal() {
  const status = useSolitaireStore((s) => s.status);
  const moves = useSolitaireStore((s) => s.moves);
  const elapsedSeconds = useSolitaireStore((s) => s.elapsedSeconds);
  const startNewGame = useSolitaireStore((s) => s.startNewGame);
  
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      {status === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm rounded-2xl bg-ink-800 p-8 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
              <Trophy size={32} />
            </div>
            
            <h2 className="mt-4 font-display text-2xl font-bold text-paper-100">Chiến Thắng!</h2>
            <p className="mt-2 text-sm text-ink-400">
              Tuyệt vời! Bạn đã vượt qua ván Solitaire này.
            </p>

            <div className="mt-6 flex justify-center gap-8 border-y border-ink-700 py-4">
              <div>
                <p className="text-xs text-ink-400">Thời gian</p>
                <p className="font-mono text-xl text-paper-100">{formatTime(elapsedSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Nước đi</p>
                <p className="font-mono text-xl text-paper-100">{moves}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={startNewGame}
                className="w-full rounded-xl bg-amber-400 py-3 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
              >
                Chơi ván mới
              </button>
              <Link
                href="/"
                className="w-full rounded-xl border border-ink-700 bg-transparent py-3 font-medium text-paper-100 transition hover:bg-ink-700 active:scale-[0.98] inline-flex items-center justify-center"
              >
                Quay về trang chủ
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
