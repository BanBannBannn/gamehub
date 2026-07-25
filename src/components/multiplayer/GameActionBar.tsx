"use client";

import { Flag, Handshake, LogOut } from "lucide-react";

interface GameActionBarProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onLeave: () => void;
  drawOfferPending: boolean; // true nếu CHÍNH MÌNH vừa gửi lời mời hoà, đang chờ đối thủ phản hồi
  disabled?: boolean;
}

/**
 * 3 nút hành động trong lúc đang chơi 1 ván online — hiển thị bên dưới
 * bàn cờ/lịch sử nước đi. Không tự mở modal xác nhận ở đây — component
 * cha (mỗi `*OnlineGame.tsx`) chịu trách nhiệm mở `ConfirmActionModal`
 * khi các callback này được gọi.
 */
export function GameActionBar({ onResign, onOfferDraw, onLeave, drawOfferPending, disabled }: GameActionBarProps) {
  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={onResign}
        disabled={disabled}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-hover px-3 py-2 text-xs font-medium text-foreground transition hover:bg-coral-500/20 hover:text-coral-500 disabled:opacity-40 sm:text-sm"
      >
        <Flag size={14} />
        Đầu hàng
      </button>
      <button
        type="button"
        onClick={onOfferDraw}
        disabled={disabled || drawOfferPending}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-hover px-3 py-2 text-xs font-medium text-foreground transition hover:bg-teal-400/20 hover:text-teal-500 disabled:opacity-40 sm:text-sm"
      >
        <Handshake size={14} />
        {drawOfferPending ? "Đã gửi lời mời hoà" : "Cầu hoà"}
      </button>
      <button
        type="button"
        onClick={onLeave}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-hover px-3 py-2 text-xs font-medium text-foreground transition hover:bg-border sm:text-sm"
      >
        <LogOut size={14} />
        Rời phòng
      </button>
    </div>
  );
}
