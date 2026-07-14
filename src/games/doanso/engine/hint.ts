import { ALL_DIGITS, evaluateGuess, shuffledDigitSequence } from "./secret";
import { GuessResult, HintResult } from "./types";

// Bộ nhớ đệm danh sách toàn bộ ứng viên hợp lệ theo từng độ dài, vì đây
// là tập cố định (hoán vị 10 chữ số chọn `length` phần tử, không lặp) —
// tính 1 lần rồi dùng lại, tránh sinh lại hàng chục nghìn phần tử mỗi lần
// người chơi bấm Gợi ý.
const candidateCache = new Map<number, string[]>();

function generateAllCandidates(length: number): string[] {
  const results: string[] = [];

  function backtrack(current: string[], used: Set<string>) {
    if (current.length === length) {
      results.push(current.join(""));
      return;
    }
    for (const digit of ALL_DIGITS) {
      if (used.has(digit)) continue;
      used.add(digit);
      current.push(digit);
      backtrack(current, used);
      current.pop();
      used.delete(digit);
    }
  }

  backtrack([], new Set());
  return results;
}

function getAllCandidates(length: number): string[] {
  const cached = candidateCache.get(length);
  if (cached) return cached;
  const generated = generateAllCandidates(length);
  candidateCache.set(length, generated);
  return generated;
}

/**
 * Gợi ý dãy số nên đoán tiếp theo bằng cách lọc trong TOÀN BỘ không gian
 * ứng viên hợp lệ (hoán vị `length` chữ số khác nhau từ 0-9) ra những
 * ứng viên còn "khả thi" — tức là nếu ứng viên đó là số bí mật thật, thì
 * mọi lượt đã đoán trước đây đều phải cho ra ĐÚNG kết quả (🎯/🔄) đã ghi
 * nhận. Đây là cách suy luận đúng đắn và mạnh hơn nhiều so với chỉ suy ra
 * "chữ số nào chắc chắn có/không có" một cách rời rạc — mọi thông tin về
 * VỊ TRÍ trong mỗi lượt đoán cũng được tận dụng triệt để.
 *
 * Không gian ứng viên tối đa (độ khó "Khó", 5 chữ số) chỉ có 10×9×8×7×6 =
 * 30.240 khả năng — đủ nhỏ để lọc trực tiếp trong vài chục mili giây,
 * không cần thuật toán tối ưu phức tạp kiểu Knuth's five-guess algorithm.
 */
export function getHint(history: GuessResult[], length: number): HintResult {
  if (history.length === 0) {
    return {
      suggestion: shuffledDigitSequence(length),
      reason: "Lượt đầu tiên, hãy thử 1 dãy số bất kỳ để bắt đầu thu thập thông tin.",
    };
  }

  const allCandidates = getAllCandidates(length);
  const triedGuesses = new Set(history.map((h) => h.guess));

  const consistent = allCandidates.filter((candidate) =>
    history.every((h) => {
      const result = evaluateGuess(candidate, h.guess);
      return result.correctPosition === h.correctPosition && result.correctValueOnly === h.correctValueOnly;
    })
  );

  // Nếu vì lý do nào đó không còn ứng viên nào khớp (không nên xảy ra với
  // dữ liệu chấm điểm trung thực), rơi về toàn bộ không gian ứng viên để
  // vẫn luôn trả ra được 1 gợi ý hợp lệ thay vì bị kẹt.
  const pool = consistent.length > 0 ? consistent : allCandidates;
  const notTriedYet = pool.filter((c) => !triedGuesses.has(c));
  const finalPool = notTriedYet.length > 0 ? notTriedYet : pool;

  const suggestion = finalPool[Math.floor(Math.random() * finalPool.length)];

  let reason: string;
  if (consistent.length === 1) {
    reason = "Chỉ còn đúng 1 đáp án khả thi dựa trên các lượt đoán trước — chắc chắn đây là số bí mật!";
  } else if (consistent.length > 0 && consistent.length <= 5) {
    reason = `Dựa trên tất cả các lượt đã đoán, chỉ còn ${consistent.length} khả năng phù hợp — đây là 1 trong số đó.`;
  } else if (consistent.length > 0) {
    reason = `Dựa trên tất cả các lượt đã đoán, đây là 1 trong ${consistent.length} khả năng còn phù hợp.`;
  } else {
    reason = "Không suy luận chắc chắn được — đây là 1 dãy số mới để tiếp tục thu thập thông tin.";
  }

  return { suggestion, reason };
}
