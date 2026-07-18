export type RoomStatus = "waiting" | "playing" | "round_finished" | "closed";

export interface Room {
  id: string;
  code: string;
  gameSlug: string;
  status: RoomStatus;
  maxPlayers: number;
  hostUserId: string | null;
  hostGuestId: string | null;
  roundNumber: number;
  scoreboard: Record<string, number>; // key = slot (dạng chuỗi), value = số ván thắng
  gameState: unknown;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomPlayer {
  id: string;
  roomId: string;
  slot: number;
  userId: string | null;
  guestId: string | null;
  displayName: string;
  isReady: boolean;
  isConnected: boolean;
  joinedAt: string;
}

/** Identity của người chơi hiện tại trong trình duyệt này (guest hoặc user đã đăng nhập). */
export interface PlayerIdentity {
  id: string; // userId (nếu đã đăng nhập) hoặc guestId (nếu là khách)
  isGuest: boolean;
  displayName: string;
}

export type JoinRoomError = "not_found" | "full" | "closed";

/**
 * Tin nhắn chat — đây là loại message DUY NHẤT đi qua Broadcast.
 * Nước đi và trạng thái ván KHÔNG broadcast — đồng bộ qua Postgres
 * Changes trên cột `rooms.game_state` (xem useRoomRealtime.ts), đơn
 * giản hơn nhiều so với việc duy trì 2 nguồn sự thật song song.
 */
export interface ChatMessage {
  type: "chat";
  senderId: string;
  senderName: string;
  text: string;
  sentAt: number;
}
