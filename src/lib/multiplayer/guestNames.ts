const ADJECTIVES = [
  "Vui Vẻ",
  "Tinh Nghịch",
  "Lém Lỉnh",
  "Bí Ẩn",
  "Nhanh Trí",
  "May Mắn",
  "Kiên Cường",
  "Dũng Cảm",
  "Tài Ba",
  "Hào Sảng",
  "Điềm Tĩnh",
  "Sáng Tạo",
];

const NOUNS = [
  "Khách",
  "Chiến Binh",
  "Kỳ Thủ",
  "Cao Thủ",
  "Ẩn Sĩ",
  "Lữ Khách",
  "Hiệp Sĩ",
  "Thám Tử",
  "Phù Thuỷ",
  "Du Khách",
];

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Sinh 1 tên khách ngẫu nhiên kiểu "Khách Vui Vẻ 4821", không cần gọi API ngoài. */
export function generateGuestName(): string {
  const noun = NOUNS[randomInt(NOUNS.length)];
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const number = 1000 + randomInt(9000);
  return `${noun} ${adjective} ${number}`;
}
