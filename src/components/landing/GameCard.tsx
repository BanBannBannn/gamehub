"use client";

import Link from "next/link";

interface GameCardProps {
  href?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
  tag?: string;
  comingSoon?: boolean;
}

export function GameCard({ href, title, description, icon, accent, badge, tag, comingSoon }: GameCardProps) {
  const content = (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
        comingSoon
          ? "border-dashed border-border-hover bg-transparent"
          : "border-border-hover bg-surface-hover/60 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-lg"
      }`}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        {tag && (
          <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-muted">
            {tag}
          </span>
        )}
        {badge && !comingSoon && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              badge === "Thử nghiệm"
                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30 shadow-xs"
                : "bg-teal-400/15 text-teal-400"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <span
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm text-muted">{description}</p>
      </div>
      {comingSoon ? (
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-600">Sắp ra mắt</p>
      ) : (
        <p className="mt-6 text-sm font-medium text-amber-400 opacity-0 transition-opacity group-hover:opacity-100">
          Chơi ngay →
        </p>
      )}
    </div>
  );

  if (comingSoon || !href) return content;
  return <Link href={href}>{content}</Link>;
}
