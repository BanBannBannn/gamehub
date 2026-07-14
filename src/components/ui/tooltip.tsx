"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ label, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={id}>{children}</span>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg ${
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
