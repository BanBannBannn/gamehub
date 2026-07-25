import { useState } from "react";
import { useXiangqiStore } from "../store";
import { Position } from "../engine/types";
import { getLegalMoves, isKingInCheck } from "../engine/logic";
import { XiangqiPiece } from "./Piece";
import { motion, AnimatePresence } from "framer-motion";

export function XiangqiBoard() {
  const board = useXiangqiStore((s) => s.board);
  const turn = useXiangqiStore((s) => s.turn);
  const status = useXiangqiStore((s) => s.status);
  const makeMove = useXiangqiStore((s) => s.makeMove);
  const mode = useXiangqiStore((s) => s.mode);
  const onlineColor = useXiangqiStore((s) => s.onlineColor);

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const isMyOnlineTurn = mode !== "online" || turn === onlineColor;

  // Lật bàn cờ khi mình chơi quân Đen (online) — để quân của mình ở gần.
  // Chỉ xoay lớp lưới quân 180°; lớp đường kẻ + chữ "sông" đối xứng dọc
  // nên giữ nguyên là đúng. Toạ độ logic (x,y) không đổi → không phải sửa
  // makeMove/handleSquareClick.
  const flipped = mode === "online" && onlineColor === "b";

  // Ô Tướng của bên đang tới lượt nếu đang bị chiếu — để tô cảnh báo.
  let checkedKingPos: Position | null = null;
  if (status === "playing" && isKingInCheck(board, turn)) {
    for (let y = 0; y < 10 && !checkedKingPos; y++) {
      for (let x = 3; x <= 5; x++) {
        const p = board[y][x];
        if (p?.type === "k" && p.color === turn) {
          checkedKingPos = { x, y };
          break;
        }
      }
    }
  }

  const handleSquareClick = (x: number, y: number) => {
    if (!isMyOnlineTurn) return; // chưa tới lượt của mình khi chơi online

    const piece = board[y][x];

    // If we have a selected piece and we clicked a valid move target
    if (selectedPos && validMoves.some((m) => m.x === x && m.y === y)) {
      if (makeMove(selectedPos, { x, y })) {
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }
    }

    // If we clicked our own piece
    if (piece && piece.color === turn) {
      setSelectedPos({ x, y });
      setValidMoves(getLegalMoves(board, x, y));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // Kích thước ô cờ (sẽ responsive dựa trên css aspect-ratio và width 100%)
  // Tỷ lệ bàn cờ là 8x9 ô (nghĩa là 9x10 giao điểm). Aspect ratio = 8/9
  return (
    <div className="w-full max-w-[500px] aspect-[8/9] relative bg-[var(--xq-board-bg)] rounded-md shadow-xl border-4 border-[var(--xq-board-line)] select-none">
      
      {/* SVG Board Lines */}
      <div className="absolute inset-0 p-[5%] pointer-events-none">
        <svg className="w-full h-full overflow-visible">
          {/* Horizontal lines */}
          {[...Array(10)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i / 9) * 100}%`} x2="100%" y2={`${(i / 9) * 100}%`} stroke="var(--xq-board-line)" strokeWidth="2" />
          ))}
          {/* Vertical lines */}
          {[...Array(9)].map((_, i) => {
            if (i === 0 || i === 8) {
              // Outer continuous lines
              return <line key={`v${i}`} x1={`${(i / 8) * 100}%`} y1="0" x2={`${(i / 8) * 100}%`} y2="100%" stroke="var(--xq-board-line)" strokeWidth="2" />;
            }
            return (
              <g key={`v${i}`}>
                <line x1={`${(i / 8) * 100}%`} y1="0" x2={`${(i / 8) * 100}%`} y2={`${(4 / 9) * 100}%`} stroke="var(--xq-board-line)" strokeWidth="2" />
                <line x1={`${(i / 8) * 100}%`} y1={`${(5 / 9) * 100}%`} x2={`${(i / 8) * 100}%`} y2="100%" stroke="var(--xq-board-line)" strokeWidth="2" />
              </g>
            );
          })}
          {/* Top Palace diagonals */}
          <line x1={`${(3 / 8) * 100}%`} y1="0" x2={`${(5 / 8) * 100}%`} y2={`${(2 / 9) * 100}%`} stroke="var(--xq-board-line)" strokeWidth="2" />
          <line x1={`${(5 / 8) * 100}%`} y1="0" x2={`${(3 / 8) * 100}%`} y2={`${(2 / 9) * 100}%`} stroke="var(--xq-board-line)" strokeWidth="2" />
          
          {/* Bottom Palace diagonals */}
          <line x1={`${(3 / 8) * 100}%`} y1={`${(7 / 9) * 100}%`} x2={`${(5 / 8) * 100}%`} y2="100%" stroke="var(--xq-board-line)" strokeWidth="2" />
          <line x1={`${(5 / 8) * 100}%`} y1={`${(7 / 9) * 100}%`} x2={`${(3 / 8) * 100}%`} y2="100%" stroke="var(--xq-board-line)" strokeWidth="2" />

          {/* River text */}
          <text x="25%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="var(--xq-board-line)" className="font-serif text-3xl sm:text-4xl opacity-50" style={{ writingMode: "vertical-rl" }}>楚 河</text>
          <text x="75%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="var(--xq-board-line)" className="font-serif text-3xl sm:text-4xl opacity-50" style={{ writingMode: "vertical-rl" }}>漢 界</text>
        </svg>
      </div>

      {/* Grid of Intersections for Interaction */}
      <div className="absolute inset-0 p-[5%]">
        <div
          className="relative w-full h-full"
          style={flipped ? { transform: "rotate(180deg)" } : undefined}
        >
          {board.map((row, y) =>
            row.map((piece, x) => {
              const isSelected = selectedPos?.x === x && selectedPos?.y === y;
              const isLegalMove = validMoves.some((m) => m.x === x && m.y === y);
              const isCheckedKing = checkedKingPos?.x === x && checkedKingPos?.y === y;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleSquareClick(x, y)}
                  className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation"
                  style={{
                    left: `${(x / 8) * 100}%`,
                    top: `${(y / 9) * 100}%`,
                    width: "11%", // Size of the square cell around the intersection
                    height: "11%",
                    zIndex: piece ? 20 : 10,
                  }}
                >
                  {/* Legal Move Indicator */}
                  {isLegalMove && !piece && (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/50" />
                  )}
                  
                  {/* Legal Capture Indicator */}
                  {isLegalMove && piece && (
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/50 z-20 scale-[0.85]" />
                  )}

                  {/* Tướng đang bị chiếu — cảnh báo đỏ nhấp nháy */}
                  {isCheckedKing && (
                    <div className="absolute inset-0 rounded-full ring-4 ring-red-500/80 animate-pulse z-30" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <div className="absolute inset-0 w-[95%] h-[95%] left-[2.5%] top-[2.5%]">
                      <XiangqiPiece piece={piece} isSelected={isSelected} flipped={flipped} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
