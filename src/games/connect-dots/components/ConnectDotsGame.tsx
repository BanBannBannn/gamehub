"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Bot, User } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRID_SIZE = 4; // 4x4 dots = 3x3 boxes

function playAudioSynth(type: "line" | "box" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "line") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    } else if (type === "box") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
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

export function ConnectDotsGame() {
  // Horizontal lines: 4 rows of 3 lines
  const [hLines, setHLines] = useState<boolean[][]>(() => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(false)));
  // Vertical lines: 3 rows of 4 lines
  const [vLines, setVLines] = useState<boolean[][]>(() => Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(false)));

  const [boxes, setBoxes] = useState<("P1" | "P2" | null)[][]>(() => Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE - 1).fill(null)));
  const [turn, setTurn] = useState<"P1" | "P2">("P1");
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [useBot, setUseBot] = useState<boolean>(true);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    setHLines(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(false)));
    setVLines(Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(false)));
    setBoxes(Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE - 1).fill(null)));
    setTurn("P1");
    setP1Score(0);
    setP2Score(0);
    setIsEnded(false);
  }, []);

  // Check newly completed boxes
  const updateBoxes = (nextH: boolean[][], nextV: boolean[][], player: "P1" | "P2") => {
    let boxCompleted = false;
    const nextBoxes = boxes.map((row) => [...row]);

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (nextBoxes[r][c] === null) {
          const top = nextH[r][c];
          const bottom = nextH[r + 1][c];
          const left = nextV[r][c];
          const right = nextV[r][c + 1];

          if (top && bottom && left && right) {
            nextBoxes[r][c] = player;
            boxCompleted = true;
            playAudioSynth("box");
            if (player === "P1") setP1Score((s) => s + 1);
            else setP2Score((s) => s + 1);
          }
        }
      }
    }

    setBoxes(nextBoxes);

    // Check game over (All 9 boxes filled)
    const totalFilled = nextBoxes.flat().filter((b) => b !== null).length;
    if (totalFilled === (GRID_SIZE - 1) * (GRID_SIZE - 1)) {
      setIsEnded(true);
      playAudioSynth("win");
    }

    return boxCompleted;
  };

  // Click Horizontal Line
  const clickHLine = (r: number, c: number) => {
    if (hLines[r][c] || isEnded || (turn === "P2" && useBot)) return;
    const nextH = hLines.map((row) => [...row]);
    nextH[r][c] = true;
    setHLines(nextH);
    playAudioSynth("line");

    const completed = updateBoxes(nextH, vLines, turn);
    if (!completed) setTurn(turn === "P1" ? "P2" : "P1");
  };

  // Click Vertical Line
  const clickVLine = (r: number, c: number) => {
    if (vLines[r][c] || isEnded || (turn === "P2" && useBot)) return;
    const nextV = vLines.map((row) => [...row]);
    nextV[r][c] = true;
    setVLines(nextV);
    playAudioSynth("line");

    const completed = updateBoxes(hLines, nextV, turn);
    if (!completed) setTurn(turn === "P1" ? "P2" : "P1");
  };

  // Bot AI Turn
  useEffect(() => {
    if (turn !== "P2" || !useBot || isEnded) return;

    const timer = setTimeout(() => {
      const availableLines: { type: "h" | "v"; r: number; c: number }[] = [];

      hLines.forEach((row, r) => {
        row.forEach((val, c) => {
          if (!val) availableLines.push({ type: "h", r, c });
        });
      });

      vLines.forEach((row, r) => {
        row.forEach((val, c) => {
          if (!val) availableLines.push({ type: "v", r, c });
        });
      });

      if (availableLines.length === 0) return;
      const choice = availableLines[Math.floor(Math.random() * availableLines.length)];

      if (choice.type === "h") {
        const nextH = hLines.map((row) => [...row]);
        nextH[choice.r][choice.c] = true;
        setHLines(nextH);
        playAudioSynth("line");
        const completed = updateBoxes(nextH, vLines, "P2");
        if (!completed) setTurn("P1");
      } else {
        const nextV = vLines.map((row) => [...row]);
        nextV[choice.r][choice.c] = true;
        setVLines(nextV);
        playAudioSynth("line");
        const completed = updateBoxes(hLines, nextV, "P2");
        if (!completed) setTurn("P1");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [hLines, isEnded, turn, useBot, vLines]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseBot(true)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              useBot ? "border-sky-500 bg-sky-100 text-sky-800" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <Bot size={14} /> Đấu Bot AI
          </button>
          <button
            onClick={() => setUseBot(false)}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              !useBot ? "border-sky-500 bg-sky-100 text-sky-800" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <User size={14} /> 2 Người
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-slate-800 sm:text-4xl">
          NỐI ĐIỂM DOTS & BOXES ⚪
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-mono">
          Nối các điểm để khép kín hình vuông tích điểm nhiều nhất!
        </p>
      </div>

      {/* Pastel Clean Stage */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 shadow-xl">
        <div className="flex w-full justify-between font-mono text-sm font-bold text-slate-700">
          <span className="text-sky-600">🔴 {turn === "P1" ? "Người 1 (Lượt bạn)" : "Người 1"}: {p1Score} ô</span>
          <span className="text-emerald-600">🔵 {turn === "P2" ? (useBot ? "Bot (Đang nghĩ...)" : "Người 2 (Lượt bạn)") : useBot ? "Bot AI" : "Người 2"}: {p2Score} ô</span>
        </div>

        {/* 4x4 Dots Grid Stage */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-inner">
          {Array.from({ length: GRID_SIZE }).map((_, r) => (
            <div key={r} className="flex flex-col gap-3">
              {/* Row of Dots and Horizontal Lines */}
              <div className="flex items-center gap-3">
                {Array.from({ length: GRID_SIZE }).map((_, c) => (
                  <div key={c} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-slate-700 shadow-xs" />
                    {c < GRID_SIZE - 1 && (
                      <button
                        onClick={() => clickHLine(r, c)}
                        disabled={hLines[r][c]}
                        type="button"
                        className={`h-2.5 w-14 rounded-full transition ${
                          hLines[r][c] ? "bg-sky-500" : "bg-slate-200 hover:bg-sky-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Vertical Lines and Box Colors */}
              {r < GRID_SIZE - 1 && (
                <div className="flex items-center gap-3">
                  {Array.from({ length: GRID_SIZE }).map((_, c) => (
                    <div key={c} className="flex items-center gap-3">
                      <button
                        onClick={() => clickVLine(r, c)}
                        disabled={vLines[r][c]}
                        type="button"
                        className={`h-14 w-2.5 rounded-full transition ${
                          vLines[r][c] ? "bg-sky-500" : "bg-slate-200 hover:bg-sky-300"
                        }`}
                      />
                      {c < GRID_SIZE - 1 && (
                        <div
                          className={`h-14 w-14 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition ${
                            boxes[r][c] === "P1"
                              ? "bg-sky-100 text-sky-700 border border-sky-300"
                              : boxes[r][c] === "P2"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                              : "bg-transparent"
                          }`}
                        >
                          {boxes[r][c]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={resetGame}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white transition hover:bg-slate-700 active:scale-95 shadow-md"
        >
          <RotateCcw size={18} /> Nối lại ván mới ⚪
        </button>
      </div>
    </div>
  );
}
