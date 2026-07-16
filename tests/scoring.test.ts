import assert from "node:assert/strict";
import test from "node:test";
import {
  baseScores,
  calculateRound,
  defaultScoreTeamForBidder,
  gameEnded,
  multiplierTeamIsValid,
  nextDealerToRight,
  projectSummary,
  roundHokumRaw,
  roundSunRaw,
  sunMultiplierAllowed,
  validateRoundInput,
} from "../lib/scoring";
import type { CalculateRoundInput } from "../lib/scoring";

const basic = (overrides: Partial<CalculateRoundInput> = {}): CalculateRoundInput => ({
  sequence_no: 1,
  dealer_position: 0,
  bidder_position: 0,
  original_bidder_position: 0,
  exposed_card_receiver_position: null,
  bidding_stage: "أول",
  game_type: "صن",
  multiplier: 1,
  multiplier_announcer_position: null,
  entered_team: "A",
  raw_card_score: 55,
  projects: [],
  tied_project_winner: null,
  kaboot_team: null,
  reverse_kaboot_team: null,
  ...overrides,
});

test("score entry defaults to the opponent of the bidder", () => {
  assert.equal(defaultScoreTeamForBidder(0), "B");
  assert.equal(defaultScoreTeamForBidder(2), "B");
  assert.equal(defaultScoreTeamForBidder(1), "A");
  assert.equal(defaultScoreTeamForBidder(3), "A");
});

test("dealer moves to the person on the dealer's right", () => {
  assert.deepEqual([0, 3, 2, 1, 0], [0, nextDealerToRight(0), nextDealerToRight(3), nextDealerToRight(2), nextDealerToRight(1)]);
});

test("sun rounding follows 64→60, 65→65, 66→70", () => {
  assert.equal(roundSunRaw(64), 60);
  assert.equal(roundSunRaw(65), 65);
  assert.equal(roundSunRaw(66), 70);
  assert.deepEqual(baseScores("صن", "A", 55), { a: 11, b: 15, roundTotal: 26 });
});

test("hokum rounding follows 74→70, 75→70, 76→80", () => {
  assert.equal(roundHokumRaw(74), 70);
  assert.equal(roundHokumRaw(75), 70);
  assert.equal(roundHokumRaw(76), 80);
});

test("all projects on the winning project side count", () => {
  const result = projectSummary("صن", [
    { team: "A", type: "مية", quantity: 1 },
    { team: "A", type: "سرى", quantity: 1 },
    { team: "B", type: "مية", quantity: 1 },
  ], "A");
  assert.equal(result.aProjects, 24);
  assert.equal(result.bProjects, 0);
});

test("projects can save the bidder before failure is checked", () => {
  const result = calculateRound(basic({
    raw_card_score: 55,
    projects: [{ team: "A", type: "خمسين", quantity: 1 }],
  }));
  assert.equal(result.bidder_failed, false);
  assert.equal(result.team_a_total, 21);
  assert.equal(result.team_b_total, 15);
});

test("failed bidder becomes zero and opponent receives full base plus projects", () => {
  const result = calculateRound(basic({
    projects: [{ team: "B", type: "خمسين", quantity: 1 }],
  }));
  assert.equal(result.bidder_failed, true);
  assert.equal(result.team_a_total, 0);
  assert.equal(result.team_b_total, 36);
});

test("normal tie does not fail, multiplied tie does", () => {
  const normal = calculateRound(basic({ raw_card_score: 65 }));
  assert.equal(normal.bidder_failed, false);
  assert.equal(normal.team_a_total, 13);
  assert.equal(normal.team_b_total, 13);

  const doubled = calculateRound(basic({
    raw_card_score: 65,
    multiplier: 2,
    multiplier_announcer_position: 1,
    bidder_position: 1,
  }), { currentA: 100, currentB: 80 });
  assert.equal(doubled.bidder_failed, true);
  assert.equal(doubled.team_a_total, 52);
  assert.equal(doubled.team_b_total, 0);
});

test("multipliers award the winner multiplied base and projects while baloot stays unmultiplied", () => {
  const result = calculateRound(basic({
    game_type: "حكم",
    raw_card_score: 100,
    multiplier: 3,
    multiplier_announcer_position: 2,
    bidder_position: 2,
    projects: [
      { team: "A", type: "مية", quantity: 1 },
      { team: "A", type: "بلوت", quantity: 1 },
    ],
  }));
  assert.equal(result.team_a_total, 80);
  assert.equal(result.team_b_total, 0);
});


