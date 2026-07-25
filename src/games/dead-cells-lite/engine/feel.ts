/**
 * Các quyết định "cảm giác điều khiển" (game feel) tách thành hàm thuần để
 * test được — đây là phần quyết định game platformer chơi sướng hay khó chịu,
 * nên đáng để có test thay vì chôn trong Phaser scene.
 *
 * Ba kỹ thuật kinh điển:
 * - **Coyote time**: vẫn cho nhảy trong ~0.1s sau khi đã rời khỏi mép nền,
 *   để người chơi bấm hơi trễ vẫn nhảy được (không cảm giác "game ăn phím").
 * - **Jump buffer**: bấm nhảy hơi sớm trước khi chạm đất thì ghi nhớ, chạm
 *   đất là nhảy luôn (không phải bấm lại).
 * - **Variable jump height**: nhả phím sớm thì cắt bớt lực nhảy → nhảy ngắn,
 *   giữ phím thì nhảy cao.
 */

export const COYOTE_TIME_MS = 110;
export const JUMP_BUFFER_MS = 130;

export type JumpKind = "ground" | "double" | "none";

export interface JumpDecisionInput {
  now: number;
  /** Thời điểm cuối cùng còn đứng trên nền (coyote time tính từ đây). */
  lastOnGroundAt: number;
  /** Thời điểm cuối cùng người chơi bấm nhảy (jump buffer tính từ đây). */
  lastJumpPressedAt: number;
  /** Đang thực sự đứng trên nền ở frame này. */
  onGround: boolean;
  /** Số lần đã nhảy trong lần rời đất hiện tại. */
  jumpsUsed: number;
  /** Tổng số lần nhảy cho phép (2 = có nhảy đôi). */
  maxJumps: number;
}

/**
 * Quyết định frame này có nhảy hay không, và là nhảy từ nền hay nhảy đôi
 * trên không. Trả về "none" nếu không nhảy.
 */
export function decideJump(input: JumpDecisionInput): JumpKind {
  const { now, lastOnGroundAt, lastJumpPressedAt, onGround, jumpsUsed, maxJumps } = input;

  const jumpBuffered = now - lastJumpPressedAt <= JUMP_BUFFER_MS;
  if (!jumpBuffered) return "none";

  const withinCoyote = now - lastOnGroundAt <= COYOTE_TIME_MS;
  if ((onGround || withinCoyote) && jumpsUsed === 0) return "ground";

  if (jumpsUsed >= 1 && jumpsUsed < maxJumps) return "double";

  return "none";
}

/**
 * Cắt lực nhảy khi người chơi nhả phím sớm (variable jump height). Chỉ cắt
 * khi đang bay lên (vy < 0) — đang rơi thì giữ nguyên.
 */
export function cutJumpVelocity(velocityY: number, cutFactor = 0.4): number {
  if (velocityY >= 0) return velocityY;
  return velocityY * cutFactor;
}

/**
 * Nhân trọng lực theo pha nhảy: rơi nhanh hơn lúc bay lên tạo cảm giác
 * "nặng" và kiểm soát tốt hơn (hầu hết platformer hay đều làm vậy).
 */
export function gravityScaleFor(velocityY: number, isHoldingJump: boolean): number {
  if (velocityY < 0) return isHoldingJump ? 1 : 1.7;
  return 1.35;
}

/** Thời gian đứng hình (hitstop) theo sát thương — đòn nặng thì đứng hình lâu hơn. */
export function hitstopMsFor(damage: number): number {
  return Math.min(110, 40 + damage * 2.5);
}
