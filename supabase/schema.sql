-- Interaktif Futbol Menajerlik Oyunu — Supabase / PostgreSQL şeması
-- Bu dosyayı Supabase SQL Editor'de çalıştırın.

create extension if not exists "pgcrypto";

-- 1. Kullanıcı Profilleri
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- 2. Takım Bilgileri
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  coins bigint default 10000,
  division int default 10,
  formation text default '4-3-3',
  tactics text default 'BALANCED',
  points int default 0,
  played int default 0,
  won int default 0,
  drawn int default 0,
  lost int default 0,
  goals_for int default 0,
  goals_against int default 0,
  kit_primary text default '#3dff8a',
  kit_secondary text default '#0b1220',
  created_at timestamptz default now()
);

-- 3. Ana Futbolcu Kataloğu (Master Dataset)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nationality text not null,
  nationality_code text not null default 'un',
  position text not null check (position in ('KL', 'DEF', 'OS', 'FV')),
  age int not null,
  attack int not null check (attack between 1 and 99),
  defense int not null check (defense between 1 and 99),
  overall int not null check (overall between 1 and 99),
  base_value bigint not null
);

-- 4. Takım Kadroları ve Durumları
create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete restrict,
  energy int default 100 check (energy between 0 and 100),
  form int default 80 check (form between 0 and 100),
  is_starter boolean default false,
  squad_position text,
  acquired_at timestamptz default now()
);

-- Bir futbolcu aynı anda yalnızca bir takımda olabilir
create unique index if not exists team_players_player_unique
  on public.team_players (player_id);

-- 5. Transfer Pazarı
create table if not exists public.transfer_market (
  id uuid primary key default gen_random_uuid(),
  team_player_id uuid references public.team_players(id) on delete cascade,
  seller_team_id uuid references public.teams(id) on delete cascade,
  price bigint not null check (price > 0),
  status text default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at timestamptz default now()
);

-- 6. Maç Kayıtları
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  home_score int default 0,
  away_score int default 0,
  status text default 'pending' check (status in ('pending', 'completed')),
  week int default 1,
  played_at timestamptz default now()
);

-- 7. Maç İçi Canlı Anlatım Logları
create table if not exists public.match_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  minute int not null check (minute between 1 and 120),
  event_type text not null,
  description text not null
);

create index if not exists idx_teams_user on public.teams(user_id);
create index if not exists idx_team_players_team on public.team_players(team_id);
create index if not exists idx_transfer_status on public.transfer_market(status);
create index if not exists idx_matches_week on public.matches(week);
create index if not exists idx_match_logs_match on public.match_logs(match_id);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.transfer_market enable row level security;
alter table public.matches enable row level security;
alter table public.match_logs enable row level security;

-- Okuma: oturum açmış herkes lig verisini görebilir
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "teams_select" on public.teams for select to authenticated using (true);
create policy "teams_insert_own" on public.teams for insert to authenticated with check (user_id = auth.uid());
create policy "teams_update_own" on public.teams for update to authenticated using (user_id = auth.uid());

create policy "players_select" on public.players for select to authenticated using (true);

create policy "team_players_select" on public.team_players for select to authenticated using (true);
create policy "team_players_update_own" on public.team_players for update to authenticated
  using (team_id in (select id from public.teams where user_id = auth.uid()));

create policy "market_select" on public.transfer_market for select to authenticated using (true);
create policy "market_insert_own" on public.transfer_market for insert to authenticated
  with check (seller_team_id in (select id from public.teams where user_id = auth.uid()));
create policy "market_update_own" on public.transfer_market for update to authenticated
  using (seller_team_id in (select id from public.teams where user_id = auth.uid()));

create policy "matches_select" on public.matches for select to authenticated using (true);
create policy "logs_select" on public.match_logs for select to authenticated using (true);

-- Yeni kullanıcı için profil tetikleyicisi
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Paylaşılan çoklu oyuncu ligi (Vercel serverless kaynak gerçeği)
create table if not exists public.league_state (
  id int primary key default 1 check (id = 1),
  version int not null default 1,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.league_state enable row level security;
-- Yazma yalnızca service role (Vercel API). Anon okuyamaz.
