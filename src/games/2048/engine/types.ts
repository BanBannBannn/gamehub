/** Lưới 4x4. Ô trống = 0, còn lại là giá trị số (2, 4, 8, ...). */
export type Grid = number[][];

export type Direction = "left" | "right" | "up" | "down";

export const SIZE = 4;
export const WIN_VALUE = 2048;

export interface MoveResult {
  grid: Grid;
  /** Điểm cộng thêm từ các lần gộp trong nước đi này. */
  gained: number;
  /** Nước đi có làm lưới thay đổi không (nếu không, không được sinh ô mới). */
  moved: boolean;
}
