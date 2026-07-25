import { describe, expect, it } from "vitest";
import { BoardState, Color, Piece, PieceType } from "../engine/types";
import {
  createInitialBoard,
  getLegalMoves,
  isCheckmateOrStalemate,
  isFlyingGeneral,
  isKingInCheck,
} from "../engine/logic";

let idc = 0;
function mk(color: Color, type: PieceType): Piece {
  return { id: `t_${idc++}`, color, type };
}
function emptyBoard(): BoardState {
  return Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null as Piece | null));
}

describe("xiangqi engine — luật cơ bản", () => {
  it("bàn khai cuộc không phải chiếu bí cho bên Đỏ", () => {
    const board = createInitialBoard();
    expect(isCheckmateOrStalemate(board, "r")).toBe(false);
    expect(isKingInCheck(board, "r")).toBe(false);
    expect(isKingInCheck(board, "b")).toBe(false);
  });

  it("Tốt Đỏ chỉ tiến thẳng khi chưa qua sông", () => {
    const board = createInitialBoard();
    // Tốt Đỏ ở (0,6): chỉ được lên (0,5).
    const moves = getLegalMoves(board, 0, 6);
    expect(moves).toEqual([{ x: 0, y: 5 }]);
  });

  it("phát hiện 2 Tướng đối mặt (flying general)", () => {
    const board = emptyBoard();
    board[9][4] = mk("r", "k");
    board[0][4] = mk("b", "k");
    // Cùng cột 4, không có quân chắn giữa → phạm luật đối mặt Tướng.
    expect(isFlyingGeneral(board)).toBe(true);
  });

  it("không cho đi nước để lộ 2 Tướng đối mặt", () => {
    const board = emptyBoard();
    board[9][4] = mk("r", "k");
    board[0][4] = mk("b", "k");
    board[5][4] = mk("r", "r"); // Xe Đỏ chắn giữa 2 Tướng trên cột 4
    const moves = getLegalMoves(board, 4, 5);
    // Rời khỏi cột 4 sẽ để 2 Tướng đối mặt → phải bị loại.
    expect(moves.some((m) => m.x !== 4)).toBe(false);
    // Vẫn được đi dọc cột 4 (giữ vai trò chắn).
    expect(moves.some((m) => m.x === 4 && m.y === 4)).toBe(true);
  });

  it("nhận diện chiếu bí (checkmate) — Tướng Đen hết đường", () => {
    const board = emptyBoard();
    board[0][4] = mk("b", "k"); // Tướng Đen
    board[9][4] = mk("r", "k"); // Tướng Đỏ (bị Xe (4,1) chắn nên không đối mặt)
    board[1][4] = mk("r", "r"); // Xe Đỏ chiếu Tướng Đen theo cột 4
    board[1][0] = mk("r", "r"); // Xe Đỏ bảo vệ ô (4,1) theo hàng 1 (Tướng không ăn được)
    board[5][3] = mk("r", "r"); // Xe khống chế ô thoát (3,0)
    board[5][5] = mk("r", "r"); // Xe khống chế ô thoát (5,0)
    expect(isKingInCheck(board, "b")).toBe(true);
    expect(isCheckmateOrStalemate(board, "b")).toBe(true);
  });

  it("đang bị chiếu nhưng còn đường thoát thì KHÔNG phải chiếu bí", () => {
    const board = emptyBoard();
    board[0][4] = mk("b", "k");
    board[9][0] = mk("r", "k");
    board[1][4] = mk("r", "r"); // Xe chiếu theo cột, Tướng Đen có thể né sang (3,0)/(5,0)
    expect(isKingInCheck(board, "b")).toBe(true);
    expect(isCheckmateOrStalemate(board, "b")).toBe(false);
  });
});
