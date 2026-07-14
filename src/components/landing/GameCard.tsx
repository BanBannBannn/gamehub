"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={comingSoon ? undefined : { y: -4 }}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-colors ${
        comingSoon
          ? "border-dashed border-border-hover bg-transparent"
          : "border-border-hover bg-surface-hover/60 hover:border-amber-400/60"
      }`}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        {tag && (
          <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-muted">
            {tag}
          </span>
        )}
        {badge && !comingSoon && (
          <span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-xs font-medium text-teal-400">
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
    </motion.div>
  );

  if (comingSoon || !href) return content;
  return <Link href={href}>{content}</Link>;
}
