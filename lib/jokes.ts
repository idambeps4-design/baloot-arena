import { isAbdullahSharif } from "./names";
import type {
  JokeEvent,
  PlayerProfile,
  Round,
  RoundAnnouncement,
  TeamCode,
} from "./types";

type JokeOption = { id: string; text: string };

type MatchJokeInput = {
  matchKey: string;
  playerIds: [string, string, string, string];
  playerNames: [string, string, string, string];
  scoreA: number;
  scoreB: number;
  rounds: Round[];
  historicalProfiles?: Record<string, PlayerProfile>;
  excludedJokeIds?: string[];
};

export type MatchJokeResult = {
  eventLabels: string[];
  detectedEvents: JokeEvent[];
  jokeIds: string[];
  jokes: string[];
  comebackDeficit: number;
  winningStreakNames: string[];
  losingStreakNames: string[];
};

export const JOKE_CATALOG: Record<JokeEvent, readonly JokeOption[]> = {
  failed: [
    { id: "failed-1", text: "الطلب كان واثق… النتيجة ما كانت بنفس الثقة" },
    { id: "failed-2", text: "طلبها بيده وسلمها للخصم" },
    { id: "failed-3", text: "شكله حسب الورق قبل لا يشوفه" },
  ],
  abdullah: [
    { id: "abdullah-sharif-inspection", text: "زخه التفتيش" },
  ],
  kaboot: [
    { id: "kaboot-1", text: "كبوت… الفريق الثاني حضر يتفرج" },
    { id: "kaboot-2", text: "ما خلو لهم حتى ذكرى من الراوند" },
  ],
  reverse: [
    { id: "reverse-1", text: "كبوت عكسي… هذي ما تنمسح بسهولة" },
    { id: "reverse-2", text: "قلبوها عليهم وصارت السالفة تاريخية" },
  ],
  coffee: [
    { id: "coffee-1", text: "قهوة مرة… والنتيجة أمر" },
    { id: "coffee-2", text: "طلب القهوة وشربها الخصم" },
  ],
  comeback: [
    { id: "comeback-1", text: "من تحت إلى الفوز… الفريق الثاني نام على النتيجة" },
    { id: "comeback-2", text: "كانوا حاسبينها خلصت، وانقلبت عليهم" },
  ],
  large: [
    { id: "large-1", text: "بعدكم ما افطرتوا يا مصخرة" },
    { id: "large-2", text: "مباراة من طرف واحد والباقي جمهور" },
    { id: "large-3", text: "النتيجة تحتاج لجنة تحقيق" },
  ],
  close: [
    { id: "close-1", text: "صكة تحبس الأنفاس إلى آخر راوند" },
    { id: "close-2", text: "فرق بسيط لكن الضغط كان كبير" },
  ],
  losingStreak: [
    { id: "losing-streak-1", text: "الخسارة صارت عادة يومية" },
    { id: "losing-streak-2", text: "يحتاج يغير الكرسي يمكن يتغير الحظ" },
  ],
  winningStreak: [
    { id: "winning-streak-1", text: "واضح داخل الصكة وهو ضامنها" },
    { id: "winning-streak-2", text: "سلسلة انتصارات والباقي يحاولون يلحقون" },
  ],
  projects: [
    { id: "projects-1", text: "المشاريع لعبت قبل الورق" },
    { id: "projects-2", text: "المشاريع شالت الراوند كامل" },
  ],
};

const MATCH_EVENT_PRIORITY: JokeEvent[] = [
  "abdullah",
  "reverse",
  "coffee",
  "comeback",
  "kaboot",
  "large",
  "close",
  "losingStreak",
  "winningStreak",
  "projects",
  "failed",
];

function seatTeam(seat: number): TeamCode {
  return seat % 2 === 0 ? "A" : "B";
}