test("the opponent can win a doubled round and the bidder side receives zero", () => {
  const result = calculateRound(basic({
    raw_card_score: 100,
    multiplier: 2,
    multiplier_announcer_position: 1,
    bidder_position: 1,
  }), { currentA: 100, currentB: 80 });
  assert.equal(result.team_a_total, 52);
  assert.equal(result.team_b_total, 0);
});

test("kaboot values override multiplier", () => {
  const sun = calculateRound(basic({
    multiplier: 2,
    multiplier_announcer_position: 1,
    bidder_position: 1,
    kaboot_team: "A",
  }), { currentA: 100, currentB: 80 });
  assert.equal(sun.team_a_total, 44);

  const hokum = calculateRound(basic({ game_type: "حكم", kaboot_team: "B" }));
  assert.equal(hokum.team_b_total, 25);

  const reverse = calculateRound(basic({ reverse_kaboot_team: "B" }));
  assert.equal(reverse.team_b_total, 88);
});

test("coffee is 152 points", () => {
  const result = calculateRound(basic({
    game_type: "حكم",
    multiplier: 152,
    multiplier_announcer_position: 2,
    bidder_position: 2,
    raw_card_score: 100,
  }));
  assert.equal(result.team_a_total, 152);
  assert.equal(result.team_b_total, 0);
});

test("multiplier announcement alternates teams", () => {
  assert.equal(multiplierTeamIsValid(0, 1, 2), true);
  assert.equal(multiplierTeamIsValid(0, 2, 3), true);
  assert.equal(multiplierTeamIsValid(0, 3, 4), true);
  assert.equal(multiplierTeamIsValid(0, 2, 152), true);
});

test("sun and askel allow only double when bidder is at least 100 and opponent is below 100", () => {
  assert.equal(sunMultiplierAllowed("صن", 0, 101, 80), true);
  assert.equal(sunMultiplierAllowed("صن", 0, 100, 80), true);
  assert.equal(sunMultiplierAllowed("صن", 0, 110, 100), false);
  assert.equal(sunMultiplierAllowed("صن", 0, 110, 120), false);
  assert.equal(sunMultiplierAllowed("أشكل", 1, 80, 100), true);
  assert.equal(sunMultiplierAllowed("حكم", 0, 0, 0), true);
});

test("sun and askel reject multipliers above double", () => {
  const errors = validateRoundInput(basic({
    game_type: "صن",
    multiplier: 3,
    multiplier_announcer_position: 2,
    bidder_position: 2,
  }), { currentA: 120, currentB: 80 });
  assert.ok(errors.some((error) => error.includes("تتوقف المضاعفة عند دبل")));
});

test("last multiplier becomes bidder and loses a multiplied tie", () => {
  const result = calculateRound(basic({
    raw_card_score: 65,
    multiplier: 2,
    multiplier_announcer_position: 1,
    bidder_position: 1,
  }), { currentA: 100, currentB: 80 });
  assert.equal(result.bidder_position, 1);
  assert.equal(result.bidder_failed, true);
  assert.deepEqual([result.team_a_total, result.team_b_total], [52, 0]);
});

test("askel is limited to dealer or dealer's left and gives card to teammate", () => {
  assert.equal(validateRoundInput(basic({
    game_type: "أشكل",
    original_bidder_position: 0,
    bidder_position: 0,
    exposed_card_receiver_position: 2,
  })).length, 0);

  assert.ok(validateRoundInput(basic({
    game_type: "أشكل",
    original_bidder_position: 2,
    bidder_position: 2,
    exposed_card_receiver_position: 0,
  })).length > 0);
});

test("match ends at 152, higher wins, equal enters sudden death", () => {
  assert.deepEqual(gameEnded(152, 120), { ended: true, winner: "A", suddenDeath: false });
  assert.deepEqual(gameEnded(154, 160), { ended: true, winner: "B", suddenDeath: false });
  assert.deepEqual(gameEnded(160, 160), { ended: false, winner: null, suddenDeath: true });
});
