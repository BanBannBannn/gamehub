"use client";

import { useCaroStore } from "@/games/caro/store";
import { SIZE } from "@/games/caro/engine";
import { Cell } from "./Cell";

export function Board({ focusedIndex }: { focusedIndex: number | null }) {
  const board = useCaroStore((s) => s.board);
  const movesHistory = useCaroStore((s) => s.movesHistory);
  const winner = useCaroStore((s) => s.winner);
  const isDraw = useCaroStore((s) => s.isDraw);
  const isAiThinking = useCaroStore((s) => s.isAiThinking);
  const mode = useCaroStore((s) => s.mode);
  const currentPlayer = useCaroStore((s) => s.currentPlayer);
  const humanPlayer = useCaroStore((s) => s.humanPlayer);
  const lastHintIndex = useCaroStore((s) => s.lastHintIndex);
  const placeMove = useCaroStore((s) => s.placeMove);
  const playAiMoveIfNeeded = useCaroStore((s) => s.playAiMoveIfNeeded);

  const lastMoveIndex = movesHistory[movesHistory.length - 1] ?? null;
  const winningCells = new Set(winner?.line ?? []);
  const gameOver = Boolean(winner) || isDraw;
  const isHumanTurn = mode !== "ai" || currentPlayer === humanPlayer;

  function handleSelect(index: number) {
    if (gameOver || !isHumanTurn || isAiThinking) return;
    placeMove(index);
    // Sau khi người chơi đánh, nếu đang chơi với AI thì để AI đánh tiếp.
    setTimeout(() => playAiMoveIfNeeded(), 0);
  }

  return (
    <div className="w-full max-w-[min(92vw,600px)] overflow-auto rounded-xl border-2 border-ink-600 bg-ink-900 shadow-2xl shadow-black/40">
      <div
        role="grid"
        aria-label="Bàn cờ Caro"
        className="grid select-none border-l border-t border-ink-800"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(20px, 1fr))`, minWidth: 420 }}
      >
        {board.map((value, index) => (
          <Cell
            key={index}
            index={index}
            value={value}
            isLastMove={index === lastMoveIndex}
            isWinningCell={winningCells.has(index)}
            isHinted={index === lastHintIndex}
            isFocused={index === focusedIndex}
            onSelect={handleSelect}
            disabled={gameOver || !isHumanTurn || isAiThinking}
          />
        ))}
      </div>
    </div>
  );
}
