"use client";

import { useSolitaireStore } from "../store";
import { HelpCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Hud() {
  const moves = useSolitaireStore((s) => s.moves);
  const elapsedSeconds = useSolitaireStore((s) => s.elapsedSeconds);
  const undo = useSolitaireStore((s) => s.undo);
  const history = useSolitaireStore((s) => s.history);
  
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3 px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between text-sm text-ink-400">
        <Link href="/" className="flex items-center gap-1.5 transition hover:text-paper-100">
          <ArrowLeft size={16} /> Trang chủ
        </Link>
        <button
          onClick={() => setShowRules(true)}
          aria-label="Xem luật chơi"
          className="flex items-center gap-1.5 transition hover:text-paper-100"
        >
          <HelpCircle size={16} /> Luật chơi
        </button>
      </div>

      {/* Stats & Undo */}
      <div className="flex items-center justify-between text-sm text-ink-400 border-b border-ink-800 pb-2 mb-4">
        <div className="flex gap-4">
          <span className="rounded-full bg-ink-800 px-3 py-1 font-medium text-paper-100">
            Nước đi: {moves}
          </span>
          <span className="flex items-center justify-center font-mono text-base tabular-nums text-paper-100">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1 font-medium text-paper-100 transition hover:bg-ink-700 active:scale-95 disabled:opacity-40"
        >
          <RotateCcw size={16} /> Undo
        </button>
      </div>

      <AnimatePresence>
        {showRules && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-ink-800 p-6 shadow-2xl"
            >
              <h2 className="font-display text-xl font-bold text-paper-100">Luật chơi Solitaire</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-400">
                <li><strong className="text-amber-400">Mục tiêu:</strong> Xếp toàn bộ 52 lá bài lên 4 cọc Đích (trên cùng bên phải).</li>
                <li><strong className="text-amber-400">Cọc Đích:</strong> Bắt đầu bằng lá Át (A), xếp tăng dần (A -&gt; K) và phải CÙNG CHẤT.</li>
                <li><strong className="text-amber-400">Cọc Dưới (Tableau):</strong> Xếp bài giảm dần (K -&gt; A) và KHÁC MÀU (Đỏ lên Đen, Đen lên Đỏ).</li>
                <li><strong className="text-amber-400">Luật kéo:</strong> Kéo 1 lá hoặc 1 cụm lá đã được lật ngửa hợp lệ. Chỉ có lá K (King) hoặc cụm bắt đầu bằng K mới được chuyển vào cột trống.</li>
                <li><strong className="text-amber-400">Mẹo:</strong> Nhấn đúp (Double-click) vào lá bài để tự động đưa lên Đích nếu hợp lệ!</li>
              </ul>
              <button
                onClick={() => setShowRules(false)}
                className="mt-6 w-full rounded-lg bg-amber-400 py-2.5 font-medium text-ink-950 transition hover:bg-amber-500"
              >
                Đã hiểu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
