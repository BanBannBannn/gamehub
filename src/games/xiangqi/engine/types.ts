export type Color = "r" | "b"; // r: Red (Đỏ), b: Black (Đen)

export type PieceType = "k" | "a" | "e" | "h" | "r" | "c" | "p";
// k: General/King (Tướng/Soái)
// a: Advisor/Guard (Sĩ)
// e: Elephant/Bishop (Tượng/Tịnh)
// h: Horse/Knight (Mã)
// r: Rook/Chariot (Xe)
// c: Cannon (Pháo)
// p: Pawn/Soldier (Tốt/Binh)

export interface Piece {
  id: string; // unique id to track DOM elements
  color: Color;
  type: PieceType;
}

export interface Position {
  x: number; // 0 to 8 (Cột)
  y: number; // 0 to 9 (Hàng)
}

export type BoardState = (Piece | null)[][]; // 10 hàng, mỗi hàng 9 ô

export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
}
