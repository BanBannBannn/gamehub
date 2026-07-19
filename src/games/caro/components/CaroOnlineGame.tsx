"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCaroStore } from "@/games/caro/store";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { useOnlineRoom } from "@/lib/multiplayer/useOnlineRoom";
import {
  finishRoomRound,
  recordRoundHistory,
  resetReadyFlags,
  startRematch,
  startRoomRound,
  updateRoomGameState,
} from "@/lib/multiplayer/rooms";
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { GameActionBar } from "@/components/multiplayer/GameActionBar";
import { DrawOfferBanner } from "@/components/multiplayer/DrawOfferBanner";
import { ConfirmActionModal } from "@/components/multiplayer/ConfirmActionModal";
import { ArrowLeft } from "lucide-react";

interface CaroGameState {
  movesHistory: number[];
  drawOfferFromSlot?: number | null;
  resignedBySlot?: number | null;
}

function isCaroGameState(value: unknown): value is CaroGameState {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as CaroGameState).movesHistory)
  );
}

/** Cập nhật query param `?room=` trên URL mà KHÔNG điều hướng/remount trang — để F5 sau này tự reconnect đúng phòng. */
function syncRoomCodeToUrl(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("room", code);
  else url.searchParams.delete("room");
  window.history.replaceState({}, "", url.toString());
}

