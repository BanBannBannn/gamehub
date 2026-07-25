import { mulberry32, shuffle } from "./rng";
import { RoomTemplate } from "./types";

/** Kích thước 1 ô, tính bằng tile — lớp render (Phaser) tự quy đổi sang px. */
export const TILE = 64;
export const ROOM_HEIGHT_TILES = 10;
export const GROUND_TILE_Y = 9;

/**
 * Khoảng trống bắt buộc (tính theo ô) từ mép trái phòng tới con quái gần
 * nhất. Người chơi luôn bước vào phòng từ mép trái, nên nếu có quái đứng sát
 * cửa vào thì sẽ bị đánh úp mất máu trước khi kịp phản ứng — đúng lỗi đã gặp
 * khi kiểm thử (vào phòng là mất 70 HP). Ràng buộc này được test bảo vệ.
 */
export const MIN_ENEMY_CLEARANCE_TILES = 5;

const NORMAL_ROOMS: RoomTemplate[] = [
  {
    id: "entrance-hall",
    width: 21 * TILE,
    platforms: [{ tileX: 0, tileY: GROUND_TILE_Y, tileCount: 21 }],
    enemies: [
      { kind: "walker", x: 8 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "walker", x: 14 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
    ],
    pickups: [{ kind: "health", x: 4 * TILE, y: (GROUND_TILE_Y - 1) * TILE }],
  },
  {
    id: "deep-pit",
    width: 21 * TILE,
    platforms: [
      { tileX: 0, tileY: GROUND_TILE_Y, tileCount: 6 },
      { tileX: 7, tileY: 6, tileCount: 2 },
      { tileX: 10, tileY: GROUND_TILE_Y, tileCount: 11 },
    ],
    enemies: [
      { kind: "walker", x: 5 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "shooter", x: 16 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
    ],
    pickups: [{ kind: "cell", x: 8 * TILE, y: 5 * TILE }],
  },
  {
    id: "staircase",
    width: 21 * TILE,
    platforms: [
      { tileX: 0, tileY: GROUND_TILE_Y, tileCount: 6 },
      { tileX: 6, tileY: 8, tileCount: 3 },
      { tileX: 9, tileY: 6, tileCount: 3 },
      { tileX: 12, tileY: 4, tileCount: 3 },
      { tileX: 15, tileY: GROUND_TILE_Y, tileCount: 6 },
    ],
    enemies: [
      { kind: "shooter", x: 13 * TILE, y: 3 * TILE },
      { kind: "walker", x: 18 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
    ],
    pickups: [{ kind: "cell", x: 12.5 * TILE, y: 3 * TILE }],
  },
  {
    id: "crossfire",
    width: 21 * TILE,
    platforms: [
      { tileX: 0, tileY: GROUND_TILE_Y, tileCount: 9 },
      { tileX: 9, tileY: 5, tileCount: 3 },
      { tileX: 11, tileY: GROUND_TILE_Y, tileCount: 10 },
    ],
    enemies: [
      { kind: "shooter", x: 6 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "walker", x: 13 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "shooter", x: 18 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
    ],
    pickups: [{ kind: "health", x: 10.5 * TILE, y: 4 * TILE }],
  },
  {
    id: "treasure-vault",
    width: 16 * TILE,
    platforms: [{ tileX: 0, tileY: GROUND_TILE_Y, tileCount: 16 }],
    enemies: [{ kind: "walker", x: 8 * TILE, y: (GROUND_TILE_Y - 1) * TILE }],
    pickups: [
      { kind: "cell", x: 3 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "cell", x: 8 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "cell", x: 13 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
      { kind: "health", x: 10 * TILE, y: (GROUND_TILE_Y - 1) * TILE },
    ],
  },
];

const BOSS_ROOM: RoomTemplate = {
  id: "boss-hall",
  width: 27 * TILE,
  platforms: [
    { tileX: 0, tileY: GROUND_TILE_Y, tileCount: 27 },
    { tileX: 3, tileY: 6, tileCount: 3 },
    { tileX: 21, tileY: 6, tileCount: 3 },
  ],
  enemies: [{ kind: "boss", x: 13 * TILE, y: (GROUND_TILE_Y - 1) * TILE }],
  pickups: [{ kind: "health", x: 2 * TILE, y: (GROUND_TILE_Y - 1) * TILE }],
};

/**
 * Chọn ngẫu nhiên 1 chuỗi phòng cho 1 lượt chơi (run): xáo trộn pool phòng
 * thường (không lặp), có thể chèn 1 phòng kho báu, rồi luôn kết thúc bằng
 * phòng boss. Dùng RNG có seed để test được (cùng seed → cùng kết quả).
 */
export function pickRun(seed: number): RoomTemplate[] {
  const rand = mulberry32(seed);
  const core = shuffle(
    NORMAL_ROOMS.filter((r) => r.id !== "treasure-vault"),
    rand
  );

  const includeTreasure = rand() < 0.6;
  const rooms = [...core];
  if (includeTreasure) {
    const treasure = NORMAL_ROOMS.find((r) => r.id === "treasure-vault")!;
    const insertAt = Math.floor(rand() * (rooms.length + 1));
    rooms.splice(insertAt, 0, treasure);
  }

  rooms.push(BOSS_ROOM);
  return rooms;
}

export function isBossRoom(room: RoomTemplate): boolean {
  return room.id === BOSS_ROOM.id;
}
