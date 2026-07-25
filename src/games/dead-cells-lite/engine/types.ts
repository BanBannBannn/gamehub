export type EnemyKind = "walker" | "shooter" | "boss";

export interface EnemySpawn {
  kind: EnemyKind;
  /** Vị trí tương đối trong phòng (0 = mép trái phòng). */
  x: number;
  y: number;
}

export interface PickupSpawn {
  kind: "health" | "cell";
  x: number;
  y: number;
}

export interface PlatformDef {
  /** Vị trí tương đối trong phòng, theo số ô 64px. */
  tileX: number;
  tileY: number;
  tileCount: number;
}

export interface RoomTemplate {
  id: string;
  /** Chiều rộng phòng tính bằng px. */
  width: number;
  platforms: PlatformDef[];
  enemies: EnemySpawn[];
  pickups: PickupSpawn[];
}

export interface EnemyStats {
  maxHp: number;
  damage: number;
  speed: number;
  contactCooldownMs: number;
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  walker: { maxHp: 30, damage: 8, speed: 70, contactCooldownMs: 700 },
  shooter: { maxHp: 20, damage: 6, speed: 0, contactCooldownMs: 700 },
  boss: { maxHp: 160, damage: 16, speed: 60, contactCooldownMs: 700 },
};

export interface WeaponStats {
  comboHits: number;
  damagePerHit: number[];
  rangePx: number;
  knockback: number;
  comboWindowMs: number;
}

export const PLAYER_WEAPON: WeaponStats = {
  comboHits: 3,
  damagePerHit: [10, 10, 18],
  /**
   * Phải dài hơn tầm lao của quái đi tuần (96px) một chút để người chơi đánh
   * trúng được từ ngoài tầm ra đòn của nó — nếu ngắn hơn thì muốn đánh là buộc
   * phải đứng trong tầm bị đánh, cơ chế né trở thành vô nghĩa.
   */
  rangePx: 62,
  knockback: 260,
  comboWindowMs: 450,
};

export interface RunEventPayload {
  roomsCleared: number;
  cellsCollected: number;
  timeMs: number;
  isVictory: boolean;
}
