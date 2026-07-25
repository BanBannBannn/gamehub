// Reversi / Othello — bàn 8x8. 0 = trống, 1 = Đen, 2 = Trắng. Đen đi trước.
export type Disc = 1 | 2;
export type Cell = 0 | Disc;
export type Board = Cell[][];

export const SIZE = 8;

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function createBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0 as Cell));
  b[3][3] = 2;
  b[3][4] = 1;
  b[4][3] = 1;
  b[4][4] = 2;
  return b;
}

export function cloneBoard(board: Board): Board {
  return board.map((r) => [...r]);
}

export function opponent(d: Disc): Disc {
  return d === 1 ? 2 : 1;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

/** Các quân sẽ bị lật nếu `player` đặt vào (r,c). Rỗng nghĩa là nước đi không hợp lệ. */
export function flipsFor(board: Board, r: number, c: number, player: Disc): { r: number; c: number }[] {
  if (!inBounds(r, c) || board[r][c] !== 0) return [];
  const foe = opponent(player);
  const flips: { r: number; c: number }[] = [];
  for (const [dr, dc] of DIRS) {
    const line: { r: number; c: number }[] = [];
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc) && board[nr][nc] === foe) {
      line.push({ r: nr, c: nc });
      nr += dr;
      nc += dc;
    }
    if (line.length > 0 && inBounds(nr, nc) && board[nr][nc] === player) {
      flips.push(...line);
    }
  }
  return flips;
}

export function isLegal(board: Board, r: number, c: number, player: Disc): boolean {
  return flipsFor(board, r, c, player).length > 0;
}

export function legalMoves(board: Board, player: Disc): { r: number; c: number }[] {
  const moves: { r: number; c: number }[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0 && flipsFor(board, r, c, player).length > 0) moves.push({ r, c });
    }
  }
  return moves;
}

/** Đặt quân (nếu hợp lệ) và lật các quân tương ứng. Trả về bàn mới hoặc null. */
export function place(board: Board, r: number, c: number, player: Disc): Board | null {
  const flips = flipsFor(board, r, c, player);
  if (flips.length === 0) return null;
  const next = cloneBoard(board);
  next[r][c] = player;
  for (const f of flips) next[f.r][f.c] = player;
  return next;
}

export function countDiscs(board: Board): { 1: number; 2: number } {
  let a = 0;
  let b = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 1) a++;
      else if (board[r][c] === 2) b++;
    }
  }
  return { 1: a, 2: b };
}

export interface GameOver {
  over: boolean;
  winner: Disc | null; // null = hoà
}

/** Ván kết thúc khi CẢ 2 bên đều không còn nước đi hợp lệ. */
export function checkOver(board: Board): GameOver {
  if (legalMoves(board, 1).length > 0 || legalMoves(board, 2).length > 0) {
    return { over: false, winner: null };
  }
  const { 1: black, 2: white } = countDiscs(board);
  return { over: true, winner: black === white ? null : black > white ? 1 : 2 };
}

// Trọng số vị trí: góc rất quý, ô cạnh góc (X/C) nguy hiểm.
const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

/** AI heuristic: chọn nước tối đa hoá trọng số vị trí + số quân lật. */
export function chooseAiMove(board: Board, player: Disc, rng: () => number = Math.random): { r: number; c: number } | null {
  const moves = legalMoves(board, player);
  if (moves.length === 0) return null;
  let best: { r: number; c: number }[] = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    const flips = flipsFor(board, m.r, m.c, player).length;
    const score = WEIGHTS[m.r][m.c] + flips;
    if (score > bestScore) {
      bestScore = score;
      best = [m];
    } else if (score === bestScore) {
      best.push(m);
    }
  }
  return best[Math.floor(rng() * best.length)];
}
