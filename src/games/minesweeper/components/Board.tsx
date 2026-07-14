"use client";

import { useRef, useCallback } from "react";
import { useMinesweeperStore } from "@/games/minesweeper/store";
import { Cell } from "./Cell";

export function Board() {
  const board = useMinesweeperStore((s) => s.board);
  const config = useMinesweeperStore((s) => s.config);
  const status = useMinesweeperStore((s) => s.status);
  const revealCell = useMinesweeperStore((s) => s.revealCell);
  const toggleFlag = useMinesweeperStore((s) => s.toggleFlag);

  // Long press handling for mobile to flag
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const handleTouchStart = useCallback((index: number) => {
    if (status !== "playing" && status !== "idle") return;
    longPressTimer.current = setTimeout(() => {
      toggleFlag(index);
      // Vibrate if supported
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  }, [status, toggleFlag]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const disabled = status === "won" || status === "lost";

  return (
    <div className="flex w-full flex-col items-center overflow-hidden">
      <div 
        className="w-full max-w-[100vw] overflow-auto px-4 pb-4"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div 
          className="mx-auto grid w-fit gap-px rounded-xl bg-border p-2 shadow-inner"
          style={{ 
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` 
          }}
        >
          {board.map((cell, idx) => (
            <Cell
              key={idx}
              cell={cell}
              disabled={disabled}
              onClick={() => {
                cancelLongPress();
                revealCell(idx);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleFlag(idx);
              }}
              onTouchStart={() => handleTouchStart(idx)}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
