import { describe, expect, it } from "vitest";
import { UPGRADES, applyUpgrade, createBaseStats, rollUpgradeChoices } from "../engine/upgrades";

describe("upgrades — bốc lựa chọn", () => {
  it("cùng seed cho cùng bộ lựa chọn", () => {
    expect(rollUpgradeChoices(42)).toEqual(rollUpgradeChoices(42));
  });

  it("bốc đúng số lượng và không trùng nhau", () => {
    const picks = rollUpgradeChoices(7, 3);
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((p) => p.id)).size).toBe(3);
  });

  it("không bốc quá số buff đang có", () => {
    expect(rollUpgradeChoices(1, 99)).toHaveLength(UPGRADES.length);
  });

  it("seed khác nhau thường cho bộ khác nhau", () => {
    const sets = [1, 2, 3, 4, 5].map((s) => rollUpgradeChoices(s).map((u) => u.id).join(","));
    expect(new Set(sets).size).toBeGreaterThan(1);
  });
});

describe("upgrades — áp buff lên chỉ số", () => {
  it("Lưỡi sắc tăng sát thương, không đụng chỉ số khác", () => {
    const base = createBaseStats();
    const { stats, healAmount } = applyUpgrade(base, "damage");
    expect(stats.damageMultiplier).toBeCloseTo(1.25);
    expect(stats.speedMultiplier).toBe(base.speedMultiplier);
    expect(healAmount).toBe(0);
  });

  it("Giáp cốt tăng máu tối đa và hồi đúng lượng vừa tăng", () => {
    const { stats, healAmount } = applyUpgrade(createBaseStats(), "maxHp");
    expect(stats.maxHp).toBe(125);
    expect(healAmount).toBe(25);
  });

  it("Bình thuốc chỉ hồi máu, không tăng máu tối đa", () => {
    const base = createBaseStats();
    const { stats, healAmount } = applyUpgrade(base, "heal");
    expect(healAmount).toBe(60);
    expect(stats.maxHp).toBe(base.maxHp);
  });

  it("Bóng mờ làm hồi chiêu lướt NHANH hơn (nhân < 1)", () => {
    const { stats } = applyUpgrade(createBaseStats(), "dashCooldown");
    expect(stats.dashCooldownMultiplier).toBeLessThan(1);
  });

  it("buff cộng dồn qua nhiều lần chọn", () => {
    let stats = createBaseStats();
    stats = applyUpgrade(stats, "damage").stats;
    stats = applyUpgrade(stats, "damage").stats;
    expect(stats.damageMultiplier).toBeGreaterThan(1.5);
  });

  it("không làm đột biến (mutate) chỉ số gốc", () => {
    const base = createBaseStats();
    applyUpgrade(base, "maxHp");
    expect(base.maxHp).toBe(100);
  });

  it("Hút máu cộng dồn lượng hồi mỗi lần hạ quái", () => {
    let stats = createBaseStats();
    stats = applyUpgrade(stats, "lifesteal").stats;
    stats = applyUpgrade(stats, "lifesteal").stats;
    expect(stats.lifestealPerKill).toBe(12);
  });
});
