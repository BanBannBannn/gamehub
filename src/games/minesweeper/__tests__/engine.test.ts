import { describe, test, expect } from "vitest";
import { createEmptyBoard, placeMinesAvoiding, revealCell, isWin } from "../engine/board";
import { BoardConfig } from "../engine/types";

describe("Minesweeper Engine", () => {
  const config: BoardConfig = { rows: 9, cols: 9, mineCount: 10 };

  test("placeMinesAvoiding never places mines on safeIndex or its neighbors", () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      let board = createEmptyBoard(config);
      // center cell
      const safeIndex = 4 * 9 + 4; // row 4, col 4
      board = placeMinesAvoiding(board, config, safeIndex);

      // Check safe index
      expect(board[safeIndex].isMine).toBe(false);

      // Check neighbors
      const neighbors = [-10, -9, -8, -1, 1, 8, 9, 10];
      for (const d of neighbors) {
        expect(board[safeIndex + d].isMine).toBe(false);
      }

      const totalMines = board.filter((c) => c.isMine).length;
      expect(totalMines).toBe(config.mineCount);
    }
  });

  test("revealCell flood fills correctly and stops at numbers > 0", () => {
    // 3x3 board for simplicity
    const smallConfig: BoardConfig = { rows: 3, cols: 3, mineCount: 1 };
    let board = createEmptyBoard(smallConfig);
    // Force a mine at [2, 2] (index 8)
    board[8].isMine = true;
    board[8].adjacentMines = 0;
    
    // Set adjacent mines
    // [0, 0, 0]
    // [0, 1, 1]
    // [0, 1, M]
    board[4].adjacentMines = 1;
    board[5].adjacentMines = 1;
    board[7].adjacentMines = 1;

    // reveal at [0, 0] (index 0) which is 0
    board = revealCell(board, 0, smallConfig);

    expect(board[0].isRevealed).toBe(true);
    expect(board[1].isRevealed).toBe(true);
    expect(board[2].isRevealed).toBe(true);
    expect(board[3].isRevealed).toBe(true);
    expect(board[4].isRevealed).toBe(true);
    expect(board[5].isRevealed).toBe(true);
    expect(board[6].isRevealed).toBe(true);
    expect(board[7].isRevealed).toBe(true);
    // Mine is unrevealed
    expect(board[8].isRevealed).toBe(false);
  });

  test("revealCell does not open flagged cells", () => {
    let board = createEmptyBoard(config);
    board[0].isFlagged = true;
    board = revealCell(board, 0, config);
    expect(board[0].isRevealed).toBe(false);
  });

  test("isWin returns true only when all non-mine cells are revealed", () => {
    let board = createEmptyBoard(config);
    board = placeMinesAvoiding(board, config, 0);

    expect(isWin(board)).toBe(false);

    // Reveal all non-mine cells
    board.forEach((cell, idx) => {
      if (!cell.isMine) {
        board[idx].isRevealed = true;
      }
    });

    expect(isWin(board)).toBe(true);
  });

  test("performance: flood fill on 16x30 board runs < 50ms", () => {
    const hardConfig: BoardConfig = { rows: 16, cols: 30, mineCount: 0 };
    let board = createEmptyBoard(hardConfig);
    // 0 mines, so revealing one will flood fill the entire board.

    const start = performance.now();
    board = revealCell(board, 0, hardConfig);
    const end = performance.now();

    const duration = end - start;
    expect(duration).toBeLessThan(50); // should be almost instant, way less than 50ms
    
    // Check all are revealed
    expect(board.every(c => c.isRevealed)).toBe(true);
  });
});
