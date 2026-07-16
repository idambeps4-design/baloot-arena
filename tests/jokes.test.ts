import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatchJokes,
  buildRoundAnnouncement,
  detectRoundJokeEvent,
  JOKE_CATALOG,
} from "../lib/jokes";
import type { JokeEvent, PlayerProfile, Round } from "../lib/types";

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

const ids = ["a", "b", "c", "d"] as [string, string, string, string];
const names = ["أحمد", "محمد", "سالم", "راشد"] as [string, string, string, string];

function profile(id: string, overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    playerId: id,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    currentWinningStreak: 0,
    longestWinningStreak: 0,
    currentLosingStreak: 0,
    longestLosingStreak: 0,
    successfulBids: 0,
    failedBids: 0,
    kaboots: 0,
    reverseKaboots: 0,
    coffeeFinishes: 0,
    projectPoints: 0,
    bestPartner: "—",
    mostFrequentPartner: "—",
    hardestOpponent: "—",
    ...overrides,
  };
}

function matchInput(overrides: Partial<Parameters<typeof buildMatchJokes>[0]> = {}): Parameters<typeof buildMatchJokes>[0] {
  return {
    matchKey: "match",
    playerIds: ids,
    playerNames: names,
    scoreA: 152,
    scoreB: 100,
    rounds: [round({ team_a_total: 26, team_b_total: 0 })],
    ...overrides,
  };
}

function hasCatalogJoke(event: JokeEvent, jokeIds: string[]) {
  return jokeIds.some((id) => JOKE_CATALOG[event].some((joke) => joke.id === id));
}

test("failed bidder round joke appears immediately from the required phrases", () => {
  const result = buildRoundAnnouncement({
    matchKey: "failed-round",
    playerNames: names,
    round: round({ bidder_failed: true, team_a_total: 0, team_b_total: 26 }),
  });
  assert.equal(detectRoundJokeEvent(names, round({ bidder_failed: true, team_a_total: 0, team_b_total: 26 })), "failed");
  assert.ok(result);
  assert.ok(JOKE_CATALOG.failed.some((joke) => joke.text === result.text));
});

test("Abdullah Sharif round joke normalizes spaces and has priority over every other event", () => {
  const playerNames = ["  عبدالله   شريف  ", "محمد", "سالم", "راشد"] as [string, string, string, string];
  const result = buildRoundAnnouncement({
    matchKey: "abdullah-round",
    playerNames,
    round: round({ bidder_failed: true, kaboot_team: "B", team_a_total: 0, team_b_total: 44 }),
  });
  assert.equal(result?.id, "abdullah-sharif-inspection");
  assert.equal(result?.text, "زخه التفتيش");
  assert.equal(result?.special, true);
});

test("Abdullah Sharif joke is not shown when his team wins", () => {
  const playerNames = ["عبدالله شريف", "محمد", "سالم", "راشد"] as [string, string, string, string];
  const result = buildRoundAnnouncement({
    matchKey: "abdullah-win",
    playerNames,
    round: round({ team_a_total: 26, team_b_total: 0 }),
  });
  assert.equal(result, null);
});

test("kaboot round joke uses the required kaboot catalog", () => {
  const result = buildRoundAnnouncement({ matchKey: "kaboot", playerNames: names, round: round({ kaboot_team: "A", team_a_total: 44, team_b_total: 0 }) });
  assert.ok(result && JOKE_CATALOG.kaboot.some((joke) => joke.text === result.text));
});

test("reverse kaboot round joke uses the required reverse catalog", () => {
  const result = buildRoundAnnouncement({ matchKey: "reverse", playerNames: names, round: round({ reverse_kaboot_team: "A", team_a_total: 88, team_b_total: 0 }) });
  assert.ok(result && JOKE_CATALOG.reverse.some((joke) => joke.text === result.text));
});

test("qahwa round joke uses the required coffee catalog", () => {
  const result = buildRoundAnnouncement({ matchKey: "coffee", playerNames: names, round: round({ multiplier: 152, multiplier_announcer_position: 2, bidder_position: 2, team_a_total: 152, team_b_total: 0 }) });
  assert.ok(result && JOKE_CATALOG.coffee.some((joke) => joke.text === result.text));
});

