import { useState } from "react";
import { useChessStore } from "@/games/chess/store";
import { Clock, Users, Bot, RotateCcw } from "lucide-react";

export function SetupScreen({ onStart }: { onStart: (config: { timeSeconds: number; mode: "ai" | "hotseat"; autoFlip: boolean }) => void }) {
  const [mode, setMode] = useState<"ai" | "hotseat">("hotseat");
  const [time, setTime] = useState<number>(600); // default 10m
  const [autoFlip, setAutoFlip] = useState(true);

  const timeOptions = [
    { label: "3 phút", value: 180 },
    { label: "5 phút", value: 300 },
    { label: "10 phút", value: 600 },
    { label: "30 phút", value: 1800 },
    { label: "Không giới hạn", value: 999999 }, // effectively unlimited for a casual game
  ];

  return (
    <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border text-center">
      <div className="mb-4 text-4xl">♔</div>
      <h2 className="font-display text-2xl font-bold text-foreground">Cờ Vua (Chess)</h2>
      <p className="mt-2 text-sm text-muted">Vui lòng thiết lập ván cờ của bạn</p>

      <div className="mt-8 flex flex-col gap-6 text-left">
        {/* Mode Selection */}
        <div>
          <label className="text-sm font-medium text-foreground">Chế độ chơi</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("hotseat")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                mode === "hotseat" ? "border-amber-400 bg-amber-400/10 text-amber-500" : "border-border hover:bg-surface-hover text-muted"
              }`}
            >
              <Users size={24} />
              <span className="text-xs font-medium">2 Người (Hotseat)</span>
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                mode === "ai" ? "border-amber-400 bg-amber-400/10 text-amber-500" : "border-border hover:bg-surface-hover text-muted"
              }`}
            >
              <Bot size={24} />
              <span className="text-xs font-medium">Đánh với Máy</span>
            </button>
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="text-sm font-medium text-foreground">Thời gian</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTime(opt.value)}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm transition ${
                  time === opt.value ? "border-amber-400 bg-amber-400 text-ink-950 font-bold" : "border-border hover:bg-surface-hover text-foreground"
                }`}
              >
                {opt.value !== 999999 && <Clock size={14} />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Flip Toggle */}
        {mode === "hotseat" && (
          <button
            onClick={() => setAutoFlip(!autoFlip)}
            className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-surface-hover"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <RotateCcw size={16} className="text-muted" />
              Tự động lật bàn cờ
            </div>
            <div className={`h-5 w-9 rounded-full p-0.5 transition-colors ${autoFlip ? "bg-amber-400" : "bg-border"}`}>
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${autoFlip ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </button>
        )}
      </div>

      <button
        onClick={() => onStart({ timeSeconds: time, mode, autoFlip: mode === "hotseat" ? autoFlip : false })}
        className="mt-8 w-full rounded-xl bg-amber-400 py-3 font-medium text-ink-950 transition hover:bg-amber-500"
      >
        Bắt đầu chơi
      </button>
    </div>
  );
}
