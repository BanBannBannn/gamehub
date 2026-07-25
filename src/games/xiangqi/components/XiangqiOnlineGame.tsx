"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useXiangqiStore } from "@/games/xiangqi/store";
import { Position } from "@/games/xiangqi/engine/types";
import { XiangqiBoard } from "./Board";
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
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { GameActionBar } from "@/components/multiplayer/GameActionBar";
import { DrawOfferBanner } from "@/components/multiplayer/DrawOfferBanner";
import { ConfirmActionModal } from "@/components/multiplayer/ConfirmActionModal";
import { ArrowLeft } from "lucide-react";

interface XiangqiGameState {
  moves: { from: Position; to: Position }[];
  redTime: number;
  blackTime: number;
  drawOfferFromSlot?: number | null;
  resignedBySlot?: number | null;
}

function isXiangqiGameState(value: unknown): value is XiangqiGameState {
  return typeof value === "object" && value !== null && Array.isArray((value as XiangqiGameState).moves);
}

function syncRoomCodeToUrl(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("room", code);
  else url.searchParams.delete("room");
  window.history.replaceState({}, "", url.toString());
}

const DEFAULT_TIME_SECONDS = 600;

export function XiangqiOnlineGame({ initialRoomCode, onExit }: { initialRoomCode?: string; onExit: () => void }) {
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
  } = useOnlineRoom("xiangqi");

  const history = useXiangqiStore((s) => s.history);
  const redTime = useXiangqiStore((s) => s.redTime);
  const blackTime = useXiangqiStore((s) => s.blackTime);
  const status = useXiangqiStore((s) => s.status);
  const winner = useXiangqiStore((s) => s.winner);
  const isRunning = useXiangqiStore((s) => s.isRunning);
  const startOnlineGame = useXiangqiStore((s) => s.startOnlineGame);
  const syncRemoteState = useXiangqiStore((s) => s.syncRemoteState);
  const applyOnlineResult = useXiangqiStore((s) => s.applyOnlineResult);
  const tick = useXiangqiStore((s) => s.tick);

  const movesRef = useRef<{ from: Position; to: Position }[]>([]);
  const lastHandledMoveIndexRef = useRef(0);

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedMoveCountRef = useRef(0);
  const roundFinishReportedRef = useRef<number | null>(null);
  const statsRecordedRef = useRef<number | null>(null);
  const appliedResultRef = useRef<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<"resign" | "leave" | null>(null);

  const myColor: "r" | "b" = mySlot === 0 ? "r" : "b";
  const gameOver = status === "won" || status === "draw";
  const currentGameState = isXiangqiGameState(room?.gameState) ? room?.gameState : undefined;
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

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (initializedRoundRef.current === room.roundNumber) return;
    initializedRoundRef.current = room.roundNumber;
    lastPushedMoveCountRef.current = 0;
    movesRef.current = [];
    lastHandledMoveIndexRef.current = 0;
    appliedResultRef.current = null;

    startOnlineGame(myColor, DEFAULT_TIME_SECONDS);
    if (isXiangqiGameState(room.gameState) && room.gameState.moves.length > 0) {
      const ok = syncRemoteState(room.gameState);
      if (ok) {
        movesRef.current = room.gameState.moves;
        lastPushedMoveCountRef.current = room.gameState.moves.length;
        lastHandledMoveIndexRef.current = room.gameState.moves.length;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

  // Nhận đầu hàng/cầu hoà đồng ý từ đối thủ.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isXiangqiGameState(room.gameState)) return;
    if (appliedResultRef.current === room.roundNumber) return;

    const state = room.gameState;
    if (state.resignedBySlot != null) {
      appliedResultRef.current = room.roundNumber;
      applyOnlineResult({ resignedColor: state.resignedBySlot === 0 ? "r" : "b" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState, room?.roundNumber, applyOnlineResult]);

  // Nhận nước đi mới từ đối thủ.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isXiangqiGameState(room.gameState)) return;
    const remoteMoves = room.gameState.moves;
    if (remoteMoves.length === history.length) return;
    if (remoteMoves.length < history.length) return;

    const ok = syncRemoteState(room.gameState);
    if (ok) {
      movesRef.current = remoteMoves;
      lastPushedMoveCountRef.current = remoteMoves.length;
      lastHandledMoveIndexRef.current = remoteMoves.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState]);

  const pushIfMyMove = useCallback(() => {
    if (!room || room.status !== "playing") return;
    if (movesRef.current.length === lastPushedMoveCountRef.current) return;

    const lastMoverColor: "r" | "b" = movesRef.current.length % 2 === 1 ? "r" : "b";
    if (lastMoverColor !== myColor) return;

    lastPushedMoveCountRef.current = movesRef.current.length;
    void updateRoomGameState(room.id, {
      moves: movesRef.current,
      redTime,
      blackTime,
      drawOfferFromSlot: null,
    } satisfies XiangqiGameState);
  }, [room, myColor, redTime, blackTime]);

  // Theo dõi thay đổi board của store để suy ra nước đi cục bộ vừa xảy
  // ra (so sánh 2 snapshot board liên tiếp: ô "from" mất quân, ô "to" đổi
  // quân) — cách này không cần sửa lại `makeMove` gốc của engine.
  const boardRef = useRef(useXiangqiStore.getState().board);
  useEffect(
    () =>
      useXiangqiStore.subscribe((state) => {
        if (state.mode !== "online") return;
        const prevBoard = boardRef.current;
        const nextBoard = state.board;
        boardRef.current = nextBoard;
        if (state.history.length <= lastHandledMoveIndexRef.current) return;

        let from: Position | null = null;
        let to: Position | null = null;
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 9; x++) {
            const before = prevBoard[y]?.[x];
            const after = nextBoard[y]?.[x];
            if (before && !after) from = { x, y };
            if (after && before !== after) to = { x, y };
          }
        }
        lastHandledMoveIndexRef.current = state.history.length;
        if (from && to) {
          movesRef.current = [...movesRef.current, { from, to }];
          pushIfMyMove();
        }
      }),
    [pushIfMyMove]
  );

  // Ghi nhận kết quả ván — bên THẮNG luôn là người báo cáo, có guard
  // chống stale closure (cùng nguyên tắc với Caro/Chess).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

    if (isXiangqiGameState(room.gameState)) {
      const remote = room.gameState;
      const remoteHasResult = remote.resignedBySlot != null;
      if (remote.moves.length === 0 && !remoteHasResult && movesRef.current.length === 0 && status !== "draw") {
        return;
      }
    }

    // Ghi điểm xếp hạng của chính mình (self-report, cả 2 client tự ghi).
    if (statsRecordedRef.current !== room.roundNumber) {
      statsRecordedRef.current = room.roundNumber;
      const myResult: MatchResult = status === "draw" ? "draw" : winner === myColor ? "win" : "loss";
      void recordMyMatchResult({
        gameSlug: "xiangqi",
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
      winnerSlot = winner === "r" ? 0 : 1;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    }
    void finishRoomRound(room.id, scoreboard);
    void recordRoundHistory({
      roomId: room.id,
      roomCode: room.code,
      gameSlug: "xiangqi",
      roundNumber: room.roundNumber,
      finalGameState: { moves: movesRef.current, redTime, blackTime } satisfies XiangqiGameState,
      winnerSlot,
      players: players.map((p) => ({ slot: p.slot, displayName: p.displayName })),
    });
  }, [status, winner, gameOver, room, myColor, mySlot, players, redTime, blackTime, identity, opponents]);

  useEffect(() => {
    if (!room || room.status !== "round_finished") return;
    if (!isHost) return;
    if (players.length < 2) return;
    if (!players.every((p) => p.isReady)) return;

    const nextRound = room.roundNumber + 1;
    void (async () => {
      await startRematch(
        room.id,
        { moves: [], redTime: DEFAULT_TIME_SECONDS, blackTime: DEFAULT_TIME_SECONDS } satisfies XiangqiGameState,
        nextRound
      );
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  // LUÔN reset `isReady` sau khi bắt đầu ván đầu tiên — tránh auto-rematch-loop.
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost) return;
    if (players.length < room.maxPlayers) return;
    if (!players.every((p) => p.isReady)) return;

    void (async () => {
      await startRoomRound(room.id, {
        moves: [],
        redTime: DEFAULT_TIME_SECONDS,
        blackTime: DEFAULT_TIME_SECONDS,
      } satisfies XiangqiGameState);
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
      moves: movesRef.current,
      redTime,
      blackTime,
      resignedBySlot: mySlot,
      drawOfferFromSlot: null,
    } satisfies XiangqiGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, redTime, blackTime]);

  const handleOfferDraw = useCallback(async () => {
    if (!room || mySlot === null) return;
    await updateRoomGameState(room.id, {
      moves: movesRef.current,
      redTime,
      blackTime,
      drawOfferFromSlot: mySlot,
    } satisfies XiangqiGameState);
  }, [room, mySlot, redTime, blackTime]);

  const handleAcceptDraw = useCallback(async () => {
    if (!room) return;
    applyOnlineResult({ isDrawAgreed: true });
    await finishRoomRound(room.id, room.scoreboard);
    await updateRoomGameState(room.id, {
      moves: movesRef.current,
      redTime,
      blackTime,
      drawOfferFromSlot: null,
    } satisfies XiangqiGameState);
  }, [room, redTime, blackTime, applyOnlineResult]);

  const handleDeclineDraw = useCallback(async () => {
    if (!room) return;
    await updateRoomGameState(room.id, {
      moves: movesRef.current,
      redTime,
      blackTime,
      drawOfferFromSlot: null,
    } satisfies XiangqiGameState);
  }, [room, redTime, blackTime]);

  const handleLeave = useCallback(async () => {
    setConfirmAction(null);
    if (room && mySlot !== null && room.status === "playing" && !gameOver) {
      const scoreboard = { ...room.scoreboard };
      const winnerSlot = mySlot === 0 ? 1 : 0;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
      await updateRoomGameState(room.id, {
        moves: movesRef.current,
        redTime,
        blackTime,
        resignedBySlot: mySlot,
      } satisfies XiangqiGameState);
      await finishRoomRound(room.id, scoreboard);
    }
    await leave();
    window.location.href = "/";
  }, [room, mySlot, gameOver, redTime, blackTime, leave]);

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
        <RoomLobby gameSlug="xiangqi" gameTitle="Cờ tướng" isLoading={isLoading} error={error} notice={notice} onCreate={create} onJoin={join} onQuickMatch={quickMatch} onBack={onExit} />
      </div>
    );
  }

  if (room.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <WaitingRoom
          roomCode={room.code}
          gameSlug="xiangqi"
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
    const winnerSlot = status === "won" && winner ? (winner === "r" ? 0 : 1) : null;
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
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 w-full mx-auto bg-[var(--xq-page-bg)] min-h-screen">
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] items-center justify-between text-sm text-muted">
        <span>
          Bạn: <span className="text-foreground">{myPlayer?.displayName}</span> ({myColor === "r" ? "Đỏ" : "Đen"})
        </span>
        <span>
          Đối thủ: <span className="text-foreground">{opponent?.displayName ?? "..."}</span>
        </span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} />}
      {opponentOfferedDraw && (
        <DrawOfferBanner opponentName={opponent?.displayName ?? "Đối thủ"} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />
      )}

      <div className="flex w-full max-w-[500px] lg:max-w-[820px] flex-col gap-4">
        <Hud />
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full">
          <div className="w-full max-w-[500px]">
            <XiangqiBoard />
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
