"use client";

import { useEffect, useRef, useState } from "react";
import { useChessStore } from "@/games/chess/store";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { SetupScreen } from "./SetupScreen";
import { MoveHistory } from "./MoveHistory";
import { stockfishEngine } from "../engine/ai";
import Link from "next/link";
import {
  loadChessProgress,
  saveChessProgress,
  clearChessProgress,
  queuePendingSession,
} from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { WifiOff, ArrowLeft, LogOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ChessGame() {
  const [ready, setReady] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);
  
  // AI processing state
  const [isAiThinking, setIsAiThinking] = useState(false);

  const game = useChessStore((s) => s.game);
  const fen = useChessStore((s) => s.fen);
  const pgn = useChessStore((s) => s.pgn);
  const status = useChessStore((s) => s.status);
  const whiteTime = useChessStore((s) => s.whiteTime);
  const blackTime = useChessStore((s) => s.blackTime);
  const winner = useChessStore((s) => s.winner);
  const isRunning = useChessStore((s) => s.isRunning);
  const mode = useChessStore((s) => s.mode);
  const autoFlip = useChessStore((s) => s.autoFlip);
  const timeConfig = useChessStore((s) => s.timeConfig);
  
  const startNewGame = useChessStore((s) => s.startNewGame);
  const loadSavedGame = useChessStore((s) => s.loadSavedGame);
  const tick = useChessStore((s) => s.tick);
  const quitGame = useChessStore((s) => s.quitGame);
  const makeMove = useChessStore((s) => s.makeMove);

  const isWhiteTurn = game.turn() === "w";

  // Load saved progress
  useEffect(() => {
    let cancelled = false;
    loadChessProgress().then((saved) => {
      if (cancelled) return;
      if (saved && (saved.status === "playing" || saved.status === "idle")) {
        loadSavedGame({
          fen: saved.fen,
          pgn: saved.pgn,
          whiteTime: saved.whiteTime,
          blackTime: saved.blackTime,
          status: saved.status,
          winner: saved.winner,
          mode: saved.mode,
          autoFlip: saved.autoFlip,
          timeConfig: saved.timeConfig,
        });
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

// AI Logic
  useEffect(() => {
    if (status !== "playing" || mode !== "ai" || isWhiteTurn) return;

    // It's AI's turn (Black)
    let cancelled = false;
    // Dời việc setState ra khỏi phần đồng bộ của effect body (tránh
    // cascading render ngay lập tức) — vẫn chạy gần như tức thì.
    queueMicrotask(() => {
      if (!cancelled) setIsAiThinking(true);
    });

    stockfishEngine.getBestMove(fen, 10, (bestMove) => {
      if (!cancelled && bestMove) {
        // Stockfish returns format like e2e4 or e7e8q
        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
        
        makeMove({ from, to, promotion });
        setIsAiThinking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fen, status, mode, isWhiteTurn, makeMove]);

  // Autosave
  useEffect(() => {
    if (!ready || status === "idle") return;
    const id = setTimeout(() => {
      void saveChessProgress({
        gameSlug: "chess",
        fen,
        pgn,
        whiteTime,
        blackTime,
        status,
        winner,
        mode,
        autoFlip,
        timeConfig,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [fen, pgn, whiteTime, blackTime, status, winner, mode, autoFlip, timeConfig, ready]);

  // Queue session on completion
  useEffect(() => {
    const isComplete = status === "won" || status === "draw";
    if (!isComplete || hasQueuedCompletion.current) return;
    
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "chess",
      difficulty: mode === "ai" ? "medium" : "easy", // simple mapping
      durationSeconds: (timeConfig - whiteTime) + (timeConfig - blackTime),
      hintsUsed: 0,
      completed: status === "won",
      createdAt: new Date().toISOString(),
    });
    void clearChessProgress();
  }, [status, whiteTime, blackTime, timeConfig, mode]);

  function handleStart(config: { timeSeconds: number; mode: "ai" | "hotseat"; autoFlip: boolean }) {
    hasQueuedCompletion.current = false;
    startNewGame(config);
  }

  function handleQuitClick() {
    setShowConfirm(true);
  }

  function handleConfirmQuit() {
    setShowConfirm(false);
    quitGame();
    void clearChessProgress();
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber-400" />
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <SetupScreen onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 w-full mx-auto">
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={handleQuitClick}
            className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-red-600"
          >
            <LogOut size={16} /> Kết thúc
          </button>
          <button
            onClick={() => useChessStore.getState().undoMove()}
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
          >
            <RotateCcw size={16} /> Đi lại
          </button>
        </div>
        {isAiThinking && (
          <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
            <div className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
            Máy đang tính...
          </div>
        )}
      </div>

      {!isOnline && (
        <div className="flex w-full max-w-[500px] lg:max-w-[820px]">
          <div className="flex items-center gap-2 rounded-full bg-surface-hover px-3 py-1.5 text-xs text-muted w-max">
            <WifiOff size={14} />
            Đang chơi offline
          </div>
        </div>
      )}
      
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] flex-col gap-4">
        <Hud />
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full">
          {/* Left: Board */}
          <div className="w-full max-w-[500px]">
            <Board />
          </div>

          {/* Right: Move History (Aligned perfectly with Board) */}
          <div className="w-full lg:w-[296px]">
            <MoveHistory />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(status === "won" || status === "draw") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border text-center"
          >
            <h3 className="font-display text-2xl font-bold text-foreground">
              {status === "won" ? (winner === "w" ? "Quân Trắng thắng!" : "Quân Đen thắng!") : "Hòa cờ!"}
            </h3>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleQuitClick}
                className="w-full rounded-xl border border-border py-2.5 font-medium text-foreground transition hover:bg-surface-hover"
              >
                Thoát
              </button>
              <button
                onClick={() => handleStart({ timeSeconds: timeConfig, mode, autoFlip })}
                className="w-full rounded-xl bg-amber-400 py-2.5 font-medium text-ink-950 transition hover:bg-amber-500 whitespace-nowrap px-4"
              >
                Chơi lại
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirm}
        title="Thoát ván cờ"
        message="Bạn có chắc chắn muốn thoát ván cờ hiện tại? Tiến trình chưa lưu có thể bị mất."
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
