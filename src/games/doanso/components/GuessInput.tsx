"use client";

import { useEffect, useId, useRef } from "react";
import { useDoansoStore } from "@/games/doanso/store";

export function GuessInput({ onSubmit }: { onSubmit: () => void }) {
  const length = useDoansoStore((s) => s.length);
  const currentInput = useDoansoStore((s) => s.currentInput);
  const setCurrentInput = useDoansoStore((s) => s.setCurrentInput);
  const errorMessage = useDoansoStore((s) => s.errorMessage);
  const status = useDoansoStore((s) => s.status);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // ID ổn định (an toàn với SSR) để chặn trình duyệt gợi ý autofill,
  // thay cho Math.random() gọi trực tiếp trong render (không tinh khiết).
  const instanceId = useId();

  const digits = Array.from({ length }, (_, i) => currentInput[i] ?? "");

  useEffect(() => {
    if (currentInput.length === 0) {
      inputRefs.current[0]?.focus();
    }
  }, [currentInput.length, length]);

  function updateDigitAt(index: number, digit: string) {
    const next = digits.map((d, i) => (i === index ? digit : d)).join("");
    setCurrentInput(next);
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    const chars = pasted.slice(0, length - index).split("");
    const nextDigits = [...digits];
    chars.forEach((c, i) => {
      nextDigits[index + i] = c;
    });
    setCurrentInput(nextDigits.join(""));
    const nextFocusIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  }

  function handleChange(index: number, rawValue: string) {
    const value = rawValue.replace(/[^0-9]/g, "");
    if (value.length === 0) {
      updateDigitAt(index, "");
      return;
    }
    // Lấy ký tự cuối cùng (nếu người dùng bấm nhanh trên điện thoại)
    const char = value.slice(-1);
    updateDigitAt(index, char);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === "Enter" && currentInput.length === length) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            disabled={status !== "playing"}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2} // Đặt 2 để chặn autofill dài nhưng vẫn nhận đc phím gõ đè
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
            name={`guess-digit-${index}-${instanceId}`}
            aria-label={`Chữ số thứ ${index + 1}`}
            className="h-12 w-10 rounded-lg border border-ink-700 bg-ink-900 text-center font-mono text-xl text-paper-100 outline-none focus:border-amber-400 disabled:opacity-50 sm:h-14 sm:w-12"
          />
        ))}
      </div>
      {errorMessage && <p className="text-sm text-coral-500">{errorMessage}</p>}
    </div>
  );
}
