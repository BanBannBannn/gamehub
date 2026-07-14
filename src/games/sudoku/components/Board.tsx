"use client";

import { useMemo } from "react";
import { useSudokuStore } from "@/games/sudoku/store";
import { colOf, rowOf, boxOf, findConflicts } from "@/games/sudoku/engine";
import { Cell } from "./Cell";

export function Board() {
  const board = useSudokuStore((s) => s.board);
  const puzzle = useSudokuStore((s) => s.puzzle);
  const notes = useSudokuStore((s) => s.notes);
  const selectedIndex = useSudokuStore((s) => s.selectedIndex);
  const selectCell = useSudokuStore((s) => s.selectCell);
  const highlightConflicts = useSudokuStore((s) => s.highlightConflicts);
  const conflicts = useMemo(() => findConflicts(board), [board]);
  const lastHintIndex = useSudokuStore((s) => s.lastHintIndex);

  const selectedValue = selectedIndex !== null ? board[selectedIndex] : 0;

  return (
    <div
      role="grid"
      aria-label="Bàn cờ Sudoku"
      className="grid grid-cols-9 w-full max-w-[min(92vw,560px)] aspect-square rounded-xl overflow-hidden border-2 border-ink-600 bg-surface shadow-2xl shadow-black/40 select-none"
    >
      {board.map((value, index) => {
        const isSelected = index === selectedIndex;
        const isPeerHighlighted =
          selectedIndex !== null &&
          !isSelected &&
          (rowOf(index) === rowOf(selectedIndex) ||
            colOf(index) === colOf(selectedIndex) ||
            boxOf(index) === boxOf(selectedIndex));
        const isSameValueHighlighted = selectedValue !== 0 && value === selectedValue && !isSelected;

        return (
          <Cell
            key={index}
            index={index}
            value={value}
            isGiven={puzzle[index] !== 0}
            isSelected={isSelected}
            isPeerHighlighted={isPeerHighlighted}
            isSameValueHighlighted={isSameValueHighlighted}
            isConflict={highlightConflicts && conflicts.has(index)}
            isHinted={index === lastHintIndex}
            notes={notes[index] ?? []}
            onSelect={selectCell}
          />
        );
      })}
    </div>
  );
}
