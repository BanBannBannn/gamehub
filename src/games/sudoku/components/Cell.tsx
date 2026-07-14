"use client";

import { colOf, rowOf } from "@/games/sudoku/engine";
import { motion } from "framer-motion";

interface CellProps {
  index: number;
  value: number;
  isGiven: boolean;
  isSelected: boolean;
  isPeerHighlighted: boolean;
  isSameValueHighlighted: boolean;
  isConflict: boolean;
  isHinted: boolean;
  notes: number[];
  onSelect: (index: number) => void;
}

export function Cell({
  index,
  value,
  isGiven,
  isSelected,
  isPeerHighlighted,
  isSameValueHighlighted,
  isConflict,
  isHinted,
  notes,
  onSelect,
}: CellProps) {
  const row = rowOf(index);
  const col = colOf(index);

  const borderRight = col % 3 === 2 && col !== 8 ? "border-r-2 border-r-ink-600" : "border-r border-r-ink-800";
  const borderBottom = row % 3 === 2 && row !== 8 ? "border-b-2 border-b-ink-600" : "border-b border-b-ink-800";

  let bg = "bg-transparent";
  if (isSelected) bg = "bg-amber-400/25";
  else if (isSameValueHighlighted) bg = "bg-teal-400/15";
  else if (isPeerHighlighted) bg = "bg-ink-700/60";

  return (
    <button
      type="button"
      aria-label={`Ô hàng ${row + 1} cột ${col + 1}${value ? `, giá trị ${value}` : ", trống"}`}
      onClick={() => onSelect(index)}
      className={`relative flex aspect-square items-center justify-center font-display text-lg sm:text-xl transition-colors duration-100 ${borderRight} ${borderBottom} ${bg} ${
        isGiven ? "font-semibold text-foreground" : "text-amber-400 font-medium"
      } ${isConflict ? "text-coral-500!" : ""}`}
    >
      {isHinted && (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.8, repeat: 2 }}
          className="absolute inset-1 rounded-md bg-amber-400/40"
        />
      )}
      {value !== 0 ? (
        <span className="relative">{value}</span>
      ) : notes.length > 0 ? (
        <span className="relative grid grid-cols-3 gap-0 text-[9px] sm:text-[10px] leading-none text-muted place-items-center w-full h-full p-0.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span key={n} className={notes.includes(n) ? "opacity-100" : "opacity-0"}>
              {n}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
