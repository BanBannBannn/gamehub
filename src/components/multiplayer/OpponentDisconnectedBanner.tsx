"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OpponentDisconnectedBanner({
  opponentName,
  secondsLeft,
}: {
  opponentName: string;
  secondsLeft?: number | null;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 rounded-full bg-coral-500/15 px-4 py-1.5 text-xs text-coral-500"
      >
        <WifiOff size={14} />
        {opponentName} mất kết nối
        {secondsLeft != null && secondsLeft > 0
          ? ` — tự xử thắng cho bạn sau ${secondsLeft}s`
          : ", đang chờ quay lại..."}
      </motion.div>
    </AnimatePresence>
  );
}
