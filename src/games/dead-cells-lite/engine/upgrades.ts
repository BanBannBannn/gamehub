import { mulberry32, shuffle } from "./rng";

/**
 * Buff chọn được sau mỗi phòng — thứ tạo nên "mỗi lượt chơi một khác" của
 * roguelike: cùng bộ phòng nhưng dựng được nhân vật khác nhau. Toàn bộ là
 * dữ liệu + hàm thuần, không phụ thuộc Phaser.
 */

export type UpgradeId =
  | "damage"
  | "maxHp"
  | "heal"
  | "speed"
  | "dashCooldown"
  | "attackSpeed"
  | "lifesteal";

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
}

export const UPGRADES: Upgrade[] = [
  { id: "damage", name: "Lưỡi sắc", description: "+25% sát thương" },
  { id: "maxHp", name: "Giáp cốt", description: "+25 máu tối đa (hồi luôn)" },
  { id: "heal", name: "Bình thuốc", description: "Hồi 60 máu ngay" },
  { id: "speed", name: "Chân nhẹ", description: "+15% tốc chạy" },
  { id: "dashCooldown", name: "Bóng mờ", description: "Lướt hồi nhanh hơn 30%" },
  { id: "attackSpeed", name: "Tay nhanh", description: "+20% tốc đánh" },
  { id: "lifesteal", name: "Hút máu", description: "Hạ quái hồi 6 máu" },
];

/** Chỉ số nhân vật bị buff tác động — nhân/cộng dồn qua nhiều lần chọn. */
export interface PlayerStats {
  maxHp: number;
  damageMultiplier: number;
  speedMultiplier: number;
  dashCooldownMultiplier: number;
  attackSpeedMultiplier: number;
  lifestealPerKill: number;
}

export function createBaseStats(): PlayerStats {
  return {
    maxHp: 100,
    damageMultiplier: 1,
    speedMultiplier: 1,
    dashCooldownMultiplier: 1,
    attackSpeedMultiplier: 1,
    lifestealPerKill: 0,
  };
}

/**
 * Bốc ngẫu nhiên `count` buff khác nhau để người chơi chọn 1. Dùng RNG có
 * seed nên test được.
 */
export function rollUpgradeChoices(seed: number, count = 3): Upgrade[] {
  const rand = mulberry32(seed);
  return shuffle(UPGRADES, rand).slice(0, Math.min(count, UPGRADES.length));
}

/**
 * Áp 1 buff lên chỉ số. Trả về chỉ số mới + lượng máu hồi ngay (nếu buff đó
 * có hồi máu) — tách `healAmount` ra để lớp render tự cộng vào máu hiện tại,
 * giữ hàm này thuần.
 */
export function applyUpgrade(stats: PlayerStats, id: UpgradeId): { stats: PlayerStats; healAmount: number } {
  const next = { ...stats };
  let healAmount = 0;

  switch (id) {
    case "damage":
      next.damageMultiplier = round2(next.damageMultiplier * 1.25);
      break;
    case "maxHp":
      next.maxHp += 25;
      healAmount = 25;
      break;
    case "heal":
      healAmount = 60;
      break;
    case "speed":
      next.speedMultiplier = round2(next.speedMultiplier * 1.15);
      break;
    case "dashCooldown":
      next.dashCooldownMultiplier = round2(next.dashCooldownMultiplier * 0.7);
      break;
    case "attackSpeed":
      next.attackSpeedMultiplier = round2(next.attackSpeedMultiplier * 1.2);
      break;
    case "lifesteal":
      next.lifestealPerKill += 6;
      break;
  }

  return { stats: next, healAmount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
