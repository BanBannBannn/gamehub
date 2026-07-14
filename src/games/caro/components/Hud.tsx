"use client";

import { useCaroStore } from "@/games/caro/store";
import { Tooltip } from "@/components/ui/tooltip";
import { Lightbulb, Undo2, X, Circle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Hud() {
  const currentPlayer = useCaroStore((s) => s.currentPlayer);
  const mode = useCaroStore((s) => s.mode);
  const humanPlayer = useCaroStore((s) => s.humanPlayer);
  const isAiThinking = useCaroStore((s) => s.isAiThinking);
  const elapsedSeconds = useCaroStore((s) => s.elapsedSeconds);
  const hintsUsed = useCaroStore((s) => s.hintsUsed);
  const lastHintReason = useCaroStore((s) => s.lastHintReason);
  const movesHistory = useCaroStore((s) => s.movesHistory);
  const winner = useCaroStore((s) => s.winner);
  const isDraw = useCaroStore((s) => s.isDraw);
  const useHint = useCaroStore((s) => s.useHint);
  const undo = useCaroStore((s) => s.undo);

  const gameOver = Boolean(winner) || isDraw;
  const isHumanTurn = mode !== "ai" || currentPlayer === humanPlayer;

  return (
    <div className="flex w-full max-w-[min(92vw,600px)] flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-ink-400">
        <span className="flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1 font-medium text-paper-100">
          {isAiThinking ? (
            "Máy đang suy nghĩ..."
          ) : (
            <>
              Lượt của:
              {currentPlayer === 1 ? (
                <X size={14} strokeWidth={3} className="text-amber-400" />
              ) : (
                <Circle size={12} strokeWidth={3} className="text-teal-400" />
              )}
              {mode === "ai" && (isHumanTurn ? "(bạn)" : "(máy)")}
            </>
          )}
        </span>
        <span className="font-mono text-base tabular-nums text-paper-100">{formatTime(elapsedSeconds)}</span>
        <span>Hint: {hintsUsed}</span>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip label="Hoàn tác nước đi gần nhất">
          <button
            type="button"
            onClick={undo}
            disabled={movesHistory.length === 0 || gameOver}
            aria-label="Hoàn tác"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-800 text-paper-100 transition hover:bg-ink-700 active:scale-95 disabled:opacity-30"
          >
            <Undo2 size={18} />
          </button>
        </Tooltip>

        <Tooltip label="Gợi ý nước đi tốt cho lượt hiện tại, kèm giải thích">
          <button
            type="button"
            onClick={useHint}
            disabled={gameOver || (mode === "ai" && !isHumanTurn)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-40"
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
            className="rounded-lg bg-ink-800/80 px-3 py-2 text-sm text-paper-100"
          >
            💡 {lastHintReason}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
