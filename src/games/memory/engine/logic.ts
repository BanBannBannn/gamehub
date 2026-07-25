// Lật hình ghép cặp (Memory) — engine thuần, dễ test.

export interface Card {
  id: number; // duy nhất theo vị trí trong bộ bài
  symbol: string; // biểu tượng; 2 lá cùng symbol tạo thành 1 cặp
  matched: boolean;
  flipped: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export const PAIR_COUNT: Record<Difficulty, number> = {
  easy: 6, // 3x4
  medium: 8, // 4x4
  hard: 10, // 4x5
};

export const GRID_COLS: Record<Difficulty, number> = {
  easy: 4,
  medium: 4,
  hard: 5,
};

const SYMBOLS = ["🍎", "🍌", "🍇", "🍓", "🍑", "🍒", "🥝", "🍍", "🥥", "🍉", "🫐", "🥭"];

/** Xáo trộn tất định theo `rng` (Fisher–Yates). Không sửa mảng gốc. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Tạo bộ bài đã xáo: mỗi biểu tượng xuất hiện đúng 2 lần. */
export function buildDeck(difficulty: Difficulty, rng: () => number = Math.random): Card[] {
  const pairs = PAIR_COUNT[difficulty];
  const chosen = SYMBOLS.slice(0, pairs);
  const doubled = [...chosen, ...chosen];
  return shuffle(doubled, rng).map((symbol, id) => ({ id, symbol, matched: false, flipped: false }));
}

export function isSolved(cards: Card[]): boolean {
  return cards.length > 0 && cards.every((c) => c.matched);
}
