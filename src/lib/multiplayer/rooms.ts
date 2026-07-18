import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { generateRoomCode, isValidRoomCodeFormat, normalizeRoomCode } from "./roomCode";
import { getMultiplayerConfig } from "./gameConfig";
import { getCurrentIdentity } from "./guest";
import { JoinRoomError, PlayerIdentity, Room, RoomPlayer } from "./types";

export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomPlayerRow = Database["public"]["Tables"]["room_players"]["Row"];

export type RoomsClientError =
  | "supabase_not_configured"
  | "invalid_code"
  | JoinRoomError
  | "unknown";

export interface RoomAndPlayers {
  room: Room;
  players: RoomPlayer[];
}

export function mapRoomRow(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code,
    gameSlug: row.game_slug,
    status: row.status as Room["status"],
    maxPlayers: row.max_players,
    hostUserId: row.host_user_id,
    hostGuestId: row.host_guest_id,
    roundNumber: row.round_number,
    scoreboard: row.scoreboard ?? {},
    gameState: row.game_state,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPlayerRow(row: RoomPlayerRow): RoomPlayer {
  return {
    id: row.id,
    roomId: row.room_id,
    slot: row.slot,
    userId: row.user_id,
    guestId: row.guest_id,
    displayName: row.display_name,
    isReady: row.is_ready,
    isConnected: row.is_connected,
    joinedAt: row.joined_at,
  };
}

function isSamePlayer(player: RoomPlayer, identity: PlayerIdentity): boolean {
  return identity.isGuest ? player.guestId === identity.id : player.userId === identity.id;
}

async function fetchRoomAndPlayers(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  roomId: string
): Promise<RoomAndPlayers | null> {
  const { data: roomRow } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (!roomRow) return null;
  const { data: playerRows } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("slot", { ascending: true });
  return { room: mapRoomRow(roomRow), players: (playerRows ?? []).map(mapPlayerRow) };
}

/**
 * Tạo phòng mới cho `gameSlug`. Nếu identity hiện tại đã là host của 1
 * phòng đang mở (waiting/playing/round_finished) cho đúng game này, trả
 * về phòng đó luôn thay vì tạo phòng mới — vừa chống spam vừa khớp tinh
 * thần "1 phòng chơi nhiều ván" (xem ONLINE_MULTIPLAYER_PLAN.md mục 3.1).
 */
export async function createRoom(
  gameSlug: string
): Promise<{ ok: true; data: RoomAndPlayers & { slot: number } } | { ok: false; error: RoomsClientError }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "supabase_not_configured" };

  const identity = await getCurrentIdentity();
  const config = getMultiplayerConfig(gameSlug);

  const identityFilter = identity.isGuest
    ? { column: "host_guest_id" as const, value: identity.id }
    : { column: "host_user_id" as const, value: identity.id };

  const { data: existingRoomRow } = await supabase
    .from("rooms")
    .select("*")
    .eq("game_slug", gameSlug)
    .eq(identityFilter.column, identityFilter.value)
    .in("status", ["waiting", "playing", "round_finished"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRoomRow) {
    const snapshot = await fetchRoomAndPlayers(supabase, existingRoomRow.id);
    if (snapshot) {
      const me = snapshot.players.find((p) => isSamePlayer(p, identity));
      if (me) return { ok: true, data: { ...snapshot, slot: me.slot } };
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data: roomRow, error: roomError } = await supabase
      .from("rooms")
      .insert({
        code,
        game_slug: gameSlug,
        max_players: config.maxPlayers,
        host_user_id: identity.isGuest ? null : identity.id,
        host_guest_id: identity.isGuest ? identity.id : null,
      })
      .select()
      .single();

    if (roomError) {
      // 23505 = unique_violation (trùng mã phòng, cực hiếm) — thử mã khác.
      if (roomError.code === "23505") continue;
      return { ok: false, error: "unknown" };
    }
    if (!roomRow) return { ok: false, error: "unknown" };

    const { data: playerRow, error: playerError } = await supabase
      .from("room_players")
      .insert({
        room_id: roomRow.id,
        slot: 0,
        user_id: identity.isGuest ? null : identity.id,
        guest_id: identity.isGuest ? identity.id : null,
        display_name: identity.displayName,
      })
      .select()
      .single();

    if (playerError || !playerRow) return { ok: false, error: "unknown" };

    return {
      ok: true,
      data: { room: mapRoomRow(roomRow), players: [mapPlayerRow(playerRow)], slot: 0 },
    };
  }

  return { ok: false, error: "unknown" };
}

