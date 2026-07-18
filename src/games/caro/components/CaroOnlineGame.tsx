"use client";

import { useEffect, useRef, useState } from "react";
import { useCaroStore } from "@/games/caro/store";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { useOnlineRoom } from "@/lib/multiplayer/useOnlineRoom";
import { finishRoomRound, resetReadyFlags, startRematch, startRoomRound, updateRoomGameState } from "@/lib/multiplayer/rooms";
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { ArrowLeft } from "lucide-react";

interface CaroGameState {
  movesHistory: number[];
}

function isCaroGameState(value: unknown): value is CaroGameState {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as CaroGameState).movesHistory)
  );
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

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedLengthRef = useRef(0);
  const roundFinishReportedRef = useRef<number | null>(null);
  const [focusedIndex] = useState<number | null>(null);

  const myPlayerNumber: 1 | 2 = mySlot === 0 ? 1 : 2;

  // Tự động tham gia phòng nếu có mã trong link mời (?room=...).
  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (!initialRoomCode) return;
    autoJoinAttempted.current = true;
    void join(initialRoomCode);
  }, [initialRoomCode, join]);

  // Khi phòng chuyển sang "playing" cho 1 round mới, khởi tạo/đồng bộ store local.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (initializedRoundRef.current === room.roundNumber) return;
    initializedRoundRef.current = room.roundNumber;
    lastPushedLengthRef.current = 0;

    startOnlineGame(mySlot ?? 0);
    if (isCaroGameState(room.gameState) && room.gameState.movesHistory.length > 0) {
      syncRemoteBoard({ movesHistory: room.gameState.movesHistory, humanPlayer: myPlayerNumber });
      lastPushedLengthRef.current = room.gameState.movesHistory.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

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
    void updateRoomGameState(room.id, { movesHistory } satisfies CaroGameState);
  }, [movesHistory, room, myPlayerNumber]);

  // Khi ván kết thúc do chính nước đi của mình gây ra, ghi nhận kết quả ván.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const gameOver = Boolean(winner) || isDraw;
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

    const lastMover: 1 | 2 = movesHistory.length % 2 === 1 ? 1 : 2;
    if (lastMover !== myPlayerNumber) return; // để người vừa đi nước cuối ghi nhận, tránh 2 client cùng ghi

    roundFinishReportedRef.current = room.roundNumber;
    const scoreboard = { ...room.scoreboard };
    if (winner) {
      const winnerSlot = winner.winner === 1 ? 0 : 1;
      scoreboard[String(winnerSlot)] = (scoreboard[String(winnerSlot)] ?? 0) + 1;
    }
    void finishRoomRound(room.id, scoreboard);
  }, [winner, isDraw, room, movesHistory.length, myPlayerNumber]);

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
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost) return;
    if (players.length < room.maxPlayers) return;
    if (!players.every((p) => p.isReady)) return;

    void startRoomRound(room.id, { movesHistory: [] } satisfies CaroGameState);
  }, [room, players, isHost]);

  if (!room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 self-start text-sm font-medium text-ink-400 transition hover:text-paper-100"
        >
          <ArrowLeft size={16} /> Quay lại chọn chế độ
        </button>
        <RoomLobby gameTitle="Caro" isLoading={isLoading} error={error} onCreate={create} onJoin={join} onBack={onExit} />
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
          onLeave={leave}
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
          onLeave={leave}
        />
        {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
      </div>
    );
  }

  // room.status === "playing"
  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[min(92vw,600px)] items-center justify-between text-sm text-ink-400">
        <span>
          Bạn: <span className="text-paper-100">{myPlayer?.displayName}</span> ({myPlayerNumber === 1 ? "X" : "O"})
        </span>
        <span>
          Đối thủ: <span className="text-paper-100">{opponent?.displayName ?? "..."}</span>
        </span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} />}

      <Hud />
      <Board focusedIndex={focusedIndex} />

      {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
    </div>
  );
}
