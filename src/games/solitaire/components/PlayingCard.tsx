"use client";

import { motion } from "framer-motion";
import { Card, Suit, Rank, Color } from "../engine/types";
import { Heart, Diamond, Club, Spade } from "lucide-react";

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  onDoubleClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  stackedOffset?: number; // How far down it should be offset (if in a tableau)
  className?: string;
}

const SUIT_ICONS = {
  hearts: <Heart fill="currentColor" size={16} />,
  diamonds: <Diamond fill="currentColor" size={16} />,
  clubs: <Club fill="currentColor" size={16} />,
  spades: <Spade fill="currentColor" size={16} />,
};

const SUIT_ICONS_LARGE = {
  hearts: <Heart fill="currentColor" size={32} />,
  diamonds: <Diamond fill="currentColor" size={32} />,
  clubs: <Club fill="currentColor" size={32} />,
  spades: <Spade fill="currentColor" size={32} />,
};

function formatRank(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return rank.toString();
}

export function PlayingCard({
  card,
  onClick,
  onDoubleClick,
  draggable,
  onDragStart,
  isDragging,
  stackedOffset = 0,
  className = "",
}: PlayingCardProps) {
  const { suit, rank, color, isFaceUp } = card;

  // Basic styling for the card container
  const baseClasses = `
    relative w-16 h-24 sm:w-20 sm:h-28 rounded-md sm:rounded-lg
    flex flex-col select-none
    ${isDragging ? "opacity-0" : "opacity-100"}
    ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
    ${className}
  `;

  // Dynamic positioning for overlapping cards
  const style = {
    marginTop: stackedOffset > 0 ? `${stackedOffset}px` : "0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  if (!isFaceUp) {
    return (
      <div
        className={`${baseClasses} bg-blue-600 border-2 border-white`}
        style={{
          ...style,
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
        }}
        onClick={onClick}
      />
    );
  }

  const textColorClass = color === "red" ? "text-red-500" : "text-slate-800";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`${baseClasses} bg-white border border-slate-200 ${textColorClass}`}
      style={style}
    >
      {/* Top Left */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center">
        <span className="text-sm sm:text-base font-bold leading-none">{formatRank(rank)}</span>
        <span className="w-3 sm:w-4">{SUIT_ICONS[suit]}</span>
      </div>

      {/* Center (optional, simplifies UI) */}
      <div className="flex-1 flex items-center justify-center opacity-40">
        {SUIT_ICONS_LARGE[suit]}
      </div>

      {/* Bottom Right (Upside down) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center rotate-180">
        <span className="text-sm sm:text-base font-bold leading-none">{formatRank(rank)}</span>
        <span className="w-3 sm:w-4">{SUIT_ICONS[suit]}</span>
      </div>
    </div>
  );
}
