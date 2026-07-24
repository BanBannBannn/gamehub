import { create } from "zustand";
import { Board, Player, WinLine } from "./engine/types";
import { chooseAiMove, createBoard, drop, findWinLine, isFull, opponent } from "./engine/logic";

export type Mode = "hotseat" | "ai" | "online";
export type Status = "idle" | "playing" | "won" | "draw";

export interface Connect4State {
  board: Board;
  current: Player;
  status: Status;
  winner: Player | null;
  winLine: WinLine | null;
  lastDrop: { r: number; c: number } | null;
  mode: Mode;
  aiPlayer: Player | null; // quân do máy điều khiển (mode 'ai')
  onlinePlayer: Player | null; // quân của mình (mode 'online')
  movesHistory: number[]; // danh sách cột đã thả, dùng để đồng bộ online

  startNewGame: (mode: Exclude<Mode, "online">, opts?: { aiPlayer?: Player }) => void;
  dropAt: (col: number) => boolean;
  aiStep: () => void;

  // --- online ---
  startOnlineGame: (player: Player) => void;
  syncRemoteBoard: (remote: { movesHistory: number[]; humanPlayer: Player }) => boolean;
  applyOnlineResult: (params: { resignedPlayer?: Player; isDrawAgreed?: boolean }) => void;
}

function applyMove(board: Board, col: number, player: Player) {
  const res = drop(board, col, player);
  if (!res) return null;
  const win = findWinLine(res.board);
  return {
    board: res.board,
    lastDrop: { r: res.row, c: col },
    win,
    full: isFull(res.board),
  };
}

export const useConnect4Store = create<Connect4State>((set, get) => ({
  board: createBoard(),
  current: 1,
  status: "idle",
  winner: null,
  winLine: null,
  lastDrop: null,
  mode: "hotseat",
  aiPlayer: null,
  onlinePlayer: null,
  movesHistory: [],

  startNewGame: (mode, opts) => {
    set({
      board: createBoard(),
      current: 1,
      status: "playing",
      winner: null,
      winLine: null,
      lastDrop: null,
      mode,
      aiPlayer: mode === "ai" ? opts?.aiPlayer ?? 2 : null,
      onlinePlayer: null,
      movesHistory: [],
    });
  },

  dropAt: (col) => {
    const { board, current, status } = get();
    if (status !== "playing") return false;
    const applied = applyMove(board, col, current);
    if (!applied) return false;

    set({
      board: applied.board,
      lastDrop: applied.lastDrop,
      movesHistory: [...get().movesHistory, col],
      current: opponent(current),
      status: applied.win ? "won" : applied.full ? "draw" : "playing",
      winner: applied.win ? applied.win.player : null,
      winLine: applied.win ?? null,
    });
    return true;
  },

  aiStep: () => {
    const { board, current, status, mode, aiPlayer } = get();
    if (mode !== "ai" || status !== "playing" || current !== aiPlayer) return;
    const col = chooseAiMove(board, aiPlayer);
    if (col >= 0) get().dropAt(col);
  },

  startOnlineGame: (player) => {
    set({
      board: createBoard(),
      current: 1,
      status: "playing",
      winner: null,
      winLine: null,
      lastDrop: null,
      mode: "online",
      aiPlayer: null,
      onlinePlayer: player,
      movesHistory: [],
    });
  },

  syncRemoteBoard: (remote) => {
    let board = createBoard();
    let current: Player = 1;
    for (const col of remote.movesHistory) {
      const applied = applyMove(board, col, current);
      if (!applied) {
        console.warn("Nước đi Bốn quân nhận từ phòng không hợp lệ, bỏ qua đồng bộ.", col);
        return false;
      }
      board = applied.board;
      current = opponent(current);
    }
    const win = findWinLine(board);
    set({
      board,
      current,
      movesHistory: [...remote.movesHistory],
      onlinePlayer: remote.humanPlayer,
      mode: "online",
      lastDrop: null,
      status: win ? "won" : isFull(board) ? "draw" : "playing",
      winner: win ? win.player : null,
      winLine: win ?? null,
    });
    return true;
  },

  applyOnlineResult: (params) => {
    if (params.resignedPlayer) {
      set({ status: "won", winner: opponent(params.resignedPlayer), winLine: null });
    } else if (params.isDrawAgreed) {
      set({ status: "draw", winner: null, winLine: null });
    }
  },
}));
