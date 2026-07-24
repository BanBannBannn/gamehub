import { create } from "zustand";
import { buildDeck, Card, Difficulty, isSolved } from "./engine/logic";

export type Status = "idle" | "playing" | "won";

export interface MemoryState {
  cards: Card[];
  difficulty: Difficulty;
  moves: number;
  status: Status;
  flippedIds: number[];
  locked: boolean; // đang chờ lật úp 2 lá không khớp

  newGame: (difficulty: Difficulty) => void;
  flip: (id: number) => "match" | "mismatch" | "flip" | "ignored";
  resolveMismatch: () => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  cards: [],
  difficulty: "medium",
  moves: 0,
  status: "idle",
  flippedIds: [],
  locked: false,

  newGame: (difficulty) => {
    set({ cards: buildDeck(difficulty), difficulty, moves: 0, status: "playing", flippedIds: [], locked: false });
  },

  flip: (id) => {
    const { cards, flippedIds, locked, status } = get();
    if (locked || status !== "playing") return "ignored";
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return "ignored";

    const nextCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const nextFlipped = [...flippedIds, id];

    if (nextFlipped.length < 2) {
      set({ cards: nextCards, flippedIds: nextFlipped });
      return "flip";
    }

    // Đã lật lá thứ 2 — tính 1 lượt.
    const [a, b] = nextFlipped;
    const cardA = nextCards.find((c) => c.id === a)!;
    const cardB = nextCards.find((c) => c.id === b)!;
    const moves = get().moves + 1;

    if (cardA.symbol === cardB.symbol) {
      const matched = nextCards.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
      set({ cards: matched, flippedIds: [], moves, status: isSolved(matched) ? "won" : "playing" });
      return "match";
    }

    // Không khớp — khoá tạm, chờ component gọi resolveMismatch để lật úp lại.
    set({ cards: nextCards, flippedIds: nextFlipped, moves, locked: true });
    return "mismatch";
  },

  resolveMismatch: () => {
    const { cards, flippedIds } = get();
    const reset = cards.map((c) => (flippedIds.includes(c.id) ? { ...c, flipped: false } : c));
    set({ cards: reset, flippedIds: [], locked: false });
  },
}));