test("projects round joke appears only when projects strongly affect the round", () => {
  const result = buildRoundAnnouncement({
    matchKey: "projects",
    playerNames: names,
    round: round({ team_a_base: 6, team_b_base: 10, team_a_projects: 20, team_a_total: 26, team_b_total: 10 }),
  });
  assert.ok(result && JOKE_CATALOG.projects.some((joke) => joke.text === result.text));
});

test("failed bidder game condition is detected without contradicting the result", () => {
  const result = buildMatchJokes(matchInput({ rounds: [round({ bidder_failed: true, team_a_total: 0, team_b_total: 26 })], scoreA: 100, scoreB: 152 }));
  assert.ok(result.detectedEvents.includes("failed"));
  assert.ok(hasCatalogJoke("failed", result.jokeIds));
});

test("Abdullah Sharif game joke appears on a loss, has priority, and disappears on a win", () => {
  const playerNames = ["عبدالله   شريف", "محمد", "سالم", "راشد"] as [string, string, string, string];
  const loss = buildMatchJokes(matchInput({ playerNames, scoreA: 100, scoreB: 152 }));
  assert.equal(loss.jokeIds[0], "abdullah-sharif-inspection");
  assert.equal(loss.jokes[0], "زخه التفتيش");

  const win = buildMatchJokes(matchInput({ playerNames, scoreA: 152, scoreB: 100 }));
  assert.equal(win.detectedEvents.includes("abdullah"), false);
  assert.equal(win.jokeIds.includes("abdullah-sharif-inspection"), false);
});

test("kaboot game condition is detected", () => {
  const result = buildMatchJokes(matchInput({ rounds: [round({ kaboot_team: "A", team_a_total: 44, team_b_total: 0 })] }));
  assert.ok(result.detectedEvents.includes("kaboot"));
  assert.ok(hasCatalogJoke("kaboot", result.jokeIds));
});

test("reverse kaboot game condition is detected", () => {
  const result = buildMatchJokes(matchInput({ rounds: [round({ reverse_kaboot_team: "A", team_a_total: 88, team_b_total: 0 })] }));
  assert.ok(result.detectedEvents.includes("reverse"));
  assert.ok(hasCatalogJoke("reverse", result.jokeIds));
});

test("qahwa game condition requires the deciding final round", () => {
  const result = buildMatchJokes(matchInput({
    rounds: [round({ multiplier: 152, multiplier_announcer_position: 2, bidder_position: 2, team_a_total: 152, team_b_total: 0 })],
    scoreA: 152,
    scoreB: 90,
  }));
  assert.ok(result.detectedEvents.includes("coffee"));
  assert.ok(hasCatalogJoke("coffee", result.jokeIds));
});

test("comeback condition is detected from a real large deficit", () => {
  const result = buildMatchJokes(matchInput({
    rounds: [
      round({ sequence_no: 1, team_a_total: 0, team_b_total: 50 }),
      round({ sequence_no: 2, team_a_total: 152, team_b_total: 0 }),
    ],
    scoreA: 152,
    scoreB: 50,
  }));
  assert.ok(result.detectedEvents.includes("comeback"));
  assert.ok(hasCatalogJoke("comeback", result.jokeIds));
});

test("large victory condition uses only large-victory jokes", () => {
  const result = buildMatchJokes(matchInput({ scoreA: 152, scoreB: 40 }));
  assert.ok(result.detectedEvents.includes("large"));
  assert.equal(result.detectedEvents.includes("close"), false);
  assert.ok(hasCatalogJoke("large", result.jokeIds));
});

test("close game condition never produces a large-victory contradiction", () => {
  const result = buildMatchJokes(matchInput({ scoreA: 152, scoreB: 145 }));
  assert.ok(result.detectedEvents.includes("close"));
  assert.equal(result.detectedEvents.includes("large"), false);
  assert.ok(hasCatalogJoke("close", result.jokeIds));
});

