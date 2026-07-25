"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DoorOpen, KeyRound, Loader2, Zap } from "lucide-react";
import { OpenRoomsBrowser } from "./OpenRoomsBrowser";

interface RoomLobbyProps {
  gameSlug: string;
  gameTitle: string;
  isLoading: boolean;
  error: string | null;
  notice?: string | null;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onQuickMatch?: () => void;
  onBack: () => void;
}

export function RoomLobby({
  gameSlug,
  gameTitle,
  isLoading,
  error,
  notice,
  onCreate,
  onJoin,
  onQuickMatch,
  onBack,
}: RoomLobbyProps) {
  const [joinMode, setJoinMode] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Chơi online — {gameTitle}</h1>
        <p className="mt-2 text-sm text-muted">
          Tạo phòng mới rồi gửi mã cho bạn bè, hoặc nhập mã phòng đã có sẵn.
        </p>
      </div>

      {notice && (
        <p className="w-full rounded-lg border border-border-hover bg-surface-hover/60 px-4 py-2 text-sm text-muted">
          {notice}
        </p>
      )}

      {!joinMode ? (
        <div className="grid w-full gap-3">
          {onQuickMatch && (
            <motion.button
              type="button"
              onClick={onQuickMatch}
              disabled={isLoading}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center gap-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-left transition hover:border-amber-400 hover:bg-amber-400/15 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400">
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
              </span>
              <span>
                <p className="font-display text-lg font-semibold text-foreground group-hover:text-amber-400">
                  Chơi nhanh
                </p>
                <p className="text-sm text-muted">Tự tìm phòng còn chỗ hoặc tạo phòng mới cho bạn</p>
              </span>
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={onCreate}
            disabled={isLoading}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-4 rounded-xl border border-border-hover bg-surface p-4 text-left transition hover:border-amber-400 hover:bg-surface-hover active:scale-[0.98] disabled:opacity-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              {isLoading ? <Loader2 size={22} className="animate-spin" /> : <DoorOpen size={22} />}
            </span>
            <span>
              <p className="font-display text-lg font-semibold text-foreground group-hover:text-amber-400">
                Tạo phòng mới
              </p>
              <p className="text-sm text-muted">Nhận mã phòng để mời bạn bè vào chơi</p>
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setJoinMode(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group flex items-center gap-4 rounded-xl border border-border-hover bg-surface p-4 text-left transition hover:border-amber-400 hover:bg-surface-hover active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/15 text-teal-400">
              <KeyRound size={22} />
            </span>
            <span>
              <p className="font-display text-lg font-semibold text-foreground group-hover:text-amber-400">
                Tham gia phòng
              </p>
              <p className="text-sm text-muted">Nhập mã phòng bạn bè đã gửi</p>
            </span>
          </motion.button>
        </div>
      ) : (
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onJoin(codeInput);
          }}
        >
          <input
            autoFocus
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Ví dụ: 7K9XPB"
            maxLength={8}
            className="rounded-xl border border-border-hover bg-surface px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-foreground outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={isLoading || codeInput.trim().length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-medium text-foreground transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            Tham gia
          </button>
          <button
            type="button"
            onClick={() => setJoinMode(false)}
            className="text-sm text-muted hover:text-foreground"
          >
            ← Quay lại
          </button>
        </form>
      )}

      {error && <p className="text-sm text-coral-500">{error}</p>}

      {!joinMode && (
        <>
          <OpenRoomsBrowser gameSlug={gameSlug} onJoinCode={onJoin} />
          <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
            ← Chọn chế độ khác
          </button>
        </>
      )}
    </div>
  );
}
