"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Bot, RotateCcw, Globe } from "lucide-react";
import { useReversiStore } from "../store";
import { legalMoves, SIZE } from "../engine/logic";
import { playSound } from "@/lib/sound";
import { ReversiOnlineGame } from "./ReversiOnlineGame";

export function ReversiGame() {
  const [screen, setScreen] = useState<"menu" | "game" | "online">("menu");
  const [pendingRoom, setPendingRoom] = useState<string | undefined>(undefined);
  const board = useReversiStore((s) => s.board);
  const current = useReversiStore((s) => s.current);
  const status = useReversiStore((s) => s.status);
  const winner = useReversiStore((s) => s.winner);
  const mode = useReversiStore((s) => s.mode);
  const aiPlayer = useReversiStore((s) => s.aiPlayer);
  const passed = useReversiStore((s) => s.passed);
  const counts = useReversiStore((s) => s.counts);
  const startNewGame = useReversiStore((s) => s.startNewGame);
  const playAt = useReversiStore((s) => s.playAt);
  const aiStep = useReversiStore((s) => s.aiStep);

  const isAiTurn = mode === "ai" && current === aiPlayer;
  const myMoves = useMemo(() => (status === "playing" && !isAiTurn ? legalMoves(board, current) : []), [board, current, status, isAiTurn]);

  useEffect(() => {
    if (!isAiTurn || status !== "playing") return;
    const id = setTimeout(() => aiStep(), 500);
    return () => clearTimeout(id);
  }, [isAiTurn, status, board, aiStep]);

  useEffect(() => {
    if (screen !== "game") return;
    if (status === "over") playSound(winner === aiPlayer ? "lose" : winner ? "win" : "notify");
  }, [status, winner, aiPlayer, screen]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("room");
    if (!code) return;
    queueMicrotask(() => {
      setPendingRoom(code);
      setScreen("online");
    });
  }, []);

  function handleClick(r: number, c: number) {
    if (isAiTurn) return;
    if (playAt(r, c)) playSound("move");
  }

  if (screen === "online") {
    return (
      <div className="flex flex-1 flex-col">
        <ReversiOnlineGame initialRoomCode={pendingRoom} onExit={() => { setScreen("menu"); setPendingRoom(undefined); }} />
      </div>
    );
  }

  if (screen === "menu") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Cờ lật (Reversi)</h1>
          <p className="mt-2 text-sm text-muted">Kẹp quân đối phương để lật thành quân mình. Nhiều quân hơn khi hết bàn là thắng.</p>
          <div className="mt-6 grid gap-3">
            <MenuButton icon={<Users size={22} />} title="2 người (cùng máy)" desc="Thay phiên nhau trên cùng thiết bị" onClick={() => { startNewGame("hotseat"); setScreen("game"); }} />
            <MenuButton icon={<Bot size={22} />} title="Chơi với máy" desc="Bạn cầm quân Đen, đi trước" onClick={() => { startNewGame("ai", { aiPlayer: 2 }); setScreen("game"); }} />
            <MenuButton icon={<Globe size={22} />} title="Chơi online" desc="Tạo phòng hoặc vào phòng bạn bè" onClick={() => setScreen("online")} accent />
          </div>
        </div>
      </div>
    );
  }

  const turnLabel = status === "over" ? "" : isAiTurn ? "Máy đang suy nghĩ..." : `Lượt quân ${current === 1 ? "Đen" : "Trắng"}`;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[480px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Trang chủ
        </Link>
        <button type="button" onClick={() => setScreen("menu")} className="text-sm text-muted transition hover:text-foreground">
          Đổi chế độ
        </button>
      </div>

      <div className="flex w-full max-w-[480px] items-center justify-between">
        <Score color="#111827" label="Đen" value={counts[1]} active={current === 1 && status === "playing"} />
        <div className="text-center text-sm font-medium text-foreground">
          {status === "over" ? (
            <span className="font-display text-lg font-bold">{winner ? `${winner === 1 ? "Đen" : "Trắng"} thắng!` : "Hoà!"}</span>
          ) : (
            <>
              {turnLabel}
              {passed && <p className="text-xs text-amber-400">Đối thủ bị bỏ lượt (không có nước đi)</p>}
            </>
          )}
        </div>
        <Score color="#f8fafc" label="Trắng" value={counts[2]} active={current === 2 && status === "playing"} />
      </div>

      <div className="grid w-full max-w-[480px] gap-[2px] rounded-lg bg-[#14532d] p-[2px] shadow-xl" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0,1fr))` }}>
        {board.map((row, r) =>
          row.map((v, c) => {
            const isLegal = myMoves.some((m) => m.r === r && m.c === c);
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleClick(r, c)}
                className="relative flex aspect-square items-center justify-center bg-[#166534] transition hover:brightness-110"
              >
                {v !== 0 && (
                  <span
                    className="block h-[80%] w-[80%] rounded-full shadow-md"
                    style={{ background: v === 1 ? "#111827" : "#f8fafc", border: v === 2 ? "1px solid #cbd5e1" : "none" }}
                  />
                )}
                {isLegal && <span className="absolute h-[24%] w-[24%] rounded-full bg-white/40" />}
              </button>
            );
          })
        )}
      </div>

      {status === "over" && (
        <button
          type="button"
          onClick={() => startNewGame(mode === "ai" ? "ai" : "hotseat", { aiPlayer: aiPlayer ?? 2 })}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
        >
          <RotateCcw size={16} /> Ván mới
        </button>
      )}
    </div>
  );
}

function Score({ color, label, value, active }: { color: string; label: string; value: number; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${active ? "bg-surface-hover ring-1 ring-amber-400" : "bg-surface"}`}>
      <span className="h-4 w-4 rounded-full border border-border" style={{ background: color }} />
      <span className="text-xs text-muted">{label}</span>
      <span className="font-mono text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}

function MenuButton({ icon, title, desc, onClick, accent }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition active:scale-[0.98] ${
        accent ? "border-amber-400/40 bg-amber-400/10 hover:border-amber-400" : "border-border-hover bg-surface hover:border-amber-400 hover:bg-surface-hover"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">{icon}</span>
      <span>
        <p className="font-display text-lg font-semibold text-foreground group-hover:text-amber-400">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </span>
    </button>
  );
}
