import { create } from "zustand";
import {
  Board,
  Difficulty,
  GameMode,
  WinResult,
  checkWin,
  createEmptyBoard,
  getAiMove,
  getHint,
  isBoardFull,
  otherPlayer,
  placeStone,
} from "@/games/caro/engine";

export interface CaroState {
  board: Board;
  currentPlayer: 1 | 2;
  mode: GameMode;
  difficulty: Difficulty;
  humanPlayer: 1 | 2; // quân của người chơi khi mode === "ai"
  movesHistory: number[];
  winner: WinResult | null;
  isDraw: boolean;
  hintsUsed: number;
  lastHintIndex: number | null;
  lastHintReason: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  isAiThinking: boolean;

  startNewGame: (mode: GameMode, difficulty: Difficulty) => void;
  loadSavedGame: (state: {
    board: Board;
    currentPlayer: 1 | 2;
    mode: GameMode;
    difficulty: Difficulty;
    humanPlayer: 1 | 2;
    movesHistory: number[];
    hintsUsed: number;
    elapsedSeconds: number;
  }) => void;
  placeMove: (index: number) => void;
  playAiMoveIfNeeded: () => void;
  undo: () => void;
  useHint: () => void;
  tick: () => void;
}

function checkGameEnd(board: Board, lastIndex: number): { winner: WinResult | null; isDraw: boolean } {
  const winner = checkWin(board, lastIndex);
  if (winner) return { winner, isDraw: false };
  if (isBoardFull(board)) return { winner: null, isDraw: true };
  return { winner: null, isDraw: false };
}

export const useCaroStore = create<CaroState>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: 1,
  mode: "hotseat",
  difficulty: "medium",
  humanPlayer: 1,
  movesHistory: [],
  winner: null,
  isDraw: false,
  hintsUsed: 0,
  lastHintIndex: null,
  lastHintReason: null,
  elapsedSeconds: 0,
  isRunning: false,
  isAiThinking: false,

  startNewGame: (mode, difficulty) => {
    set({
      board: createEmptyBoard(),
      currentPlayer: 1,
      mode,
      difficulty,
      humanPlayer: 1,
      movesHistory: [],
      winner: null,
      isDraw: false,
      hintsUsed: 0,
      lastHintIndex: null,
      lastHintReason: null,
      elapsedSeconds: 0,
      isRunning: true,
      isAiThinking: false,
    });
  },

  loadSavedGame: (state) => {
    const lastIndex = state.movesHistory[state.movesHistory.length - 1];
    const { winner, isDraw } =
      lastIndex !== undefined ? checkGameEnd(state.board, lastIndex) : { winner: null, isDraw: false };
    set({
      board: state.board,
      currentPlayer: state.currentPlayer,
      mode: state.mode,
      difficulty: state.difficulty,
      humanPlayer: state.humanPlayer,
      movesHistory: state.movesHistory,
      winner,
      isDraw,
      hintsUsed: state.hintsUsed,
      lastHintIndex: null,
      lastHintReason: null,
      elapsedSeconds: state.elapsedSeconds,
      isRunning: !winner && !isDraw,
      isAiThinking: false,
    });
  },

  placeMove: (index) => {
    const { board, currentPlayer, winner, isDraw, movesHistory } = get();
    if (winner || isDraw) return;
    if (board[index] !== 0) return;

    const nextBoard = placeStone(board, index, currentPlayer);
    const { winner: newWinner, isDraw: newIsDraw } = checkGameEnd(nextBoard, index);

    set({
      board: nextBoard,
      currentPlayer: otherPlayer(currentPlayer),
      movesHistory: [...movesHistory, index],
      winner: newWinner,
      isDraw: newIsDraw,
      isRunning: !newWinner && !newIsDraw,
      lastHintIndex: null,
      lastHintReason: null,
    });
  },

  playAiMoveIfNeeded: () => {
    const { mode, currentPlayer, humanPlayer, winner, isDraw, difficulty } = get();
    if (mode !== "ai") return;
    if (winner || isDraw) return;
    if (currentPlayer === humanPlayer) return;

    set({ isAiThinking: true });
    const aiPlayer = otherPlayer(humanPlayer);
    const delay = 300 + Math.random() * 300;

    setTimeout(() => {
      const state = get();
      if (state.winner || state.isDraw || state.currentPlayer !== aiPlayer) {
        set({ isAiThinking: false });
        return;
      }
      const move = getAiMove(state.board, aiPlayer, difficulty);
      set({ isAiThinking: false });
      if (move >= 0) get().placeMove(move);
    }, delay);
  },

  undo: () => {
    const { movesHistory, mode, winner, isDraw } = get();
    if (movesHistory.length === 0) return;
    if (winner || isDraw) return; // không undo sau khi ván đã kết thúc, bắt đầu ván mới thay vào đó

    // Chơi với AI: lùi 2 nước (của AI + của người) để giữ đúng lượt của người chơi.
    const stepsBack = mode === "ai" && movesHistory.length >= 2 ? 2 : 1;
    const newHistory = movesHistory.slice(0, -stepsBack);

    let board = createEmptyBoard();
    let player: 1 | 2 = 1;
    for (const idx of newHistory) {
      board = placeStone(board, idx, player);
      player = otherPlayer(player);
    }

    set({
      board,
      currentPlayer: player,
      movesHistory: newHistory,
      winner: null,
      isDraw: false,
      isRunning: true,
      lastHintIndex: null,
      lastHintReason: null,
    });
  },

  useHint: () => {
    const { board, currentPlayer, winner, isDraw } = get();
    if (winner || isDraw) return;
    const hint = getHint(board, currentPlayer);
    if (!hint) return;
    set((s) => ({
      lastHintIndex: hint.index,
      lastHintReason: hint.reason,
      hintsUsed: s.hintsUsed + 1,
    }));
  },

  tick: () => {
    if (!get().isRunning) return;
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },
}));
