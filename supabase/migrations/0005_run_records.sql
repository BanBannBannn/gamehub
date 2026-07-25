-- GameHub — Kỷ lục cá nhân cho các game "run" (Dead Cells Lite, ...). Chạy
-- sau 0001_init.sql. Chỉ áp dụng cho NGƯỜI ĐÃ ĐĂNG NHẬP (giống player_stats
-- ở 0004_leaderboard.sql) — khách vẫn chơi được, kỷ lục của khách chỉ lưu
-- localStorage phía client, không ghi lên đây.
--
-- Tính năng tuỳ chọn: nếu bỏ qua migration này, client tự nuốt lỗi và game
-- vẫn chơi được bình thường (chỉ mất phần lưu kỷ lục lên mây).

create table if not exists public.run_records (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null,
  display_name text not null,
  best_rooms_cleared int not null default 0,
  best_time_ms int,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

alter table public.run_records enable row level security;

drop policy if exists "Ai cũng xem được kỷ lục" on public.run_records;
create policy "Ai cũng xem được kỷ lục" on public.run_records for select using (true);

drop policy if exists "Người dùng ghi kỷ lục của chính mình" on public.run_records;
create policy "Người dùng ghi kỷ lục của chính mình" on public.run_records for insert with check (auth.uid() = user_id);

drop policy if exists "Người dùng cập nhật kỷ lục của chính mình" on public.run_records;
create policy "Người dùng cập nhật kỷ lục của chính mình" on public.run_records for update using (auth.uid() = user_id);

create index if not exists run_records_leaderboard_idx on public.run_records (game_slug, best_rooms_cleared desc, best_time_ms asc);
