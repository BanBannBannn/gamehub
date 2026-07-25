"use client";

import { motion } from "framer-motion";
import { useConnect4Store } from "../store";
import { COLS, ROWS } from "../engine/types";
import { dropRow } from "../engine/logic";

const DISC_COLOR: Record<number, string> = {
  1: "#ef4444", // đỏ
  2: "#f2b84b", // vàng
};

interface BoardProps {
  onDrop: (col: number) => void;
  disabled?: boolean;
}

export function Connect4Board({ onDrop, disabled }: BoardProps) {
  const board = useConnect4Store((s) => s.board);
  const winLine = useConnect4Store((s) => s.winLine);
  const lastDrop = useConnect4Store((s) => s.lastDrop);

  const isWinning = (r: number, c: number) => winLine?.cells.some((cell) => cell.r === r && cell.c === c) ?? false;

  return (
    <div className="w-full max-w-[460px]">
      <div className="grid gap-1.5 rounded-2xl bg-[#1d4ed8] p-2.5 shadow-xl sm:gap-2 sm:p-3" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {Array.from({ length: COLS }, (_, c) => {
          const canDrop = !disabled && dropRow(board, c) >= 0;
          return (
            <button
              key={c}
              type="button"
              onClick={() => canDrop && onDrop(c)}
              disabled={!canDrop}
              aria-label={`Thả quân vào cột ${c + 1}`}
              className="group flex flex-col gap-1.5 rounded-lg outline-none transition sm:gap-2 disabled:cursor-not-allowed enabled:hover:bg-white/10"
            >
              {Array.from({ length: ROWS }, (_, r) => {
                const v = board[r][c];
                const win = isWinning(r, c);
                const isLast = lastDrop?.r === r && lastDrop?.c === c;
                return (
                  <span key={r} className="relative block aspect-square w-full">
                    <span className="absolute inset-0 rounded-full bg-[#0f2a6b]" />
                    {v !== 0 && (
                      <motion.span
                        initial={isLast ? { y: -20, opacity: 0.6 } : false}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 26 }}
                        className={`absolute inset-[6%] rounded-full ${win ? "ring-4 ring-white" : ""}`}
                        style={{ background: DISC_COLOR[v] }}
                      />
                    )}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
