import { describe, expect, it } from "vitest";
import {
  SIZE,
  createEmptyBoard,
  indexOf,
  checkWin,
  isBoardFull,
  placeStone,
  getRelevantIndices,
} from "../board";
import { getAiMove, getHint } from "../ai";
import { Board } from "../types";

function boardFromRows(rows: string[]): Board {
  // '.' = trống, 'X' = player 1, 'O' = player 2. Mỗi string dài SIZE ký tự.
  const board = createEmptyBoard();
  rows.forEach((rowStr, r) => {
    for (let c = 0; c < rowStr.length; c++) {
      const ch = rowStr[c];
      if (ch === "X") board[indexOf(r, c)] = 1;
      else if (ch === "O") board[indexOf(r, c)] = 2;
    }
  });
  return board;
}

const EMPTY_ROW = ".".repeat(SIZE);

describe("board basics", () => {
  it("createEmptyBoard has correct size, all empty", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(SIZE * SIZE);
    expect(board.every((v) => v === 0)).toBe(true);
  });

  it("isBoardFull is false for empty/partial board, true when full", () => {
    const board = createEmptyBoard();
    expect(isBoardFull(board)).toBe(false);
    const full = board.map(() => 1) as Board;
    expect(isBoardFull(full)).toBe(true);
  });

  it("placeStone does not mutate the original board", () => {
    const board = createEmptyBoard();
    const next = placeStone(board, 10, 1);
    expect(board[10]).toBe(0);
    expect(next[10]).toBe(1);
  });

  it("getRelevantIndices returns only the center on an empty board", () => {
    const board = createEmptyBoard();
    const relevant = getRelevantIndices(board, 2);
    expect(relevant).toEqual([indexOf(7, 7)]);
  });

  it("getRelevantIndices returns empty cells near existing stones", () => {
    const board = createEmptyBoard();
    board[indexOf(7, 7)] = 1;
    const relevant = getRelevantIndices(board, 1);
    // 8 ô liền kề xung quanh (7,7), tất cả đều trống.
    expect(relevant).toHaveLength(8);
    expect(relevant).not.toContain(indexOf(7, 7));
  });
});

describe("checkWin", () => {
  it("detects a horizontal win", () => {
    const rows = [EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, EMPTY_ROW];
    const board = boardFromRows(rows);
    [0, 1, 2, 3, 4].forEach((c) => (board[indexOf(2, c)] = 1));
    const result = checkWin(board, indexOf(2, 4));
    expect(result).not.toBeNull();
    expect(result?.winner).toBe(1);
    expect(result?.line).toHaveLength(5);
  });

  it("detects a vertical win", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3, 4].forEach((r) => (board[indexOf(r, 3)] = 2));
    const result = checkWin(board, indexOf(4, 3));
    expect(result?.winner).toBe(2);
  });

  it("detects a diagonal win (down-right)", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3, 4].forEach((i) => (board[indexOf(i, i)] = 1));
    const result = checkWin(board, indexOf(4, 4));
    expect(result?.winner).toBe(1);
  });

  it("detects an anti-diagonal win (down-left)", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3, 4].forEach((i) => (board[indexOf(i, 4 - i)] = 2));
    const result = checkWin(board, indexOf(4, 0));
    expect(result?.winner).toBe(2);
  });

  it("does not count 4-in-a-row (not enough stones) as a win", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3].forEach((c) => (board[indexOf(0, c)] = 1));
    const result = checkWin(board, indexOf(0, 3));
    expect(result).toBeNull();
  });

  it("returns null when checking an empty cell", () => {
    const board = createEmptyBoard();
    expect(checkWin(board, 0)).toBeNull();
  });

  it("counts 6-in-a-row (overline) as a win under freestyle rules", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3, 4, 5].forEach((c) => (board[indexOf(0, c)] = 1));
    const result = checkWin(board, indexOf(0, 5));
    expect(result?.winner).toBe(1);
    expect(result?.line.length).toBeGreaterThanOrEqual(5);
  });
});

describe("getAiMove", () => {
  it("always returns an empty cell", () => {
    const board = createEmptyBoard();
    board[indexOf(7, 7)] = 1;
    const move = getAiMove(board, 2, "medium");
    expect(board[move]).toBe(0);
  });

  it("takes an immediate winning move when available (any difficulty)", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3].forEach((c) => (board[indexOf(5, c)] = 1));
    // Cả 2 đầu đều mở — nước thắng là (5,4) hoặc (5,-1) invalid, dùng (5,4).
    const move = getAiMove(board, 1, "hard");
    const trial = placeStone(board, move, 1);
    expect(checkWin(trial, move)?.winner).toBe(1);
  });

  it("blocks an immediate opponent win on medium/hard difficulty", () => {
    const board = createEmptyBoard();
    // O đã có 4 quân liên tiếp mở 1 đầu, X (AI) phải chặn.
    [1, 2, 3, 4].forEach((c) => (board[indexOf(5, c)] = 2));
    board[indexOf(5, 0)] = 0;
    board[indexOf(5, 5)] = 0;
    const move = getAiMove(board, 1, "hard");
    expect([indexOf(5, 0), indexOf(5, 5)]).toContain(move);
  });

  it("hard difficulty finishes within a reasonable time budget on a busy board", () => {
    // Dựng 1 bàn cờ khá nhiều quân quanh trung tâm để mô phỏng trường hợp
    // AI phải duyệt nhiều ứng viên — vẫn phải trả lời nhanh nhờ node budget.
    const board = createEmptyBoard();
    let toggle = 1;
    for (let r = 5; r <= 9; r++) {
      for (let c = 5; c <= 9; c++) {
        if ((r + c) % 3 === 0) continue; // chừa vài ô trống
        board[indexOf(r, c)] = toggle as 1 | 2;
        toggle = toggle === 1 ? 2 : 1;
      }
    }
    const start = Date.now();
    const move = getAiMove(board, 1, "hard");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(board[move]).toBe(0);
  });
});

describe("getHint", () => {
  it("suggests the winning move when one is available", () => {
    const board = createEmptyBoard();
    [0, 1, 2, 3].forEach((c) => (board[indexOf(5, c)] = 1));
    const hint = getHint(board, 1);
    expect(hint).not.toBeNull();
    const trial = placeStone(board, hint!.index, 1);
    expect(checkWin(trial, hint!.index)?.winner).toBe(1);
    expect(hint!.reason.length).toBeGreaterThan(0);
  });

  it("suggests blocking when the opponent is about to win", () => {
    const board = createEmptyBoard();
    [1, 2, 3, 4].forEach((c) => (board[indexOf(5, c)] = 2));
    const hint = getHint(board, 1);
    expect(hint).not.toBeNull();
    expect([indexOf(5, 0), indexOf(5, 5)]).toContain(hint!.index);
  });

  it("returns a hint targeting an empty cell on a mostly-empty board", () => {
    const board = createEmptyBoard();
    const hint = getHint(board, 1);
    expect(hint).not.toBeNull();
    expect(board[hint!.index]).toBe(0);
  });
});
