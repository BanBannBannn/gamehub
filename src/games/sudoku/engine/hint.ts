import { CellValue, Grid, HintResult } from "./types";
import { candidatesFor, colOf, indicesInBox, indicesInCol, indicesInRow, rowOf } from "./validator";
import { solve } from "./solver";

/**
 * Tries to find a "naked single": a cell with exactly one candidate value.
 * This is the easiest, most explainable kind of hint.
 */
function findNakedSingle(grid: Grid): HintResult | null {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 0) continue;
    const candidates = candidatesFor(grid, i);
    if (candidates.length === 1) {
      const row = rowOf(i) + 1;
      const col = colOf(i) + 1;
      return {
        index: i,
        value: candidates[0],
        reason: `Ô tại hàng ${row}, cột ${col} chỉ còn duy nhất 1 khả năng là số ${candidates[0]}, vì các số còn lại đã xuất hiện trong hàng, cột hoặc khối 3x3 chứa nó.`,
      };
    }
  }
  return null;
}

/**
 * Tries to find a "hidden single": a value that can only go in one cell
 * within a given row, column, or box, even though that cell may have
 * other candidates too.
 */
function findHiddenSingle(grid: Grid): HintResult | null {
  const units: { indices: number[]; label: string }[] = [];

  for (let r = 0; r < 9; r++) {
    units.push({ indices: indicesInRow(r), label: `hàng ${r + 1}` });
  }
  for (let c = 0; c < 9; c++) {
    units.push({ indices: indicesInCol(c), label: `cột ${c + 1}` });
  }
  for (let b = 0; b < 9; b++) {
    units.push({ indices: indicesInBox(b), label: `khối 3x3 số ${b + 1}` });
  }

  for (const unit of units) {
    for (let value = 1 as CellValue; value <= 9; value++) {
      const possibleCells = unit.indices.filter(
        (i) => grid[i] === 0 && candidatesFor(grid, i).includes(value)
      );
      if (possibleCells.length === 1) {
        const index = possibleCells[0];
        const row = rowOf(index) + 1;
        const col = colOf(index) + 1;
        return {
          index,
          value,
          reason: `Trong ${unit.label}, số ${value} chỉ có thể điền vào ô hàng ${row}, cột ${col} — không ô nào khác trong ${unit.label} còn nhận số này.`,
        };
      }
    }
  }
  return null;
}

/**
 * Fallback: reveal the correct value from the full solution for the
 * first empty cell found. Used only when no simple logical hint applies
 * (rare, for very hard states).
 */
function fallbackReveal(grid: Grid): HintResult | null {
  const solved = solve(grid);
  if (!solved) return null;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === 0) {
      const row = rowOf(i) + 1;
      const col = colOf(i) + 1;
      return {
        index: i,
        value: solved[i],
        reason: `Đây là một nước đi khó suy luận trực tiếp — ô hàng ${row}, cột ${col} nên điền số ${solved[i]}.`,
      };
    }
  }
  return null;
}

/**
 * Returns the next best hint for the current grid state, preferring the
 * simplest (most explainable) technique first.
 */
export function getHint(grid: Grid): HintResult | null {
  return findNakedSingle(grid) ?? findHiddenSingle(grid) ?? fallbackReveal(grid);
}
