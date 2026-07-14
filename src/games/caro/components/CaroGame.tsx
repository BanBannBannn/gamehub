"use client";

import { useEffect, useRef, useState } from "react";
import { useCaroStore } from "@/games/caro/store";
import { Difficulty, GameMode, SIZE } from "@/games/caro/engine";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { WinModal } from "./WinModal";
import { ModeAndDifficultyPicker } from "./ModeAndDifficultyPicker";
import Link from "next/link";
import { loadCaroProgress, saveCaroProgress, clearCaroProgress, queuePendingSession } from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { WifiOff, ArrowLeft, X } from "lucide-react";

export function CaroGame() {
  const [ready, setReady] = useState(false);
  const [hasGame, setHasGame] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);

  const board = useCaroStore((s) => s.board);
  const currentPlayer = useCaroStore((s) => s.currentPlayer);
  const mode = useCaroStore((s) => s.mode);
  const difficulty = useCaroStore((s) => s.difficulty);
  const humanPlayer = useCaroStore((s) => s.humanPlayer);
  const movesHistory = useCaroStore((s) => s.movesHistory);
  const hintsUsed = useCaroStore((s) => s.hintsUsed);
  const elapsedSeconds = useCaroStore((s) => s.elapsedSeconds);
  const winner = useCaroStore((s) => s.winner);
  const isDraw = useCaroStore((s) => s.isDraw);
  const isRunning = useCaroStore((s) => s.isRunning);

  const startNewGame = useCaroStore((s) => s.startNewGame);
  const loadSavedGame = useCaroStore((s) => s.loadSavedGame);
  const placeMove = useCaroStore((s) => s.placeMove);
  const playAiMoveIfNeeded = useCaroStore((s) => s.playAiMoveIfNeeded);
  const tick = useCaroStore((s) => s.tick);

  // Load tiến trình đã lưu.
  useEffect(() => {
    let cancelled = false;
    loadCaroProgress().then((saved) => {
      if (cancelled) return;
      if (saved) {
        loadSavedGame({
          board: saved.board as never,
          currentPlayer: saved.currentPlayer,
          mode: saved.mode,
          difficulty: saved.difficulty,
          humanPlayer: saved.humanPlayer,
          movesHistory: saved.movesHistory,
          hintsUsed: saved.hintsUsed,
          elapsedSeconds: saved.elapsedSeconds,
        });
        setHasGame(true);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  // Để AI đánh nếu đang tới lượt AI (kể cả sau khi load game đã lưu).
  useEffect(() => {
    if (!hasGame) return;
    playAiMoveIfNeeded();
  }, [hasGame, currentPlayer, mode, playAiMoveIfNeeded]);

  // Autosave.
  useEffect(() => {
    if (!ready || !hasGame) return;
    const id = setTimeout(() => {
      void saveCaroProgress({
        gameSlug: "caro",
        board: board as number[],
        currentPlayer,
        mode,
        difficulty,
        humanPlayer,
        movesHistory,
        hintsUsed,
        elapsedSeconds,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [board, currentPlayer, mode, difficulty, humanPlayer, movesHistory, hintsUsed, elapsedSeconds, ready, hasGame]);

  // Khi ván kết thúc: đưa vào hàng chờ đồng bộ + xoá save đang chơi dở.
  useEffect(() => {
    const gameOver = Boolean(winner) || isDraw;
    if (!gameOver || hasQueuedCompletion.current) return;
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "caro",
      difficulty: mode === "ai" ? difficulty : null,
      durationSeconds: elapsedSeconds,
      hintsUsed,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    void clearCaroProgress();
  }, [winner, isDraw, mode, difficulty, elapsedSeconds, hintsUsed]);

  // Điều hướng bàn phím: mũi tên di chuyển ô focus, Enter/Space để đánh.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hasGame) return;
      const gameOver = Boolean(winner) || isDraw;
      const isHumanTurn = mode !== "ai" || currentPlayer === humanPlayer;

      if (focusedIndex === null) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          setFocusedIndex(Math.floor((SIZE * SIZE) / 2));
        }
        return;
      }

      const row = Math.floor(focusedIndex / SIZE);
      const col = focusedIndex % SIZE;
      if (e.key === "ArrowUp") setFocusedIndex(Math.max(0, row - 1) * SIZE + col);
      if (e.key === "ArrowDown") setFocusedIndex(Math.min(SIZE - 1, row + 1) * SIZE + col);
      if (e.key === "ArrowLeft") setFocusedIndex(row * SIZE + Math.max(0, col - 1));
      if (e.key === "ArrowRight") setFocusedIndex(row * SIZE + Math.min(SIZE - 1, col + 1));

      if ((e.key === "Enter" || e.key === " ") && !gameOver && isHumanTurn) {
        e.preventDefault();
        if (board[focusedIndex] === 0) {
          placeMove(focusedIndex);
          setTimeout(() => playAiMoveIfNeeded(), 0);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasGame, focusedIndex, board, winner, isDraw, mode, currentPlayer, humanPlayer, placeMove, playAiMoveIfNeeded]);

  function handleStart(gameMode: GameMode, gameDifficulty: Difficulty) {
    hasQueuedCompletion.current = false;
    startNewGame(gameMode, gameDifficulty);
    setHasGame(true);
    setFocusedIndex(null);
  }

  function handlePlayAgain() {
    hasQueuedCompletion.current = false;
    setHasGame(false);
  }

  function handleQuitGame() {
    if (confirm("Bạn có chắc muốn thoát ván game này? Tiến trình chưa lưu sẽ bị xoá.")) {
      hasQueuedCompletion.current = false;
      setHasGame(false);
      void clearCaroProgress();
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber-400" />
      </div>
    );
  }

  if (!hasGame) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <ModeAndDifficultyPicker onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[min(92vw,560px)] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Trang chủ
        </Link>
        <button
          type="button"
          onClick={handleQuitGame}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-coral-500 transition hover:bg-surface-hover"
        >
          <X size={16} /> Kết thúc sớm
        </button>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 rounded-full bg-surface-hover px-3 py-1.5 text-xs text-muted">
          <WifiOff size={14} />
          Đang chơi offline — tiến trình sẽ đồng bộ khi có mạng trở lại
        </div>
      )}
      <Hud />
      <Board focusedIndex={focusedIndex} />
      <WinModal onPlayAgain={handlePlayAgain} />
    </div>
  );
}
