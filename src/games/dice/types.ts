export type Category =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeOfAKind"
  | "fourOfAKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yahtzee"
  | "chance";

export interface CategoryInfo {
  key: Category;
  label: string;
  section: "upper" | "lower";
  desc: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: "ones", label: "Số 1 (Ones)", section: "upper", desc: "Tổng các mặt 1" },
  { key: "twos", label: "Số 2 (Twos)", section: "upper", desc: "Tổng các mặt 2" },
  { key: "threes", label: "Số 3 (Threes)", section: "upper", desc: "Tổng các mặt 3" },
  { key: "fours", label: "Số 4 (Fours)", section: "upper", desc: "Tổng các mặt 4" },
  { key: "fives", label: "Số 5 (Fives)", section: "upper", desc: "Tổng các mặt 5" },
  { key: "sixes", label: "Số 6 (Sixes)", section: "upper", desc: "Tổng các mặt 6" },

  { key: "threeOfAKind", label: "Ba đồng số (3 of a Kind)", section: "lower", desc: "Ít nhất 3 mặt giống -> Tổng 5 viên" },
  { key: "fourOfAKind", label: "Bốn đồng số (4 of a Kind)", section: "lower", desc: "Ít nhất 4 mặt giống -> Tổng 5 viên" },
  { key: "fullHouse", label: "Cù lũ (Full House)", section: "lower", desc: "Bộ 3 + bộ 2 -> 25 điểm" },
  { key: "smallStraight", label: "Sảnh nhỏ (Small Straight)", section: "lower", desc: "4 số liên tiếp -> 30 điểm" },
  { key: "largeStraight", label: "Sảnh lớn (Large Straight)", section: "lower", desc: "5 số liên tiếp -> 40 điểm" },
  { key: "yahtzee", label: "Yahtzee (5 đồng số)", section: "lower", desc: "Cả 5 mặt giống -> 50 điểm" },
  { key: "chance", label: "Cơ hội (Chance)", section: "lower", desc: "Tổng số điểm 5 viên" },
];

export type Scorecard = Record<Category, number | null>;

export interface Player {
  id: number;
  name: string;
  isAi: boolean;
  avatar: string;
  scorecard: Scorecard;
}

export function createEmptyScorecard(): Scorecard {
  return {
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    threeOfAKind: null,
    fourOfAKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null,
  };
}

export function calculateScore(cat: Category, dice: number[]): number {
  if (!dice || dice.length !== 5) return 0;
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let sum = 0;
  for (const d of dice) {
    counts[d] = (counts[d] || 0) + 1;
    sum += d;
  }

  switch (cat) {
    case "ones": return (counts[1] || 0) * 1;
    case "twos": return (counts[2] || 0) * 2;
    case "threes": return (counts[3] || 0) * 3;
    case "fours": return (counts[4] || 0) * 4;
    case "fives": return (counts[5] || 0) * 5;
    case "sixes": return (counts[6] || 0) * 6;

    case "threeOfAKind": {
      const has3 = Object.values(counts).some((c) => c >= 3);
      return has3 ? sum : 0;
    }
    case "fourOfAKind": {
      const has4 = Object.values(counts).some((c) => c >= 4);
      return has4 ? sum : 0;
    }
    case "fullHouse": {
      const vals = Object.values(counts).filter((c) => c > 0);
      const isFH = (vals.includes(3) && vals.includes(2)) || vals.includes(5);
      return isFH ? 25 : 0;
    }
    case "smallStraight": {
      const unique = Array.from(new Set(dice)).sort((a, b) => a - b);
      const str = unique.join("");
      const isSm =
        str.includes("1234") ||
        str.includes("2345") ||
        str.includes("3456");
      return isSm ? 30 : 0;
    }
    case "largeStraight": {
      const unique = Array.from(new Set(dice)).sort((a, b) => a - b);
      const str = unique.join("");
      const isLg = str === "12345" || str === "23456";
      return isLg ? 40 : 0;
    }
    case "yahtzee": {
      const isY = Object.values(counts).some((c) => c === 5);
      return isY ? 50 : 0;
    }
    case "chance":
      return sum;
    default:
      return 0;
  }
}

export function calculateUpperSum(sc?: Scorecard | null): number {
  if (!sc || typeof sc !== "object") return 0;
  const categories: Category[] = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  return categories.reduce((total, cat) => {
    const val = sc?.[cat];
    return total + (typeof val === "number" ? val : 0);
  }, 0);
}

export function calculateUpperBonus(sc?: Scorecard | null): number {
  if (!sc || typeof sc !== "object") return 0;
  return calculateUpperSum(sc) >= 63 ? 35 : 0;
}

export function calculateTotalScore(sc?: Scorecard | null): number {
  if (!sc || typeof sc !== "object") return 0;
  const allCategories: Category[] = [
    "ones", "twos", "threes", "fours", "fives", "sixes",
    "threeOfAKind", "fourOfAKind", "fullHouse", "smallStraight", "largeStraight", "yahtzee", "chance"
  ];
  const catTotal = allCategories.reduce((total, cat) => {
    const val = sc?.[cat];
    return total + (typeof val === "number" ? val : 0);
  }, 0);
  return catTotal + calculateUpperBonus(sc);
}
