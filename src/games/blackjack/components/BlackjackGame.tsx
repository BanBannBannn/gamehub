"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, DollarSign, Plus, Check } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

interface Card {
  suit: "♠" | "♥" | "♦" | "♣";
  value: string;
  weight: number;
}

const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (const v of VALUES) {
      let w = parseInt(v, 10);
      if (v === "J" || v === "Q" || v === "K") w = 10;
      if (v === "A") w = 11;
      deck.push({ suit: s, value: v, weight: w });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function calculateHandScore(hand: Card[]): number {
  let total = hand.reduce((sum, c) => sum + c.weight, 0);
  let aces = hand.filter((c) => c.value === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function playAudioSynth(type: "card" | "win" | "bust") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "card") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors
  }
}

export function BlackjackGame() {
  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [chips, setChips] = useState<number>(1000);
  const [bet, setBet] = useState<number>(50);
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealerTurn" | "ended">("betting");
  const [resultText, setResultText] = useState<string>("");

  // Deal Initial Cards
  const dealHand = useCallback(() => {
    if (chips < bet) return;
    setChips((c) => c - bet);

    const currentDeck = [...deck];
    if (currentDeck.length < 10) {
      const fresh = createDeck();
      currentDeck.push(...fresh);
    }

    const pCard1 = currentDeck.pop()!;
    const dCard1 = currentDeck.pop()!;
    const pCard2 = currentDeck.pop()!;
    const dCard2 = currentDeck.pop()!;

    setDeck(currentDeck);
    setPlayerHand([pCard1, pCard2]);
    setDealerHand([dCard1, dCard2]);
    setGameState("playing");
    setResultText("");
    playAudioSynth("card");
  }, [bet, chips, deck]);

  // Hit (Rút thêm bài)
  const hit = () => {
    if (gameState !== "playing") return;
    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];

    setDeck(currentDeck);
    setPlayerHand(newHand);
    playAudioSynth("card");

    if (calculateHandScore(newHand) > 21) {
      setGameState("ended");
      setResultText("QUÁ 21 ĐIỂM (BUST)! BẠN THUA 💸");
      playAudioSynth("bust");
    }
  };

  // Stand (Dừng rút & Chuyển cho Nhà cái)
  const stand = useCallback(() => {
    setGameState("dealerTurn");

    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];

    while (calculateHandScore(currentDealerHand) < 17) {
      const card = currentDeck.pop()!;
      currentDealerHand.push(card);
    }

    setDeck(currentDeck);
    setDealerHand(currentDealerHand);

    const pScore = calculateHandScore(playerHand);
    const dScore = calculateHandScore(currentDealerHand);

    if (dScore > 21 || pScore > dScore) {
      setChips((c) => c + bet * 2);
      setResultText("BẠN THẮNG CUỘC! 🎉");
      playAudioSynth("win");
    } else if (pScore === dScore) {
      setChips((c) => c + bet);
      setResultText("HÒA CỜ (PUSH)! TRẢ LẠI TIỀN");
    } else {
      setResultText("NHÀ CÁI THẮNG 💸");
      playAudioSynth("bust");
    }

    setGameState("ended");
  }, [bet, dealerHand, deck, playerHand]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <DollarSign size={16} className="text-emerald-400" />
          <span className="text-muted">Tiền Chip:</span>
          <span className="font-bold text-emerald-400">${chips}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 sm:text-4xl">
          XÌ DÁCH BLACKJACK 21 🃏
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Rút bài sao cho tổng điểm sát 21 nhất nhưng không quá 21!
        </p>
      </div>

      {/* Main Table */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-emerald-500/40 bg-emerald-950/80 p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
        {/* Dealer Hand */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
            BÀI NHÀ CÁI (DEALER) {gameState === "ended" && `(${calculateHandScore(dealerHand)}đ)`}
          </span>
          <div className="flex gap-2 min-h-[90px]">
            {dealerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 font-mono shadow-md ${
                  gameState !== "ended" && idx === 1
                    ? "border-slate-600 bg-slate-800 text-slate-500"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                {gameState !== "ended" && idx === 1 ? (
                  <span className="text-xl">❓</span>
                ) : (
                  <>
                    <span className={`text-base font-bold ${card.suit === "♥" || card.suit === "♦" ? "text-rose-600" : "text-slate-900"}`}>
                      {card.value}
                    </span>
                    <span className={`text-lg ${card.suit === "♥" || card.suit === "♦" ? "text-rose-600" : "text-slate-900"}`}>
                      {card.suit}
                    </span>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-emerald-500/30" />

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
            BÀI CỦA BẠN ({calculateHandScore(playerHand)}đ)
          </span>
          <div className="flex gap-2 min-h-[90px]">
            {playerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white font-mono shadow-md"
              >
                <span className={`text-base font-bold ${card.suit === "♥" || card.suit === "♦" ? "text-rose-600" : "text-slate-900"}`}>
                  {card.value}
                </span>
                <span className={`text-lg ${card.suit === "♥" || card.suit === "♦" ? "text-rose-600" : "text-slate-900"}`}>
                  {card.suit}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Result Message */}
        {resultText && (
          <div className="font-mono text-base font-extrabold text-amber-400 drop-shadow-md">
            {resultText}
          </div>
        )}

        {/* Action Controls */}
        {gameState === "betting" && (
          <button
            onClick={dealHand}
            type="button"
            className="w-full max-w-xs rounded-xl bg-amber-400 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-lg"
          >
            Chia bài (${bet}) 🃏
          </button>
        )}

        {gameState === "playing" && (
          <div className="flex gap-4 w-full max-w-xs">
            <button
              onClick={hit}
              type="button"
              className="flex-1 rounded-xl bg-amber-400 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
            >
              RÚT BÀI (HIT)
            </button>
            <button
              onClick={stand}
              type="button"
              className="flex-1 rounded-xl bg-slate-800 py-3 font-bold text-white transition hover:bg-slate-700 active:scale-95 border border-slate-600"
            >
              DỪNG (STAND)
            </button>
          </div>
        )}

        {gameState === "ended" && (
          <button
            onClick={() => setGameState("betting")}
            type="button"
            className="w-full max-w-xs rounded-xl bg-amber-400 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-lg"
          >
            Chơi ván tiếp theo 🎲
          </button>
        )}
      </div>
    </div>
  );
}
