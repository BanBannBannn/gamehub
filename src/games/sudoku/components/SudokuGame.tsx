"use client";

import { useEffect, useRef, useState } from "react";
import { useSudokuStore } from "@/games/sudoku/store";
import { Difficulty } from "@/games/sudoku/engine";
import { Board } from "./Board";
import { NumberPad } from "./NumberPad";
import { Hud } from "./Hud";
import { WinModal } from "./WinModal";
import { DifficultyPicker } from "./DifficultyPicker";
import Link from "next/link";
import { loadSudokuProgress, saveSudokuProgress, clearSudokuProgress, queuePendingSession } from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { WifiOff, ArrowLeft, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function SudokuGame() {
  const [ready, setReady] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasGame, setHasGame] = useState(false);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);

  const board = useSudokuStore((s) => s.board);
  const notes = useSudokuStore((s) => s.notes);
  const puzzle = useSudokuStore((s) => s.puzzle);
  const solution = useSudokuStore((s) => s.solution);
  const difficulty = useSudokuStore((s) => s.difficulty);
  const elapsedSeconds = useSudokuStore((s) => s.elapsedSeconds);
  const hintsUsed = useSudokuStore((s) => s.hintsUsed);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const isRunning = useSudokuStore((s) => s.isRunning);

  const startNewGame = useSudokuStore((s) => s.startNewGame);
  const loadSavedGame = useSudokuStore((s) => s.loadSavedGame);
  const tick = useSudokuStore((s) => s.tick);
  const selectCell = useSudokuStore((s) => s.selectCell);
  const selectedIndex = useSudokuStore((s) => s.selectedIndex);
  const inputValue = useSudokuStore((s) => s.inputValue);
  const clearCell = useSudokuStore((s) => s.clearCell);
  const undo = useSudokuStore((s) => s.undo);
  const redo = useSudokuStore((s) => s.redo);

  // Load saved progress on mount.
  useEffect(() => {
    let cancelled = false;
    loadSudokuProgress().then((saved) => {
      if (cancelled) return;
      if (saved && !isComplete) {
        loadSavedGame({
          puzzle: saved.puzzle as never,
          solution: saved.solution as never,
          board: saved.board as never,
          notes: saved.notes,
          difficulty: saved.difficulty,
          elapsedSeconds: saved.elapsedSeconds,
          hintsUsed: saved.hintsUsed,
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

  // Timer tick.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  // Autosave to IndexedDB (debounced).
  useEffect(() => {
    if (!ready || !hasGame) return;
    const id = setTimeout(() => {
      void saveSudokuProgress({
        gameSlug: "sudoku",
        difficulty,
        puzzle: puzzle as number[],
        solution: solution as number[],
        board: board as number[],
        notes,
        startedAt: Date.now(),
        elapsedSeconds,
        hintsUsed,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [board, notes, puzzle, solution, difficulty, elapsedSeconds, hintsUsed, ready, hasGame]);

  // On completion: queue a session for sync and clear the in-progress save.
  useEffect(() => {
    if (!isComplete || hasQueuedCompletion.current) return;
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "sudoku",
      difficulty,
      durationSeconds: elapsedSeconds,
      hintsUsed,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    void clearSudokuProgress();
  }, [isComplete, difficulty, elapsedSeconds, hintsUsed]);

  // Keyboard controls.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hasGame) return;
      if (e.key >= "1" && e.key <= "9") {
        inputValue(Number(e.key) as never);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        clearCell();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (selectedIndex === null) return;
      const row = Math.floor(selectedIndex / 9);
      const col = selectedIndex % 9;
      if (e.key === "ArrowUp") selectCell(((row + 8) % 9) * 9 + col);
      if (e.key === "ArrowDown") selectCell(((row + 1) % 9) * 9 + col);
      if (e.key === "ArrowLeft") selectCell(row * 9 + ((col + 8) % 9));
      if (e.key === "ArrowRight") selectCell(row * 9 + ((col + 1) % 9));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasGame, selectedIndex, inputValue, clearCell, undo, redo, selectCell]);

  function handlePick(d: Difficulty) {
    hasQueuedCompletion.current = false;
    startNewGame(d);
    setHasGame(true);
  }

  function handlePlayAgain() {
    hasQueuedCompletion.current = false;
    setHasGame(false);
  }

  function handleQuitGameClick() {
    setShowConfirm(true);
  }

  function handleConfirmQuit() {
    setShowConfirm(false);
    hasQueuedCompletion.current = false;
    setHasGame(false);
    void clearSudokuProgress();
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
        <DifficultyPicker onPick={handlePick} />
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
          onClick={handleQuitGameClick}
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
      <NumberPad />
      <WinModal onPlayAgain={handlePlayAgain} />

      <ConfirmModal
        isOpen={showConfirm}
        title="Thoát ván cờ"
        message="Bạn có chắc chắn muốn thoát ván game Sudoku hiện tại? Tiến trình chưa lưu có thể bị mất."
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
