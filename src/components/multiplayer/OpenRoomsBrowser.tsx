"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { listOpenRooms } from "@/lib/multiplayer/rooms";
import { Room } from "@/lib/multiplayer/types";

interface OpenRoomsBrowserProps {
  gameSlug: string;
  onJoinCode: (code: string) => void;
}

/**
 * Danh sách phòng đang chờ người cho 1 game — tuỳ chọn thêm bên cạnh
 * luồng "tạo phòng / nhập mã" chính. Không tự động realtime (chỉ fetch
 * lại khi bấm làm mới) để tránh mở thêm 1 kênh Realtime chỉ cho mục đích
 * duyệt danh sách — phù hợp với tinh thần hạn chế tài nguyên đã đặt ra.
 */
export function OpenRoomsBrowser({ gameSlug, onJoinCode }: OpenRoomsBrowserProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const list = await listOpenRooms(gameSlug);
    setRooms(list);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    listOpenRooms(gameSlug).then((list) => {
      if (cancelled) return;
      setRooms(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [gameSlug]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-400">Phòng đang chờ người</p>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Làm mới danh sách phòng"
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-paper-100"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {rooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-700 px-4 py-6 text-center text-xs text-ink-600">
          {loading ? "Đang tải..." : "Chưa có phòng nào đang chờ — hãy tạo phòng mới!"}
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onJoinCode(room.code)}
              className="flex w-full items-center justify-between rounded-lg border border-ink-700 bg-ink-800/60 px-4 py-2.5 text-left transition hover:border-amber-400 hover:bg-ink-800"
            >
              <span className="font-mono text-sm tracking-widest text-amber-400">{room.code}</span>
              <span className="flex items-center gap-1 text-xs text-ink-400">
                <Users size={12} />
                Tối đa {room.maxPlayers} người
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
