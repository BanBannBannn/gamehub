import { Board, CellValue, Difficulty, HintResult } from "./types";
import { checkWin, colOf, getRelevantIndices, isInBounds, indexOf, otherPlayer, placeStone, rowOf } from "./board";

const DIRECTIONS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Scores a single line-of-sight pattern (consecutive stones + open ends)
 * using standard Gomoku heuristic weights. Higher = stronger threat.
 */
function patternScore(length: number, openEnds: number): number {
  if (length >= 5) return 100_000;
  if (length === 4) return openEnds === 2 ? 10_000 : openEnds === 1 ? 1_000 : 0;
  if (length === 3) return openEnds === 2 ? 1_000 : openEnds === 1 ? 100 : 0;
  if (length === 2) return openEnds === 2 ? 100 : openEnds === 1 ? 10 : 0;
  if (length === 1) return openEnds === 2 ? 5 : 1;
  return 0;
}

function scoreDirection(board: Board, index: number, dr: number, dc: number, player: CellValue): number {
  const row = rowOf(index);
  const col = colOf(index);
  let length = 1;

  let r = row + dr;
  let c = col + dc;
  while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
    length++;
    r += dr;
    c += dc;
  }
  const forwardOpen = isInBounds(r, c) && board[indexOf(r, c)] === 0;

  r = row - dr;
  c = col - dc;
  while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
    length++;
    r -= dr;
    c -= dc;
  }
  const backwardOpen = isInBounds(r, c) && board[indexOf(r, c)] === 0;

  const openEnds = (forwardOpen ? 1 : 0) + (backwardOpen ? 1 : 0);
  return patternScore(length, openEnds);
}

/**
 * Total offensive value of placing `player`'s stone at `index`, summed
 * across all 4 directions. Simulates the placement on a cloned board.
 */
export function scoreForPlacement(board: Board, index: number, player: CellValue): number {
  if (board[index] !== 0) return -1; // occupied, never a valid candidate
  const simulated = placeStone(board, index, player);
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    total += scoreDirection(simulated, index, dr, dc, player);
  }
  return total;
}

/**
 * Combined score used to rank candidate moves: how much this move helps
 * the mover (attack) plus how much it denies the opponent (defense,
 * weighted slightly lower so the AI still prefers building its own
 * threats over purely reactive play).
 */
function evaluateMove(board: Board, index: number, player: 1 | 2, opponent: 1 | 2): number {
  const attack = scoreForPlacement(board, index, player);
  const defense = scoreForPlacement(board, index, opponent);
  return attack + defense * 0.9;
}

