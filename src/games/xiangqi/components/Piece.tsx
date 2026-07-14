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
      className={`
        relative flex cursor-pointer items-center justify-center rounded-full shadow-md
        w-[90%] h-[90%] bg-[#F5E6CC] border-[3px] 
        ${isRed ? "border-red-600 text-red-600" : "border-ink-900 text-ink-900"}
        ${isSelected ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-[#E3C292]" : ""}
        hover:scale-105 transition-transform
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`
        absolute inset-1 rounded-full border border-dashed opacity-50
        ${isRed ? "border-red-600" : "border-ink-900"}
      `} />
      <span className="font-serif text-2xl sm:text-3xl font-bold select-none z-10">
        {text}
      </span>
    </motion.div>
  );
}
