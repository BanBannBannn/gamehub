export type Difficulty = "easy" | "medium" | "hard";

export interface CellState {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number; // 0-8, only meaningful when isMine = false
}

export type Board = CellState[]; // length = rows * cols, row-major

export interface BoardConfig {
  rows: number;
  cols: number;
  mineCount: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, BoardConfig> = {
  easy: { rows: 9, cols: 9, mineCount: 10 },
  medium: { rows: 16, cols: 16, mineCount: 40 },
  hard: { rows: 16, cols: 30, mineCount: 99 },
};
