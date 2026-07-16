-- Baloot Arena clean setup
-- Safe to run more than once on the existing project.

create extension if not exists "pgcrypto";

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  primary key (group_id,user_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  nickname text,
  user_id uuid references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  team_a_player_1 uuid references public.players(id),
  team_a_player_2 uuid references public.players(id),
  team_b_player_1 uuid references public.players(id),
  team_b_player_2 uuid references public.players(id),
  score_a integer not null default 0 check(score_a >= 0),
  score_b integer not null default 0 check(score_b >= 0),
  notes text,
  status text not null default 'completed' check (status in ('in_progress','completed','cancelled')),
  dealer_start integer not null default 0 check (dealer_start between 0 and 3),
  kaboot_count_a integer not null default 0,
  kaboot_count_b integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.match_hands (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sequence_no integer not null,
  dealer_position integer not null check (dealer_position between 0 and 3),
  bidder_position integer not null default 0 check (bidder_position between 0 and 3),
  original_bidder_position integer not null default 0 check (original_bidder_position between 0 and 3),
  exposed_card_receiver_position integer check (exposed_card_receiver_position between 0 and 3),
  bidding_stage text not null default 'أول' check (bidding_stage in ('أول','ثاني')),
  game_type text not null check (game_type in ('حكم','صن','أشكل')),
  multiplier integer not null default 1 check (multiplier in (1,2,3,4,152)),
  multiplier_announcer_position integer check (multiplier_announcer_position between 0 and 3),
  entered_team text not null default 'A' check (entered_team in ('A','B')),
  raw_card_score integer not null default 0,
  team_a_base integer not null default 0,
  team_b_base integer not null default 0,
  team_a_projects integer not null default 0,
  team_b_projects integer not null default 0,
  team_a_baloot integer not null default 0,
  team_b_baloot integer not null default 0,
  counted_project_team text check (counted_project_team in ('A','B')),
  project_items jsonb not null default '[]'::jsonb,
  tied_project_winner text check (tied_project_winner in ('A','B')),
  kaboot_team text check (kaboot_team in ('A','B')),
  reverse_kaboot_team text check (reverse_kaboot_team in ('A','B')),
  bidder_failed boolean not null default false,
  team_a_total integer not null default 0,
  team_b_total integer not null default 0,
  created_at timestamptz not null default now(),
  unique(match_id, sequence_no)
);

create table if not exists public.player_titles (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  title text not null,
  awarded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Upgrade older installations.
alter table public.players add column if not exists nickname text;
alter table public.players add column if not exists is_active boolean not null default true;
alter table public.matches add column if not exists status text not null default 'completed';
alter table public.matches add column if not exists dealer_start integer not null default 0;
alter table public.matches add column if not exists kaboot_count_a integer not null default 0;
alter table public.matches add column if not exists kaboot_count_b integer not null default 0;

alter table public.match_hands add column if not exists bidder_position integer not null default 0;
alter table public.match_hands add column if not exists original_bidder_position integer not null default 0;
alter table public.match_hands add column if not exists exposed_card_receiver_position integer;
alter table public.match_hands add column if not exists bidding_stage text not null default 'أول';
alter table public.match_hands add column if not exists multiplier_announcer_position integer;
alter table public.match_hands add column if not exists entered_team text not null default 'A';
alter table public.match_hands add column if not exists raw_card_score integer not null default 0;
alter table public.match_hands add column if not exists team_a_baloot integer not null default 0;
alter table public.match_hands add column if not exists team_b_baloot integer not null default 0;
alter table public.match_hands add column if not exists counted_project_team text;
alter table public.match_hands add column if not exists project_items jsonb not null default '[]'::jsonb;
alter table public.match_hands add column if not exists tied_project_winner text;
alter table public.match_hands add column if not exists reverse_kaboot_team text;
alter table public.match_hands add column if not exists bidder_failed boolean not null default false;

-- Remove the old restriction that prevented equal scores while an unfinished
-- match was being stored by earlier versions.
alter table public.matches drop constraint if exists matches_check;

create unique index if not exists players_group_lower_name_unique
  on public.players (group_id, lower(btrim(name)));

insert into public.groups (name, invite_code)
values ('ساحة البلوت', 'BAL001')
on conflict (invite_code) do update set name = excluded.name;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_hands enable row level security;
alter table public.player_titles enable row level security;

-- The app intentionally has no sign-in and uses one shared league. Anyone with
-- the public site can change the data. Never expose a secret/service-role key.
do $$
begin
  execute 'drop policy if exists "public groups read" on public.groups';
  execute 'create policy "public groups read" on public.groups for select to anon using (true)';

  execute 'drop policy if exists "public players read" on public.players';
  execute 'create policy "public players read" on public.players for select to anon using (true)';
  execute 'drop policy if exists "public players insert" on public.players';
  execute 'create policy "public players insert" on public.players for insert to anon with check (true)';
  execute 'drop policy if exists "public players update" on public.players';
  execute 'create policy "public players update" on public.players for update to anon using (true) with check (true)';

  execute 'drop policy if exists "public matches read" on public.matches';
  execute 'create policy "public matches read" on public.matches for select to anon using (true)';
  execute 'drop policy if exists "public matches insert" on public.matches';
  execute 'create policy "public matches insert" on public.matches for insert to anon with check (true)';
  execute 'drop policy if exists "public matches update" on public.matches';
  execute 'create policy "public matches update" on public.matches for update to anon using (true) with check (true)';
  execute 'drop policy if exists "public matches delete" on public.matches';
  execute 'create policy "public matches delete" on public.matches for delete to anon using (true)';

  execute 'drop policy if exists "public hands read" on public.match_hands';
  execute 'create policy "public hands read" on public.match_hands for select to anon using (true)';
  execute 'drop policy if exists "public hands insert" on public.match_hands';
  execute 'create policy "public hands insert" on public.match_hands for insert to anon with check (true)';
  execute 'drop policy if exists "public hands update" on public.match_hands';
  execute 'create policy "public hands update" on public.match_hands for update to anon using (true) with check (true)';
  execute 'drop policy if exists "public hands delete" on public.match_hands';
  execute 'create policy "public hands delete" on public.match_hands for delete to anon using (true)';
end $$;

grant select on public.groups to anon;
grant select, insert, update on public.players to anon;
grant select, insert, update, delete on public.matches to anon;
grant select, insert, update, delete on public.match_hands to anon;
-- Baloot Arena v1.0 completed-match persistence upgrade
-- Run this once on an existing Baloot Arena database.

alter table public.matches add column if not exists match_key text;
alter table public.matches add column if not exists summary_json jsonb;

-- Earlier versions could leave temporary rows. v1.0 never restores them.
delete from public.matches where status in ('in_progress', 'cancelled');

create unique index if not exists matches_group_match_key_unique
  on public.matches (group_id, match_key)
  where match_key is not null;

create or replace function public.save_completed_match_v1(p_match jsonb, p_hands jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_score_a integer := (p_match ->> 'score_a')::integer;
  v_score_b integer := (p_match ->> 'score_b')::integer;
  v_group_id uuid := (p_match ->> 'group_id')::uuid;
  v_match_key text := nullif(btrim(p_match ->> 'match_key'), '');
  v_hand_count integer;
  v_total_a integer;
  v_total_b integer;
begin
  if v_match_key is null then
    raise exception 'match_key is required';
  end if;

  if jsonb_typeof(p_hands) is distinct from 'array' or jsonb_array_length(p_hands) = 0 then
    raise exception 'A completed match must contain at least one hand';
  end if;

  if (v_score_a < 152 and v_score_b < 152) or v_score_a = v_score_b then
    raise exception 'Only a completely finished match can be saved';
  end if;

  if (
    select count(distinct player_id)
    from unnest(array[
      (p_match ->> 'team_a_player_1')::uuid,
      (p_match ->> 'team_a_player_2')::uuid,
      (p_match ->> 'team_b_player_1')::uuid,
      (p_match ->> 'team_b_player_2')::uuid
    ]) as ids(player_id)
  ) <> 4 then
    raise exception 'A match requires four different players';
  end if;

  if (
    select count(*)
    from public.players
    where group_id = v_group_id
      and id = any(array[
        (p_match ->> 'team_a_player_1')::uuid,
        (p_match ->> 'team_a_player_2')::uuid,
        (p_match ->> 'team_b_player_1')::uuid,
        (p_match ->> 'team_b_player_2')::uuid
      ])
  ) <> 4 then
    raise exception 'All players must belong to the selected group';
  end if;

  select * into v_match
  from public.matches
  where group_id = v_group_id and match_key = v_match_key;

  if found then
    return to_jsonb(v_match);
  end if;

  insert into public.matches (
    group_id,
    match_key,
    team_a_player_1,
    team_a_player_2,
    team_b_player_1,
    team_b_player_2,
    score_a,
    score_b,
    status,
    dealer_start,
    kaboot_count_a,
    kaboot_count_b,
    summary_json
  ) values (
    v_group_id,
    v_match_key,
    (p_match ->> 'team_a_player_1')::uuid,
    (p_match ->> 'team_a_player_2')::uuid,
    (p_match ->> 'team_b_player_1')::uuid,
    (p_match ->> 'team_b_player_2')::uuid,
    v_score_a,
    v_score_b,
    'completed',
    coalesce((p_match ->> 'dealer_start')::integer, 0),
    coalesce((p_match ->> 'kaboot_count_a')::integer, 0),
    coalesce((p_match ->> 'kaboot_count_b')::integer, 0),
    p_match -> 'summary_json'
  )
  on conflict (group_id, match_key) where match_key is not null do nothing
  returning * into v_match;

  if not found then
    select * into v_match
    from public.matches
    where group_id = v_group_id and match_key = v_match_key;
    return to_jsonb(v_match);
  end if;

  insert into public.match_hands (
    match_id,
    sequence_no,
    dealer_position,
    bidder_position,
    original_bidder_position,
    exposed_card_receiver_position,
    bidding_stage,
    game_type,
    multiplier,
    multiplier_announcer_position,
    entered_team,
    raw_card_score,
    team_a_base,
    team_b_base,
    team_a_projects,
    team_b_projects,
    team_a_baloot,
    team_b_baloot,
    counted_project_team,
    project_items,
    tied_project_winner,
    kaboot_team,
    reverse_kaboot_team,
    bidder_failed,
    team_a_total,
    team_b_total
  )
  select
    v_match.id,
    (hand ->> 'sequence_no')::integer,
    (hand ->> 'dealer_position')::integer,
    (hand ->> 'bidder_position')::integer,
    (hand ->> 'original_bidder_position')::integer,
    nullif(hand ->> 'exposed_card_receiver_position', '')::integer,
    hand ->> 'bidding_stage',
    hand ->> 'game_type',
    (hand ->> 'multiplier')::integer,
    nullif(hand ->> 'multiplier_announcer_position', '')::integer,
    hand ->> 'entered_team',
    (hand ->> 'raw_card_score')::integer,
    (hand ->> 'team_a_base')::integer,
    (hand ->> 'team_b_base')::integer,
    (hand ->> 'team_a_projects')::integer,
    (hand ->> 'team_b_projects')::integer,
    (hand ->> 'team_a_baloot')::integer,
    (hand ->> 'team_b_baloot')::integer,
    nullif(hand ->> 'counted_project_team', ''),
    coalesce(hand -> 'project_items', '[]'::jsonb),
    nullif(hand ->> 'tied_project_winner', ''),
    nullif(hand ->> 'kaboot_team', ''),
    nullif(hand ->> 'reverse_kaboot_team', ''),
    coalesce((hand ->> 'bidder_failed')::boolean, false),
    (hand ->> 'team_a_total')::integer,
    (hand ->> 'team_b_total')::integer
  from jsonb_array_elements(p_hands) as hand;

  select count(*), coalesce(sum(team_a_total), 0), coalesce(sum(team_b_total), 0)
    into v_hand_count, v_total_a, v_total_b
  from public.match_hands
  where match_id = v_match.id;

  if v_hand_count <> jsonb_array_length(p_hands) or v_total_a <> v_score_a or v_total_b <> v_score_b then
    raise exception 'Hand totals do not match the completed match score';
  end if;

  return to_jsonb(v_match);
end;
$$;

grant execute on function public.save_completed_match_v1(jsonb, jsonb) to anon;
