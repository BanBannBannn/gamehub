import { create } from "zustand";
import { Board, Disc } from "./engine/logic";
import { checkOver, chooseAiMove, countDiscs, createBoard, legalMoves, opponent, place } from "./engine/logic";

export type Mode = "hotseat" | "ai";
export type Status = "idle" | "playing" | "over";

export interface ReversiState {
  board: Board;
  current: Disc;
  status: Status;
  winner: Disc | null;
  mode: Mode;
  aiPlayer: Disc | null;
  passed: boolean; // lượt vừa rồi có ai đó bị bỏ lượt (không có nước đi)
  counts: { 1: number; 2: number };

  startNewGame: (mode: Mode, opts?: { aiPlayer?: Disc }) => void;
  playAt: (r: number, c: number) => boolean;
  aiStep: () => void;
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
  passed: false,
  counts: { 1: 2, 2: 2 },

  startNewGame: (mode, opts) => {
    const board = createBoard();
    set({
      board,
      current: 1,
      status: "playing",
      winner: null,
      mode,
      aiPlayer: mode === "ai" ? opts?.aiPlayer ?? 2 : null,
      passed: false,
      counts: countDiscs(board),
    });
  },

  playAt: (r, c) => {
    const { board, current, status } = get();
    if (status !== "playing") return false;
    const next = place(board, r, c, current);
    if (!next) return false;
    const turn = resolveTurn(next, current);
    set({ board: next, counts: countDiscs(next), ...turn });
    return true;
  },

  aiStep: () => {
    const { board, current, status, mode, aiPlayer } = get();
    if (mode !== "ai" || status !== "playing" || current !== aiPlayer) return;
    const move = chooseAiMove(board, aiPlayer);
    if (move) get().playAt(move.r, move.c);
  },
}));
