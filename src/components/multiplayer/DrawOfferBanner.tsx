"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Handshake } from "lucide-react";

interface DrawOfferBannerProps {
  opponentName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function DrawOfferBanner({ opponentName, onAccept, onDecline }: DrawOfferBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex w-full max-w-[min(92vw,600px)] flex-col items-center gap-2 rounded-xl border border-teal-400/40 bg-teal-400/10 px-4 py-3 text-center sm:flex-row sm:justify-between"
      >
        <span className="flex items-center gap-2 text-sm text-foreground">
          <Handshake size={16} className="text-teal-500" />
          {opponentName} đang xin hoà. Bạn đồng ý chứ?
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-500/90"
          >
            Đồng ý
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-border"
          >
            Từ chối
          </button>
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
