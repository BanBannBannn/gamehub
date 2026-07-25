import { describe, expect, it } from "vitest";
import {
  checkOver,
  chooseAiMove,
  countDiscs,
  createBoard,
  flipsFor,
  legalMoves,
  place,
} from "../engine/logic";

describe("reversi engine", () => {
  it("bàn khai cuộc có 2 đen 2 trắng ở giữa", () => {
    const b = createBoard();
    expect(countDiscs(b)).toEqual({ 1: 2, 2: 2 });
    expect(b[3][3]).toBe(2);
    expect(b[3][4]).toBe(1);
  });

  it("Đen có đúng 4 nước đi hợp lệ lúc khai cuộc", () => {
    const b = createBoard();
    expect(legalMoves(b, 1).length).toBe(4);
    // Một trong số đó là (2,3).
    expect(legalMoves(b, 1)).toContainEqual({ r: 2, c: 3 });
  });

  it("đặt quân lật đúng quân đối phương", () => {
    const b = createBoard();
    const flips = flipsFor(b, 2, 3, 1); // Đen đặt (2,3) lật (3,3)
    expect(flips).toContainEqual({ r: 3, c: 3 });
    const after = place(b, 2, 3, 1)!;
    expect(after[3][3]).toBe(1); // đã bị lật thành Đen
    expect(after[2][3]).toBe(1);
    expect(countDiscs(after)).toEqual({ 1: 4, 2: 1 });
  });

  it("nước đi không lật được quân nào là không hợp lệ", () => {
    const b = createBoard();
    expect(flipsFor(b, 0, 0, 1)).toEqual([]);
    expect(place(b, 0, 0, 1)).toBeNull();
  });

  it("checkOver: bàn khai cuộc chưa kết thúc", () => {
    expect(checkOver(createBoard()).over).toBe(false);
  });

  it("checkOver: bàn kín toàn Đen → Đen thắng", () => {
    const b = createBoard().map((row) => row.map(() => 1 as const));
    const res = checkOver(b);
    expect(res.over).toBe(true);
    expect(res.winner).toBe(1);
  });

  it("AI chọn nước hợp lệ, ưu tiên góc khi có", () => {
    const b = createBoard();
    const move = chooseAiMove(b, 1, () => 0);
    expect(move).not.toBeNull();
    expect(legalMoves(b, 1)).toContainEqual(move!);
  });
});