export function CaroOnlineGame({ initialRoomCode, onExit }: { initialRoomCode?: string; onExit: () => void }) {
  const {
    identity,
    room,
    players,
    myPlayer,
    opponents,
    mySlot,
    isHost,
    chatMessages,
    sendChat,
    isPlayerOnline,
    error,
    isLoading,
    create,
    join,
    leave,
    toggleReady,
  } = useOnlineRoom("caro");

  const movesHistory = useCaroStore((s) => s.movesHistory);
  const winner = useCaroStore((s) => s.winner);
  const isDraw = useCaroStore((s) => s.isDraw);
  const startOnlineGame = useCaroStore((s) => s.startOnlineGame);
  const syncRemoteBoard = useCaroStore((s) => s.syncRemoteBoard);
  const applyOnlineResult = useCaroStore((s) => s.applyOnlineResult);

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedLengthRef = useRef(0);
  const roundFinishReportedRef = useRef<number | null>(null);
  const appliedResultRef = useRef<number | null>(null); // round_number đã áp dụng đầu hàng/cầu hoà, tránh áp lại
  const [focusedIndex] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<"resign" | "leave" | null>(null);

  const myPlayerNumber: 1 | 2 = mySlot === 0 ? 1 : 2;
  const gameOver = Boolean(winner) || isDraw;
  const currentGameState = isCaroGameState(room?.gameState) ? room?.gameState : undefined;
  const drawOfferFromSlot = currentGameState?.drawOfferFromSlot ?? null;
  const iOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot === mySlot;
  const opponentOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot !== mySlot;

  // Tự động tham gia phòng nếu có mã trong link mời (?room=...).
  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (!initialRoomCode) return;
    autoJoinAttempted.current = true;
    void join(initialRoomCode);
  }, [initialRoomCode, join]);

  // Đồng bộ mã phòng lên URL ngay khi có phòng — để F5 sau này tự reconnect đúng phòng này.
  useEffect(() => {
    if (room?.code) syncRoomCodeToUrl(room.code);
  }, [room?.code]);

  // Khi phòng chuyển sang "playing" cho 1 round mới, khởi tạo/đồng bộ store local.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (initializedRoundRef.current === room.roundNumber) return;
    initializedRoundRef.current = room.roundNumber;
    lastPushedLengthRef.current = 0;
    appliedResultRef.current = null;

    startOnlineGame(mySlot ?? 0);
    if (isCaroGameState(room.gameState) && room.gameState.movesHistory.length > 0) {
      syncRemoteBoard({ movesHistory: room.gameState.movesHistory, humanPlayer: myPlayerNumber });
      lastPushedLengthRef.current = room.gameState.movesHistory.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

  // Nhận đầu hàng/cầu hoà từ đối thủ — kiểm tra TRƯỚC, độc lập với việc đồng bộ nước đi.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isCaroGameState(room.gameState)) return;
    if (appliedResultRef.current === room.roundNumber) return;

    const state = room.gameState;
    if (state.resignedBySlot != null) {
      appliedResultRef.current = room.roundNumber;
      applyOnlineResult({ resignedPlayer: state.resignedBySlot === 0 ? 1 : 2 });
    }
    // Cầu hoà chỉ áp dụng khi CẢ 2 đã đồng ý — được đại diện bằng field
    // `resignedBySlot` không dùng ở đây; xem `handleAcceptDraw` bên dưới
    // (đồng ý hoà sẽ ghi thẳng isDraw qua updateRoomGameState riêng, xử
    // lý ở effect nhận nước đi thông thường vì đó cũng là 1 dạng "kết
    // thúc ván" cần đồng bộ 2 chiều).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState, room?.roundNumber, applyOnlineResult]);

  // Nhận nước đi mới từ đối thủ (Postgres Changes cập nhật room.gameState).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isCaroGameState(room.gameState)) return;
    const remoteLength = room.gameState.movesHistory.length;
    if (remoteLength === movesHistory.length) return; // đã đồng bộ, không có gì mới
    if (remoteLength < movesHistory.length) return; // dữ liệu cũ hơn local (hiếm, bỏ qua)

    const ok = syncRemoteBoard({ movesHistory: room.gameState.movesHistory, humanPlayer: myPlayerNumber });
    if (ok) lastPushedLengthRef.current = remoteLength;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState]);

  // Đẩy nước đi của CHÍNH MÌNH lên phòng (phát hiện qua tính chẵn/lẻ độ dài lịch sử).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (movesHistory.length === 0) return;
    if (movesHistory.length === lastPushedLengthRef.current) return;

    const lastMover: 1 | 2 = movesHistory.length % 2 === 1 ? 1 : 2;
    if (lastMover !== myPlayerNumber) return; // nước đi này đến từ đồng bộ nhận được, không phải của mình

    lastPushedLengthRef.current = movesHistory.length;
    // Đánh 1 nước mới sẽ tự động huỷ lời mời cầu hoà đang treo (nếu có).
    void updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: null } satisfies CaroGameState);
  }, [movesHistory, room, myPlayerNumber]);

  // Ghi nhận kết quả ván — bên THẮNG luôn là người báo cáo (không phải
  // "người vừa đi nước cuối"), để xử lý đúng cả trường hợp thắng do đối
  // thủ đầu hàng (không có nước đi mới nào xảy ra lúc đó). Ván hoà thì
  // để host báo cáo.
  //
  // [Chống stale closure — Lỗi 2 đã gặp]: nếu state cục bộ báo "gameOver"
  // nhưng dữ liệu THẬT trên phòng (remote) cho thấy round vừa mới bắt
  // đầu lại (0 nước đi, không có cờ đầu hàng/cầu hoà) thì đây chắc chắn
  // là dữ liệu cục bộ CŨ chưa kịp reset — bỏ qua, không báo cáo.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

    if (isCaroGameState(room.gameState)) {
      const remote = room.gameState;
      const remoteHasResult = remote.resignedBySlot != null;
      if (remote.movesHistory.length === 0 && !remoteHasResult && movesHistory.length === 0) {
        // Có thể là do cầu hoà đồng ý (không qua movesHistory) — kiểm tra thêm isDraw cục bộ có khớp ý đồ không.
        if (!isDraw) return;
      }
    }

    const winnerSlot: number | null = winner ? (winner.winner === 1 ? 0 : 1) : null;
    const shouldIReport = winner ? winnerSlot === mySlot : mySlot === 0;
    if (!shouldIReport) return;

    roundFinishReportedRef.current = room.roundNumber;
    const scoreboard = { ...room.scoreboard };
    if (winnerSlot !== null) {
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    }
    void finishRoomRound(room.id, scoreboard);
    void recordRoundHistory({
      roomId: room.id,
      roomCode: room.code,
      gameSlug: "caro",
      roundNumber: room.roundNumber,
      finalGameState: { movesHistory } satisfies CaroGameState,
      winnerSlot,
      players: players.map((p) => ({ slot: p.slot, displayName: p.displayName })),
    });
  }, [winner, isDraw, gameOver, room, movesHistory, mySlot, players]);

  // Rematch: khi tất cả đã sẵn sàng ở màn kết quả, host tạo ván mới.
  useEffect(() => {
    if (!room || room.status !== "round_finished") return;
    if (!isHost) return;
    if (players.length < 2) return;
    if (!players.every((p) => p.isReady)) return;

    const nextRound = room.roundNumber + 1;
    void (async () => {
      await startRematch(room.id, { movesHistory: [] } satisfies CaroGameState, nextRound);
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  // Khi phòng chuyển từ "waiting" sang có đủ người + sẵn sàng, host bắt đầu ván đầu tiên.
  // QUAN TRỌNG (Lỗi 1 đã gặp — auto-rematch-loop): phải reset `isReady`
  // về false ngay sau khi bắt đầu, nếu không cờ "đã sẵn sàng" từ màn chờ
  // sẽ còn nguyên tới lúc ván đầu tiên kết thúc, khiến hệ thống tưởng cả
  // 2 đã bấm "Chơi lại" và tự động vào ván 2 ngay lập tức không cần hỏi.
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost) return;
    if (players.length < room.maxPlayers) return;
    if (!players.every((p) => p.isReady)) return;

    void (async () => {
      await startRoomRound(room.id, { movesHistory: [] } satisfies CaroGameState);
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  const handleResign = useCallback(async () => {
    if (!room || mySlot === null) return;
    setConfirmAction(null);
    const scoreboard = { ...room.scoreboard };
    const winnerSlot = mySlot === 0 ? 1 : 0;
    scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    await updateRoomGameState(room.id, {
      movesHistory,
      resignedBySlot: mySlot,
      drawOfferFromSlot: null,
    } satisfies CaroGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, movesHistory]);

  const handleOfferDraw = useCallback(async () => {
    if (!room || mySlot === null) return;
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: mySlot } satisfies CaroGameState);
  }, [room, mySlot, movesHistory]);

  const handleAcceptDraw = useCallback(async () => {
    if (!room) return;
    applyOnlineResult({ isDrawAgreed: true });
    await finishRoomRound(room.id, room.scoreboard);
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: null } satisfies CaroGameState);
  }, [room, movesHistory, applyOnlineResult]);

  const handleDeclineDraw = useCallback(async () => {
    if (!room) return;
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: null } satisfies CaroGameState);
  }, [room, movesHistory]);

  const handleLeave = useCallback(async () => {
    setConfirmAction(null);
    if (room && mySlot !== null && room.status === "playing" && !gameOver) {
      // Rời phòng giữa ván tính là đầu hàng — đối thủ được xử thắng ngay.
      const scoreboard = { ...room.scoreboard };
      const winnerSlot = mySlot === 0 ? 1 : 0;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
      await updateRoomGameState(room.id, { movesHistory, resignedBySlot: mySlot } satisfies CaroGameState);
      await finishRoomRound(room.id, scoreboard);
    }
    await leave();
    // Điều hướng cứng (full reload) thay vì chỉ unmount component — đảm
    // bảo dọn sạch mọi state SPA còn sót, tránh các lỗi "kẹt phòng cũ"
    // đã gặp trước đây khi chỉ gọi onExit().
    window.location.href = "/";
  }, [room, mySlot, gameOver, movesHistory, leave]);

  if (!room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 self-start text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Quay lại chọn chế độ
        </button>
        <RoomLobby gameSlug="caro" gameTitle="Caro" isLoading={isLoading} error={error} onCreate={create} onJoin={join} onBack={onExit} />
      </div>
    );
  }

  if (room.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <WaitingRoom
          roomCode={room.code}
          gameSlug="caro"
          players={players}
          maxPlayers={room.maxPlayers}
          myPlayerRowId={myPlayer?.id ?? null}
          isPlayerOnline={isPlayerOnline}
          onToggleReady={toggleReady}
          onLeave={handleLeave}
        />
      </div>
    );
  }

  const opponent = opponents[0];
  const opponentOffline = opponent ? !isPlayerOnline(opponent) : false;

  if (room.status === "round_finished") {
    const winnerSlot = winner ? (winner.winner === 1 ? 0 : 1) : null;
    const resultLabel = !winner
      ? "Hoà!"
      : winnerSlot === mySlot
        ? "Bạn thắng!"
        : `${players.find((p) => p.slot === winnerSlot)?.displayName ?? "Đối thủ"} thắng!`;

    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RoundResultPanel
          resultLabel={resultLabel}
          emoji={!winner ? "🤝" : winnerSlot === mySlot ? "🎉" : "😵"}
          scoreboard={room.scoreboard}
          players={players}
          myPlayerRowId={myPlayer?.id ?? null}
          onToggleReady={toggleReady}
          onLeave={handleLeave}
        />
        {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
      </div>
    );
  }

  // room.status === "playing"
  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[min(92vw,600px)] items-center justify-between text-sm text-muted">
        <span>
          Bạn: <span className="text-foreground">{myPlayer?.displayName}</span> ({myPlayerNumber === 1 ? "X" : "O"})
        </span>
        <span>
          Đối thủ: <span className="text-foreground">{opponent?.displayName ?? "..."}</span>
        </span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} />}
      {opponentOfferedDraw && (
        <DrawOfferBanner opponentName={opponent?.displayName ?? "Đối thủ"} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />
      )}

      <Hud />
      <Board focusedIndex={focusedIndex} />

      <div className="w-full max-w-[min(92vw,600px)]">
        <GameActionBar
          onResign={() => setConfirmAction("resign")}
          onOfferDraw={handleOfferDraw}
          onLeave={() => setConfirmAction("leave")}
          drawOfferPending={iOfferedDraw}
        />
      </div>

      {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}

      <ConfirmActionModal
        open={confirmAction === "resign"}
        title="Xác nhận đầu hàng"
        message="Bạn có chắc chắn muốn nhận thua ván này?"
        confirmLabel="Đầu hàng"
        danger
        onConfirm={handleResign}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        open={confirmAction === "leave"}
        title="Rời phòng"
        message={gameOver ? "Bạn có chắc muốn rời phòng?" : "Rời phòng lúc này sẽ tính là bạn đầu hàng. Bạn có chắc chắn?"}
        confirmLabel="Rời phòng"
        danger
        onConfirm={handleLeave}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
