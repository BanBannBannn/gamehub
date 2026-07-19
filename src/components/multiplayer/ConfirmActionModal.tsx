"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal xác nhận dùng chung cho các hành động quan trọng trong ván chơi
 * online (đầu hàng, rời phòng...) — thay cho `window.confirm()` mặc định
 * của trình duyệt (xấu, không đồng bộ giao diện, và trên 1 số trình
 * duyệt mobile hiển thị rất khó chịu).
 */
export function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Huỷ",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl"
          >
            <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted">{message}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg bg-surface-hover py-2.5 text-sm font-medium text-foreground transition hover:bg-border"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition active:scale-[0.98] ${
                  danger
                    ? "bg-coral-500 text-white hover:bg-coral-500/90"
                    : "bg-amber-400 text-ink-950 hover:bg-amber-500"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
