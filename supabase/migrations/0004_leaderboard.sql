-- GameHub — Bảng xếp hạng (Elo) cho các game online. Chạy sau 0002_multiplayer.sql.
--
-- Chỉ tính xếp hạng cho NGƯỜI ĐÃ ĐĂNG NHẬP (user_id). Người chơi khách vẫn
-- chơi online bình thường nhưng không được ghi vào bảng này. Mỗi user có 1
-- dòng cho mỗi game (khoá chính kép user_id + game_slug). Điểm khởi đầu 1000,
-- cập nhật theo công thức Elo (xem src/lib/multiplayer/rating.ts) sau MỖI ván
-- online kết thúc — số dòng tỉ lệ với số người chơi, không phình theo số ván.
--
-- Tính năng tuỳ chọn: nếu bỏ qua migration này, client tự nuốt lỗi (giống
-- room_round_history) và các tính năng online khác không bị ảnh hưởng.

create table if not exists public.player_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null,
  display_name text not null,
  rating int not null default 1000,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  games int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

alter table public.player_stats enable row level security;

-- Bảng xếp hạng công khai (ai cũng xem được). Ghi từ client (đồng bộ triết lý
-- validate-ở-client + RLS permissive của repo — có thể siết bằng Edge Function
-- sau, xem supabase/functions/validate-move/). Chỉ cho ghi khi user_id ứng với
-- người đang đăng nhập để hạn chế giả mạo điểm của người khác.
drop policy if exists "Ai cũng xem được bảng xếp hạng" on public.player_stats;
create policy "Ai cũng xem được bảng xếp hạng" on public.player_stats for select using (true);

drop policy if exists "Người dùng ghi điểm của chính mình" on public.player_stats;
create policy "Người dùng ghi điểm của chính mình" on public.player_stats for insert with check (auth.uid() = user_id);

drop policy if exists "Người dùng cập nhật điểm của chính mình" on public.player_stats;
create policy "Người dùng cập nhật điểm của chính mình" on public.player_stats for update using (auth.uid() = user_id);

create index if not exists player_stats_leaderboard_idx on public.player_stats (game_slug, rating desc);
