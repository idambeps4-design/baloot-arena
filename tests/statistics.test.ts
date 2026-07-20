import test from "node:test";
import assert from "node:assert/strict";
import { buildAdvancedStats, completedMatchesCsv } from "../lib/statistics";
import type { MatchHandRow, MatchRow, Player, PlayerProfile } from "../lib/types";

const players: Player[] = ["a","b","c","d"].map((id) => ({ id, name: id.toUpperCase(), is_active: true }));
const match: MatchRow = { id:"m", score_a:152, score_b:100, created_at:"2026-07-20T00:00:00Z", team_a_player_1:"a", team_a_player_2:"c", team_b_player_1:"b", team_b_player_2:"d" };
const base = { match_id:"m", dealer_position:0, bidder_position:0, original_bidder_position:0, exposed_card_receiver_position:null, bidding_stage:"أول" as const, multiplier:1 as const, multiplier_announcer_position:null, entered_team:"A" as const, raw_card_score:0, projects:[], tied_project_winner:null, team_a_base:0, team_b_base:0, team_a_projects:0, team_b_projects:0, team_a_baloot:0, team_b_baloot:0, counted_project_team:null, reverse_kaboot_team:null, bidder_failed:false };
const hands: MatchHandRow[] = [
  { ...base, sequence_no:1, game_type:"حكم", kaboot_team:"A", team_a_total:25, team_b_total:0 },
  { ...base, sequence_no:2, game_type:"صن", kaboot_team:null, team_a_total:10, team_b_total:16 },
];
const profiles = Object.fromEntries(players.map((p) => [p.id, { playerId:p.id, matchesPlayed:1, wins:p.id==="a"||p.id==="c"?1:0, losses:0, winPercentage:100, currentWinningStreak:1, longestWinningStreak:2, currentLosingStreak:0, longestLosingStreak:0, successfulBids:0, failedBids:0, kaboots:0, reverseKaboots:0, coffeeFinishes:0, projectPoints:0, bestPartner:"—", mostFrequentPartner:"—", hardestOpponent:"—" } satisfies PlayerProfile]));

test("advanced stats count game types, kaboot and average points", () => {
  const a = buildAdvancedStats(players, [match], hands, profiles).find((row) => row.playerId === "a")!;
  assert.equal(a.wins, 1); assert.equal(a.hokmRoundWins, 1); assert.equal(a.sunRoundWins, 0); assert.equal(a.kaboots, 1); assert.equal(a.averagePointsPerRound, 17.5); assert.equal(a.longestWinningStreak, 2);
});

test("CSV export includes BOM and both teams", () => {
  const csv = completedMatchesCsv([match], players);
  assert.ok(csv.startsWith("\uFEFF")); assert.ok(csv.includes("A + C")); assert.ok(csv.includes("B + D"));
});
