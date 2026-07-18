import { describe, expect, it, beforeEach } from "vitest";
import { useCaroStore } from "../store";

describe("caro store — chế độ online (syncRemoteBoard)", () => {
  beforeEach(() => {
    useCaroStore.getState().startOnlineGame(0);
  });

  it("áp dụng đúng 1 chuỗi nước đi hợp lệ, tính đúng người đi tiếp theo", () => {
    const ok = useCaroStore.getState().syncRemoteBoard({ movesHistory: [112, 113, 127], humanPlayer: 1 });
    expect(ok).toBe(true);
    const state = useCaroStore.getState();
    expect(state.board[112]).toBe(1); // X
    expect(state.board[113]).toBe(2); // O
    expect(state.board[127]).toBe(1); // X
    expect(state.currentPlayer).toBe(2); // tới lượt O
    expect(state.movesHistory).toEqual([112, 113, 127]);
  });

  it("từ chối chuỗi nước đi không hợp lệ (đánh trùng vào ô đã có quân), giữ nguyên state cũ", () => {
    useCaroStore.getState().syncRemoteBoard({ movesHistory: [10, 11], humanPlayer: 1 });
    const beforeState = { ...useCaroStore.getState() };

    // Chuỗi mới có 1 nước đi trùng ô (10 đã có quân từ move đầu, nhưng
    // được đưa lại vào chuỗi mới ở vị trí khác) — đây là input hỏng.
    const ok = useCaroStore.getState().syncRemoteBoard({ movesHistory: [10, 11, 10], humanPlayer: 1 });
    expect(ok).toBe(false);

    const afterState = useCaroStore.getState();
    expect(afterState.movesHistory).toEqual(beforeState.movesHistory);
    expect(afterState.board).toEqual(beforeState.board);
  });

  it("từ chối chuỗi nước đi có index ngoài phạm vi bàn cờ", () => {
    const ok = useCaroStore.getState().syncRemoteBoard({ movesHistory: [-1], humanPlayer: 1 });
    expect(ok).toBe(false);
  });

  it("phát hiện đúng thắng cuộc khi chuỗi nước đi tạo thành 5 quân liên tiếp", () => {
    // Hàng 0: X tại cột 0,1,2,3,4; O tại cột 10,11,12,13.
    const movesHistory = [0, 10, 1, 11, 2, 12, 3, 13, 4];
    const ok = useCaroStore.getState().syncRemoteBoard({ movesHistory, humanPlayer: 1 });
    expect(ok).toBe(true);
    const state = useCaroStore.getState();
    expect(state.winner?.winner).toBe(1);
    expect(state.isRunning).toBe(false);
  });

  it("startOnlineGame với slot 0 → humanPlayer = 1 (quân X); slot 1 → humanPlayer = 2 (quân O)", () => {
    useCaroStore.getState().startOnlineGame(0);
    expect(useCaroStore.getState().humanPlayer).toBe(1);
    useCaroStore.getState().startOnlineGame(1);
    expect(useCaroStore.getState().humanPlayer).toBe(2);
  });

  it("startOnlineGame reset về bàn cờ trống, mode = online", () => {
    useCaroStore.getState().syncRemoteBoard({ movesHistory: [5, 6], humanPlayer: 1 });
    useCaroStore.getState().startOnlineGame(0);
    const state = useCaroStore.getState();
    expect(state.mode).toBe("online");
    expect(state.movesHistory).toEqual([]);
    expect(state.board.every((v) => v === 0)).toBe(true);
  });
});
