-- Baloot Arena Milestone 3 migration
-- Safe to run after the original five-table script.

alter table public.players add column if not exists is_active boolean not null default true;
alter table public.matches add column if not exists status text not null default 'completed' check (status in ('in_progress','completed','cancelled'));
alter table public.matches add column if not exists dealer_start integer not null default 0 check (dealer_start between 0 and 3);

create table if not exists public.match_hands (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sequence_no integer not null,
  dealer_position integer not null check (dealer_position between 0 and 3),
  game_type text not null check (game_type in ('حكم','صن')),
  multiplier integer not null default 1 check (multiplier in (1,2,3,4)),
  team_a_base integer not null default 0,
  team_b_base integer not null default 0,
  team_a_projects integer not null default 0,
  team_b_projects integer not null default 0,
  kaboot_team text check (kaboot_team in ('A','B')),
  team_a_total integer not null default 0,
  team_b_total integer not null default 0,
  created_at timestamptz not null default now(),
  unique(match_id, sequence_no)
);

alter table public.match_hands enable row level security;

-- One permanent shared league used automatically by the website.
insert into public.groups (name, invite_code)
values ('ساحة البلوت', 'BAL001')
on conflict (invite_code) do update set name = excluded.name;

-- Remove the old authenticated-members policy if it exists.
drop policy if exists "members can read players" on public.players;

-- Public browser access. This app intentionally has no login.
drop policy if exists "public can read groups" on public.groups;
create policy "public can read groups" on public.groups for select to anon using (true);

drop policy if exists "public can create groups" on public.groups;
create policy "public can create groups" on public.groups for insert to anon with check (true);

drop policy if exists "public can read players" on public.players;
create policy "public can read players" on public.players for select to anon using (true);
drop policy if exists "public can create players" on public.players;
create policy "public can create players" on public.players for insert to anon with check (true);
drop policy if exists "public can update players" on public.players;
create policy "public can update players" on public.players for update to anon using (true) with check (true);

drop policy if exists "public can read matches" on public.matches;
create policy "public can read matches" on public.matches for select to anon using (true);
drop policy if exists "public can create matches" on public.matches;
create policy "public can create matches" on public.matches for insert to anon with check (true);
drop policy if exists "public can update matches" on public.matches;
create policy "public can update matches" on public.matches for update to anon using (true) with check (true);
drop policy if exists "public can delete matches" on public.matches;
create policy "public can delete matches" on public.matches for delete to anon using (true);

drop policy if exists "public can read hands" on public.match_hands;
create policy "public can read hands" on public.match_hands for select to anon using (true);
drop policy if exists "public can create hands" on public.match_hands;
create policy "public can create hands" on public.match_hands for insert to anon with check (true);
drop policy if exists "public can update hands" on public.match_hands;
create policy "public can update hands" on public.match_hands for update to anon using (true) with check (true);
drop policy if exists "public can delete hands" on public.match_hands;
create policy "public can delete hands" on public.match_hands for delete to anon using (true);

-- Case-insensitive duplicate protection within the shared league.
create unique index if not exists players_group_lower_name_unique
on public.players (group_id, lower(btrim(name)));

-- Baloot Arena rules-engine upgrade
alter table public.players add column if not exists nickname text;
alter table public.matches add column if not exists kaboot_count_a integer not null default 0;
alter table public.matches add column if not exists kaboot_count_b integer not null default 0;

alter table public.match_hands add column if not exists bidder_position integer not null default 0 check (bidder_position between 0 and 3);
alter table public.match_hands add column if not exists original_bidder_position integer not null default 0 check (original_bidder_position between 0 and 3);
alter table public.match_hands add column if not exists exposed_card_receiver_position integer check (exposed_card_receiver_position between 0 and 3);
alter table public.match_hands add column if not exists bidding_stage text not null default 'أول' check (bidding_stage in ('أول','ثاني'));
alter table public.match_hands drop constraint if exists match_hands_game_type_check;
alter table public.match_hands add constraint match_hands_game_type_check check (game_type in ('حكم','صن','أشكل'));
alter table public.match_hands drop constraint if exists match_hands_multiplier_check;
alter table public.match_hands add constraint match_hands_multiplier_check check (multiplier in (1,2,3,4,152));
alter table public.match_hands add column if not exists multiplier_announcer_position integer check (multiplier_announcer_position between 0 and 3);
alter table public.match_hands add column if not exists entered_team text not null default 'A' check (entered_team in ('A','B'));
alter table public.match_hands add column if not exists raw_card_score integer not null default 0;
alter table public.match_hands add column if not exists team_a_baloot integer not null default 0;
alter table public.match_hands add column if not exists team_b_baloot integer not null default 0;
alter table public.match_hands add column if not exists counted_project_team text check (counted_project_team in ('A','B'));
alter table public.match_hands add column if not exists reverse_kaboot_team text check (reverse_kaboot_team in ('A','B'));
alter table public.match_hands add column if not exists bidder_failed boolean not null default false;

-- Session 2: preserve exact project cart so edited rounds can be recalculated accurately.
alter table public.match_hands add column if not exists project_items jsonb not null default '[]'::jsonb;
alter table public.match_hands add column if not exists tied_project_winner text check (tied_project_winner in ('A','B'));
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
