"use client";

import { CellValue } from "@/games/sudoku/engine";
import { useSudokuStore } from "@/games/sudoku/store";
import { Eraser, Pencil } from "lucide-react";

export function NumberPad() {
  const inputValue = useSudokuStore((s) => s.inputValue);
  const clearCell = useSudokuStore((s) => s.clearCell);
  const pencilMode = useSudokuStore((s) => s.pencilMode);
  const togglePencilMode = useSudokuStore((s) => s.togglePencilMode);
  const board = useSudokuStore((s) => s.board);

  const counts = new Array(10).fill(0);
  board.forEach((v) => counts[v]++);

  return (
    <div className="flex w-full max-w-[min(92vw,560px)] items-center gap-2">
      <div className="grid grid-cols-9 gap-1.5 flex-1">
        {Array.from({ length: 9 }, (_, i) => (i + 1) as CellValue).map((n) => {
          const remaining = 9 - counts[n];
          return (
            <button
              key={n}
              type="button"
              disabled={remaining <= 0}
              onClick={() => inputValue(n)}
              aria-label={`Nhập số ${n}`}
              className="flex aspect-square items-center justify-center rounded-lg bg-surface-hover font-display text-lg font-semibold text-foreground transition hover:bg-ink-700 active:scale-95 disabled:opacity-25 disabled:pointer-events-none"
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={togglePencilMode}
          aria-pressed={pencilMode}
          aria-label="Chế độ ghi chú"
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition active:scale-95 ${
            pencilMode ? "bg-amber-400 text-ink-950" : "bg-surface-hover text-foreground hover:bg-ink-700"
          }`}
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={clearCell}
          aria-label="Xoá ô đang chọn"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover text-foreground transition hover:bg-ink-700 active:scale-95"
        >
          <Eraser size={18} />
        </button>
      </div>
    </div>
  );
}
