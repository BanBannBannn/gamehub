"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { Trophy, Star, CheckCircle, Lock, Award } from "lucide-react";
import { getAchievements, Achievement } from "@/lib/achievements";

export default function AchievementsPage() {
  const [list, setList] = useState<Achievement[]>([]);

  useEffect(() => {
    setList(getAchievements());
  }, []);

  const totalUnlocked = list.filter((a) => a.unlocked).length;
  const totalXp = list.reduce((sum, a) => sum + (a.unlocked ? a.xp : 0), 0);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] px-4 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          {/* Header Banner */}
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-lg">
              <Trophy size={36} />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              DANH HIỆU & THÀNH TỰU 🏆
            </h1>
            <p className="max-w-md text-sm text-muted">
              Mở khóa các danh hiệu độc quyền bằng cách chinh phục thử thách trong các trò chơi!
            </p>

            {/* Overall Stats Cards */}
            <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-4">
              <div className="flex flex-col items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                <span className="text-xs text-muted">ĐÃ MỞ KHÓA</span>
                <p className="font-mono text-2xl font-extrabold text-amber-400">
                  {totalUnlocked} / {list.length}
                </p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                <span className="text-xs text-muted">TỔNG ĐIỂM XP</span>
                <p className="font-mono text-2xl font-extrabold text-cyan-400">
                  {totalXp} XP
                </p>
              </div>
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {list.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-2xl border p-5 transition ${
                  item.unlocked
                    ? "border-amber-400/40 bg-surface shadow-lg shadow-amber-400/5"
                    : "border-border bg-surface/50 opacity-60"
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                    item.unlocked
                      ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 shadow-inner"
                      : "bg-surface-hover text-muted border border-border"
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">
                      {item.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      +{item.xp} XP
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                    {item.unlocked ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle size={12} /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted">
                        <Lock size={12} /> Chưa mở khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
