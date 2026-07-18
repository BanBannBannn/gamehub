"use client";

import { useEffect, useRef } from "react";
import { useChessStore } from "@/games/chess/store";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { MoveHistory } from "./MoveHistory";
import { useOnlineRoom } from "@/lib/multiplayer/useOnlineRoom";
import { finishRoomRound, recordRoundHistory, resetReadyFlags, startRematch, startRoomRound, updateRoomGameState } from "@/lib/multiplayer/rooms";
import { RoomLobby } from "@/components/multiplayer/RoomLobby";
import { WaitingRoom } from "@/components/multiplayer/WaitingRoom";
import { RoundResultPanel } from "@/components/multiplayer/RoundResultPanel";
import { ChatDrawer } from "@/components/multiplayer/ChatDrawer";
import { OpponentDisconnectedBanner } from "@/components/multiplayer/OpponentDisconnectedBanner";
import { ArrowLeft } from "lucide-react";

interface ChessGameState {
  pgn: string;
  whiteTime: number;
  blackTime: number;
}

function isChessGameState(value: unknown): value is ChessGameState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChessGameState).pgn === "string" &&
    typeof (value as ChessGameState).whiteTime === "number"
  );
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
    isLoading,
    create,
    join,
    leave,
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
  const tick = useChessStore((s) => s.tick);

  const autoJoinAttempted = useRef(false);
  const initializedRoundRef = useRef<number | null>(null);
  const lastPushedPgnRef = useRef<string>("");
  const roundFinishReportedRef = useRef<number | null>(null);

  const myColor: "w" | "b" = mySlot === 0 ? "w" : "b";

  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (!initialRoomCode) return;
    autoJoinAttempted.current = true;
    void join(initialRoomCode);
  }, [initialRoomCode, join]);

  // Đếm ngược thời gian mỗi giây (cần thiết để phát hiện hết giờ — xem
  // ghi chú ở effect "Ghi nhận kết quả ván" bên dưới về cách cả 2 client
  // tự phát hiện timeout gần như đồng thời qua tick() cục bộ này).
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

    startOnlineGame(myColor, DEFAULT_TIME_SECONDS);
    if (isChessGameState(room.gameState) && room.gameState.pgn.trim().length > 0) {
      syncRemoteState(room.gameState);
      lastPushedPgnRef.current = room.gameState.pgn;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.roundNumber, mySlot]);

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

    // Nước đi vừa xảy ra được thực hiện bởi bên NGƯỢC với lượt hiện tại
    // (turn đã đổi sau khi đi) — dùng chess.js turn thông qua game state
    // cục bộ: nếu bây giờ tới lượt đối phương của tôi, nghĩa là tôi vừa đi.
    const game = useChessStore.getState().game;
    const justMovedColor: "w" | "b" = game.turn() === "w" ? "b" : "w";
    if (justMovedColor !== myColor) return; // đây là state vừa nhận từ đồng bộ, không phải nước đi của mình

    lastPushedPgnRef.current = pgn;
    void updateRoomGameState(room.id, { pgn, whiteTime, blackTime } satisfies ChessGameState);
  }, [pgn, whiteTime, blackTime, room, myColor]);

  // Ghi nhận kết quả ván khi kết thúc — QUY TẮC: bên THẮNG là người báo
  // cáo (không phải "người vừa đi nước cuối"), vì điều này xử lý đúng cả
  // 2 trường hợp: (1) thắng do chiếu bí — bên thắng chính là người vừa
  // đi; (2) thắng do đối thủ HẾT GIỜ — không có nước đi nào xảy ra, cả 2
  // client tự phát hiện timeout gần như đồng thời qua tick() cục bộ,
  // nên chỉ bên thắng cuộc mới báo cáo để tránh 2 client cùng ghi. Ván
  // hoà thì để host (slot 0) báo cáo, vì không có "bên thắng" để phân định.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const gameOver = status === "won" || status === "draw";
    if (!gameOver) return;
    if (roundFinishReportedRef.current === room.roundNumber) return;

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
  }, [status, winner, room, myColor, mySlot, players, pgn, whiteTime, blackTime]);

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

  // Host bắt đầu ván đầu tiên khi đủ người + tất cả sẵn sàng.
  useEffect(() => {
    if (!room || room.status !== "waiting") return;
    if (!isHost) return;
    if (players.length < room.maxPlayers) return;
    if (!players.every((p) => p.isReady)) return;

    void startRoomRound(room.id, {
      pgn: "",
      whiteTime: DEFAULT_TIME_SECONDS,
      blackTime: DEFAULT_TIME_SECONDS,
    } satisfies ChessGameState);
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
        <RoomLobby gameSlug="chess" gameTitle="Cờ vua" isLoading={isLoading} error={error} onCreate={create} onJoin={join} onBack={onExit} />
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
          onLeave={leave}
        />
        {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6 w-full mx-auto">
      <div className="flex w-full max-w-[500px] lg:max-w-[820px] items-center justify-between text-sm text-ink-400">
        <span>
          Bạn: <span className="text-paper-100">{myPlayer?.displayName}</span> ({myColor === "w" ? "Trắng" : "Đen"})
        </span>
        <span>
          Đối thủ: <span className="text-paper-100">{opponent?.displayName ?? "..."}</span>
        </span>
      </div>

      {opponentOffline && opponent && <OpponentDisconnectedBanner opponentName={opponent.displayName} />}

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
      </div>

      {identity && <ChatDrawer messages={chatMessages} myId={identity.id} onSend={sendChat} />}
    </div>
  );
}
