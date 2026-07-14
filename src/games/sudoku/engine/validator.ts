import { CellValue, Grid } from "./types";

export const SIZE = 9;
export const BOX = 3;

export function rowOf(index: number): number {
  return Math.floor(index / SIZE);
}

export function colOf(index: number): number {
  return index % SIZE;
}

export function boxOf(index: number): number {
  const r = rowOf(index);
  const c = colOf(index);
  return Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
}

export function indicesInRow(row: number): number[] {
  return Array.from({ length: SIZE }, (_, c) => row * SIZE + c);
}

export function indicesInCol(col: number): number[] {
  return Array.from({ length: SIZE }, (_, r) => r * SIZE + col);
}

export function indicesInBox(box: number): number[] {
  const boxRow = Math.floor(box / BOX) * BOX;
  const boxCol = (box % BOX) * BOX;
  const result: number[] = [];
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      result.push((boxRow + r) * SIZE + (boxCol + c));
    }
  }
  return result;
}

export function peersOf(index: number): number[] {
  const set = new Set<number>([
    ...indicesInRow(rowOf(index)),
    ...indicesInCol(colOf(index)),
    ...indicesInBox(boxOf(index)),
  ]);
  set.delete(index);
  return Array.from(set);
}

/**
 * Returns true if placing `value` at `index` does not conflict
 * with any peer (row/col/box) currently in `grid`.
 */
export function isSafe(grid: Grid, index: number, value: CellValue): boolean {
  if (value === 0) return true;
  for (const peer of peersOf(index)) {
    if (grid[peer] === value) return false;
  }
  return true;
}

/**
 * Returns list of cell indices (0-80) that are in conflict with
 * another cell sharing the same row/col/box and same non-zero value.
 * Used purely for UI error highlighting, not for solving.
 */
export function findConflicts(grid: Grid): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < grid.length; i++) {
    const value = grid[i];
    if (value === 0) continue;
    for (const peer of peersOf(i)) {
      if (grid[peer] === value) {
        conflicts.add(i);
        conflicts.add(peer);
      }
    }
  }
  return conflicts;
}

export function isComplete(grid: Grid): boolean {
  return grid.every((v) => v !== 0) && findConflicts(grid).size === 0;
}

export function candidatesFor(grid: Grid, index: number): CellValue[] {
  if (grid[index] !== 0) return [];
  const used = new Set<CellValue>();
  for (const peer of peersOf(index)) {
    const v = grid[peer];
    if (v !== 0) used.add(v);
  }
  const result: CellValue[] = [];
  for (let v = 1; v <= 9; v++) {
    if (!used.has(v as CellValue)) result.push(v as CellValue);
  }
  return result;
}
