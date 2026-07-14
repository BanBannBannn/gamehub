"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDoansoStore } from "@/games/doanso/store";

export function HistoryList() {
  const history = useDoansoStore((s) => s.history);

  if (history.length === 0) {
    return <p className="text-center text-sm text-ink-400">Chưa có lượt đoán nào — hãy thử dãy số đầu tiên!</p>;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {history.map((result, i) => (
          <motion.div
            key={history.length - i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-lg bg-ink-800/60 px-4 py-2.5"
          >
            <span className="font-mono text-lg tracking-widest text-paper-100">{result.guess}</span>
            <span className="flex items-center gap-3 text-sm text-ink-400">
              <span title="Đúng vị trí">
                🎯 <span className="text-paper-100">{result.correctPosition}</span>
              </span>
              <span title="Đúng giá trị, sai vị trí">
                🔄 <span className="text-paper-100">{result.correctValueOnly}</span>
              </span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
