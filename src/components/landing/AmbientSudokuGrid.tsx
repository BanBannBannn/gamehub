"use client";

import { motion } from "framer-motion";

// A decorative, non-interactive 6x6-ish grid where a handful of cells
// "solve themselves" with a soft glow trail — ties the hero visual
// directly to the subject (Sudoku) instead of generic abstract shapes.
const FILLED_CELLS: { row: number; col: number; value: number; delay: number }[] = [
  { row: 0, col: 2, value: 4, delay: 0 },
  { row: 1, col: 4, value: 7, delay: 0.3 },
  { row: 2, col: 0, value: 9, delay: 0.6 },
  { row: 2, col: 5, value: 2, delay: 0.9 },
  { row: 3, col: 3, value: 6, delay: 1.2 },
  { row: 4, col: 1, value: 8, delay: 1.5 },
  { row: 5, col: 4, value: 3, delay: 1.8 },
];

const SIZE = 6;
const CELL = 56;
const DIM = SIZE * CELL;

export function AmbientSudokuGrid() {
  return (
    <svg
      viewBox={`0 0 ${DIM} ${DIM}`}
      className="h-full w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: SIZE + 1 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * CELL}
          y1={0}
          x2={i * CELL}
          y2={DIM}
          stroke="var(--color-ink-700)"
          strokeWidth={i % 3 === 0 ? 2 : 1}
        />
      ))}
      {Array.from({ length: SIZE + 1 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * CELL}
          x2={DIM}
          y2={i * CELL}
          stroke="var(--color-ink-700)"
          strokeWidth={i % 3 === 0 ? 2 : 1}
        />
      ))}

      {FILLED_CELLS.map((cell, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3.6,
            delay: cell.delay,
            repeat: Infinity,
            repeatDelay: FILLED_CELLS.length * 0.3,
            ease: "easeInOut",
          }}
        >
          <rect
            x={cell.col * CELL + 3}
            y={cell.row * CELL + 3}
            width={CELL - 6}
            height={CELL - 6}
            rx={8}
            fill="var(--color-amber-400)"
            opacity={0.12}
          />
          <text
            x={cell.col * CELL + CELL / 2}
            y={cell.row * CELL + CELL / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-display)"
            fontSize={22}
            fontWeight={600}
            fill="var(--color-amber-400)"
          >
            {cell.value}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
