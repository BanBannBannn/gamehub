export const WORDLE_EN = [
  "REACT", "SMART", "BRAIN", "CLOUD", "DRIVE", "PULSE", "CYBER", "LIGHT", "SPEED", "POWER",
  "AUDIO", "VIDEO", "LOGIC", "STORE", "FRAME", "BUILD", "Clean", "FLASH", "MAGIC", "SUPER",
  "PIXEL", "IMAGE", "GRAPH", "INPUT", "EVENT", "TIMER", "FOCUS", "MODEL", "STATE", "FETCH"
];

export const WORDLE_VI = [
  "THONG", "MINH", "NHANH", "CHINH", "TRONG", "PHONG", "TRANG", "THIEN", "THANH", "KHOANG",
  "NGUOI", "NGAOC", "NGAOI", "NGHEO", "CHUYEN", "NGHIEM", "DUONG", "TRUONG", "THUONG", "THUONG"
].map(w => w.slice(0, 5));

export function getRandomWord(mode: "en" | "vi"): string {
  const list = mode === "en" ? WORDLE_EN : WORDLE_VI;
  return list[Math.floor(Math.random() * list.length)].toUpperCase();
}
