import assert from "node:assert/strict";
import test from "node:test";
import { buildMatchSummary, buildPlayerProfiles, calculateMatchAwards } from "../lib/analytics";
import type { MatchHandRow, MatchRow, Player, Round } from "../lib/types";

const players: Player[] = [
  { id: "p1", name: "عبدالله", is_active: true },
  { id: "p2", name: "محمد", is_active: true },
  { id: "p3", name: "سالم", is_active: true },
  { id: "p4", name: "راشد", is_active: true },
];

const matches: MatchRow[] = [
  { id: "m1", created_at: "2026-01-01T00:00:00Z", score_a: 160, score_b: 100, team_a_player_1: "p1", team_a_player_2: "p2", team_b_player_1: "p3", team_b_player_2: "p4" },
  { id: "m2", created_at: "2026-01-02T00:00:00Z", score_a: 90, score_b: 152, team_a_player_1: "p1", team_a_player_2: "p3", team_b_player_1: "p2", team_b_player_2: "p4" },
  { id: "m3", created_at: "2026-01-03T00:00:00Z", score_a: 152, score_b: 20, team_a_player_1: "p1", team_a_player_2: "p2", team_b_player_1: "p3", team_b_player_2: "p4" },
];

function round(overrides: Partial<Round> = {}): Round {
  return {
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
    ...overrides,
  };
}

function hand(matchId: string, overrides: Partial<MatchHandRow> = {}): MatchHandRow {
  return { ...round(), match_id: matchId, ...overrides };
}

const hands: MatchHandRow[] = [
  hand("m1", { team_a_projects: 10, kaboot_team: "A" }),
  hand("m2", { bidder_failed: true, reverse_kaboot_team: "B", team_a_total: 0, team_b_total: 88 }),
  hand("m3", { multiplier: 152, multiplier_announcer_position: 2, bidder_position: 2, team_a_total: 152, team_b_total: 0 }),
];

test("player profiles include records, both streak directions, bids, special finishes and relationships", () => {
  const profile = buildPlayerProfiles(players, matches, hands).p1;
  assert.equal(profile.matchesPlayed, 3);
  assert.equal(profile.wins, 2);
  assert.equal(profile.losses, 1);
  assert.equal(profile.winPercentage, 67);
  assert.equal(profile.currentWinningStreak, 1);
  assert.equal(profile.longestWinningStreak, 1);
  assert.equal(profile.currentLosingStreak, 0);
  assert.equal(profile.longestLosingStreak, 1);
  assert.equal(profile.successfulBids, 1);
  assert.equal(profile.failedBids, 1);
  assert.equal(profile.kaboots, 1);
  assert.equal(profile.reverseKaboots, 0);
  assert.equal(profile.coffeeFinishes, 1);
  assert.equal(profile.projectPoints, 10);
  assert.equal(profile.bestPartner, "محمد");
  assert.equal(profile.mostFrequentPartner, "محمد");
  assert.equal(profile.hardestOpponent, "راشد");
});

test("bid statistics charge the effective last multiplier, not the original bidder", () => {
  const bidPlayers: Player[] = [
    { id: "a", name: "عبدالله شريف", is_active: true },
    { id: "b", name: "محمد", is_active: true },
    { id: "c", name: "سالم", is_active: true },
    { id: "d", name: "راشد", is_active: true },
  ];
  const bidMatch: MatchRow = {
    id: "bid-match",
    created_at: "2026-02-01T00:00:00Z",
    score_a: 152,
    score_b: 100,
    team_a_player_1: "a",
    team_a_player_2: "c",
    team_b_player_1: "b",
    team_b_player_2: "d",
  };
  const doubled = hand("bid-match", {
    original_bidder_position: 0,
    bidder_position: 1,
    multiplier: 2,
    multiplier_announcer_position: 1,
    bidder_failed: true,
    team_a_total: 52,
    team_b_total: 0,
  });
  const profiles = buildPlayerProfiles(bidPlayers, [bidMatch], [doubled]);
  assert.equal(profiles.a.failedBids, 0);
  assert.equal(profiles.a.successfulBids, 0);
  assert.equal(profiles.b.failedBids, 1);
});

test("MVP is selected from the winning team using successful bids, important rounds, projects and coffee", () => {
  const rounds = [
    round({ sequence_no: 1, bidder_position: 0, original_bidder_position: 0, team_a_projects: 20, team_a_total: 46, team_b_total: 0 }),
    round({ sequence_no: 2, bidder_position: 0, original_bidder_position: 2, multiplier: 152, multiplier_announcer_position: 0, team_a_total: 152, team_b_total: 0 }),
  ];
  const input = {
    matchKey: "mvp",
    playerIds: ["a", "b", "c", "d"] as [string, string, string, string],
    playerNames: ["أحمد", "محمد", "سالم", "راشد"] as [string, string, string, string],
    scoreA: 198,
    scoreB: 0,
    rounds,
  };
  const awards = calculateMatchAwards(input);
  assert.equal(awards.star.id, "a");
  assert.ok(awards.starReasons.some((reason) => reason.includes("طلب ناجح")));
  assert.ok(awards.starReasons.some((reason) => reason.includes("قهوة") || reason.includes("راوند مهم")));
});

test("Muflis is selected from the losing team using failed bids, repeated losses and low contribution", () => {
  const rounds = [1, 2, 3].map((sequence) => round({
    sequence_no: sequence,
    bidder_position: 1,
    original_bidder_position: 1,
    bidder_failed: true,
    team_a_total: 26,
    team_b_total: 0,
  }));
  const summary = buildMatchSummary({
    matchKey: "muflis",
    playerIds: ["a", "b", "c", "d"],
    playerNames: ["أحمد", "محمد", "سالم", "راشد"],
    scoreA: 156,
    scoreB: 80,
    rounds,
  });
  assert.equal(summary.bankruptPlayerId, "b");
  assert.ok(summary.bankruptReasons.some((reason) => reason.includes("طلب فاشل")));
  assert.ok(summary.bankruptReasons.some((reason) => reason.includes("راوندات خاسرة")));
});

test("Arabic final summary includes awards, detected events and a factual storyline", () => {
  const summary = buildMatchSummary({
    matchKey: "storyline",
    playerIds: ["a", "b", "c", "d"],
    playerNames: ["عبدالله", "محمد", "سالم", "راشد"],
    scoreA: 152,
    scoreB: 90,
    rounds: [round({
      original_bidder_position: 0,
      bidder_position: 1,
      multiplier: 2,
      multiplier_announcer_position: 1,
      bidder_failed: true,
      team_a_total: 52,
      team_b_total: 0,
    })],
  });
  assert.ok(summary.headline.startsWith("فاز"));
  assert.ok(summary.starPlayerName.length > 0);
  assert.ok(summary.bankruptPlayerName.length > 0);
  assert.ok(summary.storyline.some((line) => line.includes("عبدالله") && line.includes("محمد") && line.includes("دبل")));
  assert.ok(summary.detectedEvents.includes("failed"));
  assert.ok(summary.jokes.length <= 2);
});
