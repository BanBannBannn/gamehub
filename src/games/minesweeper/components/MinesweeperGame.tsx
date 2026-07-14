"use client";

import { useEffect, useRef, useState } from "react";
import { useMinesweeperStore } from "@/games/minesweeper/store";
import { Difficulty } from "@/games/minesweeper/engine/types";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { WinModal } from "./WinModal";
import { LoseModal } from "./LoseModal";
import { DifficultyPicker } from "./DifficultyPicker";
import Link from "next/link";
import {
  loadMinesweeperProgress,
  saveMinesweeperProgress,
  clearMinesweeperProgress,
  queuePendingSession,
} from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { WifiOff, ArrowLeft, X } from "lucide-react";

export function MinesweeperGame() {
  const [ready, setReady] = useState(false);
  const [hasGame, setHasGame] = useState(false);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);

  const board = useMinesweeperStore((s) => s.board);
  const config = useMinesweeperStore((s) => s.config);
  const difficulty = useMinesweeperStore((s) => s.difficulty);
  const status = useMinesweeperStore((s) => s.status);
  const firstClickDone = useMinesweeperStore((s) => s.firstClickDone);
  const hintsUsed = useMinesweeperStore((s) => s.hintsUsed);
  const elapsedSeconds = useMinesweeperStore((s) => s.elapsedSeconds);
  const isRunning = useMinesweeperStore((s) => s.isRunning);

  const startNewGame = useMinesweeperStore((s) => s.startNewGame);
  const loadSavedGame = useMinesweeperStore((s) => s.loadSavedGame);
  const tick = useMinesweeperStore((s) => s.tick);

  // Load saved progress
  useEffect(() => {
    let cancelled = false;
    loadMinesweeperProgress().then((saved) => {
      if (cancelled) return;
      if (saved && (saved.status === "playing" || saved.status === "idle")) {
        loadSavedGame({
          board: saved.board,
          config: saved.config,
          difficulty: saved.difficulty,
          status: saved.status,
          firstClickDone: saved.firstClickDone,
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

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  // Autosave
  useEffect(() => {
    if (!ready || !hasGame) return;
    const id = setTimeout(() => {
      void saveMinesweeperProgress({
        gameSlug: "minesweeper",
        board,
        config,
        difficulty,
        status,
        firstClickDone,
        hintsUsed,
        elapsedSeconds,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [board, config, difficulty, status, firstClickDone, hintsUsed, elapsedSeconds, ready, hasGame]);

  // Queue session on completion
  useEffect(() => {
    const isComplete = status === "won" || status === "lost";
    if (!isComplete || hasQueuedCompletion.current) return;
    
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "minesweeper",
      difficulty,
      durationSeconds: elapsedSeconds,
      hintsUsed,
      completed: status === "won",
      createdAt: new Date().toISOString(),
    });
    void clearMinesweeperProgress();
  }, [status, difficulty, elapsedSeconds, hintsUsed]);

  function handlePick(d: Difficulty) {
    hasQueuedCompletion.current = false;
    startNewGame(d);
    setHasGame(true);
  }

  function handlePlayAgain() {
    hasQueuedCompletion.current = false;
    setHasGame(false);
  }

  function handleQuitGame() {
    if (confirm("Bạn có chắc muốn thoát ván game này? Tiến trình chưa lưu sẽ bị xoá.")) {
      hasQueuedCompletion.current = false;
      setHasGame(false);
      void clearMinesweeperProgress();
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-coral-500" />
      </div>
    );
  }

  if (!hasGame) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <DifficultyPicker onPick={handlePick} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[min(92vw,600px)] items-center justify-between">
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
      <Board />
      <WinModal onPlayAgain={handlePlayAgain} />
      <LoseModal onPlayAgain={handlePlayAgain} />
    </div>
  );
}
