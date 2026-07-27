"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { use2048Store } from "../store";
import { Direction, SIZE } from "../engine/types";
import { playSound } from "@/lib/sound";

const TILE_STYLES: Record<number, { bg: string; fg: string }> = {
  0: { bg: "rgba(238,228,218,0.35)", fg: "transparent" },
  2: { bg: "#eee4da", fg: "#776e65" },
  4: { bg: "#ede0c8", fg: "#776e65" },
  8: { bg: "#f2b179", fg: "#f9f6f2" },
  16: { bg: "#f59563", fg: "#f9f6f2" },
  32: { bg: "#f67c5f", fg: "#f9f6f2" },
  64: { bg: "#f65e3b", fg: "#f9f6f2" },
  128: { bg: "#edcf72", fg: "#f9f6f2" },
  256: { bg: "#edcc61", fg: "#f9f6f2" },
  512: { bg: "#edc850", fg: "#f9f6f2" },
  1024: { bg: "#edc53f", fg: "#f9f6f2" },
  2048: { bg: "#edc22e", fg: "#f9f6f2" },
};

function tileStyle(v: number) {
  return TILE_STYLES[v] ?? { bg: "#3c3a32", fg: "#f9f6f2" };
}

function fontSize(v: number): string {
  if (v >= 1024) return "clamp(1rem, 5vw, 1.6rem)";
  if (v >= 128) return "clamp(1.2rem, 6vw, 2rem)";
  return "clamp(1.5rem, 7vw, 2.4rem)";
}

export function Game2048() {
  const grid = use2048Store((s) => s.grid);
  const score = use2048Store((s) => s.score);
  const best = use2048Store((s) => s.best);
  const status = use2048Store((s) => s.status);
  const keepPlaying = use2048Store((s) => s.keepPlaying);
  const newGame = use2048Store((s) => s.newGame);
  const moveDir = use2048Store((s) => s.moveDir);
  const continueAfterWin = use2048Store((s) => s.continueAfterWin);

  // Bắt đầu ván mới khi mount (ổn định giữa SSR/CSR: chỉ chạy client).
  useEffect(() => {
    newGame();
  }, [newGame]);

  // Âm thanh khi thắng/thua.
  useEffect(() => {
    if (status === "won") playSound("win");
    else if (status === "lost") playSound("lose");
  }, [status]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        a: "left",
        d: "right",
        w: "up",
        s: "down",
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      moveDir(dir);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveDir]);

  // Vuốt trên di động.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) return; // vuốt quá ngắn, bỏ qua
      if (absX > absY) moveDir(dx > 0 ? "right" : "left");
      else moveDir(dy > 0 ? "down" : "up");
      touchStart.current = null;
    },
    [moveDir]
  );

  const showOverlay = status === "lost" || (status === "won" && !keepPlaying);

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <GameBackButton />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">2048</h1>
          <p className="text-sm text-muted">Vuốt hoặc dùng phím mũi tên để gộp ô.</p>
        </div>
        <div className="flex gap-2">
          <ScoreBox label="Điểm" value={score} />
          <ScoreBox label="Kỷ lục" value={best} />
        </div>
      </div>

      <button
        type="button"
        onClick={newGame}
        className="inline-flex items-center gap-2 self-start rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
      >
        <RotateCcw size={16} /> Ván mới
      </button>

      <div className="relative">
        <div
          className="grid gap-2 rounded-xl bg-[#bbada0] p-2 shadow-xl select-none touch-none"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`, aspectRatio: "1 / 1" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {grid.flatMap((row, r) =>
            row.map((v, c) => {
              const st = tileStyle(v);
              return (
                <motion.div
                  key={`${r}-${c}`}
                  className="flex items-center justify-center rounded-lg font-bold"
                  style={{ background: st.bg, color: st.fg, fontSize: fontSize(v) }}
                  animate={v ? { scale: [0.85, 1] } : { scale: 1 }}
                  transition={{ duration: 0.12 }}
                >
                  {v !== 0 ? v : ""}
                </motion.div>
              );
            })
          )}
        </div>

        {showOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/85 backdrop-blur-sm">
            <p className="font-display text-3xl font-bold text-foreground">
              {status === "won" ? "🎉 Bạn đạt 2048!" : "Hết nước đi!"}
            </p>
            <p className="text-sm text-muted">Điểm: {score}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {status === "won" && (
                <button
                  type="button"
                  onClick={continueAfterWin}
                  className="rounded-lg border border-border-hover px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
                >
                  Chơi tiếp
                </button>
              )}
              <button
                type="button"
                onClick={newGame}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-amber-500"
              >
                Ván mới
              </button>
              <Link
                href="/"
                className="rounded-lg border border-border-hover bg-surface-hover/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-border"
              >
                Trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px] rounded-lg bg-surface px-3 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