test("losing streak condition uses projected third consecutive loss", () => {
  const historicalProfiles = {
    b: profile("b", { currentLosingStreak: 2, longestLosingStreak: 2 }),
    d: profile("d"),
  };
  const result = buildMatchJokes(matchInput({ historicalProfiles }));
  assert.ok(result.detectedEvents.includes("losingStreak"));
  assert.deepEqual(result.losingStreakNames, ["محمد"]);
  assert.ok(hasCatalogJoke("losingStreak", result.jokeIds));
});

test("winning streak condition uses projected third consecutive win", () => {
  const historicalProfiles = {
    a: profile("a", { currentWinningStreak: 2, longestWinningStreak: 2 }),
    c: profile("c"),
  };
  const result = buildMatchJokes(matchInput({ historicalProfiles }));
  assert.ok(result.detectedEvents.includes("winningStreak"));
  assert.deepEqual(result.winningStreakNames, ["أحمد"]);
  assert.ok(hasCatalogJoke("winningStreak", result.jokeIds));
});

test("projects game condition is detected from meaningful project contribution", () => {
  const result = buildMatchJokes(matchInput({
    rounds: [round({ team_a_base: 6, team_b_base: 10, team_a_projects: 20, team_a_total: 26, team_b_total: 10 })],
  }));
  assert.ok(result.detectedEvents.includes("projects"));
  assert.ok(hasCatalogJoke("projects", result.jokeIds));
});

test("consecutive match rotation avoids the same joke when an alternative exists", () => {
  const first = buildMatchJokes(matchInput({
    matchKey: "rotation-1",
    rounds: [round({ bidder_failed: true, team_a_total: 0, team_b_total: 26 })],
    scoreA: 100,
    scoreB: 152,
  }));
  const second = buildMatchJokes(matchInput({
    matchKey: "rotation-2",
    rounds: [round({ bidder_failed: true, team_a_total: 0, team_b_total: 26 })],
    scoreA: 100,
    scoreB: 152,
    excludedJokeIds: first.jokeIds,
  }));
  assert.notEqual(second.jokeIds[0], first.jokeIds[0]);
});

test("final summary selects at most two jokes and keeps Abdullah first", () => {
  const playerNames = ["عبدالله شريف", "محمد", "سالم", "راشد"] as [string, string, string, string];
  const result = buildMatchJokes(matchInput({
    playerNames,
    scoreA: 20,
    scoreB: 172,
    rounds: [
      round({ sequence_no: 1, bidder_failed: true, kaboot_team: "B", team_a_total: 0, team_b_total: 44 }),
      round({ sequence_no: 2, reverse_kaboot_team: "B", team_a_total: 0, team_b_total: 88 }),
    ],
  }));
  assert.equal(result.jokes.length, 2);
  assert.equal(result.jokeIds[0], "abdullah-sharif-inspection");
});

test("coffee requester-loss line is not used when the qahwa bidder wins", () => {
  const result = buildMatchJokes(matchInput({
    matchKey: "coffee-bidder-wins",
    rounds: [round({ multiplier: 152, multiplier_announcer_position: 2, bidder_position: 2, team_a_total: 152, team_b_total: 0 })],
    scoreA: 152,
    scoreB: 90,
  }));
  assert.equal(result.jokeIds.includes("coffee-2"), false);
});

test("literal team-two kaboot line is not used when team two wins", () => {
  const result = buildMatchJokes(matchInput({
    matchKey: "kaboot-team-b",
    rounds: [round({ bidder_position: 1, original_bidder_position: 1, kaboot_team: "B", team_a_total: 0, team_b_total: 44 })],
    scoreA: 100,
    scoreB: 152,
  }));
  assert.equal(result.jokeIds.includes("kaboot-1"), false);
});

test("literal team-two comeback line is not used when team two completes the comeback", () => {
  const result = buildMatchJokes(matchInput({
    matchKey: "comeback-team-b",
    rounds: [
      round({ sequence_no: 1, team_a_total: 50, team_b_total: 0 }),
      round({ sequence_no: 2, bidder_position: 1, original_bidder_position: 1, team_a_total: 0, team_b_total: 152 }),
    ],
    scoreA: 50,
    scoreB: 152,
  }));
  assert.equal(result.jokeIds.includes("comeback-1"), false);
});
