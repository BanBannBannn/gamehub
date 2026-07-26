"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Sparkles } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const GRAVITY = 0.45;
const FLAP = -7.5;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_RATE = 90; // frames
const PIPE_GAP = 130;

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

// Synthesize Audio FX for Flappy
function playSynthSound(type: "jump" | "score" | "hit") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "jump") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else if (type === "score") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore audio errors
  }
}

export function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Game Engine Refs
  const birdY = useRef<number>(200);
  const velocity = useRef<number>(0);
  const pipes = useRef<Pipe[]>([]);
  const frameCount = useRef<number>(0);
  const animFrameId = useRef<number | null>(null);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("gamehub_flappy_highscore");
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  // Jump Action
  const jump = useCallback(() => {
    if (gameState === "idle") {
      setGameState("playing");
      birdY.current = 200;
      velocity.current = FLAP;
      pipes.current = [];
      setScore(0);
      playSynthSound("jump");
    } else if (gameState === "playing") {
      velocity.current = FLAP;
      playSynthSound("jump");
    } else if (gameState === "gameover") {
      setGameState("playing");
      birdY.current = 200;
      velocity.current = FLAP;
      pipes.current = [];
      setScore(0);
      playSynthSound("jump");
    }
  }, [gameState]);

  // Keypress event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localScore = score;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw City Silhouette
      ctx.fillStyle = "#312e81";
      ctx.fillRect(20, canvas.height - 80, 50, 80);
      ctx.fillRect(90, canvas.height - 110, 60, 110);
      ctx.fillRect(170, canvas.height - 70, 70, 70);
      ctx.fillRect(260, canvas.height - 120, 55, 120);

      // Update Bird Physics if playing
      if (gameState === "playing") {
        velocity.current += GRAVITY;
        birdY.current += velocity.current;

        // Spawn Pipes
        frameCount.current++;
        if (frameCount.current % PIPE_SPAWN_RATE === 0) {
          const minH = 50;
          const maxH = canvas.height - PIPE_GAP - minH - 60;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          const botH = canvas.height - topH - PIPE_GAP;
          pipes.current.push({
            x: canvas.width,
            topHeight: topH,
            bottomHeight: botH,
            passed: false,
          });
        }

        // Update Pipes
        pipes.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;

          // Check Score
          if (!pipe.passed && pipe.x + 50 < 80) {
            pipe.passed = true;
            localScore++;
            setScore(localScore);
            playSynthSound("score");

            if (localScore > highScore) {
              setHighScore(localScore);
              localStorage.setItem("gamehub_flappy_highscore", localScore.toString());
            }
          }
        });

        // Filter off-screen pipes
        pipes.current = pipes.current.filter((p) => p.x > -60);

        // Check Collisions with Ground / Ceiling
        if (birdY.current > canvas.height - 25 || birdY.current < 0) {
          playSynthSound("hit");
          setGameState("gameover");
        }

        // Check Pipe Collision
        const birdX = 80;
        const birdRadius = 14;

        for (const p of pipes.current) {
          if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + 50) {
            if (birdY.current - birdRadius < p.topHeight || birdY.current + birdRadius > canvas.height - p.bottomHeight) {
              playSynthSound("hit");
              setGameState("gameover");
              break;
            }
          }
        }
      }

      // Draw Pipes
      pipes.current.forEach((p) => {
        // Top Pipe
        const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + 50, 0);
        pipeGrad.addColorStop(0, "#22c55e");
        pipeGrad.addColorStop(1, "#15803d");
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(p.x, 0, 50, p.topHeight);
        ctx.strokeStyle = "#166534";
        ctx.strokeRect(p.x, 0, 50, p.topHeight);

        // Pipe Lip Top
        ctx.fillRect(p.x - 4, p.topHeight - 16, 58, 16);
        ctx.strokeRect(p.x - 4, p.topHeight - 16, 58, 16);

        // Bottom Pipe
        ctx.fillRect(p.x, canvas.height - p.bottomHeight, 50, p.bottomHeight);
        ctx.strokeRect(p.x, canvas.height - p.bottomHeight, 50, p.bottomHeight);

        // Pipe Lip Bottom
        ctx.fillRect(p.x - 4, canvas.height - p.bottomHeight, 58, 16);
        ctx.strokeRect(p.x - 4, canvas.height - p.bottomHeight, 58, 16);
      });

      // Draw Ground
      const groundGrad = ctx.createLinearGradient(0, canvas.height - 20, 0, canvas.height);
      groundGrad.addColorStop(0, "#f59e0b");
      groundGrad.addColorStop(1, "#b45309");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      // Draw Bird
      ctx.save();
      ctx.translate(80, birdY.current);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, velocity.current * 0.08));
      ctx.rotate(angle);

      // Bird Body (Glowing Yellow Circle)
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bird Eye
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(10, 2);
      ctx.lineTo(20, 5);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, highScore, score]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6">
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
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500 sm:text-4xl">
          FLAPPY BIRD ARCADE 🐤
        </h1>
        <p className="mt-1 text-xs text-muted">
          Bấm Phím Space, Phím Mũi Tên Lên hoặc Chạm màn hình để Vỗ Cánh!
        </p>
      </div>

      {/* Main Game Stage */}
      <div
        onClick={jump}
        className="relative flex flex-col items-center justify-center rounded-3xl border-4 border-amber-400/40 shadow-2xl overflow-hidden cursor-pointer touch-none"
      >
        <canvas ref={canvasRef} width={360} height={480} className="block bg-slate-950" />

        {/* Start Overlay */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-6 text-center backdrop-blur-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Chạm để vỗ cánh!</h2>
            <p className="mt-1 text-xs text-amber-300">Vượt qua các ống khói để ghi điểm cao nhất.</p>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-md">
            <h2 className="font-display text-3xl font-bold text-rose-500">THUA RỒI!</h2>
            <div className="mt-4 flex flex-col gap-1 font-mono">
              <p className="text-sm text-slate-300">Điểm trận này: <span className="font-bold text-amber-400 text-lg">{score}</span></p>
              <p className="text-xs text-slate-400">Kỷ lục của bạn: <span className="font-bold text-emerald-400">{highScore}</span></p>
            </div>
            <button
              onClick={jump}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-500 active:scale-[0.98]"
            >
              <RotateCcw size={18} /> Chơi lại ván mới
            </button>
          </div>
        )}

        {/* Real-time score indicator during play */}
        {gameState === "playing" && (
          <div className="absolute top-4 font-mono text-4xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {score}
          </div>
        )}
      </div>
    </div>
  );
}
