"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChessStore } from "@/games/chess/store";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { MoveHistory } from "./MoveHistory";
import { useOnlineRoom } from "@/lib/multiplayer/useOnlineRoom";
import {
  finishRoomRound,
  recordRoundHistory,
  resetReadyFlags,
  startRematch,
  startRoomRound,
  updateRoomGameState,
} from "@/lib/multiplayer/rooms";
import { recordMyMatchResult } from "@/lib/multiplayer/stats";
import type { MatchResult } from "@/lib/multiplayer/rating";
import { useOpponentTimeout } from "@/lib/multiplayer/useOpponentTimeout";

const DISCONNECT_TIMEOUT_SECONDS = 30;
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { GameActionBar } from "@/components/multiplayer/GameActionBar";
import { DrawOfferBanner } from "@/components/multiplayer/DrawOfferBanner";
import { ConfirmActionModal } from "@/components/multiplayer/ConfirmActionModal";
import { ArrowLeft } from "lucide-react";

interface ChessGameState {
  pgn: string;
  whiteTime: number;
  blackTime: number;
  drawOfferFromSlot?: number | null;
  resignedBySlot?: number | null;
}

function isChessGameState(value: unknown): value is ChessGameState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChessGameState).pgn === "string" &&
    typeof (value as ChessGameState).whiteTime === "number"
  );
}

function syncRoomCodeToUrl(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("room", code);
  else url.searchParams.delete("room");
  window.history.replaceState({}, "", url.toString());
}

const DEFAULT_TIME_SECONDS = 600;