/** Tham gia phòng theo mã. Nếu identity hiện tại đã ở trong phòng (rejoin), trả về đúng slot cũ. */
export async function joinRoom(
  rawCode: string
): Promise<{ ok: true; data: RoomAndPlayers & { slot: number } } | { ok: false; error: RoomsClientError }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "supabase_not_configured" };

  const code = normalizeRoomCode(rawCode);
  if (!isValidRoomCodeFormat(code)) return { ok: false, error: "invalid_code" };

  const identity = await getCurrentIdentity();

  const { data: roomRow } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
  if (!roomRow || roomRow.status === "closed") return { ok: false, error: "not_found" };

  const room = mapRoomRow(roomRow);
  const { data: playerRows } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("slot", { ascending: true });
  const players = (playerRows ?? []).map(mapPlayerRow);

  const existingPlayer = players.find((p) => isSamePlayer(p, identity));
  if (existingPlayer) {
    await supabase
      .from("room_players")
      .update({ is_connected: true, display_name: identity.displayName })
      .eq("id", existingPlayer.id);
    return { ok: true, data: { room, players, slot: existingPlayer.slot } };
  }

  if (players.length >= room.maxPlayers) return { ok: false, error: "full" };
  if (room.status !== "waiting") return { ok: false, error: "closed" };

  const usedSlots = new Set(players.map((p) => p.slot));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;

  const { data: playerRow, error } = await supabase
    .from("room_players")
    .insert({
      room_id: room.id,
      slot,
      user_id: identity.isGuest ? null : identity.id,
      guest_id: identity.isGuest ? identity.id : null,
      display_name: identity.displayName,
    })
    .select()
    .single();

  if (error || !playerRow) return { ok: false, error: "full" };

  return { ok: true, data: { room, players: [...players, mapPlayerRow(playerRow)], slot } };
}

export async function getRoomSnapshot(roomId: string): Promise<RoomAndPlayers | null> {
  const supabase = createClient();
  if (!supabase) return null;
  return fetchRoomAndPlayers(supabase, roomId);
}

export async function leaveRoom(roomId: string, myPlayerRowId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("room_players").delete().eq("id", myPlayerRowId);

  const { data: remaining } = await supabase.from("room_players").select("id").eq("room_id", roomId);
  if (!remaining || remaining.length === 0) {
    await supabase.from("rooms").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", roomId);
  }
}

export async function setPlayerReady(playerRowId: string, isReady: boolean): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("room_players").update({ is_ready: isReady }).eq("id", playerRowId);
}

export async function markPlayerConnection(playerRowId: string, isConnected: boolean): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("room_players").update({ is_connected: isConnected }).eq("id", playerRowId);
}

/** Chuyển phòng từ "waiting" sang "playing", ghi trạng thái khởi tạo của ván đầu tiên. */
export async function startRoomRound(roomId: string, gameState: unknown): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("rooms")
    .update({ status: "playing", game_state: gameState, updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

/** Ghi đè trạng thái ván hiện tại — gọi sau mỗi nước đi hợp lệ. */
export async function updateRoomGameState(roomId: string, gameState: unknown): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("rooms")
    .update({ game_state: gameState, updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

/** Đánh dấu 1 ván vừa kết thúc + cập nhật tỉ số tích luỹ của phòng. */
export async function finishRoomRound(roomId: string, scoreboard: Record<string, number>): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("rooms")
    .update({ status: "round_finished", scoreboard, updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

/** Đặt lại `is_ready = false` cho toàn bộ người chơi trong phòng — gọi khi bắt đầu ván mới (rematch). */
export async function resetReadyFlags(roomId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("room_players").update({ is_ready: false }).eq("room_id", roomId);
}

/** Bắt đầu ván mới (rematch) trong cùng 1 phòng — không tạo phòng/mã mới. */
export async function startRematch(roomId: string, gameState: unknown, roundNumber: number): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("rooms")
    .update({ status: "playing", game_state: gameState, round_number: roundNumber, updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

/** Danh sách phòng đang chờ người (dùng cho sảnh chung / room browser). */
export async function listOpenRooms(gameSlug?: string): Promise<Room[]> {
  const supabase = createClient();
  if (!supabase) return [];
  let query = supabase
    .from("rooms")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(50);
  if (gameSlug) query = query.eq("game_slug", gameSlug);
  const { data } = await query;
  return (data ?? []).map(mapRoomRow);
}
