export type Difficulty = "easy" | "medium" | "hard"; // N = 3 / 4 / 5

export const DIFFICULTY_LENGTH: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

// Số lượt tham khảo để thắng "tối ưu" — chỉ để hiển thị mang tính động
// viên, không phải con số chính xác tuyệt đối theo lý thuyết game.
export const DIFFICULTY_REFERENCE_TURNS: Record<Difficulty, number> = {
  easy: 5,
  medium: 7,
  hard: 9,
};

export interface GuessResult {
  guess: string; // dãy N chữ số người chơi đã nhập
  correctPosition: number; // số đúng vị trí (A / 🎯)
  correctValueOnly: number; // đúng giá trị, sai vị trí (B / 🔄)
}

export interface HintResult {
  suggestion: string; // 1 dãy N chữ số gợi ý nên đoán tiếp
  reason: string;
}
