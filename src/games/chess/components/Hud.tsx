import { useChessStore } from "@/games/chess/store";
import { Clock } from "lucide-react";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const INITIAL_PIECES = { p: 8, n: 2, b: 2, r: 2, q: 1 };

function getCapturedPieces(board: any[][]) {
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type !== "k") {
        current[piece.color as "w" | "b"][piece.type as keyof typeof INITIAL_PIECES]++;
      }
    }
  }

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];

  const icons = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" };
  const whiteIcons = { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕" };

  for (const [type, count] of Object.entries(INITIAL_PIECES)) {
    const t = type as keyof typeof INITIAL_PIECES;
    // White captures black pieces
    const missingBlack = count - current.b[t];
    for (let i = 0; i < missingBlack; i++) capturedByWhite.push(icons[t]);
    
    // Black captures white pieces
    const missingWhite = count - current.w[t];
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push(whiteIcons[t]);
  }

  return { capturedByWhite, capturedByBlack };
}

export function Hud() {
  const whiteTime = useChessStore((s) => s.whiteTime);
  const blackTime = useChessStore((s) => s.blackTime);
  const status = useChessStore((s) => s.status);
  const game = useChessStore((s) => s.game);
  const winner = useChessStore((s) => s.winner);
  
  const isWhiteTurn = game.turn() === "w";
  const { capturedByWhite, capturedByBlack } = getCapturedPieces(game.board());

  return (
    <div className="flex w-full max-w-[500px] flex-col gap-4">
      {/* Black Player (Top) */}
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-white shadow-sm ring-1 ring-border">
            ♟
          </div>
          <div>
            <div className="font-semibold text-foreground">Quân Đen</div>
            <div className="text-xs text-muted flex gap-1 tracking-tighter">
              {capturedByBlack.length > 0 ? capturedByBlack.join("") : "Player 2"}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${
          status === "playing" && !isWhiteTurn ? "text-amber-500" : "text-muted"
        }`}>
          <Clock size={18} />
          {formatTime(blackTime)}
        </div>
      </div>

      {/* Game Status Message */}
      <div className="flex h-12 items-center justify-center rounded-xl bg-surface-hover px-4 text-sm font-medium text-foreground">
        {status === "idle" && "Chưa bắt đầu"}
        {status === "playing" && (
          isWhiteTurn ? "Đến lượt Quân Trắng đi" : "Đến lượt Quân Đen đi"
        )}
        {status === "won" && (
          <span className="text-teal-500 text-base">
            {winner === "w" ? "Trắng Thắng!" : "Đen Thắng!"} 
            {game.isCheckmate() ? " (Chiếu tướng)" : " (Hết giờ)"}
          </span>
        )}
        {status === "draw" && "Hòa cờ"}
      </div>

      {/* White Player (Bottom) */}
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink-950 shadow-sm ring-1 ring-border">
            ♙
          </div>
          <div>
            <div className="font-semibold text-foreground">Quân Trắng</div>
            <div className="text-xs text-muted flex gap-1 tracking-tighter text-foreground">
              {capturedByWhite.length > 0 ? capturedByWhite.join("") : "Player 1"}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${
          status === "playing" && isWhiteTurn ? "text-amber-500" : "text-muted"
        }`}>
          <Clock size={18} />
          {formatTime(whiteTime)}
        </div>
      </div>
    </div>
  );
}
