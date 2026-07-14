import { Board, CellValue, WinResult } from "./types";

export const SIZE = 15;
export const WIN_LENGTH = 5;

export function createEmptyBoard(): Board {
  return new Array(SIZE * SIZE).fill(0) as Board;
}

export function rowOf(index: number): number {
  return Math.floor(index / SIZE);
}

export function colOf(index: number): number {
  return index % SIZE;
}

export function indexOf(row: number, col: number): number {
  return row * SIZE + col;
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

export function isBoardFull(board: Board): boolean {
  return board.every((v) => v !== 0);
}

export function getEmptyIndices(board: Board): number[] {
  const result: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) result.push(i);
  }
  return result;
}

/**
 * Returns empty cells within `radius` of any already-placed stone.
 * Used to bound the AI's search space instead of scanning all 225 cells,
 * which matters once minimax/heuristic scoring is involved.
 */
export function getRelevantIndices(board: Board, radius = 2): number[] {
  if (board.every((v) => v === 0)) {
    // Empty board: only the center makes sense as a first move.
    return [indexOf(Math.floor(SIZE / 2), Math.floor(SIZE / 2))];
  }

  const relevant = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) continue;
    const r = rowOf(i);
    const c = colOf(i);
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (!isInBounds(nr, nc)) continue;
        const ni = indexOf(nr, nc);
        if (board[ni] === 0) relevant.add(ni);
      }
    }
  }
  return Array.from(relevant);
}

const DIRECTIONS: [number, number][] = [
  [0, 1], // ngang
  [1, 0], // dọc
  [1, 1], // chéo xuôi
  [1, -1], // chéo ngược
];

/**
 * Checks whether placing a stone at `lastMoveIndex` created a winning
 * line (5+ consecutive stones of the same player) through that point.
 * Only scans the 4 lines passing through the last move — no need to scan
 * the whole board after every move.
 */
export function checkWin(board: Board, lastMoveIndex: number): WinResult | null {
  const player = board[lastMoveIndex];
  if (player === 0) return null;

  const row = rowOf(lastMoveIndex);
  const col = colOf(lastMoveIndex);

  for (const [dr, dc] of DIRECTIONS) {
    const line = [lastMoveIndex];

    // Walk forward.
    let r = row + dr;
    let c = col + dc;
    while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
      line.push(indexOf(r, c));
      r += dr;
      c += dc;
    }

    // Walk backward.
    r = row - dr;
    c = col - dc;
    while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
      line.unshift(indexOf(r, c));
      r -= dr;
      c -= dc;
    }

    if (line.length >= WIN_LENGTH) {
      return { winner: player as 1 | 2, line };
    }
  }

  return null;
}

export function otherPlayer(player: 1 | 2): 1 | 2 {
  return player === 1 ? 2 : 1;
}

export function cloneBoard(board: Board): Board {
  return [...board] as Board;
}

export function placeStone(board: Board, index: number, player: CellValue): Board {
  const next = cloneBoard(board);
  next[index] = player;
  return next;
}
