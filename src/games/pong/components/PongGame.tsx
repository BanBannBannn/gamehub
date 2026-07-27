"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, User, Bot } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";

const WIDTH = 500;
const HEIGHT = 350;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 70;
const BALL_SIZE = 10;
const WINNING_SCORE = 7;

function playBounceSynth(type: "wall" | "paddle" | "score") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "wall") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    } else if (type === "paddle") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio errors
  }
}

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"ai" | "2p">("ai");
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Physics State
  const p1Y = useRef<number>(HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const p2Y = useRef<number>(HEIGHT / 2 - PADDLE_HEIGHT / 2);

  const ballX = useRef<number>(WIDTH / 2);
  const ballY = useRef<number>(HEIGHT / 2);
  const ballVx = useRef<number>(4);
  const ballVy = useRef<number>(3);

  const keysPressed = useRef<Record<string, boolean>>({});

  // Reset Ball
  const resetBall = useCallback((direction: number) => {
    ballX.current = WIDTH / 2;
    ballY.current = HEIGHT / 2;
    ballVx.current = 4 * direction;
    ballVy.current = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
  }, []);

  // Reset Full Match
  const startNewMatch = useCallback(() => {
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    p1Y.current = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    p2Y.current = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(1);
    setIsPlaying(true);
  }, [resetBall]);

  // Keyboard Listeners
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

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background Grid
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Center Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isPlaying && !winner) {
        // Player 1 Controls (W/S)
        if (keysPressed.current["w"] || keysPressed.current["W"] || keysPressed.current["ArrowUp"]) {
          p1Y.current = Math.max(0, p1Y.current - 6);
        }
        if (keysPressed.current["s"] || keysPressed.current["S"] || keysPressed.current["ArrowDown"]) {
          p1Y.current = Math.min(HEIGHT - PADDLE_HEIGHT, p1Y.current + 6);
        }

        // Player 2 / AI Controls
        if (mode === "2p") {
          if (keysPressed.current["i"] || keysPressed.current["I"]) {
            p2Y.current = Math.max(0, p2Y.current - 6);
          }
          if (keysPressed.current["k"] || keysPressed.current["K"]) {
            p2Y.current = Math.min(HEIGHT - PADDLE_HEIGHT, p2Y.current + 6);
          }
        } else {
          // Smart AI logic
          const p2Center = p2Y.current + PADDLE_HEIGHT / 2;
          if (p2Center < ballY.current - 10) {
            p2Y.current = Math.min(HEIGHT - PADDLE_HEIGHT, p2Y.current + 4.2);
          } else if (p2Center > ballY.current + 10) {
            p2Y.current = Math.max(0, p2Y.current - 4.2);
          }
        }

        // Move Ball
        ballX.current += ballVx.current;
        ballY.current += ballVy.current;

        // Top & Bottom Wall Bounce
        if (ballY.current - BALL_SIZE / 2 <= 0 || ballY.current + BALL_SIZE / 2 >= HEIGHT) {
          ballVy.current = -ballVy.current;
          playBounceSynth("wall");
        }

        // Paddle 1 Collision (Left)
        if (
          ballX.current - BALL_SIZE / 2 <= PADDLE_WIDTH + 10 &&
          ballY.current >= p1Y.current &&
          ballY.current <= p1Y.current + PADDLE_HEIGHT
        ) {
          ballVx.current = Math.abs(ballVx.current) * 1.05; // speed up
          playBounceSynth("paddle");
        }

        // Paddle 2 Collision (Right)
        if (
          ballX.current + BALL_SIZE / 2 >= WIDTH - PADDLE_WIDTH - 10 &&
          ballY.current >= p2Y.current &&
          ballY.current <= p2Y.current + PADDLE_HEIGHT
        ) {
          ballVx.current = -Math.abs(ballVx.current) * 1.05;
          playBounceSynth("paddle");
        }

        // Score Check
        if (ballX.current < 0) {
          playBounceSynth("score");
          setP2Score((s) => {
            const next = s + 1;
            if (next >= WINNING_SCORE) {
              setWinner(mode === "ai" ? "Bot AI" : "Người chơi 2");
              setIsPlaying(false);
            } else {
              resetBall(1);
            }
            return next;
          });
        } else if (ballX.current > WIDTH) {
          playBounceSynth("score");
          setP1Score((s) => {
            const next = s + 1;
            if (next >= WINNING_SCORE) {
              setWinner("Người chơi 1");
              setIsPlaying(false);
            } else {
              resetBall(-1);
            }
            return next;
          });
        }
      }

      // Draw Paddle 1 (Cyan Neon)
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.fillRect(10, p1Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Paddle 2 (Pink Neon)
      ctx.fillStyle = "#ec4899";
      ctx.shadowColor = "#ec4899";
      ctx.shadowBlur = 10;
      ctx.fillRect(WIDTH - PADDLE_WIDTH - 10, p2Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Ball (Glowing Amber)
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, mode, resetBall, winner]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("ai")}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              mode === "ai"
                ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                : "border-border bg-surface text-muted"
            }`}
          >
            <Bot size={14} /> Đấu với Bot AI
          </button>
          <button
            onClick={() => setMode("2p")}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              mode === "2p"
                ? "border-pink-400 bg-pink-400/10 text-pink-400"
                : "border-border bg-surface text-muted"
            }`}
          >
            <User size={14} /> 2 Người (Cùng máy)
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400 sm:text-4xl">
          PONG CYBER ARCADE 🏓
        </h1>
        <p className="mt-1 text-xs text-muted font-mono">
          Người 1: Phím W / S (hoặc Mũi tên) • Người 2: Phím I / K • Ai chạm {WINNING_SCORE} điểm trước sẽ thắng!
        </p>
      </div>

      {/* Main Arena */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        {/* Score Board Header */}
        <div className="mb-3 flex w-full justify-around font-mono text-2xl font-extrabold">
          <span className="text-cyan-400">{p1Score}</span>
          <span className="text-muted">:</span>
          <span className="text-pink-400">{p2Score}</span>
        </div>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block rounded-2xl border border-slate-800" />

        {/* Start Overlay */}
        {!isPlaying && !winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xs rounded-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Play size={36} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-white">Pong Arcade Neon</h2>
            <button
              onClick={startNewMatch}
              type="button"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Bắt đầu giao bóng 🏓
            </button>
          </div>
        )}

        {/* Winner Overlay */}
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md rounded-3xl">
            <h2 className="font-display text-3xl font-bold text-amber-400">
              {winner} Thắng Cuộc! 🏆
            </h2>
            <p className="mt-2 font-mono text-sm text-slate-300">
              Tỉ số chung cuộc: <span className="text-cyan-400 font-bold">{p1Score}</span> - <span className="text-pink-400 font-bold">{p2Score}</span>
            </p>
            <button
              onClick={startNewMatch}
              type="button"
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <RotateCcw size={18} /> Đấu lại trận mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
