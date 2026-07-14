import { useXiangqiStore } from "../store";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hud() {
  const redTime = useXiangqiStore((s) => s.redTime);
  const blackTime = useXiangqiStore((s) => s.blackTime);
  const turn = useXiangqiStore((s) => s.turn);
  const status = useXiangqiStore((s) => s.status);

  // Red plays first in Xiangqi usually, Black plays second
  // In UI, Black usually top, Red usually bottom
  
  return (
    <div className="flex w-full flex-col gap-3">
      {/* Black Player (Top) */}
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 ring-1 ring-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white font-bold font-serif shadow-inner">
            將
          </div>
          <div>
            <div className="font-semibold text-foreground">Quân Đen</div>
            <div className="text-xs text-muted font-medium tracking-wide">
              {status === "playing" && turn === "b" ? "ĐANG NGHĨ..." : "CHỜ"}
            </div>
          </div>
        </div>
        <div className={`font-mono text-2xl font-bold tabular-nums ${
          turn === "b" && status === "playing" ? "text-amber-500" : "text-muted"
        }`}>
          {formatTime(blackTime)}
        </div>
      </div>

      {/* Red Player (Bottom) */}
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 ring-1 ring-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold font-serif shadow-inner">
            帥
          </div>
          <div>
            <div className="font-semibold text-foreground">Quân Đỏ</div>
            <div className="text-xs text-muted font-medium tracking-wide">
              {status === "playing" && turn === "r" ? "ĐANG NGHĨ..." : "CHỜ"}
            </div>
          </div>
        </div>
        <div className={`font-mono text-2xl font-bold tabular-nums ${
          turn === "r" && status === "playing" ? "text-amber-500" : "text-muted"
        }`}>
          {formatTime(redTime)}
        </div>
      </div>
    </div>
  );
}
