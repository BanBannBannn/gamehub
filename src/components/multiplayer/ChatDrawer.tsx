"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { ChatMessage } from "@/lib/multiplayer/types";

const QUICK_EMOJIS = ["👍", "😂", "😮", "😢", "😡", "❤️", "🎉", "🤔"];

interface ChatDrawerProps {
  messages: ChatMessage[];
  myId: string;
  onSend: (text: string) => void;
}

export function ChatDrawer({ messages, myId, onSend }: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevCountRef.current && !open) {
      setUnread((u) => u + (messages.length - prevCountRef.current));
    }
    prevCountRef.current = messages.length;
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function handleOpen() {
    setOpen(true);
    setUnread(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length === 0) return;
    onSend(text);
    setText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label="Mở khung chat"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-ink-950 shadow-lg transition hover:bg-amber-500 active:scale-95"
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="fixed bottom-20 right-4 z-40 flex h-96 w-[min(90vw,340px)] flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
              <p className="font-display text-sm font-semibold text-paper-100">Trò chuyện</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chat" className="text-ink-400 hover:text-paper-100">
                <X size={16} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-ink-600">Chưa có tin nhắn nào — bắt đầu trò chuyện nhé!</p>
              )}
              {messages.map((m, i) => {
                const isMine = m.senderId === myId;
                return (
                  <div key={i} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    {!isMine && <span className="text-[10px] text-ink-600">{m.senderName}</span>}
                    <span
                      className={`max-w-[80%] rounded-xl px-3 py-1.5 text-sm ${
                        isMine ? "bg-amber-400 text-ink-950" : "bg-ink-800 text-paper-100"
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1 border-t border-ink-800 px-3 py-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSend(emoji)}
                  className="rounded-lg p-1 text-lg transition hover:bg-ink-800 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-ink-800 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="Nhắn gì đó..."
                className="flex-1 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={text.trim().length === 0}
                aria-label="Gửi"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-ink-950 transition hover:bg-amber-500 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
