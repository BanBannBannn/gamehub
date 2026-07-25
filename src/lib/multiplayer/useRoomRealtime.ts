"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getRoomSnapshot, mapRoomRow, RoomRow } from "./rooms";
import { ChatMessage, PlayerIdentity, Room, RoomPlayer } from "./types";

const MAX_CHAT_MESSAGES = 100;
const CHAT_MAX_LENGTH = 200;
const CHAT_MIN_INTERVAL_MS = 1000;

interface UseRoomRealtimeResult {
  room: Room | null;
  players: RoomPlayer[];
  chatMessages: ChatMessage[];
  onlineIds: Set<string>;
  sendChat: (text: string) => void;
}

function playerIdentityKey(player: RoomPlayer): string {
  return player.guestId ?? player.userId ?? player.id;
}

/**
 * Kết nối realtime cho 1 phòng cụ thể:
 * - `rooms`/`room_players` đồng bộ qua Postgres Changes (nguồn sự thật
 *   duy nhất cho trạng thái ván chơi — mỗi nước đi hợp lệ được ghi vào
 *   cột `game_state`, mọi client trong phòng tự nhận được cập nhật).
 * - Chat + trạng thái online dùng 1 channel Broadcast/Presence riêng,
 *   không ghi DB (xem lý do ở ONLINE_MULTIPLAYER_PLAN.md mục 3.3/7).
 */
export function useRoomRealtime(roomId: string | null, identity: PlayerIdentity | null): UseRoomRealtimeResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const lastChatSentAtRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;

    getRoomSnapshot(roomId).then((snapshot) => {
      if (cancelled || !snapshot) return;
      setRoom(snapshot.room);
      setPlayers(snapshot.players);
    });

    const dbChannel = supabase
      .channel(`room-db:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          setRoom(mapRoomRow(payload.new as RoomRow));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => {
          // Danh sách người chơi thay đổi (join/leave/ready) — lấy lại
          // toàn bộ cho đơn giản, số người chơi mỗi phòng luôn rất nhỏ.
          getRoomSnapshot(roomId).then((snapshot) => {
            if (!cancelled && snapshot) setPlayers(snapshot.players);
          });
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel(`room-presence:${roomId}`, {
      config: { presence: { key: identity?.id ?? "anon" } },
    });
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setChatMessages((prev) => [...prev, payload as ChatMessage].slice(-MAX_CHAT_MESSAGES));
      })
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && identity) {
          await presenceChannel.track({ name: identity.displayName, at: Date.now() });
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
    // Cố tình dùng identity?.id/displayName thay vì cả object `identity`:
    // getCurrentIdentity() có thể trả về 1 object mới mỗi lần dù giá trị
    // bên trong không đổi — dùng cả object làm dep sẽ khiến effect kết
    // nối lại kênh Realtime không cần thiết.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, identity?.id, identity?.displayName]);

  const sendChat = useCallback(
    (text: string) => {
      const channel = presenceChannelRef.current;
      if (!channel || !identity) return;
      const trimmed = text.trim().slice(0, CHAT_MAX_LENGTH);
      if (trimmed.length === 0) return;

      const now = Date.now();
      if (now - lastChatSentAtRef.current < CHAT_MIN_INTERVAL_MS) return; // giới hạn tần suất gửi đơn giản
      lastChatSentAtRef.current = now;

      const message: ChatMessage = {
        type: "chat",
        senderId: identity.id,
        senderName: identity.displayName,
        text: trimmed,
        sentAt: now,
      };
      channel.send({ type: "broadcast", event: "chat", payload: message });
      // Hiện luôn tin nhắn của chính mình ngay lập tức (không cần chờ round-trip).
      setChatMessages((prev) => [...prev, message].slice(-MAX_CHAT_MESSAGES));
    },
    [identity]
  );

  return { room, players, chatMessages, onlineIds, sendChat };
}

export function isPlayerOnline(player: RoomPlayer, onlineIds: Set<string>): boolean {
  return onlineIds.has(playerIdentityKey(player));
}