export function roundWinner(round: Round): TeamCode | null {
  if (round.team_a_total === round.team_b_total) return null;
  return round.team_a_total > round.team_b_total ? "A" : "B";
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function chooseJoke(
  event: JokeEvent,
  seed: string,
  excludedIds: ReadonlySet<string>,
  contextualOptions: readonly JokeOption[] = JOKE_CATALOG[event],
) {
  const options = [...contextualOptions];
  const alternatives = options.filter((option) => !excludedIds.has(option.id));
  const pool = alternatives.length > 0 ? alternatives : options;
  return pool[stableHash(`${seed}:${event}`) % pool.length];
}


function contextualJokeOptions(event: JokeEvent, winner: TeamCode, decidingRound?: Round) {
  let options = [...JOKE_CATALOG[event]];
  // These supplied lines mention a literal team or the requester, so only use
  // them when the actual result makes the sentence true.
  if (event === "kaboot" && winner === "B") {
    options = options.filter((option) => option.id !== "kaboot-1");
  }
  if (event === "comeback" && winner === "B") {
    options = options.filter((option) => option.id !== "comeback-1");
  }
  if (event === "coffee" && decidingRound && seatTeam(decidingRound.bidder_position) === winner) {
    options = options.filter((option) => option.id !== "coffee-2");
  }
  return options.length > 0 ? options : [...JOKE_CATALOG[event]];
}

function projectPoints(round: Round, team: TeamCode) {
  return team === "A"
    ? round.team_a_projects + round.team_a_baloot
    : round.team_b_projects + round.team_b_baloot;
}

export function projectsStronglyAffectedRound(round: Round) {
  const winner = roundWinner(round);
  if (!winner) return false;
  const loser: TeamCode = winner === "A" ? "B" : "A";
  const winnerProjects = projectPoints(round, winner);
  const loserProjects = projectPoints(round, loser);
  const baseMargin = Math.abs(round.team_a_base - round.team_b_base);
  return winnerProjects >= 10 && (
    winnerProjects - loserProjects >= 10 ||
    winnerProjects >= Math.max(20, baseMargin)
  );
}

export function detectRoundJokeEvent(
  playerNames: [string, string, string, string],
  round: Round,
): JokeEvent | null {
  const winner = roundWinner(round);
  if (!winner) return null;

  const abdullahSeat = playerNames.findIndex(isAbdullahSharif);
  if (abdullahSeat >= 0 && seatTeam(abdullahSeat) !== winner) return "abdullah";
  if (round.reverse_kaboot_team === winner) return "reverse";
  if (round.multiplier === 152) return "coffee";
  if (round.kaboot_team === winner) return "kaboot";
  if (round.bidder_failed && seatTeam(round.bidder_position) !== winner) return "failed";
  if (projectsStronglyAffectedRound(round)) return "projects";
  return null;
}

function roundTitle(event: JokeEvent) {
  const titles: Partial<Record<JokeEvent, string>> = {
    abdullah: "🚨 إعلان عبدالله شريف 🚨",
    failed: "الطلب طاح",
    kaboot: "كبوت!",
    reverse: "كبوت عكسي!",
    coffee: "قهوة!",
    projects: "المشاريع حسمت الراوند",
  };
  return titles[event] ?? "حدث في الراوند";
}

export function buildRoundAnnouncement({
  matchKey,
  playerNames,
  round,
  excludedIds = [],
}: {
  matchKey: string;
  playerNames: [string, string, string, string];
  round: Round;
  excludedIds?: string[];
}): RoundAnnouncement | null {
  const event = detectRoundJokeEvent(playerNames, round);
  if (!event) return null;
  const winner = roundWinner(round)!;
  const selected = chooseJoke(
    event,
    `${matchKey}:round:${round.sequence_no}`,
    new Set(excludedIds),
    contextualJokeOptions(event, winner, round),
  );
  return {
    id: selected.id,
    title: roundTitle(event),
    text: selected.text,
    special: event === "abdullah",
  };
}

function detectComeback(rounds: Round[], winner: TeamCode) {
  let cumulativeA = 0;
  let cumulativeB = 0;
  let largestDeficit = 0;
  for (const round of rounds) {
    cumulativeA += round.team_a_total;
    cumulativeB += round.team_b_total;
    const deficit = winner === "A" ? cumulativeB - cumulativeA : cumulativeA - cumulativeB;
    largestDeficit = Math.max(largestDeficit, deficit);
  }
  return largestDeficit;
}

function projectsStronglyAffectedMatch(rounds: Round[], winner: TeamCode, margin: number) {
  const loser: TeamCode = winner === "A" ? "B" : "A";
  const winnerProjects = rounds.reduce((sum, round) => sum + projectPoints(round, winner), 0);
  const loserProjects = rounds.reduce((sum, round) => sum + projectPoints(round, loser), 0);
  return winnerProjects >= 20 && (
    winnerProjects - loserProjects >= 10 ||
    winnerProjects >= margin ||
    rounds.some(projectsStronglyAffectedRound)
  );
}

function projectedStreakNames(input: MatchJokeInput, team: TeamCode, kind: "win" | "loss") {
  const names: string[] = [];
  input.playerIds.forEach((playerId, seat) => {
    if (seatTeam(seat) !== team) return;
    const profile = input.historicalProfiles?.[playerId];
    const previous = kind === "win"
      ? profile?.currentWinningStreak ?? 0
      : profile?.currentLosingStreak ?? 0;
    if (previous + 1 >= 3) names.push(input.playerNames[seat]);
  });
  return names;
}

export function buildMatchJokes(input: MatchJokeInput): MatchJokeResult {
  const winner: TeamCode = input.scoreA > input.scoreB ? "A" : "B";
  const loser: TeamCode = winner === "A" ? "B" : "A";
  const margin = Math.abs(input.scoreA - input.scoreB);
  const finalRound = input.rounds.at(-1);
  const failedCount = input.rounds.filter((round) => round.bidder_failed).length;
  const comebackDeficit = detectComeback(input.rounds, winner);
  const winningStreakNames = projectedStreakNames(input, winner, "win");
  const losingStreakNames = projectedStreakNames(input, loser, "loss");

  const events = new Set<JokeEvent>();
  const abdullahSeat = input.playerNames.findIndex(isAbdullahSharif);
  if (abdullahSeat >= 0 && seatTeam(abdullahSeat) === loser) events.add("abdullah");
  if (failedCount > 0) events.add("failed");
  if (input.rounds.some((round) => round.kaboot_team === roundWinner(round))) events.add("kaboot");
  if (input.rounds.some((round) => round.reverse_kaboot_team === roundWinner(round))) events.add("reverse");
  if (finalRound?.multiplier === 152 && roundWinner(finalRound) === winner) events.add("coffee");
  if (comebackDeficit >= 40) events.add("comeback");
  if (margin >= 80) events.add("large");
  if (margin <= 15) events.add("close");
  if (losingStreakNames.length > 0) events.add("losingStreak");
  if (winningStreakNames.length > 0) events.add("winningStreak");
  if (projectsStronglyAffectedMatch(input.rounds, winner, margin)) events.add("projects");

  const detectedEvents = MATCH_EVENT_PRIORITY.filter((event) => events.has(event));
  const eventLabels: string[] = [];
  if (events.has("abdullah")) eventLabels.push("زخه التفتيش");
  if (events.has("comeback")) eventLabels.push(`عودة من فارق ${comebackDeficit}`);
  if (events.has("failed")) eventLabels.push(`${failedCount} طلب فاشل`);
  if (events.has("large")) eventLabels.push("فوز كبير");
  if (events.has("close")) eventLabels.push("صكة متقاربة");
  if (events.has("kaboot")) eventLabels.push("كبوت");
  if (events.has("reverse")) eventLabels.push("كبوت عكسي");
  if (events.has("coffee")) eventLabels.push("نهاية قهوة");
  if (events.has("projects")) eventLabels.push("المشاريع أثرت في النتيجة");
  if (events.has("winningStreak")) eventLabels.push(`سلسلة فوز: ${winningStreakNames.join(" و ")}`);
  if (events.has("losingStreak")) eventLabels.push(`سلسلة خسارة: ${losingStreakNames.join(" و ")}`);

  const excluded = new Set(input.excludedJokeIds ?? []);
  const selected: JokeOption[] = [];
  for (const event of detectedEvents) {
    const joke = chooseJoke(
      event,
      `${input.matchKey}:match`,
      excluded,
      contextualJokeOptions(event, winner, finalRound),
    );
    if (!selected.some((item) => item.id === joke.id)) selected.push(joke);
    if (selected.length === 2) break;
  }

  return {
    eventLabels,
    detectedEvents,
    jokeIds: selected.map((joke) => joke.id),
    jokes: selected.map((joke) => joke.text),
    comebackDeficit,
    winningStreakNames,
    losingStreakNames,
  };
}
