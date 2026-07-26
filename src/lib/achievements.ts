export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_game",
    title: "Tân Thủ GameHub",
    description: "Chơi ván game đầu tiên bất kỳ trên GameHub.",
    icon: "🎮",
    xp: 50,
    unlocked: false,
  },
  {
    id: "dice_yahtzee",
    title: "Bậc Thầy Yahtzee",
    description: "Đạt được tổ hợp Yahtzee (5 xúc xắc giống nhau) trong game Lắc xúc xắc.",
    icon: "🎲",
    xp: 200,
    unlocked: false,
  },
  {
    id: "typing_speed",
    title: "Bàn Tay Sấm Sét",
    description: "Đạt tốc độ gõ phím trên 60 WPM trong game Gõ Phím Thần Tốc.",
    icon: "⚡",
    xp: 150,
    unlocked: false,
  },
  {
    id: "snake_pro",
    title: "Vua Săn Mồi",
    description: "Đạt từ 15 điểm trở lên trong game Rắn Săn Mồi Cyber.",
    icon: "🐍",
    xp: 100,
    unlocked: false,
  },
  {
    id: "tetris_cleaner",
    title: "Chuyên Gia Xếp Gạch",
    description: "Xóa từ 10 hàng gạch trở lên trong game Tetris Neon.",
    icon: "🧱",
    xp: 120,
    unlocked: false,
  },
  {
    id: "flappy_master",
    title: "Vỗ Cánh Bay Cao",
    description: "Đạt từ 10 điểm trở lên trong game Flappy Bird Arcade.",
    icon: "🐤",
    xp: 100,
    unlocked: false,
  },
  {
    id: "wordle_winner",
    title: "Thần Đồng Ngôn Ngữ",
    description: "Đoán đúng từ bí ẩn trong game Wordle.",
    icon: "🔤",
    xp: 100,
    unlocked: false,
  },
];

export function getAchievements(): Achievement[] {
  if (typeof window === "undefined") return INITIAL_ACHIEVEMENTS;
  try {
    const saved = localStorage.getItem("gamehub_achievements");
    if (!saved) return INITIAL_ACHIEVEMENTS;
    const parsed: Achievement[] = JSON.parse(saved);
    return INITIAL_ACHIEVEMENTS.map((def) => {
      const found = parsed.find((p) => p.id === def.id);
      return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
    });
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function unlockAchievement(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getAchievements();
    let newlyUnlocked = false;
    const updated = current.map((item) => {
      if (item.id === id && !item.unlocked) {
        newlyUnlocked = true;
        return { ...item, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      return item;
    });

    if (newlyUnlocked) {
      localStorage.setItem("gamehub_achievements", JSON.stringify(updated));
    }
    return newlyUnlocked;
  } catch {
    return false;
  }
}
