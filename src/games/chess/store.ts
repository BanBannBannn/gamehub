import { create } from "zustand";
import { Chess, Move } from "chess.js";

export type ChessStatus = "idle" | "playing" | "won" | "draw";

export interface ChessState {
  game: Chess;
  fen: string;
  pgn: string;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  status: ChessStatus;
  winner: "w" | "b" | null;
  isRunning: boolean;
  timeConfig: number; // Initial time in seconds (e.g. 600 for 10 minutes)
  mode: "ai" | "hotseat";
  autoFlip: boolean;
  
  // Actions
  startNewGame: (config: { timeSeconds: number; mode: "ai" | "hotseat"; autoFlip: boolean }) => void;
  loadSavedGame: (savedState: Partial<ChessState>) => void;
  makeMove: (move: { from: string; to: string; promotion?: string } | string) => boolean;
  undoMove: () => void;
  tick: () => void;
  quitGame: () => void;
}

export const useChessStore = create<ChessState>((set, get) => ({
  game: new Chess(),
  fen: "start",
  pgn: "",
  whiteTime: 600,
  blackTime: 600,
  status: "idle",
  winner: null,
  isRunning: false,
  timeConfig: 600,
  mode: "hotseat",
  autoFlip: true,

  startNewGame: ({ timeSeconds, mode, autoFlip }) => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: newGame.fen(),
      pgn: newGame.pgn(),
      whiteTime: timeSeconds,
      blackTime: timeSeconds,
      status: "playing",
      winner: null,
      isRunning: true,
      timeConfig: timeSeconds,
      mode,
      autoFlip,
    });
  },

  quitGame: () => {
    set({
      status: "idle",
      isRunning: false,
    });
  },

  loadSavedGame: (savedState) => {
    const newGame = new Chess();
    if (savedState.pgn) {
      newGame.loadPgn(savedState.pgn);
    } else if (savedState.fen) {
      newGame.load(savedState.fen);
    }

    set({
      ...savedState,
      game: newGame,
      isRunning: savedState.status === "playing",
    });
  },

  undoMove: () => {
    const { game, mode, status } = get();
    if (status !== "playing") return;

    // Undo once
    game.undo();
    // If playing AI and it's AI's turn, we undo again to go back to player's turn
    if (mode === "ai" && game.turn() === "b") {
      game.undo();
    }

    set({
      fen: game.fen(),
      pgn: game.pgn(),
      status: "playing",
      winner: null,
      isRunning: true,
    });
  },

  makeMove: (moveObj) => {
    const { game, status, whiteTime, blackTime, mode } = get();
    if (status !== "playing") return false;

    try {
      const move = game.move(moveObj);
      if (!move) return false;

      // Play sound
      import("./engine/audio").then((audio) => {
        if (game.isCheckmate() || game.isCheck()) {
          audio.playCheckSound();
        } else if (move.captured) {
          audio.playCaptureSound();
        } else {
          audio.playMoveSound();
        }
      }).catch(() => {});

      let newStatus: ChessStatus = "playing";
      let winner: "w" | "b" | null = null;

      if (game.isCheckmate()) {
        newStatus = "won";
        winner = game.turn() === "w" ? "b" : "w";
      } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
        newStatus = "draw";
      }

      set({
        fen: game.fen(),
        pgn: game.pgn(),
        status: newStatus,
        winner,
        isRunning: newStatus === "playing",
      });
      return true;
    } catch (e) {
      // Invalid move
      return false;
    }
  },

  tick: () => {
    const { isRunning, status, game, whiteTime, blackTime } = get();
    if (!isRunning || status !== "playing") return;

    const isWhiteTurn = game.turn() === "w";
    
    if (isWhiteTurn) {
      if (whiteTime <= 0) {
        set({ status: "won", winner: "b", isRunning: false });
      } else {
        set({ whiteTime: whiteTime - 1 });
      }
    } else {
      if (blackTime <= 0) {
        set({ status: "won", winner: "w", isRunning: false });
      } else {
        set({ blackTime: blackTime - 1 });
      }
    }
  },
}));
