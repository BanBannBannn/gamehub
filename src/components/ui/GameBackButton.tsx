"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

interface GameBackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function GameBackButton({
  href = "/",
  label = "Quay về trang chủ",
  className = "",
}: GameBackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border border-border-hover bg-surface-hover/80 px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-amber-400 hover:bg-surface active:scale-[0.98] ${className}`}
    >
      <ArrowLeft size={16} />
      <Home size={16} className="text-amber-400" />
      <span>{label}</span>
    </Link>
  );
}
