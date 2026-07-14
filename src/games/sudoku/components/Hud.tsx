"use client";

import { useSudokuStore } from "@/games/sudoku/store";
import { Tooltip } from "@/components/ui/tooltip";
import { Lightbulb, Redo2, Undo2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export function Hud() {
  const elapsedSeconds = useSudokuStore((s) => s.elapsedSeconds);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const hintsUsed = useSudokuStore((s) => s.hintsUsed);
  const lastHintReason = useSudokuStore((s) => s.lastHintReason);
  const useHint = useSudokuStore((s) => s.useHint);
  const undo = useSudokuStore((s) => s.undo);
  const redo = useSudokuStore((s) => s.redo);
  const history = useSudokuStore((s) => s.history);
  const future = useSudokuStore((s) => s.future);

  return (
    <div className="flex w-full max-w-[min(92vw,560px)] flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="rounded-full bg-surface-hover px-3 py-1 font-medium text-foreground">
          {DIFFICULTY_LABEL[difficulty] ?? difficulty}
        </span>
        <span className="font-mono text-base tabular-nums text-foreground">{formatTime(elapsedSeconds)}</span>
        <span>Hint đã dùng: {hintsUsed}</span>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip label="Hoàn tác (Ctrl+Z)">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            aria-label="Hoàn tác"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover text-foreground transition hover:bg-ink-700 active:scale-95 disabled:opacity-30"
          >
            <Undo2 size={18} />
          </button>
        </Tooltip>
        <Tooltip label="Làm lại">
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            aria-label="Làm lại"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover text-foreground transition hover:bg-ink-700 active:scale-95 disabled:opacity-30"
          >
            <Redo2 size={18} />
          </button>
        </Tooltip>

        <Tooltip label="Gợi ý nước đi tiếp theo, kèm giải thích">
          <button
            type="button"
            onClick={useHint}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
          >
            <Lightbulb size={18} />
            Gợi ý
          </button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {lastHintReason && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-surface-hover/80 px-3 py-2 text-sm text-foreground"
          >
            💡 {lastHintReason}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