export function ChessOnlineGame({ initialRoomCode, onExit }: { initialRoomCode?: string; onExit: () => void }) {
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
    notice,
    isLoading,
    create,
    join,
    quickMatch,
    leave,
    kick,
    toggleReady,
  } = useOnlineRoom("chess");

  const pgn = useChessStore((s) => s.pgn);
  const whiteTime = useChessStore((s) => s.whiteTime);
  const blackTime = useChessStore((s) => s.blackTime);
  const status = useChessStore((s) => s.status);
  const winner = useChessStore((s) => s.winner);
  const isRunning = useChessStore((s) => s.isRunning);
  const startOnlineGame = useChessStore((s) => s.startOnlineGame);
  const syncRemoteState = useChessStore((s) => s.syncRemoteState);
  const applyOnlineResult = useChessStore((s) => s.applyOnlineResult);
  const tick = useChessStore((s) => s.tick);

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedPgnRef = useRef<string>("");
  const roundFinishReportedRef = useRef<number | null>(null);
  const statsRecordedRef = useRef<number | null>(null);
  const appliedResultRef = useRef<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<"resign" | "leave" | null>(null);

  const myColor: "w" | "b" = mySlot === 0 ? "w" : "b";
  const gameOver = status === "won" || status === "draw";
  const currentGameState = isChessGameState(room?.gameState) ? room?.gameState : undefined;
  const drawOfferFromSlot = currentGameState?.drawOfferFromSlot ?? null;
  const iOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot === mySlot;
  const opponentOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot !== mySlot;

  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (!initialRoomCode) return;
    autoJoinAttempted.current = true;
    void join(initialRoomCode);
  }, [initialRoomCode, join]);

  useEffect(() => {
    if (room?.code) syncRoomCodeToUrl(room.code);
  }, [room?.code]);

  // Đếm ngược thời gian mỗi giây (để phát hiện hết giờ ở cả 2 client).
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  // Khởi tạo/đồng bộ store local khi vào 1 round mới.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (initializedRoundRef.current === room.roundNumber) return;
    initializedRoundRef.current = room.roundNumber;
    lastPushedPgnRef.current = "";
    appliedResultRef.current = null;

    startOnlineGame(myColor, DEFAULT_TIME_SECONDS);
    if (isChessGameState(room.gameState) && room.gameState.pgn.trim().length > 0) {
      syncRemoteState(room.gameState);
      lastPushedPgnRef.current = room.gameState.pgn;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

  // Nhận đầu hàng/cầu hoà đồng ý từ đối thủ.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isChessGameState(room.gameState)) return;
    if (appliedResultRef.current === room.roundNumber) return;

    const state = room.gameState;
    if (state.resignedBySlot != null) {
      appliedResultRef.current = room.roundNumber;
      applyOnlineResult({ resignedColor: state.resignedBySlot === 0 ? "w" : "b" });
    }
    // Cố tình dùng room?.gameState/room?.roundNumber thay vì cả object
    // `room` — tránh chạy lại effect khi `room` được tạo object mới
    // nhưng nội dung liên quan không đổi (cùng lý do đã áp dụng ở
    // useRoomRealtime.ts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState, room?.roundNumber, applyOnlineResult]);

  // Nhận nước đi mới từ đối thủ.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isChessGameState(room.gameState)) return;
    if (room.gameState.pgn === pgn) return;

    const ok = syncRemoteState(room.gameState);
    if (ok) lastPushedPgnRef.current = room.gameState.pgn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState]);

  // Đẩy nước đi của CHÍNH MÌNH lên phòng.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (pgn === lastPushedPgnRef.current) return;
    if (pgn.trim().length === 0) return;

    const game = useChessStore.getState().game;
    const justMovedColor: "w" | "b" = game.turn() === "w" ? "b" : "w";
    if (justMovedColor !== myColor) return; // đây là state vừa nhận từ đồng bộ, không phải nước đi của mình

    lastPushedPgnRef.current = pgn;
    void updateRoomGameState(room.id, { pgn, whiteTime, blackTime, drawOfferFromSlot: null } satisfies ChessGameState);
  }, [pgn, whiteTime, blackTime, room, myColor]);

  // Ghi nhận kết quả ván — bên THẮNG luôn là người báo cáo (xử lý đúng
  // cả trường hợp thắng do hết giờ/đầu hàng, không chỉ chiếu bí). Có
  // guard chống stale closure: nếu remote cho thấy round vừa mới bắt đầu
  // lại (pgn rỗng, không cờ kết quả) thì bỏ qua status cục bộ đang cũ.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

    if (isChessGameState(room.gameState)) {
      const remote = room.gameState;
      const remoteHasResult = remote.resignedBySlot != null;
      if (remote.pgn.trim().length === 0 && !remoteHasResult && pgn.trim().length === 0 && status !== "draw") {
        return;
      }
    }

    // Ghi điểm xếp hạng của chính mình (self-report, cả 2 client tự ghi).
    if (statsRecordedRef.current !== room.roundNumber) {
      statsRecordedRef.current = room.roundNumber;
      const myResult: MatchResult = status === "draw" ? "draw" : winner === myColor ? "win" : "loss";
      void recordMyMatchResult({
        gameSlug: "chess",
        myUserId: identity && !identity.isGuest ? identity.id : null,
        myDisplayName: identity?.displayName ?? "",
        opponentUserId: opponents[0]?.userId ?? null,
        result: myResult,
      });
    }

    const shouldIReport = status === "won" ? winner === myColor : mySlot === 0;
    if (!shouldIReport) return;

    roundFinishReportedRef.current = room.roundNumber;
    const scoreboard = { ...room.scoreboard };
    let winnerSlot: number | null = null;
    if (status === "won" && winner) {
      winnerSlot = winner === "w" ? 0 : 1;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    }
    void finishRoomRound(room.id, scoreboard);
    void recordRoundHistory({
      roomId: room.id,
      roomCode: room.code,
      gameSlug: "chess",
      roundNumber: room.roundNumber,
      finalGameState: { pgn, whiteTime, blackTime } satisfies ChessGameState,
      winnerSlot,
      players: players.map((p) => ({ slot: p.slot, displayName: p.displayName })),
    });
  }, [status, winner, gameOver, room, myColor, mySlot, players, pgn, whiteTime, blackTime, identity, opponents]);

  // Rematch khi tất cả đã sẵn sàng — host tạo ván mới.
  useEffect(() => {
    if (!room || room.status !== "round_finished") return;
    if (!isHost) return;
    if (players.length < 2) return;
    if (!players.every((p) => p.isReady)) return;

    const nextRound = room.roundNumber + 1;
    void (async () => {
      await startRematch(
        room.id,
        { pgn: "", whiteTime: DEFAULT_TIME_SECONDS, blackTime: DEFAULT_TIME_SECONDS } satisfies ChessGameState,
        nextRound
      );
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  // Host bắt đầu ván đầu tiên khi đủ người + tất cả sẵn sàng — LUÔN reset
  // `isReady` ngay sau đó để tránh auto-rematch-loop (xem chú thích chi
  // tiết trong CaroOnlineGame.tsx, cùng 1 lớp lỗi).
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost) return;
    if (players.length < room.maxPlayers) return;
    if (!players.every((p) => p.isReady)) return;

    void (async () => {
      await startRoomRound(room.id, {
        pgn: "",
        whiteTime: DEFAULT_TIME_SECONDS,
        blackTime: DEFAULT_TIME_SECONDS,
      } satisfies ChessGameState);
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  const handleResign = useCallback(async () => {
    if (!room || mySlot === null) return;
    setConfirmAction(null);
    const scoreboard = { ...room.scoreboard };
    const winnerSlot = mySlot === 0 ? 1 : 0;
    scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, resignedBySlot: mySlot, drawOfferFromSlot: null } satisfies ChessGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, pgn, whiteTime, blackTime]);

  const handleOfferDraw = useCallback(async () => {
    if (!room || mySlot === null) return;
    await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, drawOfferFromSlot: mySlot } satisfies ChessGameState);
  }, [room, mySlot, pgn, whiteTime, blackTime]);

  const handleAcceptDraw = useCallback(async () => {
    if (!room) return;
    applyOnlineResult({ isDrawAgreed: true });
    await finishRoomRound(room.id, room.scoreboard);
    await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, drawOfferFromSlot: null } satisfies ChessGameState);
  }, [room, pgn, whiteTime, blackTime, applyOnlineResult]);

  const handleDeclineDraw = useCallback(async () => {
    if (!room) return;
    await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, drawOfferFromSlot: null } satisfies ChessGameState);
  }, [room, pgn, whiteTime, blackTime]);

  const handleLeave = useCallback(async () => {
    setConfirmAction(null);
    if (room && mySlot !== null && room.status === "playing" && !gameOver) {
      const scoreboard = { ...room.scoreboard };
      const winnerSlot = mySlot === 0 ? 1 : 0;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
      await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, resignedBySlot: mySlot } satisfies ChessGameState);
      await finishRoomRound(room.id, scoreboard);
    }
    await leave();
    window.location.href = "/";
  }, [room, mySlot, gameOver, pgn, whiteTime, blackTime, leave]);

  const claimWinByTimeout = useCallback(async () => {
    if (!room || mySlot === null || gameOver || room.status !== "playing") return;
    const opponentSlot = mySlot === 0 ? 1 : 0;
    const scoreboard = { ...room.scoreboard };
    scoreboard[String(mySlot)] = (scoreboard[String(mySlot)] ?? 0) + 1;
    await updateRoomGameState(room.id, { pgn, whiteTime, blackTime, resignedBySlot: opponentSlot } satisfies ChessGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, gameOver, pgn, whiteTime, blackTime]);

  const opponentForTimeout = opponents[0];
  const { secondsLeft: disconnectSecondsLeft } = useOpponentTimeout({
    active: room?.status === "playing" && !gameOver && !!opponentForTimeout,
    opponentOnline: opponentForTimeout ? isPlayerOnline(opponentForTimeout) : true,
    seconds: DISCONNECT_TIMEOUT_SECONDS,
    onTimeout: claimWinByTimeout,
  });

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
        <RoomLobby gameSlug="chess" gameTitle="Cờ vua" isLoading={isLoading} error={error} notice={notice} onCreate={create} onJoin={join} onQuickMatch={quickMatch} onBack={onExit} />
      </div>
    );
  }

  if (room.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <WaitingRoom
          roomCode={room.code}
          gameSlug="chess"
          players={players}
          maxPlayers={room.maxPlayers}
          myPlayerRowId={myPlayer?.id ?? null}
          isHost={isHost}
          isPlayerOnline={isPlayerOnline}
          onToggleReady={toggleReady}
          onLeave={handleLeave}
          onKick={kick}
        />
      </div>
    );
  }

  const opponent = opponents[0];
  const opponentOffline = opponent ? !isPlayerOnline(opponent) : false;

  if (room.status === "round_finished") {
    const winnerSlot = status === "won" && winner ? (winner === "w" ? 0 : 1) : null;
    const resultLabel =
      status === "draw"
        ? "Hoà!"
        : winnerSlot === mySlot
          ? "Bạn thắng!"
          : `${players.find((p) => p.slot === winnerSlot)?.displayName ?? "Đối thủ"} thắng!`;

    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RoundResultPanel
          resultLabel={resultLabel}
          emoji={status === "draw" ? "🤝" : winnerSlot === mySlot ? "🎉" : "😵"}
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

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 w-full mx-auto">
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] items-center justify-between text-sm text-muted">
        <span>
          Bạn: <span className="text-foreground">{myPlayer?.displayName}</span> ({myColor === "w" ? "Trắng" : "Đen"})
        </span>
        <span>
          Đối thủ: <span className="text-foreground">{opponent?.displayName ?? "..."}</span>
        </span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} secondsLeft={disconnectSecondsLeft} />}
      {opponentOfferedDraw && (
        <DrawOfferBanner opponentName={opponent?.displayName ?? "Đối thủ"} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />
      )}

      <div className="flex w-full max-w-[500px] lg:max-w-[820px] flex-col gap-4">
        <Hud />
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full">
          <div className="w-full max-w-[500px]">
            <Board />
          </div>
          <div className="w-full lg:w-[296px]">
            <MoveHistory />
          </div>
        </div>
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
