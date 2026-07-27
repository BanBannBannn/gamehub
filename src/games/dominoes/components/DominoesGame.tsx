"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Bot, User } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

interface DominoTile {
  id: number;
  left: number;
  right: number;
}

function playAudioSynth(type: "tile" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "tile") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
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

function generateDominoDeck(): DominoTile[] {
  const deck: DominoTile[] = [];
  let id = 1;
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      deck.push({ id: id++, left: i, right: j });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

export function DominoesGame() {
  const [playerHand, setPlayerHand] = useState<DominoTile[]>([]);
  const [aiHand, setAiHand] = useState<DominoTile[]>([]);
  const [table, setTable] = useState<DominoTile[]>([]);
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [winner, setWinner] = useState<"player" | "ai" | "draw" | null>(null);

  const startNewGame = useCallback(() => {
    const deck = generateDominoDeck();
    const pHand = deck.slice(0, 7);
    const aHand = deck.slice(7, 14);
    const firstTile = deck[14];

    setPlayerHand(pHand);
    setAiHand(aHand);
    setTable([firstTile]);
    setTurn("player");
    setWinner(null);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Check valid placement
  const canPlay = (tile: DominoTile) => {
    if (table.length === 0) return true;
    const leftEnd = table[0].left;
    const rightEnd = table[table.length - 1].right;
    return tile.left === leftEnd || tile.right === leftEnd || tile.left === rightEnd || tile.right === rightEnd;
  };

  const playTile = (tile: DominoTile, side: "left" | "right") => {
    if (turn !== "player" || winner) return;

    let placedTile = { ...tile };
    if (side === "left") {
      const leftEnd = table[0].left;
      if (placedTile.right !== leftEnd) {
        placedTile = { ...tile, left: tile.right, right: tile.left };
      }
      setTable([placedTile, ...table]);
    } else {
      const rightEnd = table[table.length - 1].right;
      if (placedTile.left !== rightEnd) {
        placedTile = { ...tile, left: tile.right, right: tile.left };
      }
      setTable([...table, placedTile]);
    }

    setPlayerHand(playerHand.filter((t) => t.id !== tile.id));
    playAudioSynth("tile");

    if (playerHand.length === 1) {
      setWinner("player");
      playAudioSynth("win");
    } else {
      setTurn("ai");
    }
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "ai" || winner) return;

    const timer = setTimeout(() => {
      const validTiles = aiHand.filter(canPlay);
      if (validTiles.length === 0) {
        // AI passes
        setTurn("player");
        return;
      }

      const tile = validTiles[0];
      let placedTile = { ...tile };

      const leftEnd = table[0].left;
      const rightEnd = table[table.length - 1].right;

      if (tile.left === leftEnd || tile.right === leftEnd) {
        if (placedTile.right !== leftEnd) placedTile = { ...tile, left: tile.right, right: tile.left };
        setTable([placedTile, ...table]);
      } else {
        if (placedTile.left !== rightEnd) placedTile = { ...tile, left: tile.right, right: tile.left };
        setTable([...table, placedTile]);
      }

      setAiHand(aiHand.filter((t) => t.id !== tile.id));
      playAudioSynth("tile");

      if (aiHand.length === 1) {
        setWinner("ai");
        playAudioSynth("win");
      } else {
        setTurn("player");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [aiHand, table, turn, winner]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
          CHẾ ĐỘ PASTEL SOFT CERAMIC 🀫
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-emerald-900 sm:text-4xl">
          ĐÔ-MI-NÔ DOMINOES MATCH 🀫
        </h1>
        <p className="mt-1 text-xs text-emerald-700 font-mono">
          Ghép các quân Domino cùng số đầu/cuối trên thảm Ceramic màu dịu nhẹ!
        </p>
      </div>

      {/* Main Table Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-emerald-300 bg-emerald-50/80 p-6 shadow-xl">
        {/* AI Hand (Hidden) */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs font-bold text-emerald-800">
            BOT AI (CÒN {aiHand.length} QUÂN)
          </span>
          <div className="flex gap-1 min-h-[44px]">
            {aiHand.map((t) => (
              <div key={t.id} className="h-11 w-7 rounded-lg border border-emerald-300 bg-white shadow-xs" />
            ))}
          </div>
        </div>

        {/* Center Table Chain */}
        <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white p-4 min-h-[100px]">
          {table.map((tile, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-12 w-16 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 font-mono text-sm font-extrabold text-emerald-900 shadow-sm"
            >
              <span>{tile.left}</span>
              <span className="mx-1 text-emerald-400">|</span>
              <span>{tile.right}</span>
            </motion.div>
          ))}
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800">
            QUÂN BÀI CỦA BẠN (BẤM VÀO QUÂN HỢP LỆ ĐỂ ĐÁNH)
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {playerHand.map((tile) => {
              const playable = canPlay(tile) && turn === "player" && !winner;
              return (
                <button
                  key={tile.id}
                  onClick={() => playTile(tile, "right")}
                  disabled={!playable}
                  type="button"
                  className={`flex h-14 w-20 items-center justify-center rounded-xl border-2 font-mono text-base font-extrabold transition shadow-md ${
                    playable
                      ? "border-emerald-600 bg-white text-emerald-900 hover:bg-emerald-100 active:scale-95"
                      : "border-slate-300 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span>{tile.left}</span>
                  <span className="mx-1 text-slate-300">|</span>
                  <span>{tile.right}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Winner Message */}
        {winner && (
          <div className="font-mono text-base font-extrabold text-emerald-900">
            {winner === "player" ? "BẠN ĐÃ THẮNG CUỘC! 🎉" : "BOT AI THẮNG CUỘC!"}
          </div>
        )}

        <button
          onClick={startNewGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-600 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Đánh ván mới 🀫
        </button>
      </div>
    </div>
  );
}
