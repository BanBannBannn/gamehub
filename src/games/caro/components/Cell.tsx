"use client";

import { X, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface CellProps {
  index: number;
  value: 0 | 1 | 2;
  isLastMove: boolean;
  isWinningCell: boolean;
  isHinted: boolean;
  isFocused: boolean;
  onSelect: (index: number) => void;
  disabled: boolean;
}

export function Cell({
  index,
  value,
  isLastMove,
  isWinningCell,
  isHinted,
  isFocused,
  onSelect,
  disabled,
}: CellProps) {
  let bg = "bg-transparent hover:bg-ink-800";
  if (isWinningCell) bg = "bg-amber-400/25";
  else if (isLastMove) bg = "bg-ink-700/70";
  const ring = isFocused ? "ring-2 ring-inset ring-amber-400" : "";

  return (
    <button
      type="button"
      disabled={value !== 0 || disabled}
      onClick={() => onSelect(index)}
      aria-label={value === 0 ? "Ô trống" : value === 1 ? "Quân X" : "Quân O"}
      className={`relative flex aspect-square items-center justify-center border-b border-r border-ink-800 transition-colors duration-100 ${bg} ${ring} disabled:cursor-default`}
    >
      {isHinted && value === 0 && (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.8, repeat: 2 }}
          className="absolute inset-0.5 rounded-sm bg-amber-400/40"
        />
      )}
      {value === 1 && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <X size={14} strokeWidth={3} className="text-amber-400 sm:size-[18px]" />
        </motion.span>
      )}
      {value === 2 && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <Circle size={12} strokeWidth={3} className="text-teal-400 sm:size-4" />
        </motion.span>
      )}
    </button>
  );
}
