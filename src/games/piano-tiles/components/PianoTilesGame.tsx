"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Trophy, Music, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 360;
const HEIGHT = 480;
const LANES = 4;
const LANE_WIDTH = WIDTH / LANES;

interface Tile {
  id: number;
  lane: number;
  y: number;
  height: number;
  clicked: boolean;
}

const PIANO_NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];

function playPianoNote(index: number) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = PIANO_NOTES[index % PIANO_NOTES.length];
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function PianoTilesGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const tiles = useRef<Tile[]>([]);
  const speed = useRef<number>(4);
  const nextId = useRef<number>(1);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_pianotiles_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Spawn New Tile
  const spawnTile = useCallback(() => {
    const lane = Math.floor(Math.random() * LANES);
    const topY = tiles.current.length > 0 ? Math.min(...tiles.current.map((t) => t.y)) - 130 : -130;
    tiles.current.push({
      id: nextId.current++,
      lane,
      y: topY,
      height: 120,
      clicked: false,
    });
  }, []);

  // Start Game
  const resetGame = useCallback(() => {
    tiles.current = [];
    nextId.current = 1;
    speed.current = 4;
    setScore(0);
    setIsGameOver(false);

    // Initial 4 tiles
    for (let i = 0; i < 4; i++) {
      tiles.current.push({
        id: nextId.current++,
        lane: Math.floor(Math.random() * LANES),
        y: HEIGHT - (i + 1) * 130,
        height: 120,
        clicked: false,
      });
    }

    setIsPlaying(true);
  }, []);

  // Click Tile Logic
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const lane = Math.floor(clickX / LANE_WIDTH);

    // Find lowest unclicked tile in this lane
    const targetTile = tiles.current
      .filter((t) => t.lane === lane && !t.clicked && clickY >= t.y && clickY <= t.y + t.height)
      .sort((a, b) => b.y - a.y)[0];

    if (targetTile) {
      targetTile.clicked = true;
      playPianoNote(score);
      setScore((s) => {
        const next = s + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem("gamehub_pianotiles_highscore", next.toString());
        }
        return next;
      });

      // Increase speed slightly
      speed.current = Math.min(10, 4 + Math.floor(score / 10) * 0.5);
      spawnTile();
    } else {
      // Missed click!
      setIsGameOver(true);
      setIsPlaying(false);
    }
  };

  // Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background Lines
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, HEIGHT);
        ctx.stroke();
      }

      if (isPlaying && !isGameOver) {
        // Move Tiles
        tiles.current.forEach((t) => {
          t.y += speed.current;
        });

        // Check if unclicked tile passed bottom
        const missed = tiles.current.find((t) => !t.clicked && t.y + t.height > HEIGHT);
        if (missed) {
          setIsGameOver(true);
          setIsPlaying(false);
        }

        // Clean up offscreen clicked tiles
        tiles.current = tiles.current.filter((t) => t.y < HEIGHT + 150);
      }

      // Draw Tiles
      tiles.current.forEach((t) => {
        if (!t.clicked) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(t.lane * LANE_WIDTH + 4, t.y, LANE_WIDTH - 8, t.height);

          ctx.strokeStyle = "#00f0ff";
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2;
          ctx.strokeRect(t.lane * LANE_WIDTH + 4, t.y, LANE_WIDTH - 8, t.height);
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(t.lane * LANE_WIDTH + 4, t.y, LANE_WIDTH - 8, t.height);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPlaying, score]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation */}
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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 sm:text-4xl">
          ĐÁNH ĐÀN PIANO TIẾT TẤU 🎹
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Bấm các phím Piano đen theo tiết tấu nốt nhạc đang rơi xuống!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-cyan-400">
          NỐT ĐÃ BẤM: {score}
        </div>

        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onClick={handleCanvasClick}
          className="block rounded-2xl border border-slate-800 cursor-pointer"
        />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Music size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Piano Tiles Hero</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Bắt đầu lướt phím 🎹
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">TRẬT NỐT PIANO!</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng số nốt: <span className="font-bold text-amber-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Đánh bản nhạc mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
