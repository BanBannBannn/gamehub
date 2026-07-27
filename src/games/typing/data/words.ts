export interface CustomWordSet {
  id: string;
  name: string;
  text: string;
  createdAt: number;
}

export const ENGLISH_WORDS = [
  "algorithm", "application", "architecture", "async", "backend", "browser", "component", "database",
  "developer", "framework", "function", "interface", "javascript", "keyboard", "language", "memory",
  "network", "optimize", "parameter", "performance", "program", "react", "repository", "responsive",
  "server", "software", "solution", "storage", "structure", "system", "terminal", "typescript",
  "variable", "vector", "virtual", "web", "workspace", "arcade", "cyberpunk", "lightning", "velocity",
  "victory", "champion", "momentum", "precision", "streak", "dynamic", "matrix", "synthwave", "quantum"
];

export const VIETNAMESE_NO_ACCENT_WORDS = [
  "lap trinh", "cong nghe", "tri tue nhan tao", "phan mem", "may tinh", "ban phim", "toc do",
  "giai do", "giao dien", "trai nghiem", "nguoi dung", "du lieu", "mang luoi", "hieu nang",
  "toi uu", "chinh xac", "thien tai", "chuyen nghiep", "ky nang", "ren luyen", "tu duy",
  "sang tao", "kham pha", "phat trien", "tuong lai", "hien dai", "tro choi", "giai tri",
  "thu thach", "chien thang", "ky luc", "dinh cao", "toc do anh sang", "than toc", "chinh phuc"
];

export const TECH_PARAGRAPHS = [
  "React is a popular JavaScript library for building user interfaces with modular components.",
  "TypeScript brings static type checking to JavaScript making code maintainable and robust.",
  "Nextjs provides hybrid static rendering and server side rendering for modern web applications.",
  "Cyberpunk typing challenges your reflexes with high speed keystrokes and instant precision.",
  "Optimization is key to smooth sixty frames per second animations in modern web design."
];

export const STORAGE_KEY = "gamehub_custom_typing_sets";

export function getCustomWordSets(): CustomWordSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomWordSet(name: string, text: string): CustomWordSet[] {
  const sets = getCustomWordSets();
  const newSet: CustomWordSet = {
    id: Date.now().toString(),
    name: name.trim() || "Bộ từ mới",
    text: text.trim(),
    createdAt: Date.now(),
  };
  const updated = [newSet, ...sets];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi khi lưu custom word set:", e);
  }
  return updated;
}

export function deleteCustomWordSet(id: string): CustomWordSet[] {
  const sets = getCustomWordSets();
  const updated = sets.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi khi xóa custom word set:", e);
  }
  return updated;
}
