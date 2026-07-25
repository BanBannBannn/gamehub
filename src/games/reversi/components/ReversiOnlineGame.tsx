"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReversiStore } from "@/games/reversi/store";
import { legalMoves, SIZE } from "@/games/reversi/engine/logic";
import { playSound } from "@/lib/sound";
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
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { GameActionBar } from "@/components/multiplayer/GameActionBar";
import { DrawOfferBanner } from "@/components/multiplayer/DrawOfferBanner";
import { ConfirmActionModal } from "@/components/multiplayer/ConfirmActionModal";
import { ArrowLeft } from "lucide-react";

const DISCONNECT_TIMEOUT_SECONDS = 30;

interface ReversiGameState {
  movesHistory: number[];
  drawOfferFromSlot?: number | null;
  resignedBySlot?: number | null;
}

function isReversiGameState(value: unknown): value is ReversiGameState {
  return typeof value === "object" && value !== null && Array.isArray((value as ReversiGameState).movesHistory);
}

function syncRoomCodeToUrl(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set("room", code);
  else url.searchParams.delete("room");
  window.history.replaceState({}, "", url.toString());
}

export function ReversiOnlineGame({ initialRoomCode, onExit }: { initialRoomCode?: string; onExit: () => void }) {
  const {
    identity, room, players, myPlayer, opponents, mySlot, isHost,
    chatMessages, sendChat, isPlayerOnline, error, notice, isLoading,
    create, join, quickMatch, leave, kick, toggleReady,
  } = useOnlineRoom("reversi");

  const board = useReversiStore((s) => s.board);
  const current = useReversiStore((s) => s.current);
  const status = useReversiStore((s) => s.status);
  const winner = useReversiStore((s) => s.winner);
  const counts = useReversiStore((s) => s.counts);
  const movesHistory = useReversiStore((s) => s.movesHistory);
  const startOnlineGame = useReversiStore((s) => s.startOnlineGame);
  const syncRemoteBoard = useReversiStore((s) => s.syncRemoteBoard);
  const applyOnlineResult = useReversiStore((s) => s.applyOnlineResult);
  const playAt = useReversiStore((s) => s.playAt);

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedLengthRef = useRef(0);
  const roundFinishReportedRef = useRef<number | null>(null);
  const statsRecordedRef = useRef<number | null>(null);
  const appliedResultRef = useRef<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<"resign" | "leave" | null>(null);

  const myDisc: 1 | 2 = mySlot === 0 ? 1 : 2;
  const gameOver = status === "over";
  const currentGameState = isReversiGameState(room?.gameState) ? room?.gameState : undefined;
  const drawOfferFromSlot = currentGameState?.drawOfferFromSlot ?? null;
  const iOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot === mySlot;
  const opponentOfferedDraw = drawOfferFromSlot !== null && drawOfferFromSlot !== mySlot;

  useEffect(() => {
    if (autoJoinAttempted.current || !initialRoomCode) return;
    autoJoinAttempted.current = true;
    void join(initialRoomCode);
  }, [initialRoomCode, join]);

  useEffect(() => {
    if (room?.code) syncRoomCodeToUrl(room.code);
  }, [room?.code]);

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (initializedRoundRef.current === room.roundNumber) return;
    initializedRoundRef.current = room.roundNumber;
    lastPushedLengthRef.current = 0;
    appliedResultRef.current = null;
    startOnlineGame(myDisc);
    if (isReversiGameState(room.gameState) && room.gameState.movesHistory.length > 0) {
      syncRemoteBoard({ movesHistory: room.gameState.movesHistory, humanPlayer: myDisc });
      lastPushedLengthRef.current = room.gameState.movesHistory.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isReversiGameState(room.gameState)) return;
    if (appliedResultRef.current === room.roundNumber) return;
    const state = room.gameState;
    if (state.resignedBySlot != null) {
      appliedResultRef.current = room.roundNumber;
      applyOnlineResult({ resignedPlayer: state.resignedBySlot === 0 ? 1 : 2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState, room?.roundNumber, applyOnlineResult]);

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!isReversiGameState(room.gameState)) return;
    const remoteLength = room.gameState.movesHistory.length;
    if (remoteLength <= movesHistory.length) return;
    const ok = syncRemoteBoard({ movesHistory: room.gameState.movesHistory, humanPlayer: myDisc });
    if (ok) lastPushedLengthRef.current = remoteLength;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.gameState]);

  // Ghi nhận kết quả + điểm khi ván kết thúc.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

    if (isReversiGameState(room.gameState)) {
      const remote = room.gameState;
      if (remote.movesHistory.length === 0 && remote.resignedBySlot == null && movesHistory.length === 0) return;
    }

    const winnerSlot: number | null = winner ? (winner === 1 ? 0 : 1) : null;

    if (statsRecordedRef.current !== room.roundNumber) {
      statsRecordedRef.current = room.roundNumber;
      const myResult: MatchResult = !winner ? "draw" : winnerSlot === mySlot ? "win" : "loss";
      void recordMyMatchResult({
        gameSlug: "reversi",
        myUserId: identity && !identity.isGuest ? identity.id : null,
        myDisplayName: identity?.displayName ?? "",
        opponentUserId: opponents[0]?.userId ?? null,
        result: myResult,
      });
    }

    const shouldIReport = winner ? winnerSlot === mySlot : mySlot === 0;
    if (!shouldIReport) return;
    roundFinishReportedRef.current = room.roundNumber;
    const scoreboard = { ...room.scoreboard };
    if (winnerSlot !== null) scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    void finishRoomRound(room.id, scoreboard);
    void recordRoundHistory({
      roomId: room.id, roomCode: room.code, gameSlug: "reversi", roundNumber: room.roundNumber,
      finalGameState: { movesHistory } satisfies ReversiGameState, winnerSlot,
      players: players.map((p) => ({ slot: p.slot, displayName: p.displayName })),
    });
  }, [status, winner, gameOver, room, movesHistory, mySlot, players, identity, opponents]);

  useEffect(() => {
    if (!room || room.status !== "round_finished") return;
    if (!isHost || players.length < 2 || !players.every((p) => p.isReady)) return;
    const nextRound = room.roundNumber + 1;
    void (async () => {
      await startRematch(room.id, { movesHistory: [] } satisfies ReversiGameState, nextRound);
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost || players.length < room.maxPlayers || !players.every((p) => p.isReady)) return;
    void (async () => {
      await startRoomRound(room.id, { movesHistory: [] } satisfies ReversiGameState);
      await resetReadyFlags(room.id);
    })();
  }, [room, players, isHost]);

  const isMyTurn = status === "playing" && current === myDisc;
  const myMoves = isMyTurn ? legalMoves(board, myDisc) : [];

  const handlePlace = (r: number, c: number) => {
    if (!room || !isMyTurn) return;
    if (!playAt(r, c)) return;
    playSound("move");
    const moves = useReversiStore.getState().movesHistory;
    lastPushedLengthRef.current = moves.length;
    void updateRoomGameState(room.id, { movesHistory: moves, drawOfferFromSlot: null } satisfies ReversiGameState);
  };

  const handleResign = useCallback(async () => {
    if (!room || mySlot === null) return;
    setConfirmAction(null);
    const scoreboard = { ...room.scoreboard };
    const winnerSlot = mySlot === 0 ? 1 : 0;
    scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    await updateRoomGameState(room.id, { movesHistory, resignedBySlot: mySlot, drawOfferFromSlot: null } satisfies ReversiGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, movesHistory]);

  const handleOfferDraw = useCallback(async () => {
    if (!room || mySlot === null) return;
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: mySlot } satisfies ReversiGameState);
  }, [room, mySlot, movesHistory]);

  const handleAcceptDraw = useCallback(async () => {
    if (!room) return;
    applyOnlineResult({ isDrawAgreed: true });
    await finishRoomRound(room.id, room.scoreboard);
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: null } satisfies ReversiGameState);
  }, [room, movesHistory, applyOnlineResult]);

  const handleDeclineDraw = useCallback(async () => {
    if (!room) return;
    await updateRoomGameState(room.id, { movesHistory, drawOfferFromSlot: null } satisfies ReversiGameState);
  }, [room, movesHistory]);

  const handleLeave = useCallback(async () => {
    setConfirmAction(null);
    if (room && mySlot !== null && room.status === "playing" && !gameOver) {
      const scoreboard = { ...room.scoreboard };
      const winnerSlot = mySlot === 0 ? 1 : 0;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
      await updateRoomGameState(room.id, { movesHistory, resignedBySlot: mySlot } satisfies ReversiGameState);
      await finishRoomRound(room.id, scoreboard);
    }
    await leave();
    window.location.href = "/";
  }, [room, mySlot, gameOver, movesHistory, leave]);

  const claimWinByTimeout = useCallback(async () => {
    if (!room || mySlot === null || gameOver || room.status !== "playing") return;
    const opponentSlot = mySlot === 0 ? 1 : 0;
    const scoreboard = { ...room.scoreboard };
    scoreboard[String(mySlot)] = (scoreboard[String(mySlot)] ?? 0) + 1;
    await updateRoomGameState(room.id, { movesHistory, resignedBySlot: opponentSlot } satisfies ReversiGameState);
    await finishRoomRound(room.id, scoreboard);
  }, [room, mySlot, gameOver, movesHistory]);

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
        <button type="button" onClick={onExit} className="flex items-center gap-2 self-start text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại chọn chế độ
        </button>
        <RoomLobby gameSlug="reversi" gameTitle="Cờ lật" isLoading={isLoading} error={error} notice={notice} onCreate={create} onJoin={join} onQuickMatch={quickMatch} onBack={onExit} />
      </div>
    );
  }

  if (room.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <WaitingRoom roomCode={room.code} gameSlug="reversi" players={players} maxPlayers={room.maxPlayers} myPlayerRowId={myPlayer?.id ?? null} isHost={isHost} isPlayerOnline={isPlayerOnline} onToggleReady={toggleReady} onLeave={handleLeave} onKick={kick} />
      </div>
    );
  }

  const opponent = opponents[0];
  const opponentOffline = opponent ? !isPlayerOnline(opponent) : false;

  if (room.status === "round_finished") {
    const winnerSlot = winner ? (winner === 1 ? 0 : 1) : null;
    const resultLabel = !winner ? "Hoà!" : winnerSlot === mySlot ? "Bạn thắng!" : `${players.find((p) => p.slot === winnerSlot)?.displayName ?? "Đối thủ"} thắng!`;
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RoundResultPanel resultLabel={resultLabel} emoji={!winner ? "🤝" : winnerSlot === mySlot ? "🎉" : "😵"} scoreboard={room.scoreboard} players={players} myPlayerRowId={myPlayer?.id ?? null} onToggleReady={toggleReady} onLeave={handleLeave} />
        {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[480px] items-center justify-between text-sm text-muted">
        <span>Bạn: <span className="text-foreground">{myPlayer?.displayName}</span> ({myDisc === 1 ? "Đen" : "Trắng"}) · {counts[myDisc]}</span>
        <span>Đối thủ: <span className="text-foreground">{opponent?.displayName ?? "..."}</span> · {counts[myDisc === 1 ? 2 : 1]}</span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} secondsLeft={disconnectSecondsLeft} />}
      {opponentOfferedDraw && <DrawOfferBanner opponentName={opponent?.displayName ?? "Đối thủ"} onAccept={handleAcceptDraw} onDecline={handleDeclineDraw} />}

      <div className="flex h-6 items-center text-sm font-medium text-foreground">{isMyTurn ? "Tới lượt bạn" : "Chờ đối thủ đi..."}</div>

      <div className="grid w-full max-w-[480px] gap-[2px] rounded-lg bg-[#14532d] p-[2px] shadow-xl" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0,1fr))` }}>
        {board.map((row, r) =>
          row.map((v, c) => {
            const isLegal = myMoves.some((m) => m.r === r && m.c === c);
            return (
              <button key={`${r}-${c}`} type="button" onClick={() => handlePlace(r, c)} disabled={!isMyTurn} className="relative flex aspect-square items-center justify-center bg-[#166534] transition enabled:hover:brightness-110">
                {v !== 0 && <span className="block h-[80%] w-[80%] rounded-full shadow-md" style={{ background: v === 1 ? "#111827" : "#f8fafc", border: v === 2 ? "1px solid #cbd5e1" : "none" }} />}
                {isLegal && <span className="absolute h-[24%] w-[24%] rounded-full bg-white/40" />}
              </button>
            );
          })
        )}
      </div>

      <div className="w-full max-w-[480px]">
        <GameActionBar onResign={() => setConfirmAction("resign")} onOfferDraw={handleOfferDraw} onLeave={() => setConfirmAction("leave")} drawOfferPending={iOfferedDraw} />
      </div>

      {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}

      <ConfirmActionModal open={confirmAction === "resign"} title="Xác nhận đầu hàng" message="Bạn có chắc chắn muốn nhận thua ván này?" confirmLabel="Đầu hàng" danger onConfirm={handleResign} onCancel={() => setConfirmAction(null)} />
      <ConfirmActionModal open={confirmAction === "leave"} title="Rời phòng" message={gameOver ? "Bạn có chắc muốn rời phòng?" : "Rời phòng lúc này sẽ tính là bạn đầu hàng. Bạn có chắc chắn?"} confirmLabel="Rời phòng" danger onConfirm={handleLeave} onCancel={() => setConfirmAction(null)} />
    </div>
  );
}
