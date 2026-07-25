"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/game-shell/Header";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listLeaderboard, PlayerStat } from "@/lib/multiplayer/stats";
import { MULTIPLAYER_CONFIG } from "@/lib/multiplayer/gameConfig";
import { Trophy, Loader2 } from "lucide-react";

const GAMES = Object.entries(MULTIPLAYER_CONFIG).map(([slug, cfg]) => ({ slug, label: cfg.label }));

function winRate(s: PlayerStat): string {
  if (s.games === 0) return "—";
  return `${Math.round((s.wins / s.games) * 100)}%`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [game, setGame] = useState(GAMES[0]?.slug ?? "caro");
  const [rows, setRows] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listLeaderboard(game).then((data) => {
      if (cancelled) return;
      setRows(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [game]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
            <Trophy size={20} />
          </span>
          <h1 className="font-display text-2xl font-bold text-foreground">Bảng xếp hạng</h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          Điểm Elo tính sau mỗi ván chơi online. Chỉ người đã đăng nhập được xếp hạng.
        </p>

        <div className="mt-6 flex gap-2">
          {GAMES.map((g) => (
            <button
              key={g.slug}
              type="button"
              onClick={() => setGame(g.slug)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                game === g.slug
                  ? "bg-amber-400 text-ink-950"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {!isSupabaseConfigured ? (
          <p className="mt-8 rounded-xl border border-dashed border-border-hover px-4 py-8 text-center text-sm text-muted">
            Chưa cấu hình Supabase — bảng xếp hạng cần cơ sở dữ liệu để hoạt động.
          </p>
        ) : loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Đang tải...
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border-hover px-4 py-8 text-center text-sm text-muted">
            Chưa có ai được xếp hạng cho {MULTIPLAYER_CONFIG[game]?.label}. Hãy đăng nhập và chơi ván online đầu tiên!
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-border-hover">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5 text-left font-medium">#</th>
                  <th className="px-3 py-2.5 text-left font-medium">Người chơi</th>
                  <th className="px-3 py-2.5 text-right font-medium">Điểm</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">T/H/B</th>
                  <th className="px-3 py-2.5 text-right font-medium">Tỉ lệ thắng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s, i) => (
                  <tr key={s.userId} className="bg-surface-hover/30">
                    <td className="px-3 py-3 text-muted">{MEDALS[i] ?? i + 1}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{s.displayName}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-amber-400">{s.rating}</td>
                    <td className="hidden px-3 py-3 text-right font-mono text-muted sm:table-cell">
                      <span className="text-teal-400">{s.wins}</span>/
                      <span>{s.draws}</span>/
                      <span className="text-coral-500">{s.losses}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-muted">{winRate(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
