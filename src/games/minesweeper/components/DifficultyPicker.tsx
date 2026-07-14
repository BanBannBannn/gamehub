import { Difficulty } from "@/games/minesweeper/engine/types";
import { DIFFICULTY_CONFIG } from "@/games/minesweeper/engine/types";
import { Bomb } from "lucide-react";

export function DifficultyPicker({ onPick }: { onPick: (d: Difficulty) => void }) {
  const diffs: { id: Difficulty; label: string; desc: string; color: string }[] = [
    {
      id: "easy",
      label: "Dễ",
      desc: "Bàn cờ 9x9 với 10 quả mìn.",
      color: "bg-teal-500",
    },
    {
      id: "medium",
      label: "Trung bình",
      desc: "Bàn cờ 16x16 với 40 quả mìn.",
      color: "bg-amber-500",
    },
    {
      id: "hard",
      label: "Khó",
      desc: "Bàn cờ 16x30 với 99 quả mìn.",
      color: "bg-coral-500",
    },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover text-coral-500">
          <Bomb size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dò mìn</h2>
        <p className="mt-1 text-sm text-muted">Chọn độ khó để bắt đầu</p>
      </div>

      <div className="flex flex-col gap-3">
        {diffs.map((d) => (
          <button
            key={d.id}
            onClick={() => onPick(d.id)}
            className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-4 text-left transition hover:border-border-hover hover:bg-surface-hover"
          >
            <div>
              <div className="font-medium text-foreground">{d.label}</div>
              <div className="mt-0.5 text-xs text-muted">{d.desc}</div>
            </div>
            <div className={`h-3 w-3 rounded-full ${d.color}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
