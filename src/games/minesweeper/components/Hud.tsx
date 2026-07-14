"use client";

import { useMinesweeperStore } from "@/games/minesweeper/store";
import { countRemainingFlags } from "@/games/minesweeper/engine/board";
import { Tooltip } from "@/components/ui/tooltip";
import { Lightbulb, Flag, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Hud() {
  const board = useMinesweeperStore((s) => s.board);
  const config = useMinesweeperStore((s) => s.config);
  const status = useMinesweeperStore((s) => s.status);
  const elapsedSeconds = useMinesweeperStore((s) => s.elapsedSeconds);
  const hintsUsed = useMinesweeperStore((s) => s.hintsUsed);
  const lastHintReason = useMinesweeperStore((s) => s.lastHintReason);
  const useHint = useMinesweeperStore((s) => s.useHint);
  const startNewGame = useMinesweeperStore((s) => s.startNewGame);
  const difficulty = useMinesweeperStore((s) => s.difficulty);

  const remainingMines = countRemainingFlags(board, config.mineCount);

  // Determine smiley face based on game status
  let Smiley = "😊";
  if (status === "lost") Smiley = "😵";
  if (status === "won") Smiley = "😎";
  // We could add an "O" face on mouse down using a global listener, but this is fine for now

  return (
    <div className="flex w-full max-w-[min(92vw,600px)] flex-col gap-3">
      {/* Top HUD bar */}
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border">
        {/* Mine counter */}
        <div className="flex min-w-[80px] items-center gap-2 font-mono text-xl font-bold text-coral-500">
          <Flag size={20} className="text-muted" />
          {remainingMines.toString().padStart(3, "0")}
        </div>

        {/* Reset Face */}
        <button
          onClick={() => startNewGame(difficulty)}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-2xl transition hover:bg-border active:scale-95"
          title="Chơi lại"
        >
          {Smiley}
        </button>

        {/* Timer */}
        <div className="flex min-w-[80px] items-center justify-end gap-2 font-mono text-xl font-bold text-foreground">
          <Clock size={20} className="text-muted" />
          {formatTime(elapsedSeconds)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip label="Gợi ý nước đi tiếp theo, kèm giải thích">
          <button
            type="button"
            onClick={useHint}
            disabled={status !== "playing"}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
          >
            <Lightbulb size={18} />
            Gợi ý ({hintsUsed})
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
