import { describe, expect, it } from "vitest";
import { buildDeck, isSolved, PAIR_COUNT, shuffle } from "../engine/logic";

describe("memory engine", () => {
  it("buildDeck có đúng số lá và mỗi biểu tượng xuất hiện 2 lần", () => {
    const deck = buildDeck("medium");
    expect(deck.length).toBe(PAIR_COUNT.medium * 2);
    const counts = new Map<string, number>();
    for (const c of deck) counts.set(c.symbol, (counts.get(c.symbol) ?? 0) + 1);
    for (const n of counts.values()) expect(n).toBe(2);
    expect(counts.size).toBe(PAIR_COUNT.medium);
  });

  it("id là duy nhất, ban đầu chưa lật/chưa ghép", () => {
    const deck = buildDeck("easy");
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
    expect(deck.every((c) => !c.flipped && !c.matched)).toBe(true);
  });

  it("shuffle giữ nguyên phần tử (chỉ đổi thứ tự)", () => {
    const arr = [1, 2, 3, 4, 5];
    const s = shuffle(arr, () => 0);
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(arr).toEqual([1, 2, 3, 4, 5]); // không sửa mảng gốc
  });

  it("isSolved đúng khi tất cả đã ghép", () => {
    const deck = buildDeck("easy").map((c) => ({ ...c, matched: true }));
    expect(isSolved(deck)).toBe(true);
    expect(isSolved(buildDeck("easy"))).toBe(false);
    expect(isSolved([])).toBe(false);
  });
});
