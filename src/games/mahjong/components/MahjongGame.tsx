"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, RefreshCw, Undo2 } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

interface MahjongTile {
  id: number;
  symbol: string;
  category: "bamboo" | "character" | "circle" | "dragon";
  matched: boolean;
}

const TILE_SYMBOLS = [
  { symbol: "🀀", category: "dragon" },
  { symbol: "🀁", category: "dragon" },
  { symbol: "🀂", category: "dragon" },
  { symbol: "🀃", category: "dragon" },
  { symbol: "🀇", category: "character" },
  { symbol: "🀈", category: "character" },
  { symbol: "🀉", category: "character" },
  { symbol: "🀐", category: "bamboo" },
  { symbol: "🀑", category: "bamboo" },
  { symbol: "🀒", category: "bamboo" },
  { symbol: "🀙", category: "circle" },
  { symbol: "🀚", category: "circle" },
];

function generateMahjongDeck(): MahjongTile[] {
  const list: MahjongTile[] = [];
  let id = 1;

  // Create 4 copies of each symbol for matching
  TILE_SYMBOLS.forEach((item) => {
    for (let c = 0; c < 4; c++) {
      list.push({ id: id++, symbol: item.symbol, category: item.category as MahjongTile["category"], matched: false });
    }
  });

  return list.sort(() => Math.random() - 0.5);
}

function playAudioSynth(type: "tile" | "match" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "tile") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    } else if (type === "match") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors
  }
}

export function MahjongGame() {
  const [deck, setDeck] = useState<MahjongTile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  const initGame = useCallback(() => {
    setDeck(generateMahjongDeck());
    setSelectedId(null);
    setScore(0);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleTileClick = (tile: MahjongTile) => {
    if (tile.matched) return;

    if (selectedId === null) {
      setSelectedId(tile.id);
      playAudioSynth("tile");
    } else if (selectedId === tile.id) {
      setSelectedId(null);
    } else {
      const selectedTile = deck.find((t) => t.id === selectedId);
      if (selectedTile && selectedTile.symbol === tile.symbol) {
        // Match!
        const nextDeck = deck.map((t) => (t.id === selectedId || t.id === tile.id ? { ...t, matched: true } : t));
        setDeck(nextDeck);
        setSelectedId(null);
        setScore((s) => s + 100);
        playAudioSynth("match");

        if (nextDeck.every((t) => t.matched)) {
          setIsWon(true);
          playAudioSynth("win");
        }
      } else {
        setSelectedId(tile.id);
        playAudioSynth("tile");
      }
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="font-mono text-xs font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700">
          CỜ THẺ NGỌC BÍCH EMERALD JADE 🀄
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-emerald-200 sm:text-4xl">
          MAHJONG SOLITAIRE GỐM CỔ 🀄
        </h1>
        <p className="mt-1 text-xs text-emerald-300/70 font-mono">
          Bấm chọn 2 thẻ Mahjong có cùng biểu tượng để ghép cặp xóa khỏi bàn bàn cờ!
        </p>
      </div>

      {/* Deep Jade Felt Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-emerald-800 bg-gradient-to-b from-emerald-950 to-emerald-900 p-6 shadow-2xl">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-emerald-200">
          <span>ĐIỂM SỐ: <span className="text-amber-400 font-extrabold text-base">{score}</span></span>
          <span>CÒN LẠI: {deck.filter((t) => !t.matched).length} / {deck.length} THẺ</span>
        </div>

        {/* Mahjong Tile Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 w-full rounded-2xl border-2 border-emerald-800/80 bg-emerald-950/80 p-4">
          {deck.map((tile) => (
            <motion.button
              key={tile.id}
              layout
              onClick={() => handleTileClick(tile)}
              disabled={tile.matched}
              type="button"
              className={`flex h-16 sm:h-20 flex-col items-center justify-center rounded-xl border-2 font-mono text-3xl sm:text-4xl shadow-md transition ${
                tile.matched
                  ? "opacity-0 pointer-events-none"
                  : selectedId === tile.id
                  ? "border-amber-400 bg-amber-100 text-slate-900 scale-105 shadow-amber-400/50"
                  : "border-emerald-300 bg-emerald-100/90 text-slate-900 hover:bg-white active:scale-95"
              }`}
            >
              {tile.symbol}
            </motion.button>
          ))}
        </div>

        <button
          onClick={initGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-emerald-100 transition hover:bg-emerald-600 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Trộn bàn cờ mới 🀄
        </button>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {isWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center rounded-3xl border-2 border-emerald-600 bg-emerald-950 p-6 text-center shadow-2xl text-emerald-200"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/30 text-emerald-400">
                <Trophy size={36} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-emerald-100">BẠN ĐÃ XÓA SẠCH BÀN CỜ! 🎉</h2>
              <p className="mt-2 font-mono text-sm text-emerald-300">
                Tổng điểm: <span className="font-bold text-amber-400 text-lg">{score}</span>
              </p>
              <button
                onClick={initGame}
                type="button"
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold text-emerald-100 hover:bg-emerald-500 active:scale-95"
              >
                Chơi lại ván mới 🀄
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
