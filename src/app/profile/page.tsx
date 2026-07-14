"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/game-shell/Header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface SessionRow {
  id: string;
  difficulty: string | null;
  duration_seconds: number | null;
  hints_used: number;
  completed: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      // Guest-only mode (Supabase not configured): nothing to fetch, just
      // stop the loading state so the guest message renders.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: rows } = await supabase
          .from("game_sessions")
          .select("id, difficulty, duration_seconds, hints_used, completed, created_at")
          .eq("game_slug", "sudoku")
          .order("created_at", { ascending: false })
          .limit(20);
        setSessions(rows ?? []);
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
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Hồ sơ</h1>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Đang tải...</p>
        ) : !isSupabaseConfigured ? (
          <p className="mt-4 text-sm text-muted">
            Supabase chưa được cấu hình — chế độ khách chỉ lưu tiến trình trên thiết bị này.
          </p>
        ) : !user ? (
          <div className="mt-4 rounded-xl border border-border-hover bg-surface-hover/60 p-5">
            <p className="text-sm text-muted">
              Bạn đang chơi ở chế độ khách. Đăng nhập để đồng bộ tiến trình và xem lịch sử chơi.
            </p>
            <Link
              href="/auth"
              className="mt-3 inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-amber-500"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border-hover bg-surface-hover/60 p-4">
              <p className="text-sm text-foreground">{user.email}</p>
              <button
                onClick={handleSignOut}
                className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-ink-700 hover:text-foreground"
              >
                Đăng xuất
              </button>
            </div>

            <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Lịch sử Sudoku</h2>
            {sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Chưa có ván nào được đồng bộ.</p>
            ) : (
              <div className="mt-3 divide-y divide-ink-800 rounded-xl border border-border-hover bg-surface-hover/40">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-foreground">
                      {s.difficulty === "easy" ? "Dễ" : s.difficulty === "medium" ? "Trung bình" : "Khó"}
                    </span>
                    <span className="font-mono text-muted">
                      {s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}:${(s.duration_seconds % 60).toString().padStart(2, "0")}` : "-"}
                    </span>
                    <span className="text-muted">{s.hints_used} hint</span>
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
