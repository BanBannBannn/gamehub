"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Mail, X, Send, CheckCircle2, AlertCircle } from "lucide-react";

const REPORT_CATEGORIES = [
  "🐛 Báo lỗi Game (Bug / Crash / Visual Error)",
  "💡 Góp ý tính năng / Game mode mới",
  "⚖️ Cân bằng độ khó / AI Bot Balance",
  "🎨 Giao diện & Âm thanh Synth FX",
  "⚡ Lỗi hiệu năng / Lag / Drop FPS",
  "🌐 Lỗi kết nối Online Realtime / Multiplayer",
  "💬 Góp ý & Phản hồi chung",
];

interface GameReportModalProps {
  gameTitle?: string;
  buttonLabel?: string;
  className?: string;
}

export function GameReportModal({
  gameTitle,
  buttonLabel = "Góp ý",
  className = "",
}: GameReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const derivedTitle =
    gameTitle ||
    (pathname?.startsWith("/games/")
      ? pathname.replace("/games/", "").toUpperCase()
      : "Trang chủ GameHub");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userEmail.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: derivedTitle,
          category,
          message,
          userEmail,
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gửi email thất bại");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setMessage("");
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        <button
          onClick={() => setIsOpen(false)}
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 font-display text-lg font-bold text-white pr-6">
          <Mail className="text-rose-500 shrink-0" size={20} />
          <span>Báo Cáo / Góp Ý ({derivedTitle})</span>
        </div>

        {success ? (
          <div className="my-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 size={48} className="text-emerald-400 animate-bounce" />
            <h3 className="font-display text-lg font-bold text-emerald-400">
              Đã Gửi Báo Cáo Thành Công! 🎉
            </h3>
            <p className="text-xs text-slate-400">Cảm ơn bạn đã gửi ý kiến đóng góp cho GameHub.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Của Bạn <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Danh Mục Báo Cáo (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
              >
                {REPORT_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nội Dung Báo Cáo Chi Tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả chi tiết lỗi hoặc ý kiến góp ý của bạn..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-amber-400 focus:outline-hidden resize-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !message.trim() || !userEmail.trim()}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 font-bold text-white transition hover:bg-rose-500 active:scale-95 disabled:opacity-50 shadow-md cursor-pointer"
            >
              <Send size={16} />
              <span>{loading ? "Đang gửi..." : "Gửi báo cáo 📩"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/60 active:scale-95 shadow-xs cursor-pointer ${className}`}
      >
        <Mail size={14} className="text-rose-400" />
        <span>{buttonLabel}</span>
      </button>

      {/* React Portal teleports the modal straight to document.body, escaping CSS backdrop-filter stacking context */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
