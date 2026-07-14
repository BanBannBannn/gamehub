"use client";

import { useSolitaireStore } from "../store";
import { PlayingCard } from "./PlayingCard";
import { CardLocation, Card } from "../engine/types";
import { canMoveToTableau, canMoveToFoundation, isValidStack } from "../engine/logic";

export function SolitaireBoard() {
  const stock = useSolitaireStore((s) => s.stock);
  const waste = useSolitaireStore((s) => s.waste);
  const foundations = useSolitaireStore((s) => s.foundations);
  const tableaus = useSolitaireStore((s) => s.tableaus);
  const drawStock = useSolitaireStore((s) => s.drawStock);
  const moveCards = useSolitaireStore((s) => s.moveCards);

  // --- Drag and Drop Handlers ---
  function handleDragStart(e: React.DragEvent, from: CardLocation, cards: Card[]) {
    // Only allow dragging if the stack is valid
    if (!isValidStack(cards)) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ from, cards }));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, to: CardLocation) {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;

    try {
      const { from, cards } = JSON.parse(data) as { from: CardLocation; cards: Card[] };
      
      // Prevent dropping on itself
      if (from.pileType === to.pileType && from.pileIndex === to.pileIndex) return;

      // Validate move
      if (to.pileType === "foundation") {
        if (cards.length > 1) {
          useSolitaireStore.getState().setErrorMessage("Chỉ có thể xếp từng lá một lên Đích!");
          return;
        }
        const targetFoundation = foundations[to.pileIndex!];
        const topCard = targetFoundation.length > 0 ? targetFoundation[targetFoundation.length - 1] : undefined;
        if (canMoveToFoundation(topCard, cards[0])) {
          moveCards(cards, from, to);
        } else {
          useSolitaireStore.getState().setErrorMessage("Bài xếp lên Đích phải CÙNG CHẤT và TĂNG DẦN (A đến K).");
        }
      } else if (to.pileType === "tableau") {
        const targetTableau = tableaus[to.pileIndex!];
        const topCard = targetTableau.length > 0 ? targetTableau[targetTableau.length - 1] : undefined;
        if (canMoveToTableau(topCard, cards[0])) {
          moveCards(cards, from, to);
        } else {
          if (!topCard) {
            useSolitaireStore.getState().setErrorMessage("Chỉ có lá K (King) mới được đặt vào ô trống!");
          } else {
            useSolitaireStore.getState().setErrorMessage("Bài xếp lên Cột phải KHÁC MÀU và GIẢM DẦN.");
          }
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  }

  function handleDoubleClick(from: CardLocation, card: Card) {
    // Attempt to move to a foundation
    for (let i = 0; i < 4; i++) {
      const topCard = foundations[i].length > 0 ? foundations[i][foundations[i].length - 1] : undefined;
      if (canMoveToFoundation(topCard, card)) {
        moveCards([card], from, { pileType: "foundation", pileIndex: i });
        return;
      }
    }
  }

  // --- Renders ---
  
  // Empty slot placeholder
  const EmptySlot = ({ onDrop, className = "" }: { onDrop?: (e: React.DragEvent) => void, className?: string }) => (
    <div
      onDragOver={handleDragOver}
      onDrop={onDrop}
      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-md sm:rounded-lg border-2 border-dashed border-ink-600/30 flex items-center justify-center ${className}`}
    >
      <div className="w-10 h-14 bg-ink-600/10 rounded" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl px-2 sm:px-4 mx-auto select-none">
      {/* Top Row: Stock/Waste (Left) & Foundations (Right) */}
      <div className="flex justify-between items-start">
        {/* Stock & Waste */}
        <div className="flex gap-2 sm:gap-4">
          <div className="relative cursor-pointer hover:brightness-110 active:scale-95 transition" onClick={drawStock}>
            {stock.length > 0 ? (
              <PlayingCard card={stock[stock.length - 1]} />
            ) : (
              <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-md sm:rounded-lg border-2 border-ink-600/40 bg-ink-800 flex items-center justify-center text-ink-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v6h6"/></svg>
              </div>
            )}
          </div>
          
          <div className="relative w-16 sm:w-20">
            {waste.length > 0 && (
              <PlayingCard
                card={waste[waste.length - 1]}
                draggable
                onDragStart={(e) => handleDragStart(e, { pileType: "waste" }, [waste[waste.length - 1]])}
                onDoubleClick={() => handleDoubleClick({ pileType: "waste" }, waste[waste.length - 1])}
              />
            )}
          </div>
        </div>

        {/* Foundations */}
        <div className="flex gap-2 sm:gap-4">
          {foundations.map((foundation, i) => (
            <div
              key={i}
              className="relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, { pileType: "foundation", pileIndex: i })}
            >
              {foundation.length > 0 ? (
                <PlayingCard
                  card={foundation[foundation.length - 1]}
                  draggable // Can drag back down to tableau
                  onDragStart={(e) => handleDragStart(e, { pileType: "foundation", pileIndex: i }, [foundation[foundation.length - 1]])}
                />
              ) : (
                <EmptySlot />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Tableaus */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1 items-start justify-items-center">
        {tableaus.map((tableau, tIndex) => (
          <div
            key={tIndex}
            className="relative flex flex-col items-center w-16 sm:w-20 min-h-[60vh]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, { pileType: "tableau", pileIndex: tIndex })}
          >
            {tableau.length === 0 ? (
              <EmptySlot />
            ) : (
              // We render cards absolutely positioned
              <div className="relative w-full">
                {tableau.map((card, cIndex) => {
                  const isTopCard = cIndex === tableau.length - 1;
                  // If it's face up, we can drag it + all cards below it
                  const draggableCards = card.isFaceUp ? tableau.slice(cIndex) : [];
                  const isDraggable = card.isFaceUp && isValidStack(draggableCards);

                  return (
                    <div
                      key={card.id}
                      className="absolute top-0 left-0 w-full"
                      style={{ top: `${cIndex * 24}px`, zIndex: cIndex }}
                    >
                      <PlayingCard
                        card={card}
                        draggable={isDraggable}
                        onDragStart={(e) => handleDragStart(e, { pileType: "tableau", pileIndex: tIndex, cardIndex: cIndex }, draggableCards)}
                        onDoubleClick={() => {
                          if (isTopCard) handleDoubleClick({ pileType: "tableau", pileIndex: tIndex, cardIndex: cIndex }, card);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
