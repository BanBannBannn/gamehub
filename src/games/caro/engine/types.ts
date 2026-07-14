export type CellValue = 0 | 1 | 2; // 0 trống, 1 = X, 2 = O
export type Board = CellValue[]; // length 225 (15x15), row-major
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "ai" | "hotseat";

export interface WinResult {
  winner: 1 | 2;
  line: number[]; // các chỉ số ô tạo thành đường thắng (>=5 ô liên tiếp)
}

export interface HintResult {
  index: number;
  reason: string;
}
