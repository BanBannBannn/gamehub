-- GameHub initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`
-- if you use the Supabase CLI.

-- 1. Profiles: extends auth.users with public-safe fields.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Game sessions: one row per completed/attempted game round.
-- `game_slug` is a free-text identifier ('sudoku', and future games)
-- so this table can be reused without schema changes as more games
-- are added.
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null,
  difficulty text,
  duration_seconds integer,
  hints_used integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.game_sessions enable row level security;

create policy "Users can view their own sessions"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.game_sessions for update
  using (auth.uid() = user_id);

create index if not exists game_sessions_user_id_idx on public.game_sessions (user_id);
create index if not exists game_sessions_game_slug_idx on public.game_sessions (game_slug);
