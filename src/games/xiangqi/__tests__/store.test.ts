import { describe, expect, it, beforeEach } from "vitest";
import { useXiangqiStore } from "../store";
import { Position } from "../engine/types";

describe("xiangqi store — chế độ online (syncRemoteState)", () => {
  beforeEach(() => {
    useXiangqiStore.getState().startOnlineGame("r", 600);
  });

  it("áp dụng đúng 1 chuỗi nước đi hợp lệ", () => {
    const moves: { from: Position; to: Position }[] = [
      { from: { x: 0, y: 6 }, to: { x: 0, y: 5 } }, // Tốt đỏ tiến lên
      { from: { x: 0, y: 3 }, to: { x: 0, y: 4 } }, // Tốt đen tiến xuống
    ];
    const ok = useXiangqiStore.getState().syncRemoteState({ moves, redTime: 590, blackTime: 595 });
    expect(ok).toBe(true);

    const state = useXiangqiStore.getState();
    expect(state.board[5][0]?.type).toBe("p");
    expect(state.board[6][0]).toBeNull();
    expect(state.board[4][0]?.type).toBe("p");
    expect(state.turn).toBe("r"); // sau 2 nước (đỏ, đen), lại tới lượt đỏ
    expect(state.redTime).toBe(590);
    expect(state.blackTime).toBe(595);
  });

  it("từ chối nước đi không hợp lệ (ô from không có quân đúng lượt), giữ nguyên state cũ", () => {
    const before = { ...useXiangqiStore.getState() };
    // Nước đầu tiên cố tình đi quân ĐEN trong khi lượt đầu là ĐỎ.
    const ok = useXiangqiStore.getState().syncRemoteState({
      moves: [{ from: { x: 0, y: 3 }, to: { x: 0, y: 4 } }],
      redTime: 1,
      blackTime: 1,
    });
    expect(ok).toBe(false);
    const after = useXiangqiStore.getState();
    expect(after.board).toEqual(before.board);
    expect(after.redTime).toBe(before.redTime);
  });

  it("từ chối nước đi trái luật (Tốt đi lùi ngay từ đầu)", () => {
    // Tốt đỏ ở (0,6) đi lùi xuống (0,7) — trái luật (chỉ được tiến lên
    // hoặc, sau khi qua sông, đi ngang).
    const ok = useXiangqiStore.getState().syncRemoteState({
      moves: [{ from: { x: 0, y: 6 }, to: { x: 0, y: 7 } }],
      redTime: 1,
      blackTime: 1,
    });
    expect(ok).toBe(false);
  });

  it("startOnlineGame với color 'r' và 'b' set đúng onlineColor", () => {
    useXiangqiStore.getState().startOnlineGame("r", 600);
    expect(useXiangqiStore.getState().onlineColor).toBe("r");
    useXiangqiStore.getState().startOnlineGame("b", 600);
    expect(useXiangqiStore.getState().onlineColor).toBe("b");
  });

  it("undoMove không có tác dụng khi mode === online", () => {
    useXiangqiStore.getState().syncRemoteState({
      moves: [{ from: { x: 0, y: 6 }, to: { x: 0, y: 5 } }],
      redTime: 590,
      blackTime: 600,
    });
    const beforeBoard = useXiangqiStore.getState().board;
    useXiangqiStore.getState().undoMove();
    expect(useXiangqiStore.getState().board).toEqual(beforeBoard);
  });

  it("applyOnlineResult: đầu hàng xác định đúng người thắng", () => {
    useXiangqiStore.getState().applyOnlineResult({ resignedColor: "r" });
    const state = useXiangqiStore.getState();
    expect(state.status).toBe("won");
    expect(state.winner).toBe("b");
    expect(state.isRunning).toBe(false);
  });

  it("applyOnlineResult: cầu hoà đặt đúng status = draw", () => {
    useXiangqiStore.getState().applyOnlineResult({ isDrawAgreed: true });
    const state = useXiangqiStore.getState();
    expect(state.status).toBe("draw");
    expect(state.winner).toBeNull();
  });
});
