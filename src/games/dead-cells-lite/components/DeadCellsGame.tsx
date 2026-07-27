"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Trophy, Home } from "lucide-react";
import dynamic from "next/dynamic";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { RunEventPayload } from "../engine/types";
import { getLocalBest, saveRunResult, RunRecord } from "../lib/records";
import type { OnRunEvent } from "./DeadCellsCanvas";

const DeadCellsCanvas = dynamic(
  () => import("./DeadCellsCanvas").then((mod) => mod.DeadCellsCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl border border-border-hover bg-surface-hover/60 text-sm text-muted">
        Đang tải game…
      </div>
    ),
  }
);

type RunResultState = { payload: RunEventPayload; isNewBest: boolean } | null;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DeadCellsGame() {
  const [runKey, setRunKey] = useState(0);
  const [result, setResult] = useState<RunResultState>(null);
  const [best, setBest] = useState<RunRecord | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(getLocalBest());
  }, []);

  const onRunEvent: OnRunEvent = useCallback((type, payload) => {
    setResult({ payload, isNewBest: false });
    void saveRunResult({ roomsCleared: payload.roomsCleared, timeMs: payload.timeMs }).then(({ isNewBest, best: newBest }) => {
      setBest(newBest);
      setResult({ payload, isNewBest });
    });
  }, []);

  const restart = () => {
    setResult(null);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Top action bar */}
      <div className="flex w-full max-w-3xl items-center justify-between gap-3">
        <GameBackButton />

        <button
          onClick={restart}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-border-hover bg-surface-hover/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-amber-400 hover:bg-surface active:scale-[0.98]"
        >
          <RotateCcw size={16} className="text-amber-400" />
          <span>Chơi ván mới</span>
        </button>
      </div>

      <div className="relative w-full max-w-3xl">
        <DeadCellsCanvas key={runKey} onRunEvent={onRunEvent} />

        {result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/85 p-6 text-center backdrop-blur-md">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {result.payload.isVictory ? "🎉 Hạ gục trùm — Chiến thắng!" : "💀 Bạn đã gục ngã"}
            </h2>
            <p className="text-sm text-muted sm:text-base">
              Qua {result.payload.roomsCleared} phòng · {result.payload.cellsCollected} tế bào · {formatTime(result.payload.timeMs)}
            </p>
            {result.isNewBest && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 sm:text-base">
                <Trophy size={18} /> Kỷ lục cá nhân mới!
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 font-semibold text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
              >
                <RotateCcw size={18} /> Chơi lại
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border-hover bg-surface-hover/90 px-6 py-2.5 font-semibold text-foreground transition hover:bg-border active:scale-[0.98]"
              >
                <Home size={18} className="text-amber-400" /> Quay về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex max-w-3xl flex-col items-center gap-1 text-center text-sm text-muted">
        {best && (
          <p>
            Kỷ lục cá nhân: {best.roomsCleared} phòng, {formatTime(best.timeMs)}
          </p>
        )}
        <p>
          Roguelike hành động lấy cảm hứng từ Dead Cells — dọn sạch quái để mở cổng sang phòng
          tiếp theo, mỗi lượt chơi các phòng được xếp ngẫu nhiên một kiểu khác.
        </p>
      </div>
    </div>
  );
}
