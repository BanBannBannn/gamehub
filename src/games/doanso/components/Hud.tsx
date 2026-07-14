"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDoansoStore } from "@/games/doanso/store";
import { Tooltip } from "@/components/ui/tooltip";
import { HelpCircle, Lightbulb, X } from "lucide-react";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Hud() {
  const [showRules, setShowRules] = useState(false);
  const length = useDoansoStore((s) => s.length);
  const history = useDoansoStore((s) => s.history);
  const elapsedSeconds = useDoansoStore((s) => s.elapsedSeconds);
  const hintsUsed = useDoansoStore((s) => s.hintsUsed);
  const lastHintSuggestion = useDoansoStore((s) => s.lastHintSuggestion);
  const lastHintReason = useDoansoStore((s) => s.lastHintReason);
  const status = useDoansoStore((s) => s.status);
  const useHint = useDoansoStore((s) => s.useHint);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-ink-400">
        <span className="rounded-full bg-ink-800 px-3 py-1 font-medium text-paper-100">
          Lượt: {history.length}
        </span>
        <span className="font-mono text-base tabular-nums text-paper-100">{formatTime(elapsedSeconds)}</span>
        <button
          type="button"
          onClick={() => setShowRules(true)}
          aria-label="Xem luật chơi"
          className="flex items-center gap-1 text-ink-400 hover:text-paper-100"
        >
          <HelpCircle size={16} /> Luật chơi
        </button>
      </div>

      <Tooltip label={`Gợi ý 1 dãy ${length} chữ số nên thử, kèm lý do suy luận`}>
        <button
          type="button"
          onClick={useHint}
          disabled={status !== "playing"}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-40"
        >
          <Lightbulb size={18} />
          Gợi ý {hintsUsed > 0 && `(đã dùng ${hintsUsed})`}
        </button>
      </Tooltip>

      <AnimatePresence>
        {lastHintSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-ink-800/80 px-3 py-2 text-sm text-paper-100"
          >
            <p>
              💡 Thử: <span className="font-mono tracking-widest text-amber-400">{lastHintSuggestion}</span>
            </p>
            <p className="mt-1 text-ink-400">{lastHintReason}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl bg-ink-800 p-6 text-left shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowRules(false)}
                aria-label="Đóng"
                className="absolute right-4 top-4 text-ink-400 hover:text-paper-100"
              >
                <X size={18} />
              </button>
              <h2 className="font-display text-xl font-bold text-paper-100">Luật chơi</h2>
              <p className="mt-3 text-sm text-ink-400">
                Hệ thống đã chọn 1 dãy {length} chữ số khác nhau đôi một. Mỗi lượt bạn đoán 1 dãy
                {` ${length} `}chữ số, hệ thống sẽ phản hồi:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-paper-100">
                <li>🎯 <b>Đúng vị trí</b>: số chữ số đoán đúng cả giá trị lẫn vị trí.</li>
                <li>🔄 <b>Đúng giá trị, sai vị trí</b>: số chữ số có trong dãy bí mật nhưng bạn đặt sai chỗ.</li>
              </ul>
              <p className="mt-3 text-sm text-ink-400">
                Ví dụ: số bí mật là <span className="font-mono text-paper-100">1234</span>, bạn đoán{" "}
                <span className="font-mono text-paper-100">1325</span> → 🎯 1 (chữ số &quot;1&quot;), 🔄 2
                (chữ số &quot;3&quot; và &quot;2&quot; có mặt nhưng sai vị trí).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
