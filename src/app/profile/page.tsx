"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/game-shell/Header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { listMyStats, PlayerStat } from "@/lib/multiplayer/stats";
import { getOrCreateGuestIdentity, setGuestName } from "@/lib/multiplayer/guest";
import { MULTIPLAYER_CONFIG } from "@/lib/multiplayer/gameConfig";
import { Check, Loader2, Pencil, Trophy } from "lucide-react";

interface SessionRow {
  id: string;
  game_slug: string;
  difficulty: string | null;
  duration_seconds: number | null;
  hints_used: number;
  completed: boolean;
  created_at: string;
}

const GAME_LABELS: Record<string, string> = {
  sudoku: "Sudoku",
  minesweeper: "Dò mìn",
  solitaire: "Solitaire",
  doanso: "Đoán số",
  caro: "Caro",
  chess: "Cờ vua",
  xiangqi: "Cờ tướng",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function difficultyLabel(d: string | null): string {
  return d === "easy" ? "Dễ" : d === "medium" ? "Trung bình" : d === "hard" ? "Khó" : d ?? "—";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [guestName, setGuestNameState] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      const { guestName: gn } = getOrCreateGuestIdentity();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuestNameState(gn);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const [{ data: rows }, { data: profile }, statRows] = await Promise.all([
          supabase
            .from("game_sessions")
            .select("id, game_slug, difficulty, duration_seconds, hints_used, completed, created_at")
            .order("created_at", { ascending: false })
            .limit(30),
          supabase.from("profiles").select("username").eq("id", data.user.id).maybeSingle(),
          listMyStats(data.user.id),
        ]);
        setSessions(rows ?? []);
        setStats(statRows);
        setNameInput(profile?.username || data.user.email?.split("@")[0] || "");
      } else {
        const { guestName: gn } = getOrCreateGuestIdentity();
        setGuestNameState(gn);
      }
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSessions([]);
    setStats([]);
  }

  async function handleSaveName() {
    const supabase = createClient();
    if (!supabase || !user) return;
    const trimmed = nameInput.trim().slice(0, 40);
    if (trimmed.length === 0) return;
    await supabase.from("profiles").upsert({ id: user.id, username: trimmed });
    setEditingName(false);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  }

  function handleSaveGuestName() {
    const trimmed = guestName.trim().slice(0, 40);
    if (trimmed.length === 0) return;
    setGuestName(trimmed);
    setEditingName(false);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Hồ sơ</h1>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Đang tải...
          </div>
        ) : !isSupabaseConfigured ? (
          <GuestPanel
            guestName={guestName}
            editing={editingName}
            saved={savedName}
            onChange={setGuestNameState}
            onEdit={() => setEditingName(true)}
            onSave={handleSaveGuestName}
            supabaseNote
          />
        ) : !user ? (
          <div className="mt-6 space-y-4">
            <GuestPanel
              guestName={guestName}
              editing={editingName}
              saved={savedName}
              onChange={setGuestNameState}
              onEdit={() => setEditingName(true)}
              onSave={handleSaveGuestName}
            />
            <div className="rounded-xl border border-border-hover bg-surface-hover/60 p-5">
              <p className="text-sm text-muted">
                Đăng nhập để đồng bộ tiến trình, xem lịch sử chơi và được xếp hạng trên bảng xếp hạng.
              </p>
              <Link
                href="/auth"
                className="mt-3 inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-amber-500"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-border-hover bg-surface-hover/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={40}
                        className="w-full rounded-lg border border-border-hover bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleSaveName}
                        className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-amber-500"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-lg font-semibold text-foreground">{nameInput}</p>
                      <button
                        onClick={() => setEditingName(true)}
                        aria-label="Đổi tên hiển thị"
                        className="shrink-0 text-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      {savedName && <Check size={14} className="text-teal-400" />}
                    </div>
                  )}
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  Đăng xuất
                </button>
              </div>
            </div>

            {/* Thống kê online / xếp hạng */}
            <div className="mt-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Trophy size={18} className="text-amber-400" /> Thành tích online
              </h2>
              <Link href="/leaderboard" className="text-sm text-amber-400 hover:underline">
                Xem bảng xếp hạng →
              </Link>
            </div>
            {stats.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border-hover px-4 py-6 text-center text-sm text-muted">
                Chưa có ván online nào. Vào một game cờ và chọn &quot;Chơi online&quot; để bắt đầu leo hạng!
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.gameSlug} className="rounded-xl border border-border-hover bg-surface-hover/40 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {MULTIPLAYER_CONFIG[s.gameSlug]?.label ?? GAME_LABELS[s.gameSlug] ?? s.gameSlug}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-amber-400">{s.rating}</p>
                    <p className="mt-1 text-xs text-muted">
                      <span className="text-teal-400">{s.wins}T</span> · {s.draws}H ·{" "}
                      <span className="text-coral-500">{s.losses}B</span> · {s.games} ván
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Lịch sử ván đơn (mọi game) */}
            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Lịch sử chơi</h2>
            {sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Chưa có ván nào được đồng bộ.</p>
            ) : (
              <div className="mt-3 divide-y divide-border rounded-xl border border-border-hover bg-surface-hover/40">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="w-24 shrink-0 font-medium text-foreground">
                      {GAME_LABELS[s.game_slug] ?? s.game_slug}
                    </span>
                    <span className="text-muted">{difficultyLabel(s.difficulty)}</span>
                    <span className="font-mono text-muted">{formatDuration(s.duration_seconds)}</span>
                    <span className="text-xs text-ink-600">
                      {new Date(s.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function GuestPanel({
  guestName,
  editing,
  saved,
  onChange,
  onEdit,
  onSave,
  supabaseNote,
}: {
  guestName: string;
  editing: boolean;
  saved: boolean;
  onChange: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  supabaseNote?: boolean;
}) {
  return (
    <div className="mt-6 rounded-xl border border-border-hover bg-surface-hover/60 p-5">
      <p className="text-sm text-muted">Bạn đang chơi ở chế độ khách. Tên này hiển thị khi chơi online:</p>
      <div className="mt-3 flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={guestName}
              onChange={(e) => onChange(e.target.value)}
              maxLength={40}
              className="w-full rounded-lg border border-border-hover bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-amber-400"
            />
            <button
              onClick={onSave}
              className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-amber-500"
            >
              Lưu
            </button>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-semibold text-foreground">{guestName || "Khách"}</p>
            <button onClick={onEdit} aria-label="Đổi tên khách" className="text-muted hover:text-foreground">
              <Pencil size={14} />
            </button>
            {saved && <Check size={14} className="text-teal-400" />}
          </>
        )}
      </div>
      {supabaseNote && (
        <p className="mt-3 text-xs text-muted">Supabase chưa được cấu hình — tiến trình chỉ lưu trên thiết bị này.</p>
      )}
    </div>
  );
}
