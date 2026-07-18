// Bỏ các ký tự dễ nhầm lẫn khi đọc/gõ tay: 0/O, 1/I, và cả L (dễ lẫn với 1/I ở 1 số font).
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Chuẩn hoá mã phòng người dùng gõ tay: viết hoa, bỏ khoảng trắng, bỏ ký tự lạ. */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidRoomCodeFormat(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return code.split("").every((ch) => ROOM_CODE_ALPHABET.includes(ch));
}
