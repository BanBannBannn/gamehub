import { useChessStore } from "@/games/chess/store";
import { Chessboard } from "react-chessboard";
import { useCallback, useState, CSSProperties } from "react";
import { Square } from "chess.js";

export function Board() {
  const game = useChessStore((s) => s.game);
  const fen = useChessStore((s) => s.fen);
  const status = useChessStore((s) => s.status);
  const makeMove = useChessStore((s) => s.makeMove);
  const autoFlip = useChessStore((s) => s.autoFlip);
  const mode = useChessStore((s) => s.mode);
  const onlineColor = useChessStore((s) => s.onlineColor);

  const [optionSquares, setOptionSquares] = useState({});

  const boardOrientation =
    mode === "online"
      ? onlineColor === "b"
        ? "black"
        : "white"
      : autoFlip && game.turn() === "b"
        ? "black"
        : "white";
  const isMyOnlineTurn = mode !== "online" || game.turn() === onlineColor;

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as Square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return;
    }

    const newSquares: Record<string, CSSProperties> = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as Square) && game.get(move.to as Square)?.color !== game.get(square as Square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
  }

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    getMoveOptions(sourceSquare);
  };

  const onPieceDragEnd = () => {
    setOptionSquares({});
  };

  const onSquareClick = (square: string) => {
    getMoveOptions(square);
  };

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string) => {
      setOptionSquares({});
      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? "q", // default to queen if pawn reaches end
      };
      
      return makeMove(move);
    },
    [makeMove]
  );

  return (
    <div className="flex w-full items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[500px] aspect-square overflow-hidden rounded-xl shadow-2xl ring-1 ring-border/50">
        <Chessboard
          id="ChessGame"
          position={fen}
          onPieceDrop={onDrop}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          onSquareClick={onSquareClick}
          customSquareStyles={optionSquares}
          boardOrientation={boardOrientation}
          arePiecesDraggable={status === "playing" && isMyOnlineTurn}
          customDarkSquareStyle={{ backgroundColor: "var(--color-slate-600)", opacity: "0.9" }} 
          customLightSquareStyle={{ backgroundColor: "var(--color-slate-200)", opacity: "0.9" }}
          animationDuration={200}
        />
      </div>
    </div>
  );
}
