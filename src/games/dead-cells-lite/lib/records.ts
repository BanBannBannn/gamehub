import { createClient } from "@/lib/supabase/client";
import { getCurrentIdentity } from "@/lib/multiplayer/guest";

const GAME_SLUG = "dead-cells-lite";
const LOCAL_KEY = "gamehub:dead-cells-lite:best";

export interface RunRecord {
  roomsCleared: number;
  timeMs: number;
}

function isNewBest(candidate: RunRecord, current: RunRecord | null): boolean {
  if (!current) return true;
  if (candidate.roomsCleared !== current.roomsCleared) return candidate.roomsCleared > current.roomsCleared;
  return candidate.timeMs < current.timeMs;
}

export function getLocalBest(): RunRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as RunRecord) : null;
  } catch {
    return null;
  }
}

function setLocalBest(record: RunRecord): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(record));
}

/**
 * Ghi kết quả 1 lượt chơi nếu là kỷ lục mới. Luôn cập nhật localStorage
 * (chơi offline/khách vẫn có kỷ lục cá nhân); chỉ đồng bộ lên Supabase nếu
 * đã đăng nhập — theo đúng triết lý self-report của `player_stats`
 * (xem src/lib/multiplayer/stats.ts). Không được phép làm hỏng luồng chơi
 * nếu bảng chưa migrate hoặc mất mạng.
 */
export async function saveRunResult(result: RunRecord): Promise<{ isNewBest: boolean; best: RunRecord }> {
  const current = getLocalBest();
  const newBest = isNewBest(result, current) ? result : current!;
  const becameNewBest = !current || newBest === result;
  if (becameNewBest) setLocalBest(result);

  try {
    const identity = await getCurrentIdentity();
    if (!identity.isGuest && becameNewBest) {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("run_records").upsert(
          {
            user_id: identity.id,
            game_slug: GAME_SLUG,
            display_name: identity.displayName,
            best_rooms_cleared: result.roomsCleared,
            best_time_ms: result.timeMs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,game_slug" }
        );
      }
    }
  } catch {
    // Bảng chưa migrate / mất mạng — bỏ qua, kỷ lục local vẫn còn.
  }

  return { isNewBest: becameNewBest, best: newBest };
}
