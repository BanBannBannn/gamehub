"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentIdentity } from "./guest";
import {
  createRoom,
  joinRoom,
  kickPlayer,
  leaveRoom,
  listJoinableRooms,
  markPlayerConnection,
  setPlayerReady,
  RoomsClientError,
} from "./rooms";
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
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { room, players, chatMessages, onlineIds, sendChat } = useRoomRealtime(roomId, identity);
  const myPlayerRowIdRef = useRef<string | null>(null);
  useEffect(() => {
    myPlayerRowIdRef.current = myPlayerRowId;
  }, [myPlayerRowId]);

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

  // "Chơi nhanh": tìm 1 phòng còn chỗ để vào; nếu không có thì tự tạo phòng mới.
  const quickMatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const joinable = await listJoinableRooms(gameSlug);
    if (joinable.length > 0) {
      const result = await joinRoom(joinable[0].code);
      setIsLoading(false);
      if (result.ok) {
        const me = result.data.players.find((p) => p.slot === result.data.slot);
        setRoomId(result.data.room.id);
        setMySlot(result.data.slot);
        setMyPlayerRowId(me?.id ?? null);
        return;
      }
      // Phòng vừa đầy/đóng ngay lúc đó — rơi xuống tạo phòng mới.
    }
    const created = await createRoom(gameSlug);
    setIsLoading(false);
    if (!created.ok) {
      setError(describeError(created.error));
      return;
    }
    const me = created.data.players.find((p) => p.slot === created.data.slot);
    setRoomId(created.data.room.id);
    setMySlot(created.data.slot);
    setMyPlayerRowId(me?.id ?? null);
  }, [gameSlug]);

  const leave = useCallback(async () => {
    if (roomId && myPlayerRowId) {
      await leaveRoom(roomId, myPlayerRowId);
    }
    setRoomId(null);
    setMySlot(null);
    setMyPlayerRowId(null);
    setError(null);
  }, [roomId, myPlayerRowId]);

  const kick = useCallback(async (playerRowId: string) => {
    await kickPlayer(playerRowId);
  }, []);

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

  // Phát hiện bị chủ phòng mời ra ngoài (kick): mình đang có row trong phòng
  // nhưng realtime cho thấy danh sách người chơi (đã tải) không còn chứa mình,
  // và phòng chưa đóng → tự rời về sảnh kèm thông báo.
  useEffect(() => {
    if (!roomId || !myPlayerRowId) return;
    if (players.length === 0) return; // chưa tải xong snapshot
    if (room?.status === "closed") return;
    const stillIn = players.some((p) => p.id === myPlayerRowId);
    if (stillIn) return;
    // Đồng bộ với thay đổi từ hệ thống ngoài (Realtime): mình bị xoá khỏi
    // phòng → reset state cục bộ. Đây là mục đích chính đáng của effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    setRoomId(null);
    setMySlot(null);
    setMyPlayerRowId(null);
    setNotice("Bạn đã được đưa ra khỏi phòng.");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [players, roomId, myPlayerRowId, room?.status]);

  const myPlayer = players.find((p) => p.id === myPlayerRowId) ?? null;
  const opponents = players.filter((p) => p.id !== myPlayerRowId);
  // Chủ phòng = người có slot nhỏ nhất trong số người CÒN trong phòng. Nhờ vậy
  // nếu chủ phòng gốc (slot 0) rời đi, người còn lại vẫn trở thành chủ phòng —
  // tránh kẹt cứng luồng "bắt đầu ván / chơi lại" (vốn chỉ chủ phòng làm được).
  const lowestSlot = players.length > 0 ? Math.min(...players.map((p) => p.slot)) : null;
  const isHost = mySlot !== null && mySlot === lowestSlot;

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
    notice,
    clearNotice: () => setNotice(null),
    isLoading,
    create,
    join,
    quickMatch,
    leave,
    kick,
    toggleReady,
  };
}

export type UseOnlineRoomResult = ReturnType<typeof useOnlineRoom>;
