/** Ô trống = 0, người chơi 1 hoặc 2. Bàn 6 hàng x 7 cột, board[row][col], row 0 ở trên cùng. */
export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];

export const ROWS = 6;
export const COLS = 7;
export const CONNECT = 4;

export interface WinLine {
  player: Player;
  cells: { r: number; c: number }[];
}
