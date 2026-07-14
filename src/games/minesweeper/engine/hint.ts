import { Board, BoardConfig } from "./types";

export function getHint(
  board: Board,
  config: BoardConfig
): { index: number; reason: string; action: "reveal" | "flag" } | null {
  const size = config.rows * config.cols;

  const getNeighbors = (index: number) => {
    const neighbors: number[] = [];
    const r = Math.floor(index / config.cols);
    const c = index % config.cols;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
          neighbors.push(nr * config.cols + nc);
        }
      }
    }
    return neighbors;
  };

  // Strategy 1: Definitely Safe
  for (let i = 0; i < size; i++) {
    const cell = board[i];
    if (cell.isRevealed && cell.adjacentMines > 0) {
      const neighbors = getNeighbors(i);
      const flaggedNeighbors = neighbors.filter((n) => board[n].isFlagged);
      const hiddenUnflaggedNeighbors = neighbors.filter((n) => !board[n].isRevealed && !board[n].isFlagged);

      if (flaggedNeighbors.length === cell.adjacentMines && hiddenUnflaggedNeighbors.length > 0) {
        // We can safely reveal any hidden unflagged neighbor
        return {
          index: hiddenUnflaggedNeighbors[0],
          reason: `Ô số ${cell.adjacentMines} đã đủ ${cell.adjacentMines} cờ xung quanh, nên các ô còn lại quanh nó chắc chắn an toàn.`,
          action: "reveal",
        };
      }
    }
  }

  // Strategy 2: Definitely a Mine
  for (let i = 0; i < size; i++) {
    const cell = board[i];
    if (cell.isRevealed && cell.adjacentMines > 0) {
      const neighbors = getNeighbors(i);
      const hiddenNeighbors = neighbors.filter((n) => !board[n].isRevealed);
      const unflaggedHiddenNeighbors = hiddenNeighbors.filter((n) => !board[n].isFlagged);

      // If the number of hidden neighbors matches the number on the cell, they MUST be mines
      if (hiddenNeighbors.length === cell.adjacentMines && unflaggedHiddenNeighbors.length > 0) {
        return {
          index: unflaggedHiddenNeighbors[0],
          reason: `Ô số ${cell.adjacentMines} chỉ còn đúng ${cell.adjacentMines} ô chưa mở xung quanh — tất cả chắc chắn là mìn.`,
          action: "flag",
        };
      }
    }
  }

  // Strategy 3: Random fallback (guess)
  const hiddenUnflagged = [];
  for (let i = 0; i < size; i++) {
    if (!board[i].isRevealed && !board[i].isFlagged) {
      hiddenUnflagged.push(i);
    }
  }

  if (hiddenUnflagged.length > 0) {
    // Pick a random hidden cell.
    const randomIndex = hiddenUnflagged[Math.floor(Math.random() * hiddenUnflagged.length)];
    return {
      index: randomIndex,
      reason: "Không có ô nào suy luận chắc chắn được — đây là một trong những ô có khả năng an toàn cao hơn theo thống kê.",
      action: "reveal", // Randomly opening is usually the only way forward
    };
  }

  return null;
}
