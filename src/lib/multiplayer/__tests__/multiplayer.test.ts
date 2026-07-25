import { describe, expect, it } from "vitest";
import { generateRoomCode, isValidRoomCodeFormat, normalizeRoomCode } from "../roomCode";
import { generateGuestName } from "../guestNames";
import { isMultiplayerSupported, getMultiplayerConfig, MULTIPLAYER_CONFIG } from "../gameConfig";

describe("roomCode", () => {
  it("sinh mã đúng 6 ký tự, hợp lệ", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(isValidRoomCodeFormat(code)).toBe(true);
    }
  });

  it("không chứa ký tự dễ nhầm 0/O, 1/I, L", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      for (const banned of ["0", "O", "1", "I", "L"]) {
        expect(code.includes(banned)).toBe(false);
      }
    }
  });

  it("normalizeRoomCode viết hoa, bỏ khoảng trắng và ký tự lạ", () => {
    expect(normalizeRoomCode(" ab3k-9p ")).toBe("AB3K9P");
    expect(normalizeRoomCode("xy z12")).toBe("XYZ12");
  });

  it("isValidRoomCodeFormat từ chối mã sai độ dài hoặc chứa ký tự cấm", () => {
    expect(isValidRoomCodeFormat("AB3K9")).toBe(false); // thiếu 1 ký tự
    expect(isValidRoomCodeFormat("AB3K9O")).toBe(false); // chứa O bị cấm
    expect(isValidRoomCodeFormat("AB3K9P")).toBe(true);
  });

  it("sinh mã đa dạng qua nhiều lần gọi (không cố định 1 giá trị)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("guestNames", () => {
  it("sinh tên khách đúng định dạng 'Danh từ Tính từ Số'", () => {
    for (let i = 0; i < 50; i++) {
      const name = generateGuestName();
      const parts = name.split(" ");
      expect(parts.length).toBeGreaterThanOrEqual(3);
      const lastPart = parts[parts.length - 1];
      expect(/^\d{4}$/.test(lastPart)).toBe(true);
    }
  });

  it("sinh tên đa dạng qua nhiều lần gọi", () => {
    const names = new Set(Array.from({ length: 30 }, () => generateGuestName()));
    expect(names.size).toBeGreaterThan(1);
  });
});

describe("gameConfig", () => {
  it("chỉ 3 game cờ bàn hỗ trợ online, game 1 người không có trong danh sách", () => {
    expect(isMultiplayerSupported("caro")).toBe(true);
    expect(isMultiplayerSupported("chess")).toBe(true);
    expect(isMultiplayerSupported("xiangqi")).toBe(true);
    expect(isMultiplayerSupported("sudoku")).toBe(false);
    expect(isMultiplayerSupported("minesweeper")).toBe(false);
    expect(isMultiplayerSupported("solitaire")).toBe(false);
    expect(isMultiplayerSupported("doanso")).toBe(false);
  });

  it("mỗi game hỗ trợ online đều có minPlayers <= maxPlayers hợp lệ", () => {
    for (const slug of Object.keys(MULTIPLAYER_CONFIG)) {
      const config = getMultiplayerConfig(slug);
      expect(config.minPlayers).toBeGreaterThanOrEqual(2);
      expect(config.maxPlayers).toBeGreaterThanOrEqual(config.minPlayers);
    }
  });

  it("ném lỗi rõ ràng khi hỏi config của game không hỗ trợ online", () => {
    expect(() => getMultiplayerConfig("sudoku")).toThrow();
  });
});
