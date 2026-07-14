import { create } from "zustand";
import {
  Difficulty,
  Board,
  BoardConfig,
  DIFFICULTY_CONFIG,
} from "@/games/minesweeper/engine/types";
import {
  createEmptyBoard,
  placeMinesAvoiding,
  revealCell,
  toggleFlag,
  isWin,
  countRemainingFlags,
  revealAllMines,
} from "@/games/minesweeper/engine/board";
import { getHint } from "@/games/minesweeper/engine/hint";

export type GameStatus = "idle" | "playing" | "won" | "lost";

export interface MinesweeperState {
  board: Board;
  config: BoardConfig;
  difficulty: Difficulty;
  status: GameStatus;
  firstClickDone: boolean;
  hintsUsed: number;
  lastHintIndex: number | null;
  lastHintReason: string | null;
  elapsedSeconds: number;
  isRunning: boolean;

  // Actions
  startNewGame: (difficulty: Difficulty) => void;
  loadSavedGame: (savedState: Partial<MinesweeperState>) => void;
  revealCell: (index: number) => void;
  toggleFlag: (index: number) => void;
  useHint: () => void;
  tick: () => void;
}

export const useMinesweeperStore = create<MinesweeperState>((set, get) => ({
  board: [],
  config: DIFFICULTY_CONFIG.easy,
  difficulty: "easy",
  status: "idle",
  firstClickDone: false,
  hintsUsed: 0,
  lastHintIndex: null,
  lastHintReason: null,
  elapsedSeconds: 0,
  isRunning: false,

  startNewGame: (difficulty) => {
    const config = DIFFICULTY_CONFIG[difficulty];
    set({
      board: createEmptyBoard(config),
      config,
      difficulty,
      status: "playing",
      firstClickDone: false,
      hintsUsed: 0,
      lastHintIndex: null,
      lastHintReason: null,
      elapsedSeconds: 0,
      isRunning: false, // Timer starts on first click
    });
  },

  loadSavedGame: (savedState) => {
    set({
      ...savedState,
      isRunning: savedState.status === "playing",
    });
  },

  revealCell: (index) => {
    const { board, config, status, firstClickDone } = get();

    if (status !== "playing" || board[index].isFlagged || board[index].isRevealed) {
      return;
    }

    let currentBoard = board;

    // First click logic
    if (!firstClickDone) {
      currentBoard = placeMinesAvoiding(currentBoard, config, index);
      set({ firstClickDone: true, isRunning: true });
    }

    // Attempt reveal
    const newBoard = revealCell(currentBoard, index, config);
    const clickedCell = newBoard[index];

    if (clickedCell.isMine) {
      // Game Over
      set({
        board: revealAllMines(newBoard),
        status: "lost",
        isRunning: false,
        lastHintReason: null,
      });
      return;
    }

    // Check Win
    if (isWin(newBoard)) {
      set({
        board: newBoard,
        status: "won",
        isRunning: false,
        lastHintReason: null,
      });
      return;
    }

    // Continue
    set({ board: newBoard, lastHintReason: null });
  },

  toggleFlag: (index) => {
    const { board, status } = get();
    if (status !== "playing") return;
    
    set({
      board: toggleFlag(board, index),
      lastHintReason: null,
    });
  },

  useHint: () => {
    const { board, config, status, hintsUsed, firstClickDone } = get();
    if (status !== "playing") return;

    if (!firstClickDone) {
      set({ lastHintReason: "Hãy mở ô đầu tiên bất kỳ, ô đó luôn an toàn!" });
      return;
    }

    const hint = getHint(board, config);
    if (!hint) {
      set({ lastHintReason: "Không tìm thấy gợi ý nào khả thi!" });
      return;
    }

    set({
      hintsUsed: hintsUsed + 1,
      lastHintIndex: hint.index,
      lastHintReason: hint.reason,
    });

    if (hint.action === "reveal") {
      get().revealCell(hint.index);
    } else if (hint.action === "flag") {
      get().toggleFlag(hint.index);
    }
  },

  tick: () => {
    const { isRunning, elapsedSeconds } = get();
    if (isRunning) {
      set({ elapsedSeconds: elapsedSeconds + 1 });
    }
  },
}));
