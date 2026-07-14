import { Card, Suit, Rank, Color } from "./types";

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function getColor(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        color: getColor(suit),
        isFaceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export interface DealResult {
  stock: Card[];
  tableaus: Card[][]; // 7 arrays
}

export function dealCards(deck: Card[]): DealResult {
  const tableaus: Card[][] = Array.from({ length: 7 }, () => []);
  let cardIndex = 0;

  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = deck[cardIndex++];
      card.isFaceUp = i === j; // Only the top card is face up
      tableaus[j].push(card);
    }
  }

  return {
    tableaus,
    stock: deck.slice(cardIndex),
  };
}

export function canMoveToTableau(targetTopCard: Card | undefined, movedCard: Card): boolean {
  if (!targetTopCard) {
    // Can only move King (13) to an empty tableau
    return movedCard.rank === 13;
  }
  return targetTopCard.color !== movedCard.color && targetTopCard.rank - 1 === movedCard.rank;
}

export function canMoveToFoundation(targetTopCard: Card | undefined, movedCard: Card): boolean {
  if (!targetTopCard) {
    // Can only move Ace (1) to an empty foundation
    return movedCard.rank === 1;
  }
  return targetTopCard.suit === movedCard.suit && targetTopCard.rank + 1 === movedCard.rank;
}

// Determines if a game is won
export function checkWin(foundations: Card[][]): boolean {
  return foundations.every((foundation) => foundation.length === 13);
}

// Determines if a card stack is valid to be dragged (all face up, alternating colors, decreasing ranks)
// (In Klondike, all face-up cards in a tableau pile are always valid by definition, but good to have)
export function isValidStack(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  if (!cards[0].isFaceUp) return false;
  
  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1];
    const curr = cards[i];
    if (!curr.isFaceUp) return false;
    if (prev.color === curr.color || prev.rank - 1 !== curr.rank) return false;
  }
  return true;
}
