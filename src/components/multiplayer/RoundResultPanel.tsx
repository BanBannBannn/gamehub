"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RoomPlayer } from "@/lib/multiplayer/types";
import { playSound } from "@/lib/sound";

interface RoundResultPanelProps {
  resultLabel: string; // ví dụ "Bạn thắng!" / "X thắng!" / "Hoà!"
  emoji: string;
  scoreboard: Record<string, number>;
  players: RoomPlayer[];
  myPlayerRowId: string | null;
  onToggleReady: () => void;
  onLeave: () => void;
}

export function RoundResultPanel({
  resultLabel,
  emoji,
  scoreboard,
  players,
  myPlayerRowId,
  onToggleReady,
  onLeave,
}: RoundResultPanelProps) {
  const me = players.find((p) => p.id === myPlayerRowId);
  const sortedPlayers = [...players].sort((a, b) => a.slot - b.slot);

  // Âm thanh kết quả (một lần khi panel xuất hiện): 🎉 thắng, 😵 thua, còn lại trung tính.
  useEffect(() => {
    playSound(emoji === "🎉" ? "win" : emoji === "😵" ? "lose" : "notify");
  }, [emoji]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border-hover bg-surface-hover p-6 text-center"
    >
      <p className="text-4xl">{emoji}</p>
      <h2 className="font-display text-2xl font-bold text-foreground">{resultLabel}</h2>

      <div className="flex gap-6 font-mono text-lg">
        {sortedPlayers.map((p) => (
          <div key={p.id}>
            <p className="text-xs text-muted">{p.displayName}</p>
            <p className="text-foreground">{scoreboard[String(p.slot)] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="w-full space-y-2">
        {sortedPlayers.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface px-4 py-2 text-sm">
            <span className="text-foreground">
              {p.displayName}
              {p.id === myPlayerRowId && <span className="ml-1 text-muted">(bạn)</span>}
            </span>
            <span className={p.isReady ? "text-teal-400" : "text-muted"}>
              {p.isReady ? "Muốn chơi lại" : "Đang chờ..."}
            </span>
          </div>
        ))}
      </div>

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={onLeave}
          className="flex-1 rounded-lg bg-border-hover py-2.5 text-sm font-medium text-foreground transition hover:brightness-110"
        >
          Rời phòng
        </button>
        <button
          type="button"
          onClick={onToggleReady}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition active:scale-[0.98] ${
            me?.isReady ? "bg-border-hover text-foreground hover:brightness-110" : "bg-amber-400 text-foreground hover:bg-amber-500"
          }`}
        >
          {me?.isReady ? "Đã bấm — chờ đối thủ" : "Chơi lại"}
        </button>
      </div>
    </motion.div>
  );
}
