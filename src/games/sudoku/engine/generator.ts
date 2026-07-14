import { CellValue, Difficulty, Grid, SudokuPuzzle } from "./types";
import { candidatesFor } from "./validator";
import { countSolutions } from "./solver";

const EMPTY_GRID: Grid = new Array(81).fill(0) as Grid;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates a fully solved, valid 9x9 Sudoku grid using randomized
 * backtracking (candidates are shuffled so each generation differs).
 */
export function generateSolvedGrid(): Grid {
  const grid = [...EMPTY_GRID];

  function fillCell(pos: number): boolean {
    if (pos === 81) return true;
    if (grid[pos] !== 0) return fillCell(pos + 1);

    const candidates = shuffle(candidatesFor(grid, pos));
    for (const value of candidates) {
      grid[pos] = value;
      if (fillCell(pos + 1)) return true;
      grid[pos] = 0;
    }
    return false;
  }

  fillCell(0);
  return grid;
}

// Roughly how many cells to remove (out of 81) per difficulty.
// Fewer givens = harder. These are conservative counts that keep
// generation time reasonable while still using the unique-solution check.
const REMOVE_TARGET: Record<Difficulty, number> = {
  easy: 38, // ~43 givens
  medium: 46, // ~35 givens
  hard: 54, // ~27 givens
};

/**
 * Generates a puzzle with a guaranteed UNIQUE solution for the given
 * difficulty. Digs holes one at a time in random order, only keeping
 * a removal if the puzzle still has exactly one solution.
 */
export function generatePuzzle(difficulty: Difficulty = "easy"): SudokuPuzzle {
  const solution = generateSolvedGrid();
  const puzzle = [...solution];
  const removeTarget = REMOVE_TARGET[difficulty];

  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;

  for (const index of order) {
    if (removed >= removeTarget) break;

    const backup = puzzle[index];
    puzzle[index] = 0;

    const solutions = countSolutions(puzzle, 2);
    if (solutions === 1) {
      removed++;
    } else {
      puzzle[index] = backup; // revert, would break uniqueness
    }
  }

  return { puzzle, solution, difficulty };
}

export function cloneGrid(grid: Grid): Grid {
  return [...grid] as Grid;
}

export function emptyGrid(): Grid {
  return [...EMPTY_GRID] as Grid;
}

export type { CellValue };
