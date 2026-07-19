"use client";

import { useEffect, useRef, useState } from "react";
import { useXiangqiStore } from "../store";
import { XiangqiBoard } from "./Board";
import { Hud } from "./Hud";
import { SetupScreen } from "./SetupScreen";
import { XiangqiOnlineGame } from "./XiangqiOnlineGame";
import { MoveHistory } from "./MoveHistory";
import Link from "next/link";
import {
  loadXiangqiProgress,
  saveXiangqiProgress,
  clearXiangqiProgress,
  queuePendingSession,
} from "@/lib/offline/db";
import { useIsOnline } from "@/lib/offline/sync-provider";
import { WifiOff, ArrowLeft, LogOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function XiangqiGame() {
  const [ready, setReady] = useState(false);
  const [screenMode, setScreenMode] = useState<"menu" | "local" | "online">("menu");
  const [pendingRoomCode, setPendingRoomCode] = useState<string | undefined>(undefined);
  const isOnline = useIsOnline();
  const hasQueuedCompletion = useRef(false);

  // Nếu người dùng mở link mời (?room=MÃ), tự động vào thẳng màn hình online.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (!code) return;
    queueMicrotask(() => {
      setPendingRoomCode(code);
      setScreenMode("online");
    });
  }, []);

  const board = useXiangqiStore((s) => s.board);
  const turn = useXiangqiStore((s) => s.turn);
  const status = useXiangqiStore((s) => s.status);
  const winner = useXiangqiStore((s) => s.winner);
  const history = useXiangqiStore((s) => s.history);
  const redTime = useXiangqiStore((s) => s.redTime);
  const blackTime = useXiangqiStore((s) => s.blackTime);
  const isRunning = useXiangqiStore((s) => s.isRunning);
  const timeConfig = useXiangqiStore((s) => s.timeConfig);
  const mode = useXiangqiStore((s) => s.mode);

  const startNewGame = useXiangqiStore((s) => s.startNewGame);
  const loadSavedGame = useXiangqiStore((s) => s.loadSavedGame);
  const tick = useXiangqiStore((s) => s.tick);
  const quitGame = useXiangqiStore((s) => s.quitGame);

  const [showConfirm, setShowConfirm] = useState(false);

  // Load saved progress
  useEffect(() => {
    let cancelled = false;
    loadXiangqiProgress().then((saved) => {
      if (cancelled) return;
      if (saved && saved.mode !== "online" && (saved.status === "playing" || saved.status === "idle")) {
        loadSavedGame({
          board: saved.board,
          turn: saved.turn,
          history: saved.history,
          redTime: saved.redTime,
          blackTime: saved.blackTime,
          status: saved.status,
          winner: saved.winner,
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

  // Autosave (chỉ áp dụng cho ván chơi local — ván online đã đồng bộ qua Supabase, không cần lưu IndexedDB).
  useEffect(() => {
    if (!ready || status === "idle" || mode === "online") return;
    const id = setTimeout(() => {
      void saveXiangqiProgress({
        gameSlug: "xiangqi",
        board,
        turn,
        history,
        redTime,
        blackTime,
        status,
        winner,
        timeConfig,
        mode: "hotseat",
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [board, turn, history, redTime, blackTime, status, winner, timeConfig, mode, ready]);

  // Queue session on completion
  useEffect(() => {
    const isComplete = status === "won" || status === "draw";
    if (!isComplete || hasQueuedCompletion.current) return;
    
    hasQueuedCompletion.current = true;
    void queuePendingSession({
      id: crypto.randomUUID(),
      gameSlug: "xiangqi",
      difficulty: "easy",
      durationSeconds: (timeConfig - redTime) + (timeConfig - blackTime),
      hintsUsed: 0,
      completed: status === "won",
      createdAt: new Date().toISOString(),
    });
    void clearXiangqiProgress();
  }, [status, redTime, blackTime, timeConfig]);

  function handleStart(config: { timeSeconds: number; mode: "hotseat" }) {
    hasQueuedCompletion.current = false;
    startNewGame({ timeSeconds: config.timeSeconds });
    setScreenMode("local");
  }

  function handleSelectOnline() {
    setScreenMode("online");
  }

  function handleExitOnline() {
    setScreenMode("menu");
    setPendingRoomCode(undefined);
  }

  function handleQuitClick() {
    setShowConfirm(true);
  }

  function handleConfirmQuit() {
    setShowConfirm(false);
    quitGame();
    setScreenMode("menu");
    void clearXiangqiProgress();
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber-400" />
      </div>
    );
  }

  if (screenMode === "online") {
    return (
      <div className="flex flex-1 flex-col">
        <XiangqiOnlineGame initialRoomCode={pendingRoomCode} onExit={handleExitOnline} />
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 bg-[var(--xq-page-bg)]">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <SetupScreen onStart={handleStart} onSelectOnline={handleSelectOnline} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 w-full mx-auto bg-[var(--xq-page-bg)] min-h-screen">
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={handleQuitClick}
            className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-red-600"
          >
            <LogOut size={16} /> Kết thúc
          </button>
          <button
            onClick={() => useXiangqiStore.getState().undoMove()}
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
          >
            <RotateCcw size={16} /> Đi lại
          </button>
        </div>
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
            <XiangqiBoard />
          </div>

          {/* Right: Move History */}
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
              {status === "won" ? (winner === "r" ? "Quân Đỏ thắng!" : "Quân Đen thắng!") : "Hòa cờ!"}
            </h3>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleQuitClick}
                className="w-full rounded-xl border border-border py-2.5 font-medium text-foreground transition hover:bg-surface-hover"
              >
                Thoát
              </button>
              <button
                onClick={() => handleStart({ timeSeconds: timeConfig, mode: "hotseat" })}
                className="w-full rounded-xl bg-red-600 py-2.5 font-medium text-white transition hover:bg-red-700 whitespace-nowrap px-4"
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
