import { createClient } from "@/lib/supabase/client";
import { computeNewRating, DEFAULT_RATING, MatchResult } from "./rating";

export interface PlayerStat {
  userId: string;
  gameSlug: string;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  updatedAt: string;
}

function mapStatRow(row: {
  user_id: string;
  game_slug: string;
  display_name: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  updated_at: string;
}): PlayerStat {
  return {
    userId: row.user_id,
    gameSlug: row.game_slug,
    displayName: row.display_name,
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    games: row.games,
    updatedAt: row.updated_at,
  };
}

/** Lấy điểm rating hiện tại của 1 user cho 1 game (mặc định 1000 nếu chưa có). */
async function fetchRating(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string,
  gameSlug: string
): Promise<number> {
  const { data } = await supabase
    .from("player_stats")
    .select("rating")
    .eq("user_id", userId)
    .eq("game_slug", gameSlug)
    .maybeSingle();
  return data?.rating ?? DEFAULT_RATING;
}

/**
 * Ghi kết quả 1 ván online cho CHÍNH người đang đăng nhập (self-report).
 *
 * Mỗi client tự gọi hàm này cho phía của mình khi ván kết thúc → chỉ ghi
 * đúng 1 dòng của mình (khớp RLS `auth.uid() = user_id`), không cần "người
 * báo cáo" duy nhất. Bỏ qua nếu mình là khách (chưa đăng nhập) hoặc bảng
 * chưa được migrate — xếp hạng là tính năng tuỳ chọn, không được phép làm
 * hỏng luồng chơi online chính.
 */
export async function recordMyMatchResult(params: {
  gameSlug: string;
  myUserId: string | null; // null nếu là khách → không tính xếp hạng
  myDisplayName: string;
  opponentUserId: string | null; // null nếu đối thủ là khách → coi như điểm mặc định
  result: MatchResult;
}): Promise<void> {
  const { gameSlug, myUserId, myDisplayName, opponentUserId, result } = params;
  if (!myUserId) return; // khách không được xếp hạng

  const supabase = createClient();
  if (!supabase) return;

  try {
    const [myRating, opponentRating] = await Promise.all([
      fetchRating(supabase, myUserId, gameSlug),
      opponentUserId ? fetchRating(supabase, opponentUserId, gameSlug) : Promise.resolve(DEFAULT_RATING),
    ]);

    const newRating = computeNewRating(myRating, opponentRating, result);

    // Lấy số liệu tích luỹ hiện tại để cộng dồn (upsert thủ công vì cần
    // increment có điều kiện theo kết quả).
    const { data: existing } = await supabase
      .from("player_stats")
      .select("wins, losses, draws, games")
      .eq("user_id", myUserId)
      .eq("game_slug", gameSlug)
      .maybeSingle();

    const base = existing ?? { wins: 0, losses: 0, draws: 0, games: 0 };
    await supabase.from("player_stats").upsert(
      {
        user_id: myUserId,
        game_slug: gameSlug,
        display_name: myDisplayName,
        rating: newRating,
        wins: base.wins + (result === "win" ? 1 : 0),
        losses: base.losses + (result === "loss" ? 1 : 0),
        draws: base.draws + (result === "draw" ? 1 : 0),
        games: base.games + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_slug" }
    );
  } catch {
    // Bảng chưa migrate / lỗi mạng — bỏ qua, không ảnh hưởng luồng chơi.
  }
}

/** Bảng xếp hạng của 1 game, sắp theo điểm giảm dần. */
export async function listLeaderboard(gameSlug: string, limit = 100): Promise<PlayerStat[]> {
  const supabase = createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("game_slug", gameSlug)
      .order("rating", { ascending: false })
      .order("games", { ascending: false })
      .limit(limit);
    return (data ?? []).map(mapStatRow);
  } catch {
    return [];
  }
}

/** Toàn bộ thống kê xếp hạng của 1 user (mọi game) — dùng cho trang Hồ sơ. */
export async function listMyStats(userId: string): Promise<PlayerStat[]> {
  const supabase = createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .order("rating", { ascending: false });
    return (data ?? []).map(mapStatRow);
  } catch {
    return [];
  }
}
