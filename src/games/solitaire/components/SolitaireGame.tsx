"use client";

import { useEffect, useState, useRef } from "react";
import { useSolitaireStore, SolitaireState } from "../store";
import { SolitaireBoard } from "./SolitaireBoard";
import { Hud } from "./Hud";
import { WinModal } from "./WinModal";
import { loadSolitaireProgress, saveSolitaireProgress } from "@/lib/offline/db";
import { Card } from "../engine/types";
import { motion, AnimatePresence } from "framer-motion";

export function SolitaireGame() {
  const [mounted, setMounted] = useState(false);
  const startNewGame = useSolitaireStore((s) => s.startNewGame);
  const loadSavedGame = useSolitaireStore((s) => s.loadSavedGame);
  const isRunning = useSolitaireStore((s) => s.isRunning);
  const tick = useSolitaireStore((s) => s.tick);
  
  const stateRef = useRef(useSolitaireStore.getState());

  useEffect(() => {
    useSolitaireStore.subscribe((state) => {
      stateRef.current = state;
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await loadSolitaireProgress();
        if (saved && saved.gameSlug === "solitaire") {
          const hasCards = saved.stock.length > 0 || saved.waste.length > 0 || saved.foundations.some(f => f.length > 0) || saved.tableaus.some(t => t.length > 0);
          
          // Validate no duplicate cards to prevent crash
          const allCardIds = new Set();
          let isCorrupt = false;
          const checkCards = (cards: Card[]) => {
            cards.forEach(c => {
              if (allCardIds.has(c.id)) isCorrupt = true;
              allCardIds.add(c.id);
            });
          };
          checkCards(saved.stock);
          checkCards(saved.waste);
          saved.foundations.forEach(checkCards);
          saved.tableaus.forEach(checkCards);

          if (hasCards && !isCorrupt) {
            loadSavedGame(saved as Partial<SolitaireState>);
          } else {
            startNewGame();
          }
        } else {
          startNewGame();
        }
      } catch (e) {
        startNewGame();
      }
      setMounted(true);
    };
    init();
  }, [startNewGame, loadSavedGame]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = stateRef.current;
      saveSolitaireProgress({
        gameSlug: "solitaire",
        stock: state.stock,
        waste: state.waste,
        foundations: state.foundations,
        tableaus: state.tableaus,
        history: state.history,
        status: state.status,
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        updatedAt: Date.now(),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // Also save periodically
    const saveInterval = setInterval(handleBeforeUnload, 10000);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(saveInterval);
      handleBeforeUnload(); // Save on unmount
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const errorMessage = useSolitaireStore((s) => s.errorMessage);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center py-6 w-full h-full min-h-0 bg-emerald-800 relative overflow-hidden">
      {/* Table cloth texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
      
      <div className="relative z-10 w-full flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <div className="flex-none mb-6">
          <Hud />
        </div>
        <div className="flex-1 min-h-[600px]">
          <SolitaireBoard />
        </div>
      </div>
      
      <WinModal />

      {/* Toast Notification for Errors */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-none absolute bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral-500/90 px-6 py-3 font-medium text-white shadow-lg backdrop-blur-md"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
