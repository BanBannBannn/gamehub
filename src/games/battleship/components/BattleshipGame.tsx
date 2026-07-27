"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Target, Shield } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRID_SIZE = 8;
const SHIPS = [
  { name: "Tàu Hạm Đội", size: 4 },
  { name: "Tàu Tuần Dương", size: 3 },
  { name: "Tàu Ngầm", size: 2 },
];

type CellState = "empty" | "ship" | "hit" | "miss";

function playAudioSynth(type: "hit" | "miss" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "hit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else if (type === "miss") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
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

export function BattleshipGame() {
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("empty"))
  );
  const [aiGrid, setAiGrid] = useState<CellState[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("empty"))
  );
  const [aiShipsVisible, setAiShipsVisible] = useState<boolean[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
  );

  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_battleship_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Place ships randomly on a grid
  const placeShipsRandomly = (visibleGrid: boolean[][]) => {
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

    SHIPS.forEach((ship) => {
      let placed = false;
      while (!placed) {
        const isHorizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE : GRID_SIZE - ship.size));
        const col = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE - ship.size : GRID_SIZE));

        let canPlace = true;
        for (let i = 0; i < ship.size; i++) {
          const r = isHorizontal ? row : row + i;
          const c = isHorizontal ? col + i : col;
          if (grid[r][c]) canPlace = false;
        }

        if (canPlace) {
          for (let i = 0; i < ship.size; i++) {
            const r = isHorizontal ? row : row + i;
            const c = isHorizontal ? col + i : col;
            grid[r][c] = true;
          }
          placed = true;
        }
      }
    });

    return grid;
  };

  // Reset Game
  const startNewGame = useCallback(() => {
    const pShips = placeShipsRandomly(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)));
    const pGrid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => (pShips[r][c] ? ("ship" as CellState) : ("empty" as CellState)))
    );

    const aShips = placeShipsRandomly(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)));
    const aGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("empty"));

    setPlayerGrid(pGrid);
    setAiGrid(aGrid);
    setAiShipsVisible(aShips);
    setIsPlayerTurn(true);
    setGameStatus("playing");
    setScore(0);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Player Fire Missile
  const playerFire = (r: number, c: number) => {
    if (!isPlayerTurn || gameStatus !== "playing" || aiGrid[r][c] !== "empty") return;

    const hasShip = aiShipsVisible[r][c];
    const newAiGrid = aiGrid.map((row) => [...row]);
    newAiGrid[r][c] = hasShip ? "hit" : "miss";
    setAiGrid(newAiGrid);

    if (hasShip) {
      playAudioSynth("hit");
      setScore((s) => {
        const next = s + 100;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem("gamehub_battleship_highscore", next.toString());
        }
        return next;
      });

      // Check Win Condition
      const totalHits = newAiGrid.flat().filter((cell) => cell === "hit").length;
      const totalShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);
      if (totalHits >= totalShipCells) {
        setGameStatus("won");
        playAudioSynth("win");
        return;
      }
    } else {
      playAudioSynth("miss");
    }

    setIsPlayerTurn(false);
  };

  // Bot AI Fire Missile Turn
  useEffect(() => {
    if (isPlayerTurn || gameStatus !== "playing") return;

    const timer = setTimeout(() => {
      setPlayerGrid((prevPGrid) => {
        const available: { r: number; c: number }[] = [];
        prevPGrid.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (cell === "empty" || cell === "ship") {
              available.push({ r, c });
            }
          });
        });

        if (available.length === 0) return prevPGrid;
        const target = available[Math.floor(Math.random() * available.length)];
        const nextPGrid = prevPGrid.map((row) => [...row]);

        if (nextPGrid[target.r][target.c] === "ship") {
          nextPGrid[target.r][target.c] = "hit";
          playAudioSynth("hit");
        } else {
          nextPGrid[target.r][target.c] = "miss";
          playAudioSynth("miss");
        }

        // Check Loss Condition
        const totalShipHits = nextPGrid.flat().filter((cell) => cell === "hit").length;
        const totalShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);
        if (totalShipHits >= totalShipCells) {
          setGameStatus("lost");
        }

        return nextPGrid;
      });

      setIsPlayerTurn(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [gameStatus, isPlayerTurn]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2 font-mono text-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-muted">Kỷ lục:</span>
          <span className="font-bold text-amber-400">{highScore}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 sm:text-4xl">
          THỦY CHIẾN BATTLESHIP 🚢
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Bắn hạ toàn bộ hạm đội tàu chiến của Bot AI trước khi hạm đội của bạn bị tiêu diệt!
        </p>
      </div>

      {/* Main Game Stage */}
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        {/* Enemy Grid (Target Field) */}
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-cyan-500/40 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-cyan-400">
            <Target size={18} /> HẢI TRẬN ĐỊCH (BẤM ĐỂ BẮN TEN LỬA)
          </div>
          <div className="grid grid-cols-8 gap-1 rounded-2xl bg-slate-900 p-2">
            {aiGrid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => playerFire(r, c)}
                  disabled={!isPlayerTurn || cell !== "empty"}
                  type="button"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold transition ${
                    cell === "hit"
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/50"
                      : cell === "miss"
                      ? "bg-slate-800 text-slate-500"
                      : "bg-slate-800/80 text-transparent hover:bg-cyan-500/30"
                  }`}
                >
                  {cell === "hit" ? "💥" : cell === "miss" ? "💧" : ""}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Player Grid (Own Fleet) */}
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-blue-500/40 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-blue-400">
            <Shield size={18} /> HẠM ĐỘI CỦA BẠN
          </div>
          <div className="grid grid-cols-8 gap-1 rounded-2xl bg-slate-900 p-2">
            {playerGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    cell === "hit"
                      ? "bg-rose-600 text-white"
                      : cell === "miss"
                      ? "bg-slate-800 text-slate-500"
                      : cell === "ship"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-800/50 text-transparent"
                  }`}
                >
                  {cell === "hit" ? "💥" : cell === "miss" ? "💧" : cell === "ship" ? "🚢" : ""}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={startNewGame}
        type="button"
        className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-lg"
      >
        <RotateCcw size={18} /> Xếp lại hạm đội ván mới
      </button>
    </div>
  );
}