function topCandidates(
  board: Board,
  player: 1 | 2,
  opponent: 1 | 2,
  limit: number
): number[] {
  const relevant = getRelevantIndices(board, 2);
  const scored = relevant.map((i) => ({ i, score: evaluateMove(board, i, player, opponent) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.i);
}

/** Cheap static evaluation of a board state, used as the minimax leaf value. */
function staticEval(board: Board, aiPlayer: 1 | 2, opponent: 1 | 2): number {
  const relevant = getRelevantIndices(board, 2);
  let aiBest = 0;
  let oppBest = 0;
  for (const idx of relevant) {
    aiBest = Math.max(aiBest, scoreForPlacement(board, idx, aiPlayer));
    oppBest = Math.max(oppBest, scoreForPlacement(board, idx, opponent));
  }
  return aiBest - oppBest;
}

interface SearchBudget {
  nodes: number;
  maxNodes: number;
}

interface MinimaxResult {
  score: number;
  index: number | null;
}

const CANDIDATES_PER_NODE = 8;

/**
 * Bounded minimax with alpha-beta pruning. Both `depth` and `maxNodes`
 * cap the search so this can never run away on a busy board — the same
 * lesson learned building the Sudoku engine: naive unbounded backtracking
 * search can blow up combinatorially on certain positions, so a hard
 * node budget is non-negotiable.
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: 1 | 2,
  opponent: 1 | 2,
  budget: SearchBudget
): MinimaxResult {
  budget.nodes++;

  const mover = isMaximizing ? aiPlayer : opponent;
  const rival = isMaximizing ? opponent : aiPlayer;

  if (depth === 0 || budget.nodes > budget.maxNodes) {
    return { score: staticEval(board, aiPlayer, opponent), index: null };
  }

  const candidates = topCandidates(board, mover, rival, CANDIDATES_PER_NODE);
  if (candidates.length === 0) {
    return { score: staticEval(board, aiPlayer, opponent), index: null };
  }

  let bestIndex = candidates[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of candidates) {
      const nextBoard = placeStone(board, idx, mover);
      const win = checkWin(nextBoard, idx);
      const evalScore = win ? 1_000_000 - (10 - depth) : minimax(nextBoard, depth - 1, alpha, beta, false, aiPlayer, opponent, budget).score;

      if (evalScore > maxEval) {
        maxEval = evalScore;
        bestIndex = idx;
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha || budget.nodes > budget.maxNodes) break;
    }
    return { score: maxEval, index: bestIndex };
  }

  let minEval = Infinity;
  for (const idx of candidates) {
    const nextBoard = placeStone(board, idx, mover);
    const win = checkWin(nextBoard, idx);
    const evalScore = win ? -1_000_000 + (10 - depth) : minimax(nextBoard, depth - 1, alpha, beta, true, aiPlayer, opponent, budget).score;

    if (evalScore < minEval) {
      minEval = evalScore;
      bestIndex = idx;
    }
    beta = Math.min(beta, evalScore);
    if (beta <= alpha || budget.nodes > budget.maxNodes) break;
  }
  return { score: minEval, index: bestIndex };
}

function pickImmediateWin(board: Board, player: 1 | 2, relevant: number[]): number | null {
  for (const idx of relevant) {
    if (checkWin(placeStone(board, idx, player), idx)) return idx;
  }
  return null;
}

function pickBlockingMove(board: Board, opponent: 1 | 2, relevant: number[]): number | null {
  for (const idx of relevant) {
    if (checkWin(placeStone(board, idx, opponent), idx)) return idx;
  }
  return null;
}

function getEasyMove(board: Board, player: 1 | 2, opponent: 1 | 2, relevant: number[]): number {
  const scored = relevant
    .map((i) => ({ i, score: evaluateMove(board, i, player, opponent) }))
    .sort((a, b) => b.score - a.score);

  if (Math.random() < 0.35) return scored[0].i;
  const poolSize = Math.max(1, Math.ceil(scored.length * 0.5));
  const pick = Math.floor(Math.random() * poolSize);
  return scored[pick].i;
}

function getMediumMove(board: Board, player: 1 | 2, opponent: 1 | 2, relevant: number[]): number {
  let best = relevant[0];
  let bestScore = -Infinity;
  for (const idx of relevant) {
    const score = evaluateMove(board, idx, player, opponent);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  return best;
}

function getHardMove(board: Board, player: 1 | 2, opponent: 1 | 2, relevant: number[]): number {
  const budget: SearchBudget = { nodes: 0, maxNodes: 15_000 };
  const result = minimax(board, 3, -Infinity, Infinity, true, player, opponent, budget);
  return result.index ?? getMediumMove(board, player, opponent, relevant);
}

/**
 * Returns the AI's chosen move for the current board. Always takes an
 * immediate win if one exists, and (except on "easy") always blocks an
 * immediate opponent win, regardless of difficulty — anything else would
 * feel broken rather than "easy".
 */
export function getAiMove(board: Board, player: 1 | 2, difficulty: Difficulty): number {
  const opponent = otherPlayer(player);
  const relevant = getRelevantIndices(board, 2);
  if (relevant.length === 0) return -1;

  const win = pickImmediateWin(board, player, relevant);
  if (win !== null) return win;

  if (difficulty !== "easy") {
    const block = pickBlockingMove(board, opponent, relevant);
    if (block !== null) return block;
  }

  if (difficulty === "easy") return getEasyMove(board, player, opponent, relevant);
  if (difficulty === "medium") return getMediumMove(board, player, opponent, relevant);
  return getHardMove(board, player, opponent, relevant);
}

/**
 * Suggests a move for `forPlayer` with a human-readable (Vietnamese)
 * reason, using the same heuristic as the "medium" AI so hints stay
 * consistent with how the AI itself thinks.
 */
export function getHint(board: Board, forPlayer: 1 | 2): HintResult | null {
  const opponent = otherPlayer(forPlayer);
  const relevant = getRelevantIndices(board, 2);
  if (relevant.length === 0) return null;

  const win = pickImmediateWin(board, forPlayer, relevant);
  if (win !== null) {
    return { index: win, reason: "Đánh vào đây sẽ giúp bạn thắng ngay lập tức!" };
  }

  const block = pickBlockingMove(board, opponent, relevant);
  if (block !== null) {
    return {
      index: block,
      reason: "Đối thủ sắp thắng ở nước tiếp theo nếu không chặn ô này ngay.",
    };
  }

  let bestIndex = relevant[0];
  let bestScore = -Infinity;
  for (const idx of relevant) {
    const score = evaluateMove(board, idx, forPlayer, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  }

  const attackScore = scoreForPlacement(board, bestIndex, forPlayer);
  let reason: string;
  if (attackScore >= 10_000) {
    reason = "Nước này tạo thế '4 quân mở', gần như chắc thắng ở lượt sau.";
  } else if (attackScore >= 1_000) {
    reason = "Nước này tạo thế '3 quân mở 2 đầu', rất khó bị chặn.";
  } else if (attackScore >= 100) {
    reason = "Nước này giúp bạn xây dựng thế cờ tốt hơn.";
  } else {
    reason = "Đây là vị trí trung tâm, tạo nhiều hướng phát triển hơn.";
  }

  return { index: bestIndex, reason };
}
