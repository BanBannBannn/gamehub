import { describe, expect, it } from "vitest";
import {
  computeNewRating,
  DEFAULT_RATING,
  expectedScore,
  ratingDelta,
  scoreOf,
} from "../rating";

describe("rating (Elo)", () => {
  it("scoreOf theo quy ước Elo", () => {
    expect(scoreOf("win")).toBe(1);
    expect(scoreOf("draw")).toBe(0.5);
    expect(scoreOf("loss")).toBe(0);
  });

  it("2 người điểm bằng nhau: kỳ vọng thắng = 0.5", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 6);
  });

  it("người điểm cao có kỳ vọng thắng > 0.5", () => {
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
    expect(expectedScore(800, 1000)).toBeLessThan(0.5);
  });

  it("thắng đối thủ ngang điểm được +16 (K=32)", () => {
    expect(computeNewRating(1000, 1000, "win")).toBe(1016);
    expect(computeNewRating(1000, 1000, "loss")).toBe(984);
    expect(computeNewRating(1000, 1000, "draw")).toBe(1000);
  });

  it("thắng đối thủ mạnh hơn được nhiều điểm hơn thắng đối thủ yếu", () => {
    const winVsStrong = ratingDelta(1000, 1400, "win");
    const winVsWeak = ratingDelta(1000, 600, "win");
    expect(winVsStrong).toBeGreaterThan(winVsWeak);
  });

  it("điểm không tụt xuống dưới 100", () => {
    expect(computeNewRating(100, 2000, "loss")).toBeGreaterThanOrEqual(100);
  });

  it("delta thắng + delta thua của 2 người ngang điểm triệt tiêu nhau", () => {
    expect(ratingDelta(1000, 1000, "win") + ratingDelta(1000, 1000, "loss")).toBe(0);
  });

  it("DEFAULT_RATING = 1000", () => {
    expect(DEFAULT_RATING).toBe(1000);
  });
});
