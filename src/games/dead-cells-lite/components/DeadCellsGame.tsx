"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
      <div className="relative w-full max-w-3xl">
        <DeadCellsCanvas key={runKey} onRunEvent={onRunEvent} />

        {result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/80 text-center backdrop-blur-sm">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {result.payload.isVictory ? "Hạ gục trùm — Chiến thắng!" : "Bạn đã gục ngã"}
            </h2>
            <p className="text-sm text-muted">
              Qua {result.payload.roomsCleared} phòng · {result.payload.cellsCollected} tế bào · {formatTime(result.payload.timeMs)}
            </p>
            {result.isNewBest && <p className="text-sm font-medium text-amber-400">🏆 Kỷ lục cá nhân mới!</p>}
            <button
              onClick={restart}
              className="mt-2 rounded-xl bg-amber-400 px-6 py-2.5 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
            >
              Chơi lại
            </button>
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
