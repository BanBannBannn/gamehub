export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Color = "red" | "black";

export interface Card {
  id: string; // e.g., "hearts-1"
  suit: Suit;
  rank: Rank;
  color: Color;
  isFaceUp: boolean;
}

export type PileType = "stock" | "waste" | "foundation" | "tableau";

export interface CardLocation {
  pileType: PileType;
  pileIndex?: number; // 0-3 for foundation, 0-6 for tableau
  cardIndex?: number; // Position within the pile
}

// Action for undo history
export interface GameMove {
  from: CardLocation;
  to: CardLocation;
  cards: Card[]; // The cards that were moved
  wasTableauRevealed: boolean; // Did this move reveal a facedown card in the source tableau?
}

// To support drawing/recycling stock
export interface StockAction {
  type: "DRAW" | "RECYCLE";
  cards: Card[]; // Cards drawn, or all waste cards recycled
}

export type HistoryAction = { type: "MOVE"; payload: GameMove } | { type: "STOCK"; payload: StockAction };
