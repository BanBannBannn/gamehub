/**
 * Elo rating thuần (không phụ thuộc Supabase) — tách riêng để test dễ dàng.
 *
 * Mô hình: mỗi người chơi tự ghi kết quả CỦA CHÍNH MÌNH (self-report) dựa trên
 * điểm hiện tại của đối thủ đọc được lúc kết thúc ván. Nhờ vậy mỗi client chỉ
 * ghi đúng 1 dòng của mình (khớp RLS `auth.uid() = user_id`), không cần "người
 * báo cáo" duy nhất và không bị race khi cả 2 cùng ghi.
 */

export const DEFAULT_RATING = 1000;
export const DEFAULT_K = 32;

export type MatchResult = "win" | "loss" | "draw";

/** Điểm số của ván theo quy ước Elo: thắng = 1, hoà = 0.5, thua = 0. */
export function scoreOf(result: MatchResult): number {
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}

/** Kỳ vọng thắng của A khi gặp B (0..1). */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Điểm mới của "mình" sau 1 ván gặp đối thủ có điểm `opponentRating`.
 * Làm tròn về số nguyên, không bao giờ xuống dưới 100 (tránh điểm âm khó chịu).
 */
export function computeNewRating(
  myRating: number,
  opponentRating: number,
  result: MatchResult,
  k: number = DEFAULT_K
): number {
  const expected = expectedScore(myRating, opponentRating);
  const next = myRating + k * (scoreOf(result) - expected);
  return Math.max(100, Math.round(next));
}

/** Chênh lệch điểm (có dấu) mình sẽ nhận — tiện để hiển thị "+12 / −8". */
export function ratingDelta(
  myRating: number,
  opponentRating: number,
  result: MatchResult,
  k: number = DEFAULT_K
): number {
  return computeNewRating(myRating, opponentRating, result, k) - myRating;
}
