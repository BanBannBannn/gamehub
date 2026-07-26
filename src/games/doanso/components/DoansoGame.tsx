"use client";

import { useEffect, useRef, useState } from "react";
import { useDoansoStore } from "@/games/doanso/store";
import { Difficulty } from "@/games/doanso/engine";
import { DifficultyPicker } from "./DifficultyPicker";
import { GuessInput } from "./GuessInput";
import { HistoryList } from "./HistoryList";
import { Hud } from "./Hud";
import { WinModal } from "./WinModal";
import {
  loadDoansoProgress,
  saveDoansoProgress,
  clearDoansoProgress,
  queuePendingSession,
} from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { ArrowLeft, Home, RotateCcw, WifiOff } from "lucide-react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DoansoGame() {
  const [ready, setReady] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasGame, setHasGame] = useState(false);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);

  const secret = useDoansoStore((s) => s.secret);
  const length = useDoansoStore((s) => s.length);
  const difficulty = useDoansoStore((s) => s.difficulty);
  const history = useDoansoStore((s) => s.history);
  const hintsUsed = useDoansoStore((s) => s.hintsUsed);
  const elapsedSeconds = useDoansoStore((s) => s.elapsedSeconds);
  const status = useDoansoStore((s) => s.status);
  const isRunning = useDoansoStore((s) => s.isRunning);

  const startNewGame = useDoansoStore((s) => s.startNewGame);
  const loadSavedGame = useDoansoStore((s) => s.loadSavedGame);
  const submitGuess = useDoansoStore((s) => s.submitGuess);
  const tick = useDoansoStore((s) => s.tick);

  // Load tiến trình đã lưu.
  useEffect(() => {
    let cancelled = false;
    loadDoansoProgress().then((saved) => {
      if (cancelled) return;
      if (saved) {
        loadSavedGame({
          secret: saved.secret,
          length: saved.length,
          difficulty: saved.difficulty,
          history: saved.history,
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

  // Autosave.
  useEffect(() => {
    if (!ready || !hasGame) return;
    const id = setTimeout(() => {
      void saveDoansoProgress({
        gameSlug: "doanso",
        secret,
        length,
        difficulty,
        history,
        hintsUsed,
        elapsedSeconds,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [secret, length, difficulty, history, hintsUsed, elapsedSeconds, ready, hasGame]);

  // Khi thắng: đưa vào hàng chờ đồng bộ + xoá save đang chơi dở.
  useEffect(() => {
    if (status !== "won" || hasQueuedCompletion.current) return;
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "doanso",
      difficulty,
      durationSeconds: elapsedSeconds,
      hintsUsed,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    void clearDoansoProgress();
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

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber-400" />
      </div>
    );
  }

  if (!hasGame) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/80 px-4 py-2 text-sm font-medium text-paper-100 transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <Home size={16} className="text-amber-400" />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
        <DifficultyPicker onPick={handlePick} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-4 py-6">
      <div className="flex w-full max-w-sm items-center justify-between text-sm text-ink-400 mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/80 px-3.5 py-1.5 text-sm font-medium text-paper-100 transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
        >
          <ArrowLeft size={16} />
          <Home size={16} className="text-amber-400" />
          <span>Trang chủ</span>
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800/80 px-3.5 py-1.5 text-sm font-medium text-paper-100 transition hover:border-amber-400 hover:bg-ink-800 active:scale-[0.98]"
        >
          <RotateCcw size={16} className="text-amber-400" /> Đổi độ khó
        </button>
      </div>

      {!isOnline && (
        <div className="flex w-full max-w-sm items-center gap-2 rounded-full bg-ink-800 px-3 py-1.5 text-xs text-ink-400">
          <WifiOff size={14} />
          Đang chơi offline
        </div>
      )}
      <Hud />
      <GuessInput onSubmit={submitGuess} />
      <button
        type="button"
        onClick={submitGuess}
        disabled={status !== "playing"}
        className="w-full max-w-sm rounded-lg bg-ink-800 py-2.5 font-medium text-paper-100 transition hover:bg-ink-700 active:scale-[0.98] disabled:opacity-40"
      >
        Đoán
      </button>
      <HistoryList />
      <WinModal onPlayAgain={handlePlayAgain} />

      <ConfirmModal
        isOpen={showConfirm}
        title="Đổi độ khó"
        message="Bạn có chắc muốn thoát ván này để đổi độ khó không? Tiến trình chưa lưu sẽ bị mất."
        onConfirm={() => {
          setShowConfirm(false);
          setHasGame(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
