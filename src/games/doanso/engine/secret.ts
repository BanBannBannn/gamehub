export const ALL_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh 1 dãy `length` chữ số khác nhau đôi một (0-9, không lặp lại).
 */
export function generateSecret(length: number): string {
  return shuffle(ALL_DIGITS).slice(0, length).join("");
}

export function shuffledDigitSequence(length: number): string {
  return shuffle(ALL_DIGITS).slice(0, length).join("");
}

export function isValidGuessFormat(guess: string, length: number): boolean {
  if (guess.length !== length) return false;
  return /^[0-9]+$/.test(guess);
}

/**
 * Chấm điểm 1 lượt đoán theo luật Bulls and Cows.
 *
 * Lưu ý quan trọng (lỗi phổ biến nhất khi code game này): `guess` CÓ THỂ
 * chứa chữ số lặp lại dù `secret` luôn là các chữ số khác nhau đôi một.
 * Ví dụ secret="123", guess="112" phải cho kết quả 1 đúng vị trí (chữ
 * số "1" ở vị trí đầu) và 1 đúng giá trị sai vị trí (chỉ tính 1 lần, dù
 * "1" xuất hiện 2 lần trong guess, vì secret chỉ có đúng 1 chữ số "1").
 */
export function evaluateGuess(secret: string, guess: string): { correctPosition: number; correctValueOnly: number } {
  let correctPosition = 0;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) correctPosition++;
  }

  const guessDigits = new Set(guess.split(""));
  let valuePresent = 0;
  for (const digit of secret) {
    if (guessDigits.has(digit)) valuePresent++;
  }

  return { correctPosition, correctValueOnly: valuePresent - correctPosition };
}
