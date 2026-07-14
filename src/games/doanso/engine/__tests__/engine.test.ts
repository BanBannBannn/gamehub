import { describe, expect, it } from "vitest";
import { generateSecret, evaluateGuess, isValidGuessFormat } from "../secret";
import { getHint } from "../hint";
import { GuessResult } from "../types";

describe("generateSecret", () => {
  it("trả về đúng độ dài yêu cầu", () => {
    expect(generateSecret(3)).toHaveLength(3);
    expect(generateSecret(4)).toHaveLength(4);
    expect(generateSecret(5)).toHaveLength(5);
  });

  it("chỉ chứa chữ số, không có chữ số lặp lại (chạy nhiều lần để chắc chắn)", () => {
    for (let i = 0; i < 200; i++) {
      const secret = generateSecret(5);
      expect(/^[0-9]+$/.test(secret)).toBe(true);
      const unique = new Set(secret.split(""));
      expect(unique.size).toBe(5);
    }
  });
});

describe("evaluateGuess", () => {
  it("đoán đúng hết → correctPosition = N, correctValueOnly = 0", () => {
    const result = evaluateGuess("1234", "1234");
    expect(result).toEqual({ correctPosition: 4, correctValueOnly: 0 });
  });

  it("không trùng chữ số nào → cả 2 đều 0", () => {
    const result = evaluateGuess("123", "456");
    expect(result).toEqual({ correctPosition: 0, correctValueOnly: 0 });
  });

  it("xử lý đúng trường hợp guess có chữ số lặp lại (secret='123', guess='112')", () => {
    // '1' ở vị trí 0 đúng vị trí. '1' ở vị trí 1 sai (secret[1]='2').
    // '2' ở vị trí 2 sai vị trí (secret[2]='3').
    // Chữ số '1' chỉ được tính đúng-giá-trị-sai-vị-trí 1 lần dù lặp lại trong guess.
    const result = evaluateGuess("123", "112");
    expect(result.correctPosition).toBe(1);
    expect(result.correctValueOnly).toBe(1);
  });

  it("một ví dụ kinh điển khác: secret='1234', guess='1325' → 1A2B", () => {
    const result = evaluateGuess("1234", "1325");
    expect(result.correctPosition).toBe(1); // chữ số '1' đúng vị trí đầu
    expect(result.correctValueOnly).toBe(2); // '3' và '2' có mặt nhưng sai vị trí
  });

  it("guess toàn chữ số lặp lại của 1 chữ số duy nhất có trong secret", () => {
    // secret có đúng 1 chữ số '7', guess toàn '7' → chỉ tính đúng vị trí (nếu trùng) và không tính thêm B.
    const result = evaluateGuess("789", "777");
    expect(result.correctPosition).toBe(1); // vị trí đầu '7' khớp
    expect(result.correctValueOnly).toBe(0); // không có thêm B vì secret chỉ có 1 chữ số '7'
  });

  it("tổng correctValueOnly luôn <= length - correctPosition (tính đối xứng)", () => {
    const cases: [string, string][] = [
      ["12345", "54321"],
      ["09876", "98760"],
      ["123", "321"],
      ["4567", "7654"],
    ];
    for (const [secret, guess] of cases) {
      const { correctPosition, correctValueOnly } = evaluateGuess(secret, guess);
      expect(correctValueOnly).toBeLessThanOrEqual(secret.length - correctPosition);
    }
  });
});

describe("isValidGuessFormat", () => {
  it("từ chối sai độ dài", () => {
    expect(isValidGuessFormat("123", 4)).toBe(false);
  });

  it("từ chối ký tự không phải số", () => {
    expect(isValidGuessFormat("12a4", 4)).toBe(false);
  });

  it("chấp nhận dãy số đúng độ dài, kể cả có chữ số lặp lại", () => {
    expect(isValidGuessFormat("1123", 4)).toBe(true);
  });
});

describe("getHint", () => {
  it("lượt đầu tiên (history rỗng) trả về gợi ý hợp lệ", () => {
    const hint = getHint([], 4);
    expect(isValidGuessFormat(hint.suggestion, 4)).toBe(true);
    expect(hint.reason.length).toBeGreaterThan(0);
  });

  it("luôn trả về gợi ý đúng định dạng hợp lệ", () => {
    const history: GuessResult[] = [
      { guess: "1234", correctPosition: 1, correctValueOnly: 1 },
      { guess: "5678", correctPosition: 0, correctValueOnly: 0 },
    ];
    const hint = getHint(history, 4);
    expect(isValidGuessFormat(hint.suggestion, 4)).toBe(true);
  });

  it("tránh các chữ số đã biết chắc chắn không có mặt", () => {
    const history: GuessResult[] = [
      // Lượt này có tổng = 0 → toàn bộ chữ số 5,6,7,8 chắc chắn không có trong secret.
      { guess: "5678", correctPosition: 0, correctValueOnly: 0 },
    ];
    const hint = getHint(history, 4);
    for (const digit of ["5", "6", "7", "8"]) {
      expect(hint.suggestion.includes(digit)).toBe(false);
    }
  });

  it("ưu tiên các chữ số đã biết chắc chắn có mặt", () => {
    const history: GuessResult[] = [
      // Lượt này 4 chữ số khác nhau, tổng khớp = 4 → toàn bộ chữ số 1,2,3,4 chắc chắn có mặt.
      { guess: "1234", correctPosition: 2, correctValueOnly: 2 },
    ];
    const hint = getHint(history, 4);
    for (const digit of ["1", "2", "3", "4"]) {
      expect(hint.suggestion.includes(digit)).toBe(true);
    }
  });

  it("[hồi quy] tự động làm theo gợi ý liên tục phải hội tụ tới đáp án trong số lượt hợp lý, không bao giờ kẹt lặp vô hạn", () => {
    // Đây là bài test tái hiện đúng bug thực tế đã gặp: phiên bản thuật
    // toán đầu tiên luôn build lại đúng 1 gợi ý "0123" không đổi mỗi khi
    // chưa suy luận ra thêm gì chắc chắn, khiến người chơi làm theo hint
    // mãi mãi mà không bao giờ thắng. Test này đảm bảo lỗi đó không tái diễn.
    for (const length of [3, 4, 5] as const) {
      const secret = generateSecret(length);
      const history: GuessResult[] = [];
      const maxTurns = 60;
      let won = false;

      for (let turn = 0; turn < maxTurns; turn++) {
        const hint = getHint(history, length);
        expect(isValidGuessFormat(hint.suggestion, length)).toBe(true);
        // Không bao giờ được lặp lại y hệt 1 lượt đã đoán trước đó, trừ
        // khi không còn lựa chọn nào khác (cực hiếm, không xảy ra ở đây).
        expect(history.some((h) => h.guess === hint.suggestion)).toBe(false);

        const evalResult = evaluateGuess(secret, hint.suggestion);
        history.push({ guess: hint.suggestion, ...evalResult });
        if (evalResult.correctPosition === length) {
          won = true;
          break;
        }
      }

      expect(won).toBe(true);
      expect(history.length).toBeLessThan(maxTurns);
    }
  });
});
