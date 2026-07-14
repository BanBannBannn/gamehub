import { Board, BoardConfig, CellState } from "./types";

export function createEmptyBoard(config: BoardConfig): Board {
  const size = config.rows * config.cols;
  const board: Board = new Array(size);
  for (let i = 0; i < size; i++) {
    board[i] = {
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    };
  }
  return board;
}

function getNeighbors(index: number, rows: number, cols: number): number[] {
  const neighbors: number[] = [];
  const r = Math.floor(index / cols);
  const c = index % cols;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(nr * cols + nc);
      }
    }
  }
  return neighbors;
}

export function placeMinesAvoiding(board: Board, config: BoardConfig, safeIndex: number): Board {
  const newBoard = board.map((cell) => ({ ...cell }));
  const size = config.rows * config.cols;

  // Safe zones are safeIndex and its neighbors
  const safeZones = new Set(getNeighbors(safeIndex, config.rows, config.cols));
  safeZones.add(safeIndex);

  let minesToPlace = config.mineCount;

  // Make sure we don't try to place more mines than available cells
  const availableCells = size - safeZones.size;
  if (minesToPlace > availableCells) {
    minesToPlace = availableCells;
  }

  // Create an array of available indices
  const possibleIndices: number[] = [];
  for (let i = 0; i < size; i++) {
    if (!safeZones.has(i)) {
      possibleIndices.push(i);
    }
  }

  // Shuffle and pick
  for (let i = possibleIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleIndices[i], possibleIndices[j]] = [possibleIndices[j], possibleIndices[i]];
  }

  const mineIndices = possibleIndices.slice(0, minesToPlace);
  for (const idx of mineIndices) {
    newBoard[idx].isMine = true;
  }

  // Compute adjacent mines
  for (let i = 0; i < size; i++) {
    if (newBoard[i].isMine) continue;
    let count = 0;
    const neighbors = getNeighbors(i, config.rows, config.cols);
    for (const n of neighbors) {
      if (newBoard[n].isMine) count++;
    }
    newBoard[i].adjacentMines = count;
  }

  return newBoard;
}

export function revealCell(board: Board, index: number, config: BoardConfig): Board {
  if (board[index].isRevealed || board[index].isFlagged) {
    return board;
  }

  const newBoard = board.map((cell) => ({ ...cell }));

  if (newBoard[index].isMine) {
    newBoard[index].isRevealed = true;
    return newBoard;
  }

  // Flood fill using queue (BFS)
  const queue: number[] = [index];
  newBoard[index].isRevealed = true;

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    
    // Only continue spreading if the current cell has 0 adjacent mines
    if (newBoard[curr].adjacentMines === 0) {
      const neighbors = getNeighbors(curr, config.rows, config.cols);
      for (const n of neighbors) {
        if (!newBoard[n].isRevealed && !newBoard[n].isFlagged && !newBoard[n].isMine) {
          newBoard[n].isRevealed = true;
          queue.push(n);
        }
      }
    }
  }

  return newBoard;
}

export function toggleFlag(board: Board, index: number): Board {
  if (board[index].isRevealed) return board;

  const newBoard = [...board];
  newBoard[index] = { ...newBoard[index], isFlagged: !newBoard[index].isFlagged };
  return newBoard;
}

export function isWin(board: Board): boolean {
  for (let i = 0; i < board.length; i++) {
    if (!board[i].isMine && !board[i].isRevealed) {
      return false;
    }
  }
  return true;
}

export function countRemainingFlags(board: Board, mineCount: number): number {
  let flaggedCount = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i].isFlagged) flaggedCount++;
  }
  return mineCount - flaggedCount;
}

export function revealAllMines(board: Board): Board {
  return board.map((cell) => {
    if (cell.isMine) {
      return { ...cell, isRevealed: true };
    }
    return cell;
  });
}
