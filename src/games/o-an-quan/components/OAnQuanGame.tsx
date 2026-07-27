"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, User, Bot } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

// Board Pits: 0..4 (P1 Dân), 5 (P1 Quan), 6..10 (P2 Dân), 11 (P2 Quan)
interface BoardState {
  pits: number[]; // 12 pits total
  p1Score: number;
  p2Score: number;
}

function playAudioSynth(type: "sow" | "eat" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "sow") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    } else if (type === "eat") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function OAnQuanGame() {
  const [board, setBoard] = useState<BoardState>({
    pits: [5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 10], // 5 pebbles per small pit, 10 (Quan) per big pit
    p1Score: 0,
    p2Score: 0,
  });
  const [turn, setTurn] = useState<"p1" | "p2">("p1");
  const [useBot, setUseBot] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<"playing" | "ended">("playing");
  const [winnerText, setWinnerText] = useState<string>("");

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard({
      pits: [5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 10],
      p1Score: 0,
      p2Score: 0,
    });
    setTurn("p1");
    setGameStatus("playing");
    setWinnerText("");
  }, []);

  // Make Move (Rải quân)
  const makeMove = (pitIndex: number, direction: "cw" | "ccw") => {
    if (gameStatus !== "playing") return;
    if (turn === "p1" && (pitIndex < 0 || pitIndex > 4)) return;
    if (turn === "p2" && (pitIndex < 6 || pitIndex > 10)) return;

    let pits = [...board.pits];
    let pebbles = pits[pitIndex];
    if (pebbles === 0) return;

    pits[pitIndex] = 0;
    let curr = pitIndex;
    const step = direction === "cw" ? 1 : -1;

    playAudioSynth("sow");

    // Sowing pebbles
    while (pebbles > 0) {
      curr = (curr + step + 12) % 12;
      pits[curr] += 1;
      pebbles--;
    }

    // Check Eating Logic (Ăn ô)
    let extraP1 = 0;
    let extraP2 = 0;

    while (true) {
      const nextPit = (curr + step + 12) % 12;
      const targetPit = (curr + step * 2 + 12) % 12;

      // If next pit is empty and target pit has pebbles -> Eat!
      if (pits[nextPit] === 0 && pits[targetPit] > 0) {
        playAudioSynth("eat");
        const eaten = pits[targetPit];
        pits[targetPit] = 0;

        if (turn === "p1") extraP1 += eaten;
        else extraP2 += eaten;

        curr = targetPit;
      } else {
        break;
      }
    }

    const newP1Score = board.p1Score + extraP1;
    const newP2Score = board.p2Score + extraP2;

    // Check End Game (Cả 2 Quan 5 & 11 đều bị ăn hết)
    if (pits[5] === 0 && pits[11] === 0) {
      setGameStatus("ended");
      playAudioSynth("win");
      if (newP1Score > newP2Score) setWinnerText("Người chơi 1 THẮNG CUỘC! 🎉");
      else if (newP2Score > newP1Score) setWinnerText(useBot ? "Bot AI THẮNG CUỘC!" : "Người chơi 2 THẮNG CUỘC!");
      else setWinnerText("HÒA NHAU!");
    } else {
      setTurn(turn === "p1" ? "p2" : "p1");
    }

    setBoard({ pits, p1Score: newP1Score, p2Score: newP2Score });
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "p2" || !useBot || gameStatus !== "playing") return;

    const timer = setTimeout(() => {
      const validPits = [6, 7, 8, 9, 10].filter((idx) => board.pits[idx] > 0);
      if (validPits.length === 0) return;
      const chosenPit = validPits[Math.floor(Math.random() * validPits.length)];
      const dir = Math.random() < 0.5 ? "cw" : "ccw";
      makeMove(chosenPit, dir);
    }, 800);

    return () => clearTimeout(timer);
  }, [board.pits, gameStatus, turn, useBot]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseBot(true)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              useBot ? "border-amber-500 bg-amber-900/40 text-amber-300" : "border-amber-900/40 bg-amber-950/40 text-amber-700"
            }`}
          >
            <Bot size={14} /> Đấu với Bot AI
          </button>
          <button
            onClick={() => setUseBot(false)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              !useBot ? "border-amber-500 bg-amber-900/40 text-amber-300" : "border-amber-900/40 bg-amber-950/40 text-amber-700"
            }`}
          >
            <User size={14} /> 2 Người (Cùng máy)
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-amber-300 sm:text-4xl">
          Ô ĂN QUAN GỖ CỔ TRUYỀN 🌾
        </h1>
        <p className="mt-1 text-xs text-amber-200/70 font-mono">
          Phong cách Gỗ mộc ấm áp • Chọn ô dân của bạn và chọn chiều rải quân để ăn điểm!
        </p>
      </div>

      {/* Cozy Wooden Board Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-4 border-amber-800 bg-gradient-to-b from-amber-950 to-amber-900 p-6 shadow-2xl">
        {/* Score Banner */}
        <div className="flex w-full justify-between font-mono text-base font-extrabold text-amber-200">
          <div className="flex items-center gap-2">
            <span>🔴 {turn === "p1" ? "Người 1 (Lượt bạn)" : "Người 1"}:</span>
            <span className="text-amber-400 text-xl">{board.p1Score}đ</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔵 {turn === "p2" ? (useBot ? "Bot AI (Đang nghĩ...)" : "Người 2 (Lượt bạn)") : useBot ? "Bot AI" : "Người 2"}:</span>
            <span className="text-amber-400 text-xl">{board.p2Score}đ</span>
          </div>
        </div>

        {/* 12-Pit Board Layout */}
        <div className="grid w-full max-w-2xl grid-cols-7 gap-3 rounded-2xl border-2 border-amber-800/80 bg-amber-950/80 p-4">
          {/* Quan P1 (Pit 11) - Left Big Pit */}
          <div className="col-span-1 flex flex-col items-center justify-center rounded-2xl border-2 border-amber-700 bg-amber-900/60 p-3 text-center shadow-inner">
            <span className="text-[10px] font-bold text-amber-400 uppercase">QUAN BẮC</span>
            <span className="font-mono text-2xl font-extrabold text-amber-200">{board.pits[11]}</span>
          </div>

          {/* Center 5 Dân Pits Top (6..10) & Bottom (0..4) */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Player 2 Pits (6..10) */}
            <div className="grid grid-cols-5 gap-2">
              {[10, 9, 8, 7, 6].map((pitIdx) => (
                <div key={pitIdx} className="flex flex-col items-center gap-1">
                  <div className="flex h-16 w-full flex-col items-center justify-center rounded-xl border border-amber-800 bg-amber-900/40 font-mono font-bold text-amber-200">
                    {board.pits[pitIdx]}
                  </div>
                  {turn === "p2" && !useBot && board.pits[pitIdx] > 0 && (
                    <div className="flex gap-1">
                      <button onClick={() => makeMove(pitIdx, "ccw")} className="rounded bg-amber-800 px-1.5 text-[10px] text-amber-200">⬅️</button>
                      <button onClick={() => makeMove(pitIdx, "cw")} className="rounded bg-amber-800 px-1.5 text-[10px] text-amber-200">➡️</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Player 1 Pits (0..4) */}
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((pitIdx) => (
                <div key={pitIdx} className="flex flex-col items-center gap-1">
                  {turn === "p1" && board.pits[pitIdx] > 0 && (
                    <div className="flex gap-1">
                      <button onClick={() => makeMove(pitIdx, "cw")} className="rounded bg-amber-700 px-1.5 text-[10px] text-amber-100 font-bold hover:bg-amber-600">⬅️</button>
                      <button onClick={() => makeMove(pitIdx, "ccw")} className="rounded bg-amber-700 px-1.5 text-[10px] text-amber-100 font-bold hover:bg-amber-600">➡️</button>
                    </div>
                  )}
                  <div className="flex h-16 w-full flex-col items-center justify-center rounded-xl border border-amber-700 bg-amber-900/80 font-mono font-bold text-amber-200">
                    {board.pits[pitIdx]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quan P2 (Pit 5) - Right Big Pit */}
          <div className="col-span-1 flex flex-col items-center justify-center rounded-2xl border-2 border-amber-700 bg-amber-900/60 p-3 text-center shadow-inner">
            <span className="text-[10px] font-bold text-amber-400 uppercase">QUAN NAM</span>
            <span className="font-mono text-2xl font-extrabold text-amber-200">{board.pits[5]}</span>
          </div>
        </div>

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-bold text-amber-100 transition hover:bg-amber-500 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Ván chơi mới 🌾
        </button>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {gameStatus === "ended" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center rounded-3xl border-2 border-amber-600 bg-amber-950 p-6 text-center shadow-2xl text-amber-200"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-600/30 text-amber-400">
                <Trophy size={36} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">{winnerText}</h2>
              <p className="mt-2 font-mono text-sm text-amber-300">
                Tỉ số: <span className="font-bold text-amber-400 text-lg">{board.p1Score}</span> - <span className="font-bold text-amber-400 text-lg">{board.p2Score}</span>
              </p>
              <button
                onClick={resetGame}
                type="button"
                className="mt-6 w-full rounded-xl bg-amber-600 py-3 font-bold text-amber-100 hover:bg-amber-500 active:scale-95"
              >
                Chơi ván mới 🌾
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
