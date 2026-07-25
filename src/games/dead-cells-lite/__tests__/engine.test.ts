import { describe, expect, it } from "vitest";
import { applyDamage, comboDamage, isDead, knockbackDirection } from "../engine/combat";
import { MIN_ENEMY_CLEARANCE_TILES, TILE, pickRun, isBossRoom } from "../engine/roomPool";
import { PLAYER_WEAPON } from "../engine/types";
import { mulberry32, shuffle } from "../engine/rng";

describe("dead-cells-lite engine — combat", () => {
  it("trừ máu không xuống dưới 0", () => {
    expect(applyDamage(10, 30)).toBe(0);
    expect(applyDamage(30, 10)).toBe(20);
  });

  it("sát thương âm không hồi máu", () => {
    expect(applyDamage(10, -5)).toBe(10);
  });

  it("isDead đúng ở biên", () => {
    expect(isDead(0)).toBe(true);
    expect(isDead(1)).toBe(false);
  });

  it("hướng đẩy lùi theo vị trí tương đối", () => {
    expect(knockbackDirection(100, 50)).toBe(1);
    expect(knockbackDirection(50, 100)).toBe(-1);
  });

  it("sát thương combo tăng dần và kẹp trong khoảng hợp lệ", () => {
    expect(comboDamage(PLAYER_WEAPON.damagePerHit, 0)).toBe(10);
    expect(comboDamage(PLAYER_WEAPON.damagePerHit, 2)).toBe(18);
    expect(comboDamage(PLAYER_WEAPON.damagePerHit, 99)).toBe(18);
    expect(comboDamage(PLAYER_WEAPON.damagePerHit, -1)).toBe(10);
  });
});

describe("dead-cells-lite engine — RNG", () => {
  it("cùng seed cho cùng kết quả", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("shuffle giữ nguyên tập phần tử", () => {
    const rand = mulberry32(7);
    const shuffled = shuffle([1, 2, 3, 4, 5], rand);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("dead-cells-lite engine — room pool", () => {
  it("cùng seed → cùng chuỗi phòng", () => {
    expect(pickRun(123)).toEqual(pickRun(123));
  });

  it("luôn kết thúc bằng phòng boss, không lặp phòng thường", () => {
    for (const seed of [1, 2, 3, 4, 5, 100, 999]) {
      const run = pickRun(seed);
      expect(isBossRoom(run[run.length - 1])).toBe(true);
      const normalRooms = run.slice(0, -1);
      const ids = normalRooms.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(run.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("không có quái nào đứng sát cửa vào phòng (chống bị đánh úp)", () => {
    // Người chơi luôn vào phòng từ mép trái; quái sát cửa = mất máu oan.
    for (const seed of [1, 2, 3, 4, 5, 42, 777]) {
      for (const room of pickRun(seed)) {
        for (const enemy of room.enemies) {
          expect(enemy.x, `${room.id} có quái quá sát mép trái`).toBeGreaterThanOrEqual(
            MIN_ENEMY_CLEARANCE_TILES * TILE
          );
        }
      }
    }
  });

  it("phòng khác seed thường cho thứ tự khác nhau", () => {
    const runs = [1, 2, 3, 4, 5].map((s) => pickRun(s).map((r) => r.id).join(","));
    expect(new Set(runs).size).toBeGreaterThan(1);
  });
});
