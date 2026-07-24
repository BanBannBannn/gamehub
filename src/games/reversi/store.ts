import { create } from "zustand";
import { Board, Disc, SIZE } from "./engine/logic";
import { checkOver, chooseAiMove, countDiscs, createBoard, legalMoves, opponent, place } from "./engine/logic";

export type Mode = "hotseat" | "ai" | "online";
export type Status = "idle" | "playing" | "over";

export interface ReversiState {
  board: Board;
  current: Disc;
  status: Status;
  winner: Disc | null;
  mode: Mode;
  aiPlayer: Disc | null;
  onlinePlayer: Disc | null;
  passed: boolean; // lượt vừa rồi có ai đó bị bỏ lượt (không có nước đi)
  counts: { 1: number; 2: number };
  movesHistory: number[]; // ô đã đánh (r*SIZE+c), dùng đồng bộ online

  startNewGame: (mode: Exclude<Mode, "online">, opts?: { aiPlayer?: Disc }) => void;
  playAt: (r: number, c: number) => boolean;
  aiStep: () => void;

  // --- online ---
  startOnlineGame: (player: Disc) => void;
  syncRemoteBoard: (remote: { movesHistory: number[]; humanPlayer: Disc }) => boolean;
  applyOnlineResult: (params: { resignedPlayer?: Disc; isDrawAgreed?: boolean }) => void;
}

function resolveTurn(board: Board, justMoved: Disc): { current: Disc; status: Status; winner: Disc | null; passed: boolean } {
  const next = opponent(justMoved);
  if (legalMoves(board, next).length > 0) {
    return { current: next, status: "playing", winner: null, passed: false };
  }
  // Đối thủ không có nước đi → bỏ lượt, quay lại người vừa đi (nếu còn nước).
  if (legalMoves(board, justMoved).length > 0) {
    return { current: justMoved, status: "playing", winner: null, passed: true };
  }
  const res = checkOver(board);
  return { current: next, status: "over", winner: res.winner, passed: false };
}

export const useReversiStore = create<ReversiState>((set, get) => ({
  board: createBoard(),
  current: 1,
  status: "idle",
  winner: null,
  mode: "hotseat",
  aiPlayer: null,
  onlinePlayer: null,
  passed: false,
  counts: { 1: 2, 2: 2 },
  movesHistory: [],

  startNewGame: (mode, opts) => {
    const board = createBoard();
    set({
      board,
      current: 1,
      status: "playing",
      winner: null,
      mode,
      aiPlayer: mode === "ai" ? opts?.aiPlayer ?? 2 : null,
      onlinePlayer: null,
      passed: false,
      counts: countDiscs(board),
      movesHistory: [],
    });
  },

  playAt: (r, c) => {
    const { board, current, status } = get();
    if (status !== "playing") return false;
    const next = place(board, r, c, current);
    if (!next) return false;
    const turn = resolveTurn(next, current);
    set({ board: next, counts: countDiscs(next), movesHistory: [...get().movesHistory, r * SIZE + c], ...turn });
    return true;
  },

  aiStep: () => {
    const { board, current, status, mode, aiPlayer } = get();
    if (mode !== "ai" || status !== "playing" || current !== aiPlayer) return;
    const move = chooseAiMove(board, aiPlayer);
    if (move) get().playAt(move.r, move.c);
  },

  startOnlineGame: (player) => {
    const board = createBoard();
    set({
      board,
      current: 1,
      status: "playing",
      winner: null,
      mode: "online",
      aiPlayer: null,
      onlinePlayer: player,
      passed: false,
      counts: countDiscs(board),
      movesHistory: [],
    });
  },

  syncRemoteBoard: (remote) => {
    let board = createBoard();
    let current: Disc = 1;
    for (const cell of remote.movesHistory) {
      const r = Math.floor(cell / SIZE);
      const c = cell % SIZE;
      const next = place(board, r, c, current);
      if (!next) {
        console.warn("Nước đi Reversi nhận từ phòng không hợp lệ, bỏ qua đồng bộ.", cell);
        return false;
      }
      board = next;
      current = resolveTurn(board, current).current;
    }
    const over = checkOver(board);
    set({
      board,
      current,
      movesHistory: [...remote.movesHistory],
      onlinePlayer: remote.humanPlayer,
      mode: "online",
      counts: countDiscs(board),
      status: over.over ? "over" : "playing",
      winner: over.winner,
      passed: false,
    });
    return true;
  },

  applyOnlineResult: (params) => {
    if (params.resignedPlayer) {
      set({ status: "over", winner: opponent(params.resignedPlayer) });
    } else if (params.isDrawAgreed) {
      set({ status: "over", winner: null });
    }
  },
}));
