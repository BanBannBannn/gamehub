"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun, Grid3x3, Trophy, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { getMuted, setMuted } from "@/lib/sound";
import { GameReportModal } from "@/components/game-shell/GameReportModal";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [muted, setMutedState] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMutedState(getMuted());
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: Logo + GameHub Title */}
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-ink-950 shadow-xs">
            <Grid3x3 size={18} strokeWidth={2.5} />
          </span>
          <span className="font-bold tracking-tight text-foreground">GameHub</span>
        </Link>

        {/* Right Navigation */}
        <nav className="flex items-center gap-2">
          {/* Report Pop-up Button Placed Right Next to Speaker Volume Icon */}
          <GameReportModal
            buttonLabel="Góp ý 📩"
            className="bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl shrink-0"
          />

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/leaderboard"
            className="hidden sm:flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground shrink-0"
          >
            <Trophy size={16} className="text-amber-400" />
            <span>Xếp hạng</span>
          </Link>
          <Link
            href="/profile"
            className="hidden md:inline-block rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground shrink-0"
          >
            Hồ sơ
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground transition hover:bg-border shrink-0"
          >
            Đăng nhập
          </Link>
        </nav>
      </div>
    </header>
  );
}
