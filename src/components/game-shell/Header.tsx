"use client";

import Link from "next/link";
import { Moon, Sun, Grid3x3 } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-ink-950">
            <Grid3x3 size={18} strokeWidth={2.5} />
          </span>
          GameHub
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href="/profile"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            Hồ sơ
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-surface-hover px-3 py-2 text-sm font-medium text-foreground transition hover:bg-border"
          >
            Đăng nhập
          </Link>
        </nav>
      </div>
    </header>
  );
}
