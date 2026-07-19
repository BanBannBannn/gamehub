import { Bomb, Flag } from "lucide-react";
import { CellState } from "@/games/minesweeper/engine/types";

// Classic Minesweeper colors mapped to theme-friendly colors
const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-500", // 1: Blue
  2: "text-green-500", // 2: Green
  3: "text-red-500", // 3: Red
  4: "text-purple-500", // 4: Purple
  5: "text-amber-600", // 5: Maroon/Dark Red
  6: "text-teal-500", // 6: Turquoise
  7: "text-[var(--foreground)]", // 7: theo màu chữ chính của theme (đủ tương phản cả 2 chế độ)
  8: "text-gray-500", // 8: Gray
};

interface CellProps {
  cell: CellState;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  disabled?: boolean;
}

export function Cell({ 
  cell, 
  onClick, 
  onContextMenu, 
  onTouchStart, 
  onTouchEnd, 
  onTouchCancel,
  disabled 
}: CellProps) {
  
  // Decide the visual class based on cell state
  let baseClass = "relative flex h-8 w-8 min-w-[32px] sm:h-9 sm:w-9 sm:min-w-[36px] items-center justify-center font-display font-bold select-none transition-colors ";
  
  if (!cell.isRevealed) {
    baseClass += "bg-surface hover:bg-surface-hover border border-border-hover cursor-pointer";
  } else {
    baseClass += "border border-border/50 "; // revealed border
    if (cell.isMine) {
      baseClass += "bg-coral-500/30"; // Mine hit
    } else {
      baseClass += "bg-[var(--surface-hover)]"; // Sunken effect
    }
  }

  // Handle right click safely
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!disabled) {
      onContextMenu(e);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={baseClass}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={disabled ? undefined : onTouchStart}
      onTouchEnd={disabled ? undefined : onTouchEnd}
      onTouchCancel={disabled ? undefined : onTouchCancel}
      disabled={disabled || cell.isRevealed}
    >
      {cell.isFlagged && !cell.isRevealed && (
        <Flag size={16} className="text-amber-400 drop-shadow-sm" fill="currentColor" />
      )}
      
      {cell.isRevealed && cell.isMine && (
        <Bomb size={18} className="text-coral-500 drop-shadow-sm" />
      )}

      {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
        <span className={`${NUMBER_COLORS[cell.adjacentMines]} drop-shadow-sm`}>
          {cell.adjacentMines}
        </span>
      )}
    </button>
  );
}
