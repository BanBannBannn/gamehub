import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmModalProps) {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDanger ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {title}
                </h3>
              </div>
              
              <p className="text-sm text-muted">
                {message}
              </p>

              <div className="mt-2 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
                    isDanger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
