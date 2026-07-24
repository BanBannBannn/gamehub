import { create } from "zustand";
import { Direction, Grid } from "./engine/types";
import { canMove, createEmptyGrid, hasWon, move, spawnRandom } from "./engine/logic";

const BEST_KEY = "gamehub:2048:best";

function readBest(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
}

function writeBest(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BEST_KEY, String(v));
}

export type Status = "playing" | "won" | "lost";

export interface Game2048State {
  grid: Grid;
  score: number;
  best: number;
  status: Status;
  keepPlaying: boolean; // tiếp tục chơi sau khi đạt 2048
  newGame: () => void;
  moveDir: (dir: Direction) => void;
  continueAfterWin: () => void;
}

function freshGrid(): Grid {
  return spawnRandom(spawnRandom(createEmptyGrid()));
}

export const use2048Store = create<Game2048State>((set, get) => ({
  grid: createEmptyGrid(),
  score: 0,
  best: 0,
  status: "playing",
  keepPlaying: false,

  newGame: () => {
    set({ grid: freshGrid(), score: 0, best: readBest(), status: "playing", keepPlaying: false });
  },

  moveDir: (dir) => {
    const { grid, score, best, status, keepPlaying } = get();
    if (status === "lost") return;
    if (status === "won" && !keepPlaying) return;

    const result = move(grid, dir);
    if (!result.moved) return;

    const nextGrid = spawnRandom(result.grid);
    const nextScore = score + result.gained;
    const nextBest = Math.max(best, nextScore);
    if (nextBest > best) writeBest(nextBest);

    let nextStatus: Status = status;
    if (!keepPlaying && hasWon(nextGrid)) nextStatus = "won";
    else if (!canMove(nextGrid)) nextStatus = "lost";

    set({ grid: nextGrid, score: nextScore, best: nextBest, status: nextStatus });
  },

  continueAfterWin: () => set({ keepPlaying: true, status: "playing" }),
}));
