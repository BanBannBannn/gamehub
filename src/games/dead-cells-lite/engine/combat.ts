export function applyDamage(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - Math.max(0, damage));
}

export function isDead(hp: number): boolean {
  return hp <= 0;
}

/** Hướng đẩy lùi (knockback) — dương nếu nguồn sát thương ở bên trái mục tiêu. */
export function knockbackDirection(targetX: number, sourceX: number): 1 | -1 {
  return targetX >= sourceX ? 1 : -1;
}

/** Vũ khí của người chơi có combo tăng dần — trả về sát thương của đòn thứ `hitIndex` (0-based), kẹp trong khoảng hợp lệ. */
export function comboDamage(damagePerHit: number[], hitIndex: number): number {
  const clamped = Math.min(Math.max(hitIndex, 0), damagePerHit.length - 1);
  return damagePerHit[clamped];
}
