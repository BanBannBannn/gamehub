import { describe, expect, it } from "vitest";
import {
  chooseAiMove,
  createBoard,
  drop,
  dropRow,
  findWinLine,
  isFull,
  validColumns,
} from "../engine/logic";
import { Board } from "../engine/types";

describe("connect4 engine — thả quân", () => {
  it("quân rơi xuống đáy cột", () => {
    const b = createBoard();
    const r = drop(b, 3, 1)!;
    expect(r.row).toBe(5);
    expect(r.board[5][3]).toBe(1);
  });

  it("quân xếp chồng lên nhau", () => {
    let b = createBoard();
    b = drop(b, 3, 1)!.board;
    const r = drop(b, 3, 2)!;
    expect(r.row).toBe(4);
    expect(r.board[4][3]).toBe(2);
  });

  it("cột đầy trả về null", () => {
    let b = createBoard();
    for (let i = 0; i < 6; i++) b = drop(b, 0, 1)!.board;
    expect(dropRow(b, 0)).toBe(-1);
    expect(drop(b, 0, 1)).toBeNull();
    expect(validColumns(b)).not.toContain(0);
  });
});

describe("connect4 engine — phát hiện thắng", () => {
  it("4 quân ngang", () => {
    let b = createBoard();
    for (const c of [0, 1, 2, 3]) b = drop(b, c, 1)!.board;
    const w = findWinLine(b);
    expect(w?.player).toBe(1);
    expect(w?.cells.length).toBe(4);
  });

  it("4 quân dọc", () => {
    let b = createBoard();
    for (let i = 0; i < 4; i++) b = drop(b, 2, 2)!.board;
    expect(findWinLine(b)?.player).toBe(2);
  });

  it("4 quân chéo", () => {
    // Dựng thế chéo cho người chơi 1.
    let b = createBoard();
    b = drop(b, 0, 1)!.board;
    b = drop(b, 1, 2)!.board;
    b = drop(b, 1, 1)!.board;
    b = drop(b, 2, 2)!.board;
    b = drop(b, 2, 2)!.board;
    b = drop(b, 2, 1)!.board;
    b = drop(b, 3, 2)!.board;
    b = drop(b, 3, 2)!.board;
    b = drop(b, 3, 2)!.board;
    b = drop(b, 3, 1)!.board;
    expect(findWinLine(b)?.player).toBe(1);
  });

  it("bàn mới chưa ai thắng", () => {
    expect(findWinLine(createBoard())).toBeNull();
    expect(isFull(createBoard())).toBe(false);
  });
});

describe("connect4 engine — AI", () => {
  it("AI đi nước thắng khi có thể", () => {
    let b = createBoard();
    for (const c of [0, 1, 2]) b = drop(b, c, 1)!.board; // 1 có 3 quân hàng ngang 0-1-2
    expect(chooseAiMove(b, 1, () => 0)).toBe(3);
  });

  it("AI chặn nước thắng của đối thủ", () => {
    let b = createBoard();
    for (const c of [0, 1, 2]) b = drop(b, c, 1)!.board; // đối thủ (1) sắp thắng ở cột 3
    expect(chooseAiMove(b, 2, () => 0)).toBe(3);
  });

  it("AI trả cột hợp lệ trên bàn trống (ưu tiên giữa)", () => {
    const b: Board = createBoard();
    const move = chooseAiMove(b, 1, () => 0);
    expect(move).toBe(3); // cột giữa
  });
});
