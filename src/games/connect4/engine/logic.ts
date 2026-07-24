import { Board, Cell, COLS, CONNECT, Player, ROWS, WinLine } from "./types";

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Hàng thấp nhất còn trống ở 1 cột (nơi quân sẽ rơi tới), hoặc -1 nếu cột đầy. */
export function dropRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

/** Thả quân vào cột. Trả về bàn mới + hàng đã rơi, hoặc null nếu cột đầy/không hợp lệ. */
export function drop(board: Board, col: number, player: Player): { board: Board; row: number } | null {
  if (col < 0 || col >= COLS) return null;
  const row = dropRow(board, col);
  if (row < 0) return null;
  const next = cloneBoard(board);
  next[row][col] = player;
  return { board: next, row };
}

const DIRS = [
  [0, 1], // ngang
  [1, 0], // dọc
  [1, 1], // chéo xuống-phải
  [1, -1], // chéo xuống-trái
];

/** Tìm 4 quân liên tiếp cùng màu (nếu có). Quét toàn bàn (42 ô, rất nhẹ). */
export function findWinLine(board: Board): WinLine | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p === 0) continue;
      for (const [dr, dc] of DIRS) {
        const cells = [{ r, c }];
        for (let k = 1; k < CONNECT; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p) break;
          cells.push({ r: nr, c: nc });
        }
        if (cells.length === CONNECT) return { player: p, cells };
      }
    }
  }
  return null;
}

export function isFull(board: Board): boolean {
  return board[0].every((c) => c !== 0);
}

export function validColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) if (dropRow(board, c) >= 0) cols.push(c);
  return cols;
}

export function opponent(p: Player): Player {
  return p === 1 ? 2 : 1;
}

/**
 * AI đơn giản nhưng "biết điều": (1) thắng ngay nếu có nước thắng, (2) chặn
 * nước thắng của đối thủ, (3) tránh đi vào cột mà sau đó đối thủ thắng ngay,
 * (4) ưu tiên cột giữa. Đủ vui cho chế độ chơi với máy, không cần minimax sâu.
 */
export function chooseAiMove(board: Board, ai: Player, rng: () => number = Math.random): number {
  const cols = validColumns(board);
  if (cols.length === 0) return -1;
  const foe = opponent(ai);

  // 1) Thắng ngay.
  for (const c of cols) {
    const res = drop(board, c, ai)!;
    if (findWinLine(res.board)?.player === ai) return c;
  }
  // 2) Chặn thắng của đối thủ.
  for (const c of cols) {
    const res = drop(board, c, foe)!;
    if (findWinLine(res.board)?.player === foe) return c;
  }
  // 3) Loại các cột mà sau khi mình đi, đối thủ có nước thắng ngay.
  const safe = cols.filter((c) => {
    const after = drop(board, c, ai)!.board;
    return !validColumns(after).some((c2) => findWinLine(drop(after, c2, foe)!.board)?.player === foe);
  });
  const pool = safe.length > 0 ? safe : cols;

  // 4) Ưu tiên gần cột giữa.
  const center = (COLS - 1) / 2;
  pool.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  const best = pool.filter((c) => Math.abs(c - center) === Math.abs(pool[0] - center));
  return best[Math.floor(rng() * best.length)];
}
