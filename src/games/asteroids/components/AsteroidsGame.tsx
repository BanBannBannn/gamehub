"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowUp, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 480;
const HEIGHT = 400;

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

function playAudioSynth(type: "shoot" | "explode") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
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

export function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const ship = useRef({
    x: WIDTH / 2,
    y: HEIGHT / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
  });

  const asteroids = useRef<Asteroid[]>([]);
  const bullets = useRef<Bullet[]>([]);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_asteroids_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Init Asteroids
  const initAsteroids = useCallback(() => {
    const list: Asteroid[] = [];
    for (let i = 0; i < 5; i++) {
      list.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        radius: 25,
      });
    }
    asteroids.current = list;
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    ship.current = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
    };
    bullets.current = [];
    setScore(0);
    setIsGameOver(false);
    initAsteroids();
    setIsPlaying(true);
  }, [initAsteroids]);

  // Shoot
  const shoot = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    const s = ship.current;
    bullets.current.push({
      x: s.x + Math.cos(s.angle) * 15,
      y: s.y + Math.sin(s.angle) * 15,
      vx: Math.cos(s.angle) * 7,
      vy: Math.sin(s.angle) * 7,
      life: 40,
    });
    playAudioSynth("shoot");
  }, [isGameOver, isPlaying]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === " " || e.key === "w" || e.key === "ArrowUp") {
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

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (isPlaying && !isGameOver) {
        const s = ship.current;

        // Rotation
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) s.angle -= 0.08;
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) s.angle += 0.08;

        // Thrust
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) {
          s.vx += Math.cos(s.angle) * 0.15;
          s.vy += Math.sin(s.angle) * 0.15;
        }

        // Apply friction
        s.vx *= 0.98;
        s.vy *= 0.98;

        // Move Ship
        s.x = (s.x + s.vx + WIDTH) % WIDTH;
        s.y = (s.y + s.vy + HEIGHT) % HEIGHT;

        // Move Bullets
        bullets.current.forEach((b) => {
          b.x = (b.x + b.vx + WIDTH) % WIDTH;
          b.y = (b.y + b.vy + HEIGHT) % HEIGHT;
          b.life -= 1;
        });
        bullets.current = bullets.current.filter((b) => b.life > 0);

        // Move Asteroids & Check Bullet Collision
        const newAsteroids: Asteroid[] = [];

        asteroids.current.forEach((ast) => {
          ast.x = (ast.x + ast.vx + WIDTH) % WIDTH;
          ast.y = (ast.y + ast.vy + HEIGHT) % HEIGHT;

          let destroyed = false;

          bullets.current.forEach((b) => {
            const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
            if (dist < ast.radius) {
              destroyed = true;
              b.life = 0;
              playAudioSynth("explode");
              setScore((sc) => {
                const next = sc + (ast.radius > 15 ? 50 : 100);
                if (next > highScore) {
                  setHighScore(next);
                  localStorage.setItem("gamehub_asteroids_highscore", next.toString());
                }
                return next;
              });

              // Split into smaller asteroids
              if (ast.radius > 15) {
                newAsteroids.push(
                  { x: ast.x, y: ast.y, vx: Math.random() * 3 - 1.5, vy: Math.random() * 3 - 1.5, radius: 12 },
                  { x: ast.x, y: ast.y, vx: Math.random() * 3 - 1.5, vy: Math.random() * 3 - 1.5, radius: 12 }
                );
              }
            }
          });

          // Check Ship Collision
          const shipDist = Math.hypot(s.x - ast.x, s.y - ast.y);
          if (shipDist < ast.radius + 10) {
            playAudioSynth("explode");
            setIsGameOver(true);
            setIsPlaying(false);
          }

          if (!destroyed) newAsteroids.push(ast);
        });

        asteroids.current = newAsteroids;
      }

      // Draw Ship (Glowing Cyan Triangle)
      const s = ship.current;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.strokeStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Draw Asteroids (Glowing Amber)
      asteroids.current.forEach((ast) => {
        ctx.strokeStyle = "#facc15";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Bullets (Glowing Rose)
      bullets.current.forEach((b) => {
        ctx.fillStyle = "#f43f5e";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 sm:text-4xl">
          ASTEROIDS ARCADE 🌠
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Phím A/D xoay phi thuyền • Phím W tăng tốc • Space bắn vỡ thiên thạch!
        </p>
      </div>

      {/* Stage */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="mb-2 font-mono text-sm font-bold text-cyan-400">
          ĐIỂM SỐ: {score}
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Zap size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Asteroids Neon Arcade</h2>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Bắt đầu bắn thiên thạch 🌠
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-rose-500">VA CHẠM THIÊN THẠCH!</h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tổng điểm: <span className="font-bold text-amber-400 text-lg">{score}</span>
            </p>
            <button
              onClick={resetGame}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Chơi lại ván mới
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-4 sm:hidden">
        <button
          onClick={() => {
            ship.current.angle -= 0.3;
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={shoot}
          type="button"
          className="flex h-12 px-6 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950"
        >
          BẮN
        </button>
        <button
          onClick={() => {
            ship.current.angle += 0.3;
          }}
          type="button"
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-900 text-cyan-400 border border-cyan-500/40"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
