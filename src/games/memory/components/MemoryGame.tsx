"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { useMemoryStore } from "../store";
import { Difficulty, GRID_COLS, PAIR_COUNT } from "../engine/logic";
import { playSound } from "@/lib/sound";

const LABELS: Record<Difficulty, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };

export function MemoryGame() {
  const [started, setStarted] = useState(false);
  const cards = useMemoryStore((s) => s.cards);
  const difficulty = useMemoryStore((s) => s.difficulty);
  const moves = useMemoryStore((s) => s.moves);
  const status = useMemoryStore((s) => s.status);
  const locked = useMemoryStore((s) => s.locked);
  const newGame = useMemoryStore((s) => s.newGame);
  const flip = useMemoryStore((s) => s.flip);
  const resolveMismatch = useMemoryStore((s) => s.resolveMismatch);

  const matched = cards.filter((c) => c.matched).length / 2;

  // Lật úp lại 2 lá không khớp sau khoảng nghỉ.
  useEffect(() => {
    if (!locked) return;
    const id = setTimeout(() => resolveMismatch(), 800);
    return () => clearTimeout(id);
  }, [locked, resolveMismatch]);

  useEffect(() => {
    if (status === "won") playSound("win");
  }, [status]);

  function handleFlip(id: number) {
    const r = flip(id);
    if (r === "flip") playSound("click");
    else if (r === "match") playSound("capture");
  }

  function start(d: Difficulty) {
    newGame(d);
    setStarted(true);
  }

  if (!started) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <GameBackButton />
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Lật hình ghép cặp</h1>
          <p className="mt-2 text-sm text-muted">Lật 2 lá giống nhau để ghép cặp. Hoàn thành với ít lượt nhất!</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => start(d)}
                className="rounded-xl border border-border-hover bg-surface p-4 transition hover:border-amber-400 hover:bg-surface-hover active:scale-[0.98]"
              >
                <p className="font-display text-lg font-semibold text-foreground">{LABELS[d]}</p>
                <p className="text-xs text-muted">{PAIR_COUNT[d]} cặp</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[520px] items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>Lượt: <span className="font-mono text-foreground">{moves}</span></span>
          <span>Cặp: <span className="font-mono text-foreground">{matched}/{PAIR_COUNT[difficulty]}</span></span>
        </div>
      </div>

      {status === "won" && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-6 py-3 text-center">
          <p className="font-display text-lg font-bold text-foreground">🎉 Hoàn thành trong {moves} lượt!</p>
          <button type="button" onClick={() => start(difficulty)} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-amber-500">
            <RotateCcw size={16} /> Chơi lại
          </button>
        </div>
      )}

      <div className="grid w-full max-w-[520px] gap-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS[difficulty]}, minmax(0,1fr))` }}>
        {cards.map((card) => {
          const shown = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(card.id)}
              disabled={shown || locked || status === "won"}
              className="relative aspect-square"
              aria-label={shown ? card.symbol : "Lá úp"}
            >
              <span
                className={`flex h-full w-full items-center justify-center rounded-xl text-3xl transition sm:text-4xl ${
                  shown
                    ? card.matched
                      ? "bg-teal-400/20 ring-2 ring-teal-400"
                      : "bg-surface-hover ring-1 ring-border-hover"
                    : "bg-gradient-to-br from-amber-400/80 to-amber-500 hover:brightness-110"
                }`}
              >
                {shown ? card.symbol : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
