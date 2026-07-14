import { describe, expect, it } from "vitest";
import { generatePuzzle, generateSolvedGrid } from "../generator";
import { countSolutions, solve } from "../solver";
import { findConflicts, isComplete, isSafe } from "../validator";
import { getHint } from "../hint";
import { Grid } from "../types";

function isFullyValidSolution(grid: Grid): boolean {
  if (grid.some((v) => v === 0)) return false;
  return findConflicts(grid).size === 0;
}

describe("generateSolvedGrid", () => {
  it("produces a complete, conflict-free 81-cell grid", () => {
    const grid = generateSolvedGrid();
    expect(grid).toHaveLength(81);
    expect(isFullyValidSolution(grid)).toBe(true);
  });

  it("produces different grids across generations (randomized)", () => {
    const a = generateSolvedGrid();
    const b = generateSolvedGrid();
    expect(a).not.toEqual(b);
  });
});

describe("generatePuzzle", () => {
  (["easy", "medium", "hard"] as const).forEach((difficulty) => {
    it(`generates a ${difficulty} puzzle with a UNIQUE solution`, () => {
      const { puzzle, solution } = generatePuzzle(difficulty);
      expect(puzzle).toHaveLength(81);
      expect(isFullyValidSolution(solution)).toBe(true);
      expect(countSolutions(puzzle, 2)).toBe(1);

      // The puzzle's clues must match the solution exactly.
      puzzle.forEach((value, i) => {
        if (value !== 0) {
          expect(value).toBe(solution[i]);
        }
      });

      // Solving the puzzle independently must yield the same solution.
      const solved = solve(puzzle);
      expect(solved).toEqual(solution);
    });
  });

  it("harder difficulty has fewer or equal givens than easier difficulty", () => {
    const easy = generatePuzzle("easy");
    const hard = generatePuzzle("hard");
    const givens = (g: Grid) => g.filter((v) => v !== 0).length;
    expect(givens(hard.puzzle)).toBeLessThanOrEqual(givens(easy.puzzle));
  });
});

describe("validator", () => {
  it("detects row conflicts", () => {
    const grid = new Array(81).fill(0) as Grid;
    grid[0] = 5;
    grid[1] = 5; // same row, duplicate
    const conflicts = findConflicts(grid);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(1)).toBe(true);
  });

  it("detects column conflicts", () => {
    const grid = new Array(81).fill(0) as Grid;
    grid[0] = 7;
    grid[9] = 7; // same column, duplicate
    const conflicts = findConflicts(grid);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(9)).toBe(true);
  });

  it("detects box conflicts", () => {
    const grid = new Array(81).fill(0) as Grid;
    grid[0] = 3;
    grid[10] = 3; // same 3x3 box, duplicate
    const conflicts = findConflicts(grid);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(10)).toBe(true);
  });

  it("isSafe rejects a value that already exists in a peer", () => {
    const grid = new Array(81).fill(0) as Grid;
    grid[0] = 4;
    expect(isSafe(grid, 1, 4)).toBe(false); // same row
    expect(isSafe(grid, 1, 5)).toBe(true);
  });

  it("isComplete is true only for a full, conflict-free grid", () => {
    const solved = generateSolvedGrid();
    expect(isComplete(solved)).toBe(true);

    const incomplete = [...solved];
    incomplete[0] = 0;
    expect(isComplete(incomplete)).toBe(false);
  });
});

describe("solver", () => {
  it("solves a puzzle back to a valid complete grid", () => {
    const { puzzle } = generatePuzzle("medium");
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    expect(isFullyValidSolution(solved as Grid)).toBe(true);
  });

  it("returns null for a genuinely unsolvable grid (a cell with zero candidates)", () => {
    // Fill an entire row with 8 of the 9 digits, and box-constrain the
    // 9th remaining cell's box so that cell has zero valid candidates.
    const grid = new Array(81).fill(0) as Grid;
    // Row 0: cells 0-7 get digits 1-8, cell 8 left empty.
    for (let i = 0; i < 8; i++) grid[i] = (i + 1) as Grid[number];
    // Force the box containing cell 8 (top-right box: cells 6,7,8,15,16,17,24,25,26)
    // to also contain digit 9 elsewhere, so cell 8 can't take 9 either.
    grid[17] = 9; // same box as cell 8, not same row/col as any row-0 clue
    expect(solve(grid)).toBeNull();
  });

  it("bounds runaway search on a pathological grid instead of hanging (node budget)", () => {
    // Two identical givens sharing a row/box do not create an immediate
    // zero-candidate cell, but naive backtracking without constraint
    // propagation can still blow up combinatorially trying to fill the
    // rest of the board. The node budget must guarantee this returns
    // quickly rather than hanging indefinitely.
    const grid = new Array(81).fill(0) as Grid;
    grid[0] = 5;
    grid[1] = 5;
    const start = Date.now();
    const result = solve(grid, 50_000); // small budget for a fast test
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(5000);
    expect(result).toBeNull();
  });

  it("countSolutions correctly counts a grid with multiple solutions", () => {
    // An almost-empty grid has many solutions; should hit the limit fast.
    const grid = new Array(81).fill(0) as Grid;
    expect(countSolutions(grid, 2)).toBe(2);
  });
});

describe("getHint", () => {
  it("never suggests a value that conflicts with existing peers", () => {
    const { puzzle } = generatePuzzle("easy");
    const hint = getHint(puzzle);
    expect(hint).not.toBeNull();
    if (hint) {
      expect(isSafe(puzzle, hint.index, hint.value)).toBe(true);
      expect(puzzle[hint.index]).toBe(0); // must target an empty cell
      expect(hint.reason.length).toBeGreaterThan(0);
    }
  });

  it("suggested value always matches the true solution", () => {
    const { puzzle, solution } = generatePuzzle("hard");
    const hint = getHint(puzzle);
    expect(hint).not.toBeNull();
    if (hint) {
      expect(hint.value).toBe(solution[hint.index]);
    }
  });

  it("returns null on a fully solved grid (no empty cells)", () => {
    const solved = generateSolvedGrid();
    expect(getHint(solved)).toBeNull();
  });
});
