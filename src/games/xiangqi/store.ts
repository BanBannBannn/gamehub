import { create } from "zustand";
import { BoardState, Color, Position } from "./engine/types";
import { createInitialBoard, getLegalMoves, isCheckmateOrStalemate, isKingInCheck } from "./engine/logic";

export type GameStatus = "idle" | "playing" | "won" | "draw";

export interface XiangqiState {
  board: BoardState;
  turn: Color;
  status: GameStatus;
  winner: Color | null;
  history: string[]; // Chứa lịch sử nước đi dạng text đơn giản
  mode: "hotseat" | "online";
  onlineColor: Color | null; // màu quân của mình khi mode === "online" (host luôn là "r")

  // Settings
  timeConfig: number; // 600s = 10 phút
  redTime: number;
  blackTime: number;
  isRunning: boolean;

  // Actions
  startNewGame: (config?: { timeSeconds?: number }) => void;
  loadSavedGame: (state: Partial<XiangqiState>) => void;
  makeMove: (from: Position, to: Position) => boolean;
  undoMove: () => void;
  quitGame: () => void;
  tick: () => void;

  // --- Chế độ online ---
  startOnlineGame: (color: Color, timeSeconds: number) => void;
  /**
   * Ghi đè state cục bộ bằng cách replay lại toàn bộ `moves` nhận được từ
   * phòng qua đúng `getLegalMoves` (validate từng nước đi y hệt `makeMove`
   * cục bộ) — nếu 1 nước đi nào không hợp lệ, trả về false và GIỮ NGUYÊN
   * state hiện tại thay vì áp dụng dữ liệu hỏng.
   */
  syncRemoteState: (remote: { moves: { from: Position; to: Position }[]; redTime: number; blackTime: number }) => boolean;
}

// Hàm format tọa độ để lưu history (vd: c2-c5)
const fileToChar = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const rankToNum = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"]; // 0 là hàng dưới cùng theo hiển thị, hoặc ngược lại. Tạm dùng tọa độ x, y đơn giản

function formatMove(from: Position, to: Position): string {
  return `${fileToChar[from.x]}${9 - from.y}-${fileToChar[to.x]}${9 - to.y}`;
}

// Lưu các snapshot board để có thể undo
let boardHistory: BoardState[] = [];

export const useXiangqiStore = create<XiangqiState>((set, get) => ({
  board: createInitialBoard(),
  turn: "r",
  status: "idle",
  winner: null,
  history: [],
  
  timeConfig: 600,
  redTime: 600,
  blackTime: 600,
  isRunning: false,
  mode: "hotseat",
  onlineColor: null,

  startNewGame: (config) => {
    boardHistory = [];
    const time = config?.timeSeconds || 600;
    set({
      board: createInitialBoard(),
      turn: "r",
      status: "playing",
      winner: null,
      history: [],
      timeConfig: time,
      redTime: time,
      blackTime: time,
      isRunning: false,
      mode: "hotseat",
      onlineColor: null,
    });
  },

  loadSavedGame: (state) => {
    if (state.board) {
      // Reconstruct boardHistory roughly if needed, or just disallow undo past load
      boardHistory = [];
    }
    set({ ...state });
  },

  makeMove: (from, to) => {
    const { board, turn, status } = get();
    if (status !== "playing") return false;

    const piece = board[from.y][from.x];
    if (!piece || piece.color !== turn) return false;

    const legalMoves = getLegalMoves(board, from.x, from.y);
    const isLegal = legalMoves.some(m => m.x === to.x && m.y === to.y);

    if (!isLegal) return false;

    // Save history
    boardHistory.push(board.map(r => [...r]));
    
    // Create new board
    const newBoard = board.map(r => [...r]);
    newBoard[to.y][to.x] = piece;
    newBoard[from.y][from.x] = null;

    const nextTurn: Color = turn === "r" ? "b" : "r";
    const moveStr = formatMove(from, to);

    // Check game over
    let newStatus: GameStatus = status;
    let newWinner = null;
    let newIsRunning = true; // Timer starts/keeps running on move

    if (isCheckmateOrStalemate(newBoard, nextTurn)) {
      newStatus = "won";
      newWinner = turn; // Current turn won
      newIsRunning = false;
    }

    set((state) => ({
      board: newBoard,
      turn: nextTurn,
      history: [...state.history, moveStr],
      status: newStatus,
      winner: newWinner,
      isRunning: newIsRunning,
    }));

    return true;
  },

  undoMove: () => {
    const { status, history, mode } = get();
    // Cannot undo if game is over or no moves made
    if (status !== "playing" || boardHistory.length === 0) return;
    if (mode === "online") return; // không cho lùi nước khi chơi online với người thật

    const prevBoard = boardHistory.pop()!;
    
    set((state) => ({
      board: prevBoard,
      turn: state.turn === "r" ? "b" : "r",
      history: state.history.slice(0, -1),
    }));
  },

  quitGame: () => {
    set({ status: "idle", isRunning: false });
  },

  tick: () => {
    const { isRunning, turn, redTime, blackTime, status } = get();
    if (!isRunning || status !== "playing") return;

    if (turn === "r") {
      if (redTime <= 1) {
        set({ status: "won", winner: "b", isRunning: false, redTime: 0 });
      } else {
        set({ redTime: redTime - 1 });
      }
    } else {
      if (blackTime <= 1) {
        set({ status: "won", winner: "r", isRunning: false, blackTime: 0 });
      } else {
        set({ blackTime: blackTime - 1 });
      }
    }
  },

  startOnlineGame: (color, timeSeconds) => {
    boardHistory = [];
    set({
      board: createInitialBoard(),
      turn: "r",
      status: "playing",
      winner: null,
      history: [],
      timeConfig: timeSeconds,
      redTime: timeSeconds,
      blackTime: timeSeconds,
      isRunning: false,
      mode: "online",
      onlineColor: color,
    });
  },

  syncRemoteState: (remote) => {
    let board: BoardState = createInitialBoard();
    let turn: Color = "r";
    const historyStrs: string[] = [];

    for (const mv of remote.moves) {
      const piece = board[mv.from.y]?.[mv.from.x];
      if (!piece || piece.color !== turn) {
        console.warn("Nước đi nhận được từ phòng không hợp lệ (sai quân/lượt), bỏ qua đồng bộ.", mv);
        return false;
      }
      const legalMoves = getLegalMoves(board, mv.from.x, mv.from.y);
      const isLegal = legalMoves.some((m) => m.x === mv.to.x && m.y === mv.to.y);
      if (!isLegal) {
        console.warn("Nước đi nhận được từ phòng không hợp lệ (không đúng luật), bỏ qua đồng bộ.", mv);
        return false;
      }

      const newBoard = board.map((r) => [...r]);
      newBoard[mv.to.y][mv.to.x] = piece;
      newBoard[mv.from.y][mv.from.x] = null;
      board = newBoard;
      historyStrs.push(formatMove(mv.from, mv.to));
      turn = turn === "r" ? "b" : "r";
    }

    let status: GameStatus = "playing";
    let winner: Color | null = null;
    if (isCheckmateOrStalemate(board, turn)) {
      status = "won";
      winner = turn === "r" ? "b" : "r";
    }

    boardHistory = []; // không hỗ trợ undo xuyên suốt sau khi đồng bộ từ xa
    set({
      board,
      turn,
      history: historyStrs,
      status,
      winner,
      redTime: remote.redTime,
      blackTime: remote.blackTime,
      isRunning: status === "playing",
    });
    return true;
  },
}));
