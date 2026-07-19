import { Piece } from "../engine/types";
import { motion } from "framer-motion";

interface PieceProps {
  piece: Piece;
  isSelected?: boolean;
  onClick?: () => void;
}

const pieceText = {
  r: {
    k: "帥",
    a: "仕",
    e: "相",
    h: "傌",
    r: "俥",
    c: "炮",
    p: "兵"
  },
  b: {
    k: "將",
    a: "士",
    e: "象",
    h: "馬",
    r: "車",
    c: "砲",
    p: "卒"
  }
};

export function XiangqiPiece({ piece, isSelected, onClick }: PieceProps) {
  const isRed = piece.color === "r";
  const text = pieceText[piece.color][piece.type];

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative flex cursor-pointer items-center justify-center rounded-full shadow-md
        w-[90%] h-[90%] bg-[var(--xq-piece-bg)] border-[3px]
        ${isRed ? "border-[var(--xq-piece-text-red)] text-[var(--xq-piece-text-red)]" : "border-[var(--xq-piece-text-black)] text-[var(--xq-piece-text-black)]"}
        ${isSelected ? "ring-4 ring-amber-400 ring-offset-2" : ""}
        hover:scale-105 transition-transform
      `}
      style={isSelected ? { ["--tw-ring-offset-color" as string]: "var(--xq-piece-ring-offset)" } : undefined}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`
        absolute inset-1 rounded-full border border-dashed opacity-50
        ${isRed ? "border-[var(--xq-piece-text-red)]" : "border-[var(--xq-piece-text-black)]"}
      `} />
      <span className="font-serif text-2xl sm:text-3xl font-bold select-none z-10">
        {text}
      </span>
    </motion.div>
  );
}
