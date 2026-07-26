"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 480;
const HEIGHT = 400;
const BASKET_WIDTH = 70;
const BASKET_HEIGHT = 16;

interface Item {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: "apple" | "orange" | "watermelon" | "bomb";
  emoji: string;
}

function playAudioSynth(type: "catch" | "bomb") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "catch") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
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

export function FruitCatcherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const basketX = useRef<number>(WIDTH / 2 - BASKET_WIDTH / 2);
  const items = useRef<Item[]>([]);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_fruit_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    basketX.current = WIDTH / 2 - BASKET_WIDTH / 2;
    items.current = [];
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (isPlaying && !isGameOver) {
        // Move Basket
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
          basketX.current = Math.max(0, basketX.current - 7);
        }
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
          basketX.current = Math.min(WIDTH - BASKET_WIDTH, basketX.current + 7);
        }

        // Spawn Items
        spawnTimer++;
        if (spawnTimer > 35) {
          spawnTimer = 0;
          const rand = Math.random();
          let type: Item["type"] = "apple";
          let emoji = "🍎";
          if (rand < 0.25) {
            type = "orange";
            emoji = "🍊";
          } else if (rand < 0.45) {
            type = "watermelon";
            emoji = "🍉";
          } else if (rand < 0.65) {
            type = "bomb";
            emoji = "💣";
          }

          items.current.push({
            id: Math.random(),
            x: Math.random() * (WIDTH - 30) + 15,
            y: -20,
            speed: 3 + Math.random() * 2.5,
            type,
            emoji,
          });
        }

        // Move & Check Catch
        items.current.forEach((item) => {
          item.y += item.speed;

          // Check Basket Collision
          if (
            item.y >= HEIGHT - BASKET_HEIGHT - 20 &&
            item.y <= HEIGHT - 10 &&
            item.x >= basketX.current - 15 &&
            item.x <= basketX.current + BASKET_WIDTH + 15
          ) {
            if (item.type === "bomb") {
              playAudioSynth("bomb");
              item.y = HEIGHT + 100; // remove
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                }
                return next;
              });
            } else {
              playAudioSynth("catch");
              const pts = item.type === "watermelon" ? 30 : item.type === "orange" ? 20 : 10;
              item.y = HEIGHT + 100; // remove
              setScore((s) => {
                const newScore = s + pts;
                if (newScore > highScore) {
                  setHighScore(newScore);
                  localStorage.setItem("gamehub_fruit_highscore", newScore.toString());
                }
                return newScore;
              });
            }
          }
        });

        // Filter out items
        items.current = items.current.filter((i) => i.y < HEIGHT + 50);
      }

      // Draw Basket (Glowing Amber/Gold)
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.fillRect(basketX.current, HEIGHT - BASKET_HEIGHT - 10, BASKET_WIDTH, BASKET_HEIGHT);

      // Draw Falling Items
      ctx.font = "24px sans-serif";
      items.current.forEach((item) => {
        ctx.fillText(item.emoji, item.x - 12, item.y);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPlaying]);

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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 sm:text-4xl">
          HỨNG HOA QUẢ SLICE 🍎
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím Mũi Tên Trái/Phải điều khiển giỏ • Hứng hoa quả, NÉ BOM!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-amber-400/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        {/* Header Indicators */}
        <div className="mb-2 flex w-full justify-between font-mono text-sm font-bold">
          <div className="flex items-center gap-1 text-rose-500">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} size={18} fill={i < lives ? "#f43f5e" : "transparent"} color="#f43f5e" />
            ))}
          </div>
          <div className="text-amber-400">
            ĐIỂM: {score}
          </div>
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Hứng Hoa Quả Arcade</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              Bắt đầu hứng hoa quả 🍎
            </button>
          </div>
        )}

        {/* End Game Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">KẾT THÚC VÁN!</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm hứng được: <span className="font-bold text-amber-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <RotateCcw size={18} /> Chơi ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 sm:hidden">
        <button
          onClick={() => {
            basketX.current = Math.max(0, basketX.current - 30);
          }}
          type="button"
          className="flex h-12 w-20 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => {
            basketX.current = Math.min(WIDTH - BASKET_WIDTH, basketX.current + 30);
          }}
          type="button"
          className="flex h-12 w-20 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-amber-400/40"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
