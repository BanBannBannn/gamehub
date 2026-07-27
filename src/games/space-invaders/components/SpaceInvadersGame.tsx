"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { unlockAchievement } from "@/lib/achievements";

const WIDTH = 480;
const HEIGHT = 400;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 16;
const ALIEN_ROWS = 3;
const ALIEN_COLS = 7;

interface Bullet {
  x: number;
  y: number;
  isAlien: boolean;
}

interface Alien {
  x: number;
  y: number;
  alive: boolean;
}

function playAudioSynth(type: "shoot" | "invader_die" | "player_die") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else if (type === "invader_die") {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
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

export function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const playerX = useRef<number>(WIDTH / 2 - PLAYER_WIDTH / 2);
  const bullets = useRef<Bullet[]>([]);
  const aliens = useRef<Alien[]>([]);
  const alienDir = useRef<number>(1);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_space_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Init Aliens
  const initAliens = useCallback(() => {
    const list: Alien[] = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        list.push({
          x: 40 + c * 55,
          y: 40 + r * 40,
          alive: true,
        });
      }
    }
    aliens.current = list;
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    playerX.current = WIDTH / 2 - PLAYER_WIDTH / 2;
    bullets.current = [];
    alienDir.current = 1;
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    initAliens();
    setIsPlaying(true);
    unlockAchievement("first_game");
  }, [initAliens]);

  // Shoot Bullet
  const shoot = useCallback(() => {
    if (!isPlaying || isGameOver || isWon) return;
    bullets.current.push({
      x: playerX.current + PLAYER_WIDTH / 2,
      y: HEIGHT - PLAYER_HEIGHT - 10,
      isAlien: false,
    });
    playAudioSynth("shoot");
  }, [isGameOver, isPlaying, isWon]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        shoot();
      }
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
  }, [shoot]);

  // Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let alienMoveCounter = 0;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (isPlaying && !isGameOver && !isWon) {
        // Player Move
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
          playerX.current = Math.max(0, playerX.current - 5);
        }
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
          playerX.current = Math.min(WIDTH - PLAYER_WIDTH, playerX.current + 5);
        }

        // Alien Move Logic
        alienMoveCounter++;
        if (alienMoveCounter > 25) {
          alienMoveCounter = 0;

          // Check Wall Bounce
          const aliveAliens = aliens.current.filter((a) => a.alive);
          let shiftDown = false;

          for (const a of aliveAliens) {
            if ((alienDir.current === 1 && a.x >= WIDTH - 50) || (alienDir.current === -1 && a.x <= 10)) {
              alienDir.current *= -1;
              shiftDown = true;
              break;
            }
          }

          aliens.current.forEach((a) => {
            if (a.alive) {
              a.x += alienDir.current * 12;
              if (shiftDown) a.y += 15;

              // Alien reached bottom
              if (a.y >= HEIGHT - PLAYER_HEIGHT - 30) {
                playAudioSynth("player_die");
                setIsGameOver(true);
                setIsPlaying(false);
              }
            }
          });
        }

        // Alien Random Laser Fire
        if (Math.random() < 0.03) {
          const aliveAliens = aliens.current.filter((a) => a.alive);
          if (aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            bullets.current.push({
              x: shooter.x + 15,
              y: shooter.y + 20,
              isAlien: true,
            });
          }
        }

        // Update Bullets
        bullets.current.forEach((b) => {
          if (b.isAlien) b.y += 4;
          else b.y -= 7;

          // Player Bullet hits Alien
          if (!b.isAlien) {
            aliens.current.forEach((a) => {
              if (a.alive && b.x >= a.x && b.x <= a.x + 30 && b.y >= a.y && b.y <= a.y + 25) {
                a.alive = false;
                b.y = -100;
                playAudioSynth("invader_die");
                setScore((s) => {
                  const newScore = s + 50;
                  if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem("gamehub_space_highscore", newScore.toString());
                  }
                  return newScore;
                });
              }
            });
          }

          // Alien Bullet hits Player
          if (b.isAlien) {
            if (b.x >= playerX.current && b.x <= playerX.current + PLAYER_WIDTH && b.y >= HEIGHT - PLAYER_HEIGHT - 10) {
              playAudioSynth("player_die");
              setIsGameOver(true);
              setIsPlaying(false);
            }
          }
        });

        // Filter out-of-bound bullets
        bullets.current = bullets.current.filter((b) => b.y > 0 && b.y < HEIGHT);

        // Check Win Condition
        if (aliens.current.every((a) => !a.alive)) {
          setIsWon(true);
          setIsPlaying(false);
        }
      }

      // Draw Player Spaceship (Glowing Green Neon)
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 10;
      ctx.fillRect(playerX.current, HEIGHT - PLAYER_HEIGHT - 10, PLAYER_WIDTH, PLAYER_HEIGHT);
      ctx.fillRect(playerX.current + PLAYER_WIDTH / 2 - 4, HEIGHT - PLAYER_HEIGHT - 18, 8, 8);

      // Draw Aliens (Glowing Purple Neon)
      aliens.current.forEach((a) => {
        if (a.alive) {
          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 10;
          ctx.fillRect(a.x, a.y, 30, 22);

          // Eyes
          ctx.fillStyle = "#000000";
          ctx.shadowBlur = 0;
          ctx.fillRect(a.x + 6, a.y + 6, 5, 5);
          ctx.fillRect(a.x + 19, a.y + 6, 5, 5);
        }
      });

      // Draw Bullets
      bullets.current.forEach((b) => {
        ctx.fillStyle = b.isAlien ? "#ef4444" : "#00f0ff";
        ctx.shadowColor = b.isAlien ? "#ef4444" : "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x - 2, b.y, 4, 10);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPlaying, isWon]);

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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 sm:text-4xl">
          SPACE INVADERS NEON 🚀
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím Mũi Tên Trái/Phải di chuyển • Phím Space hoặc Bắn laser tiêu diệt đĩa bay!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-purple-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-purple-400">
          ĐIỂM SỐ: {score}
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && !isWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 animate-pulse">
              <Zap size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Bắn Đĩa Bay Space Invaders</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-purple-500 px-6 py-3 font-bold text-white transition hover:bg-purple-400 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              Khai hỏa chiến đấu 🚀
            </button>
          </div>
        )}

        {/* End Game Overlay */}
        {(isGameOver || isWon) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className={`font-display text-3xl font-bold ${isWon ? "text-emerald-400" : "text-rose-500"}`}>
              {isWon ? "CHIẾN THẮNG RỰC RỠ! 🎉" : "PHI THUYỀN BỊ BẮN HẠ!"}
            </h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm: <span className="font-bold text-purple-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-bold text-white transition hover:bg-purple-400 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
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
            playerX.current = Math.max(0, playerX.current - 20);
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={shoot}
          type="button"
          className="flex h-12 px-6 items-center justify-center rounded-xl bg-purple-500 font-bold text-white"
        >
          BẮN
        </button>
        <button
          onClick={() => {
            playerX.current = Math.min(WIDTH - PLAYER_WIDTH, playerX.current + 20);
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-purple-400 border border-purple-500/40"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
