-- GameHub — Multiplayer online (phòng chơi realtime qua Supabase Realtime)
-- Chạy sau 0001_init.sql. Xem ONLINE_MULTIPLAYER_PLAN.md để biết bối cảnh
-- thiết kế đầy đủ (vòng đời phòng, lý do không lưu chat/lịch sử nước đi...).

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_slug text not null,
  status text not null default 'waiting',  -- 'waiting' | 'playing' | 'round_finished' | 'closed'
  max_players int not null,
  host_user_id uuid references public.profiles(id),
  host_guest_id text,
  round_number int not null default 1,
  scoreboard jsonb not null default '{}',   -- { "<slot>": <số ván thắng> }
  game_state jsonb,
  settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  slot int not null,
  user_id uuid references public.profiles(id),
  guest_id text,
  display_name text not null,
  is_ready boolean not null default false,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, slot),
  check (user_id is not null or guest_id is not null)
);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

-- Phòng chơi mang tính "công khai với người có mã phòng" — kiểm soát
-- truy cập ở tầng ứng dụng (phải biết đúng mã mới join), không phải RLS.
drop policy if exists "Ai cũng đọc được thông tin phòng" on public.rooms;
create policy "Ai cũng đọc được thông tin phòng" on public.rooms for select using (true);
drop policy if exists "Ai cũng tạo được phòng" on public.rooms;
create policy "Ai cũng tạo được phòng" on public.rooms for insert with check (true);
drop policy if exists "Người trong phòng có thể cập nhật phòng" on public.rooms;
create policy "Người trong phòng có thể cập nhật phòng" on public.rooms for update using (true);

drop policy if exists "Ai cũng đọc được danh sách người chơi trong phòng" on public.room_players;
create policy "Ai cũng đọc được danh sách người chơi trong phòng" on public.room_players for select using (true);
drop policy if exists "Ai cũng có thể tham gia phòng" on public.room_players;
create policy "Ai cũng có thể tham gia phòng" on public.room_players for insert with check (true);
drop policy if exists "Người chơi có thể cập nhật trạng thái của chính mình" on public.room_players;
create policy "Người chơi có thể cập nhật trạng thái của chính mình" on public.room_players for update using (true);
drop policy if exists "Người chơi có thể rời phòng" on public.room_players;
create policy "Người chơi có thể rời phòng" on public.room_players for delete using (true);

create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_status_updated_idx on public.rooms (status, updated_at);
create index if not exists room_players_room_id_idx on public.room_players (room_id);

-- Bật Realtime cho 2 bảng này (Postgres Changes) để client tự cập nhật
-- danh sách người chơi / trạng thái phòng theo thời gian thực.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;

-- Dọn phòng rác tự động — đăng ký chạy định kỳ (5-10 phút/lần) qua
-- Supabase Dashboard → Database → Cron Jobs (pg_cron), ví dụ:
--   select cron.schedule('cleanup-stale-rooms', '*/10 * * * *',
--     $$ select public.cleanup_stale_rooms(); $$);
-- Không tự động bật cron trong migration này vì pg_cron cần được bật
-- riêng (extension) tuỳ theo gói Supabase — xem SETUP.md.
create or replace function public.cleanup_stale_rooms() returns void as $$
begin
  -- Phòng chờ quá lâu không đủ người / không ai sẵn sàng.
  update public.rooms set status = 'closed', updated_at = now()
  where status = 'waiting' and updated_at < now() - interval '15 minutes';

  -- Phòng mà TẤT CẢ người chơi đều mất kết nối khá lâu.
  update public.rooms r set status = 'closed', updated_at = now()
  where r.status in ('waiting', 'playing', 'round_finished')
    and not exists (
      select 1 from public.room_players p
      where p.room_id = r.id and p.is_connected = true
    )
    and r.updated_at < now() - interval '5 minutes';

  -- Phòng đã đóng từ lâu → xoá hẳn khỏi DB (room_players tự xoá theo do "on delete cascade").
  delete from public.rooms where status = 'closed' and updated_at < now() - interval '2 hours';
end;
$$ language plpgsql security definer set search_path = public;
