import { Direction, Grid, MoveResult, SIZE, WIN_VALUE } from "./types";

export function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

/** Toạ độ các ô trống. */
export function emptyCells(grid: Grid): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

/**
 * Sinh 1 ô mới (2 với xác suất 90%, 4 với 10%) vào 1 ô trống ngẫu nhiên.
 * `rng` cho phép test tất định. Trả về lưới mới; nếu không còn ô trống thì
 * trả về nguyên lưới cũ.
 */
export function spawnRandom(grid: Grid, rng: () => number = Math.random): Grid {
  const cells = emptyCells(grid);
  if (cells.length === 0) return grid;
  const { r, c } = cells[Math.floor(rng() * cells.length)];
  const next = cloneGrid(grid);
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

/**
 * Xử lý 1 hàng theo hướng "sang trái": dồn số về trái, gộp 2 ô bằng nhau liền
 * kề (mỗi ô chỉ gộp 1 lần/nước), rồi dồn tiếp. Thuần, dễ test.
 */
export function collapseLeft(line: number[]): { line: number[]; gained: number } {
  const nums = line.filter((n) => n !== 0);
  const result: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const merged = nums[i] * 2;
      result.push(merged);
      gained += merged;
      i++; // bỏ qua ô đã gộp
    } else {
      result.push(nums[i]);
    }
  }
  while (result.length < line.length) result.push(0);
  return { line: result, gained };
}

function transpose(grid: Grid): Grid {
  const out = createEmptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) out[c][r] = grid[r][c];
  }
  return out;
}

function reverseRows(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse());
}

/** Áp dụng 1 nước đi theo hướng. Không sinh ô mới (việc đó do store làm sau). */
export function move(grid: Grid, dir: Direction): MoveResult {
  // Quy mọi hướng về "sang trái" bằng các phép biến đổi lưới.
  let work = cloneGrid(grid);
  if (dir === "right") work = reverseRows(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = reverseRows(transpose(work));

  let gained = 0;
  work = work.map((row) => {
    const { line, gained: g } = collapseLeft(row);
    gained += g;
    return line;
  });

  // Biến đổi ngược lại về hệ toạ độ gốc.
  if (dir === "right") work = reverseRows(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = transpose(reverseRows(work));

  const moved = JSON.stringify(work) !== JSON.stringify(grid);
  return { grid: work, gained, moved };
}

export function hasWon(grid: Grid): boolean {
  return grid.some((row) => row.some((v) => v >= WIN_VALUE));
}

/** Còn nước đi hợp lệ không (còn ô trống, hoặc còn 2 ô kề nhau bằng nhau). */
export function canMove(grid: Grid): boolean {
  if (emptyCells(grid).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
    }
  }
  return false;
}

export function highestTile(grid: Grid): number {
  return Math.max(...grid.flat());
}
