"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Bot, Globe, RotateCcw } from "lucide-react";
import { useConnect4Store } from "../store";
import { Connect4Board } from "./Board";
import { Connect4OnlineGame } from "./Connect4OnlineGame";

const DISC = { 1: "#ef4444", 2: "#f2b84b" } as const;

export function Connect4Game() {
  const [screen, setScreen] = useState<"menu" | "local" | "online">("menu");
  const [pendingRoom, setPendingRoom] = useState<string | undefined>(undefined);

  const board = useConnect4Store((s) => s.board); // giữ subscribe để re-render
  const status = useConnect4Store((s) => s.status);
  const current = useConnect4Store((s) => s.current);
  const winner = useConnect4Store((s) => s.winner);
  const mode = useConnect4Store((s) => s.mode);
  const aiPlayer = useConnect4Store((s) => s.aiPlayer);
  const startNewGame = useConnect4Store((s) => s.startNewGame);
  const dropAt = useConnect4Store((s) => s.dropAt);
  const aiStep = useConnect4Store((s) => s.aiStep);
  void board;

  // Link mời ?room=MÃ → vào thẳng online.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("room");
    if (!code) return;
    queueMicrotask(() => {
      setPendingRoom(code);
      setScreen("online");
    });
  }, []);

  // Cho máy đi khi tới lượt (mode 'ai').
  useEffect(() => {
    if (mode !== "ai" || status !== "playing" || current !== aiPlayer) return;
    const id = setTimeout(() => aiStep(), 450);
    return () => clearTimeout(id);
  }, [mode, status, current, aiPlayer, aiStep]);

  if (screen === "online") {
    return (
      <div className="flex flex-1 flex-col">
        <Connect4OnlineGame initialRoomCode={pendingRoom} onExit={() => { setScreen("menu"); setPendingRoom(undefined); }} />
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
          <h1 className="font-display text-3xl font-bold text-foreground">Bốn quân</h1>
          <p className="mt-2 text-sm text-muted">Thả quân, ai nối được 4 quân (ngang/dọc/chéo) trước sẽ thắng.</p>
          <div className="mt-6 grid gap-3">
            <MenuButton icon={<Users size={22} />} title="2 người (cùng máy)" desc="Thay phiên nhau trên cùng thiết bị" onClick={() => { startNewGame("hotseat"); setScreen("local"); }} />
            <MenuButton icon={<Bot size={22} />} title="Chơi với máy" desc="Bạn cầm quân đỏ, đi trước" onClick={() => { startNewGame("ai", { aiPlayer: 2 }); setScreen("local"); }} />
            <MenuButton icon={<Globe size={22} />} title="Chơi online" desc="Tạo phòng hoặc vào phòng bạn bè" onClick={() => setScreen("online")} accent />
          </div>
        </div>
      </div>
    );
  }

  const gameOver = status === "won" || status === "draw";
  const humanTurnLabel =
    status === "won" ? "" : mode === "ai" && current === aiPlayer ? "Máy đang suy nghĩ..." : `Lượt của quân ${current === 1 ? "Đỏ" : "Vàng"}`;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full max-w-[460px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground">
          <ArrowLeft size={16} /> Trang chủ
        </Link>
        <button type="button" onClick={() => setScreen("menu")} className="text-sm text-muted transition hover:text-foreground">
          Đổi chế độ
        </button>
      </div>

      <div className="flex h-8 items-center gap-2 text-sm font-medium">
        {gameOver ? (
          <span className="font-display text-lg font-bold text-foreground">
            {status === "draw" ? "🤝 Hoà!" : `🎉 Quân ${winner === 1 ? "Đỏ" : "Vàng"} thắng!`}
          </span>
        ) : (
          <>
            <span className="h-4 w-4 rounded-full" style={{ background: DISC[current] }} />
            <span className="text-foreground">{humanTurnLabel}</span>
          </>
        )}
      </div>

      <Connect4Board onDrop={dropAt} disabled={gameOver || (mode === "ai" && current === aiPlayer)} />

      {gameOver && (
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
