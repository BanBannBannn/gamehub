export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 = empty
export type Grid = CellValue[]; // length 81, row-major (row * 9 + col)
export type Difficulty = "easy" | "medium" | "hard";

export interface SudokuPuzzle {
  puzzle: Grid; // starting grid with 0 for empty cells
  solution: Grid; // fully solved grid
  difficulty: Difficulty;
}

export interface HintResult {
  index: number; // 0-80
  value: CellValue;
  reason: string; // human readable explanation (Vietnamese)
}
