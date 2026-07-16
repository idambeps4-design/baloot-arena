import assert from "node:assert/strict";
import test from "node:test";
import { mergeCompletedMatchSnapshot } from "../lib/data";
import type { MatchHandRow, MatchRow, Round } from "../lib/types";

const oldMatch: MatchRow = {
  id: "old",
  created_at: "2026-01-01T00:00:00Z",
  score_a: 152,
  score_b: 100,
  team_a_player_1: "a",
  team_a_player_2: "c",
  team_b_player_1: "b",
  team_b_player_2: "d",
};

const savedMatch: MatchRow = {
  ...oldMatch,
  id: "saved",
  created_at: "2026-02-01T00:00:00Z",
  score_a: 160,
  score_b: 90,
};

const round: Round = {
  sequence_no: 1,
  dealer_position: 0,
  bidder_position: 0,
  original_bidder_position: 0,
  exposed_card_receiver_position: null,
  bidding_stage: "أول",
  game_type: "حكم",
  multiplier: 1,
  multiplier_announcer_position: null,
  entered_team: "B",
  raw_card_score: 100,
  projects: [],
  tied_project_winner: null,
  team_a_base: 10,
  team_b_base: 6,
  team_a_projects: 0,
  team_b_projects: 0,
  team_a_baloot: 0,
  team_b_baloot: 0,
  counted_project_team: null,
  kaboot_team: null,
  reverse_kaboot_team: null,
  bidder_failed: false,
  team_a_total: 10,
  team_b_total: 6,
};

test("saved match and hands are merged immediately for standings and profiles", () => {
  const previousHand = { ...round, match_id: "old" } as MatchHandRow;
  const result = mergeCompletedMatchSnapshot([oldMatch], [previousHand], savedMatch, [round]);
  assert.deepEqual(result.matches.map((match) => match.id), ["saved", "old"]);
  assert.ok(result.hands.some((hand) => hand.match_id === "saved"));
  assert.ok(result.hands.some((hand) => hand.match_id === "old"));
});
