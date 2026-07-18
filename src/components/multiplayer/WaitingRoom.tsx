"use client";

import { useState } from "react";
import { Check, Copy, LogOut } from "lucide-react";
import { RoomPlayer } from "@/lib/multiplayer/types";

interface WaitingRoomProps {
  roomCode: string;
  gameSlug: string;
  players: RoomPlayer[];
  maxPlayers: number;
  myPlayerRowId: string | null;
  isPlayerOnline: (player: RoomPlayer) => boolean;
  onToggleReady: () => void;
  onLeave: () => void;
}

export function WaitingRoom({
  roomCode,
  gameSlug,
  players,
  maxPlayers,
  myPlayerRowId,
  isPlayerOnline,
  onToggleReady,
  onLeave,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const me = players.find((p) => p.id === myPlayerRowId);

  async function handleCopyLink() {
    const url = `${window.location.origin}/games/${gameSlug}?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard (hiếm) — im lặng bỏ qua, mã phòng vẫn hiển thị sẵn để copy tay.
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-paper-100">Đang chờ đối thủ...</h1>
        <p className="mt-1 text-sm text-ink-400">Chia sẻ mã phòng hoặc link mời cho bạn bè.</p>
      </div>

      <div className="w-full rounded-xl border border-ink-700 bg-ink-800/60 p-5">
        <p className="font-mono text-3xl font-bold tracking-[0.3em] text-amber-400">{roomCode}</p>
        <button
          type="button"
          onClick={handleCopyLink}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-ink-700 px-4 py-2 text-sm font-medium text-paper-100 transition hover:bg-ink-600 active:scale-[0.98]"
        >
          {copied ? <Check size={16} className="text-teal-400" /> : <Copy size={16} />}
          {copied ? "Đã sao chép!" : "Sao chép link mời"}
        </button>
      </div>

      <div className="w-full space-y-2">
        {Array.from({ length: maxPlayers }, (_, slot) => {
          const player = players.find((p) => p.slot === slot);
          return (
            <div
              key={slot}
              className="flex items-center justify-between rounded-lg bg-ink-800/60 px-4 py-3 text-sm"
            >
              {player ? (
                <>
                  <span className="flex items-center gap-2 text-paper-100">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isPlayerOnline(player) ? "bg-teal-400" : "bg-ink-600"
                      }`}
                    />
                    {player.displayName}
                    {player.id === myPlayerRowId && <span className="text-ink-400">(bạn)</span>}
                  </span>
                  <span className={player.isReady ? "text-teal-400" : "text-ink-400"}>
                    {player.isReady ? "Đã sẵn sàng" : "Chưa sẵn sàng"}
                  </span>
                </>
              ) : (
                <span className="text-ink-600">Đang chờ người chơi...</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={onLeave}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-400 transition hover:bg-ink-700 hover:text-paper-100"
          aria-label="Rời phòng"
        >
          <LogOut size={18} />
        </button>
        <button
          type="button"
          onClick={onToggleReady}
          className={`flex-1 rounded-lg py-3 font-medium transition active:scale-[0.98] ${
            me?.isReady ? "bg-ink-700 text-paper-100 hover:bg-ink-600" : "bg-amber-400 text-ink-950 hover:bg-amber-500"
          }`}
        >
          {me?.isReady ? "Huỷ sẵn sàng" : "Sẵn sàng"}
        </button>
      </div>
    </div>
  );
}
