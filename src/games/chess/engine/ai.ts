// Minimax Fallback
import { Chess } from "chess.js";

const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
function evaluateBoard(game: Chess): number {
  const board = game.board();
  let score = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = pieceValues[piece.type];
        score += piece.color === "w" ? val : -val;
      }
    }
  }
  return score;
}

function getFallbackMove(game: Chess): string | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  moves.sort(() => Math.random() - 0.5);
  let bestMove = moves[0];
  let bestVal = game.turn() === "w" ? -Infinity : Infinity;
  for (const move of moves) {
    game.move(move.san);
    const val = evaluateBoard(game);
    game.undo();
    if (game.turn() === "w") {
      if (val > bestVal) { bestVal = val; bestMove = move; }
    } else {
      if (val < bestVal) { bestVal = val; bestMove = move; }
    }
  }
  return bestMove.from + bestMove.to + (bestMove.promotion || "");
}

// Stockfish Wrapper
export class StockfishEngine {
  private worker: Worker | null = null;
  private onMessageCallback: ((bestmove: string) => void) | null = null;
  private isReady = false;

  init() {
    if (typeof window === "undefined") return;
    if (this.worker) return;

    try {
      this.worker = new Worker("/api/stockfish");
      
      this.worker.onmessage = (e) => {
        const line = e.data;
        if (typeof line === "string" && line.startsWith("bestmove")) {
          const move = line.split(" ")[1];
          if (this.onMessageCallback) {
            this.onMessageCallback(move);
          }
        }
      };
      
      this.worker.postMessage("uci");
      this.isReady = true;
    } catch (err) {
      console.error("Failed to load Stockfish Worker:", err);
    }
  }

  getBestMove(fen: string, depth: number = 10, callback: (bestmove: string) => void) {
    if (!this.worker && !this.isReady) this.init();
    
    // If worker is not ready yet or failed, use fallback immediately
    if (!this.worker) {
      console.warn("Stockfish not ready, using fallback");
      const game = new Chess(fen);
      const fallback = getFallbackMove(game);
      if (fallback) {
        // Need to convert SAN to standard from-to format if necessary, 
        // but fallback is SAN. Wait, our makeMove handles SAN if we pass string.
        setTimeout(() => callback(fallback), 500);
      }
      return;
    }

    this.onMessageCallback = callback;
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth}`);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

export const stockfishEngine = new StockfishEngine();
