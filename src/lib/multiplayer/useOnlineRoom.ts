"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentIdentity } from "./guest";
import { createRoom, joinRoom, leaveRoom, markPlayerConnection, setPlayerReady, RoomsClientError } from "./rooms";
import { useRoomRealtime, isPlayerOnline } from "./useRoomRealtime";
import { PlayerIdentity, RoomPlayer } from "./types";

function describeError(error: RoomsClientError): string {
  switch (error) {
    case "supabase_not_configured":
      return "Chưa cấu hình Supabase nên chưa thể chơi online — xem SETUP.md.";
    case "invalid_code":
      return "Mã phòng không đúng định dạng (6 ký tự chữ/số).";
    case "not_found":
      return "Không tìm thấy phòng với mã này.";
    case "full":
      return "Phòng đã đủ người chơi.";
    case "closed":
      return "Ván đã bắt đầu, không thể vào giữa chừng.";
    default:
      return "Đã có lỗi xảy ra, vui lòng thử lại.";
  }
}

export function useOnlineRoom(gameSlug: string) {
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mySlot, setMySlot] = useState<number | null>(null);
  const [myPlayerRowId, setMyPlayerRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { room, players, chatMessages, onlineIds, sendChat } = useRoomRealtime(roomId, identity);
  const myPlayerRowIdRef = useRef<string | null>(null);
  myPlayerRowIdRef.current = myPlayerRowId;

  useEffect(() => {
    getCurrentIdentity().then(setIdentity);
  }, []);

  const create = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await createRoom(gameSlug);
    setIsLoading(false);
    if (!result.ok) {
      setError(describeError(result.error));
      return;
    }
    const me = result.data.players.find((p) => p.slot === result.data.slot);
    setRoomId(result.data.room.id);
    setMySlot(result.data.slot);
    setMyPlayerRowId(me?.id ?? null);
  }, [gameSlug]);

  const join = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    const result = await joinRoom(code);
    setIsLoading(false);
    if (!result.ok) {
      setError(describeError(result.error));
      return;
    }
    const me = result.data.players.find((p) => p.slot === result.data.slot);
    setRoomId(result.data.room.id);
    setMySlot(result.data.slot);
    setMyPlayerRowId(me?.id ?? null);
  }, []);

  const leave = useCallback(async () => {
    if (roomId && myPlayerRowId) {
      await leaveRoom(roomId, myPlayerRowId);
    }
    setRoomId(null);
    setMySlot(null);
    setMyPlayerRowId(null);
    setError(null);
  }, [roomId, myPlayerRowId]);

  const toggleReady = useCallback(async () => {
    if (!myPlayerRowId) return;
    const me = players.find((p) => p.id === myPlayerRowId);
    await setPlayerReady(myPlayerRowId, !me?.isReady);
  }, [myPlayerRowId, players]);

  // Báo trạng thái kết nối best-effort (chủ yếu phục vụ cron dọn phòng
  // phía server — trạng thái "online ngay bây giờ" thật sự hiển thị cho
  // UI dùng Presence trong useRoomRealtime, đáng tin cậy hơn cột DB này).
  useEffect(() => {
    if (!myPlayerRowId) return;
    void markPlayerConnection(myPlayerRowId, true);

    function handleVisibility() {
      void markPlayerConnection(myPlayerRowIdRef.current!, document.visibilityState === "visible");
    }
    function handleBeforeUnload() {
      void markPlayerConnection(myPlayerRowIdRef.current!, false);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [myPlayerRowId]);

  const myPlayer = players.find((p) => p.id === myPlayerRowId) ?? null;
  const opponents = players.filter((p) => p.id !== myPlayerRowId);
  const isHost = mySlot === 0;

  return {
    identity,
    room,
    players,
    myPlayer,
    opponents,
    mySlot,
    myPlayerRowId,
    isHost,
    chatMessages,
    onlineIds,
    sendChat,
    isPlayerOnline: (player: RoomPlayer) => isPlayerOnline(player, onlineIds),
    error,
    isLoading,
    create,
    join,
    leave,
    toggleReady,
  };
}

export type UseOnlineRoomResult = ReturnType<typeof useOnlineRoom>;
