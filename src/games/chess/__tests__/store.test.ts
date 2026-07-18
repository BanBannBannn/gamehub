import { describe, expect, it, beforeEach } from "vitest";
import { useChessStore } from "../store";

describe("chess store — chế độ online (syncRemoteState)", () => {
  beforeEach(() => {
    useChessStore.getState().startOnlineGame("w", 600);
  });

  it("áp dụng đúng 1 PGN hợp lệ", () => {
    const chess = useChessStore.getState().game;
    chess.move("e4");
    chess.move("e5");
    const pgn = chess.pgn();

    const ok = useChessStore.getState().syncRemoteState({ pgn, whiteTime: 590, blackTime: 595 });
    expect(ok).toBe(true);
    const state = useChessStore.getState();
    expect(state.pgn).toBe(pgn);
    expect(state.whiteTime).toBe(590);
    expect(state.blackTime).toBe(595);
    expect(state.game.turn()).toBe("w");
  });

  it("từ chối PGN không hợp lệ (cú pháp hỏng), giữ nguyên state cũ", () => {
    const before = { ...useChessStore.getState() };
    const ok = useChessStore.getState().syncRemoteState({ pgn: "1. z9z9 gibberish !!", whiteTime: 1, blackTime: 1 });
    expect(ok).toBe(false);
    const after = useChessStore.getState();
    expect(after.pgn).toBe(before.pgn);
    expect(after.whiteTime).toBe(before.whiteTime);
  });

  it("phát hiện đúng chiếu bí (checkmate) từ PGN nhận được", () => {
    // Fool's mate: chiếu bí nhanh nhất cho Đen thắng.
    const chess = useChessStore.getState().game;
    chess.move("f3");
    chess.move("e5");
    chess.move("g4");
    chess.move("Qh4");
    const pgn = chess.pgn();

    const ok = useChessStore.getState().syncRemoteState({ pgn, whiteTime: 500, blackTime: 500 });
    expect(ok).toBe(true);
    const state = useChessStore.getState();
    expect(state.status).toBe("won");
    expect(state.winner).toBe("b");
    expect(state.isRunning).toBe(false);
  });

  it("startOnlineGame với color 'w' và 'b' set đúng onlineColor", () => {
    useChessStore.getState().startOnlineGame("w", 600);
    expect(useChessStore.getState().onlineColor).toBe("w");
    useChessStore.getState().startOnlineGame("b", 600);
    expect(useChessStore.getState().onlineColor).toBe("b");
  });

  it("undoMove không có tác dụng khi mode === online", () => {
    const chess = useChessStore.getState().game;
    chess.move("e4");
    useChessStore.getState().syncRemoteState({ pgn: chess.pgn(), whiteTime: 590, blackTime: 600 });
    const beforePgn = useChessStore.getState().pgn;

    useChessStore.getState().undoMove();
    expect(useChessStore.getState().pgn).toBe(beforePgn);
  });
});
