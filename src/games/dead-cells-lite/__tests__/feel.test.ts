import { describe, expect, it } from "vitest";
import {
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  cutJumpVelocity,
  decideJump,
  gravityScaleFor,
  hitstopMsFor,
} from "../engine/feel";

const base = {
  now: 1000,
  lastOnGroundAt: 1000,
  lastJumpPressedAt: 1000,
  onGround: true,
  jumpsUsed: 0,
  maxJumps: 2,
};

describe("feel — decideJump", () => {
  it("đứng trên nền + vừa bấm → nhảy thường", () => {
    expect(decideJump(base)).toBe("ground");
  });

  it("không bấm nhảy (quá jump buffer) → không nhảy", () => {
    expect(decideJump({ ...base, lastJumpPressedAt: 1000 - JUMP_BUFFER_MS - 1 })).toBe("none");
  });

  it("jump buffer: bấm hơi sớm trước khi chạm đất vẫn nhảy", () => {
    // bấm ở 1000, chạm đất ở 1100 → vẫn trong buffer 130ms
    expect(decideJump({ ...base, now: 1100, lastOnGroundAt: 1100, lastJumpPressedAt: 1000 })).toBe("ground");
  });

  it("coyote time: vừa rời mép nền vẫn nhảy được như trên nền", () => {
    const t = 1000;
    expect(
      decideJump({
        ...base,
        now: t,
        onGround: false,
        lastOnGroundAt: t - COYOTE_TIME_MS + 10,
        lastJumpPressedAt: t,
      })
    ).toBe("ground");
  });

  it("quá coyote time + chưa dùng lần nhảy nào → không nhảy thường nữa", () => {
    const t = 1000;
    expect(
      decideJump({
        ...base,
        now: t,
        onGround: false,
        lastOnGroundAt: t - COYOTE_TIME_MS - 50,
        lastJumpPressedAt: t,
      })
    ).toBe("none");
  });

  it("đang trên không sau lần nhảy đầu → nhảy đôi", () => {
    expect(decideJump({ ...base, onGround: false, lastOnGroundAt: 0, jumpsUsed: 1 })).toBe("double");
  });

  it("đã dùng hết số lần nhảy → không nhảy", () => {
    expect(decideJump({ ...base, onGround: false, lastOnGroundAt: 0, jumpsUsed: 2 })).toBe("none");
  });

  it("maxJumps = 1 thì không có nhảy đôi", () => {
    expect(decideJump({ ...base, onGround: false, lastOnGroundAt: 0, jumpsUsed: 1, maxJumps: 1 })).toBe("none");
  });
});

describe("feel — variable jump height & gravity", () => {
  it("nhả phím sớm khi đang bay lên thì cắt lực nhảy", () => {
    expect(cutJumpVelocity(-600, 0.4)).toBeCloseTo(-240);
  });

  it("đang rơi thì không cắt (không tự dưng rơi chậm lại)", () => {
    expect(cutJumpVelocity(300)).toBe(300);
  });

  it("giữ phím thì bay lên nhẹ hơn là nhả phím", () => {
    expect(gravityScaleFor(-300, true)).toBeLessThan(gravityScaleFor(-300, false));
  });

  it("lúc rơi trọng lực lớn hơn lúc bay lên có giữ phím", () => {
    expect(gravityScaleFor(300, false)).toBeGreaterThan(gravityScaleFor(-300, true));
  });
});

describe("feel — hitstop", () => {
  it("đòn nặng đứng hình lâu hơn đòn nhẹ", () => {
    expect(hitstopMsFor(20)).toBeGreaterThan(hitstopMsFor(5));
  });

  it("có chặn trên để không đứng hình quá lâu", () => {
    expect(hitstopMsFor(9999)).toBeLessThanOrEqual(110);
  });
});
