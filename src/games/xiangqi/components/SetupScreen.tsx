import { useState } from "react";
import { Clock, Users, Bot, Settings2, Globe } from "lucide-react";

interface SetupScreenProps {
  onStart: (config: { timeSeconds: number; mode: "hotseat" }) => void;
  onSelectOnline: () => void;
}

const TIME_PRESETS = [
  { label: "5 phút", value: 300 },
  { label: "10 phút", value: 600 },
  { label: "15 phút", value: 900 },
  { label: "30 phút", value: 1800 },
];

export function SetupScreen({ onStart, onSelectOnline }: SetupScreenProps) {
  const [time, setTime] = useState(600);

  return (
    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-border">
      <div className="bg-surface-hover px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Settings2 size={20} className="text-amber-500" />
          Cài đặt ván đấu
        </h2>
      </div>

      <div className="flex flex-col gap-8 p-6">
        {/* Time Control */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Clock size={16} /> Thời gian mỗi bên
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIME_PRESETS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTime(t.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  time === t.value
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border text-muted hover:bg-surface-hover"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => onStart({ timeSeconds: time, mode: "hotseat" })}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Users size={20} />
            Chơi 2 Người (Local)
          </button>

          <button
            onClick={onSelectOnline}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-500/60 px-6 py-3.5 font-medium text-amber-600 dark:text-amber-400 transition hover:bg-amber-500/10"
          >
            <Globe size={20} />
            Chơi online — tạo phòng hoặc nhập mã
          </button>

          <button
            disabled
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-3.5 font-medium text-muted opacity-60"
          >
            <Bot size={20} />
            Đánh với Máy (Sắp ra mắt)
          </button>
        </div>
      </div>
    </div>
  );
}
