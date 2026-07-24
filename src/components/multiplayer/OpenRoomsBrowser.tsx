"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { listJoinableRooms, JoinableRoom } from "@/lib/multiplayer/rooms";

interface OpenRoomsBrowserProps {
  gameSlug: string;
  onJoinCode: (code: string) => void;
}

const POLL_INTERVAL_MS = 5000;

/**
 * Danh sách phòng còn chỗ (đang chờ HOẶC vừa xong 1 ván còn slot trống) cho
 * 1 game. Tự làm mới nhẹ nhàng mỗi 5s (chỉ 1 query, không mở kênh Realtime)
 * để người mới luôn thấy phòng cập nhật mà không phải bấm tay.
 */
export function OpenRoomsBrowser({ gameSlug, onJoinCode }: OpenRoomsBrowserProps) {
  const [rooms, setRooms] = useState<JoinableRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(showSpinner: boolean) {
      if (showSpinner) setLoading(true);
      const list = await listJoinableRooms(gameSlug);
      if (cancelled) return;
      setRooms(list);
      setLoading(false);
    }
    void load(true);
    const id = setInterval(() => void load(false), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [gameSlug]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-muted">Phòng còn chỗ</p>
        <span className="flex items-center gap-1 text-xs text-muted">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Tự cập nhật
        </span>
      </div>

      {rooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-hover px-4 py-6 text-center text-xs text-muted">
          {loading ? "Đang tải..." : "Chưa có phòng nào còn chỗ — hãy tạo phòng mới hoặc bấm Chơi nhanh!"}
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onJoinCode(room.code)}
              className="flex w-full items-center justify-between rounded-lg border border-border-hover bg-surface px-4 py-2.5 text-left transition hover:border-amber-400 hover:bg-surface-hover"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest text-amber-400">{room.code}</span>
                {room.status === "round_finished" && (
                  <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted">đang chơi tiếp</span>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Users size={12} />
                {room.playerCount}/{room.maxPlayers}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
