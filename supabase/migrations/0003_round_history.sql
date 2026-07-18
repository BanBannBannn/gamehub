-- GameHub — Lịch sử ván đấu online (giai đoạn 4, tính năng tuỳ chọn)
-- Chạy sau 0002_multiplayer.sql.
--
-- QUAN TRỌNG về việc không làm phình DB: bảng này chỉ ghi ĐÚNG 1 DÒNG
-- mỗi khi 1 VÁN kết thúc (không phải mỗi nước đi) — số dòng tỉ lệ với số
-- ván đã hoàn thành thực sự, không tỉ lệ với số nước đi hay số phòng tạo
-- ra rồi bỏ dở. Đây là tính năng tuỳ chọn: nếu bạn không cần xem lại lịch
-- sử ván đấu, có thể bỏ qua migration này hoàn toàn — không ảnh hưởng gì
-- tới các tính năng chơi online khác.

create table if not exists public.room_round_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  room_code text not null,
  game_slug text not null,
  round_number int not null,
  final_game_state jsonb,          -- snapshot cuối cùng (movesHistory/pgn/moves...) để có thể xem lại
  winner_slot int,                  -- null nếu hoà
  players jsonb not null,           -- snapshot tên người chơi tại thời điểm kết thúc ván (không cần join lại room_players vì phòng có thể đã bị dọn)
  finished_at timestamptz not null default now()
);

alter table public.room_round_history enable row level security;

drop policy if exists "Ai cũng đọc được lịch sử ván đấu" on public.room_round_history;
create policy "Ai cũng đọc được lịch sử ván đấu" on public.room_round_history for select using (true);
drop policy if exists "Ai cũng có thể ghi lịch sử ván đấu" on public.room_round_history;
create policy "Ai cũng có thể ghi lịch sử ván đấu" on public.room_round_history for insert with check (true);

create index if not exists room_round_history_room_id_idx on public.room_round_history (room_id);
create index if not exists room_round_history_game_slug_idx on public.room_round_history (game_slug, finished_at desc);

-- (Tuỳ chọn) Dọn lịch sử quá cũ nếu muốn giới hạn kích thước bảng lâu
-- dài — KHÔNG bắt buộc, chỉ bật nếu bạn thực sự cần, ví dụ giữ 90 ngày:
--
-- create or replace function public.cleanup_old_round_history() returns void as $$
-- begin
--   delete from public.room_round_history where finished_at < now() - interval '90 days';
-- end;
-- $$ language plpgsql security definer set search_path = public;
