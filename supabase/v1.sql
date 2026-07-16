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
