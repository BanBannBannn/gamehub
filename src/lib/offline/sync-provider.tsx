"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPendingSessions, removePendingSession } from "@/lib/offline/db";

interface SyncContextValue {
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextValue>({ isOnline: true });

export function useIsOnline(): boolean {
  return useContext(SyncContext).isOnline;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  const flushPendingSessions = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return; // guest-only mode, nothing to sync

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return; // not logged in, keep sessions queued locally

    const pending = await getPendingSessions();
    for (const session of pending) {
      const { error } = await supabase.from("game_sessions").insert({
        id: session.id,
        user_id: userData.user.id,
        game_slug: session.gameSlug,
        difficulty: session.difficulty,
        duration_seconds: session.durationSeconds,
        hints_used: session.hintsUsed,
        completed: session.completed,
        created_at: session.createdAt,
      });
      if (!error) {
        await removePendingSession(session.id);
      }
    }
  }, []);

  useEffect(() => {
    // navigator.onLine is only available in the browser, so this must be
    // read after mount rather than during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      void flushPendingSessions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      void flushPendingSessions();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushPendingSessions]);

  return <SyncContext.Provider value={{ isOnline }}>{children}</SyncContext.Provider>;
}
