import { buildMatchJokes, buildRoundAnnouncement, projectsStronglyAffectedRound, roundWinner } from "./jokes";
import { isAbdullahSharif, normalizeArabicPlayerName } from "./names";
import type {
  MatchHandRow,
  MatchRow,
  MatchSummary,
  Player,
  PlayerProfile,
  Round,
  TeamCode,
} from "./types";

export { buildRoundAnnouncement, isAbdullahSharif, normalizeArabicPlayerName };

type PlayerMap = Map<string, Player>;
type Relation = { matches: number; wins: number; losses: number };

function teamForSeat(seat: number): TeamCode {
  return seat % 2 === 0 ? "A" : "B";
}

function teamPlayers(match: MatchRow, team: TeamCode) {
  return team === "A"
    ? [match.team_a_player_1, match.team_a_player_2]
    : [match.team_b_player_1, match.team_b_player_2];
}

function playerTeam(match: MatchRow, playerId: string): TeamCode | null {
  if (teamPlayers(match, "A").includes(playerId)) return "A";
  if (teamPlayers(match, "B").includes(playerId)) return "B";
  return null;
}

function winnerTeam(match: MatchRow): TeamCode {
  return match.score_a > match.score_b ? "A" : "B";
}

function seatPlayerIds(match: MatchRow) {
  return [
    match.team_a_player_1,
    match.team_b_player_1,
    match.team_a_player_2,
    match.team_b_player_2,
  ];
}

function nameFor(players: PlayerMap, id: string | undefined) {
  if (!id) return "—";
  return players.get(id)?.name ?? "—";
}

function chooseRelation(
  relations: Map<string, Relation>,
  players: PlayerMap,
  compare: (left: [string, Relation], right: [string, Relation]) => number,
) {
  const selected = [...relations.entries()].sort(compare)[0];
  return selected ? nameFor(players, selected[0]) : "—";
}

export function buildPlayerProfiles(
  players: Player[],
  matches: MatchRow[],
  hands: MatchHandRow[],
): Record<string, PlayerProfile> {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const handsByMatch = new Map<string, MatchHandRow[]>();
  for (const hand of hands) {
    const current = handsByMatch.get(hand.match_id) ?? [];
    current.push(hand);
    handsByMatch.set(hand.match_id, current);
  }

  const profiles: Record<string, PlayerProfile> = {};
  for (const player of players) {
    const relevant = matches
      .filter((match) => playerTeam(match, player.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let wins = 0;
    let losses = 0;
    let currentWinningStreak = 0;
    let longestWinningStreak = 0;
    let currentLosingStreak = 0;
    let longestLosingStreak = 0;
    let successfulBids = 0;
    let failedBids = 0;
    let kaboots = 0;
    let reverseKaboots = 0;
    let coffeeFinishes = 0;
    let projectPoints = 0;
    const partners = new Map<string, Relation>();
    const opponents = new Map<string, Relation>();

    for (const match of relevant) {
      const team = playerTeam(match, player.id)!;
      const won = winnerTeam(match) === team;
      if (won) {
        wins += 1;
        currentWinningStreak += 1;
        currentLosingStreak = 0;
        longestWinningStreak = Math.max(longestWinningStreak, currentWinningStreak);
      } else {
        losses += 1;
        currentLosingStreak += 1;
        currentWinningStreak = 0;
        longestLosingStreak = Math.max(longestLosingStreak, currentLosingStreak);
      }

      const partnerId = teamPlayers(match, team).find((id) => id !== player.id);
      if (partnerId) {
        const relation = partners.get(partnerId) ?? { matches: 0, wins: 0, losses: 0 };
        relation.matches += 1;
        if (won) relation.wins += 1;
        else relation.losses += 1;
        partners.set(partnerId, relation);
      }

      const opponentTeam: TeamCode = team === "A" ? "B" : "A";
      for (const opponentId of teamPlayers(match, opponentTeam)) {
        const relation = opponents.get(opponentId) ?? { matches: 0, wins: 0, losses: 0 };
        relation.matches += 1;
        if (won) relation.wins += 1;
        else relation.losses += 1;
        opponents.set(opponentId, relation);
      }

      for (const hand of handsByMatch.get(match.id) ?? []) {
        const bidderId = seatPlayerIds(match)[hand.bidder_position];
        if (bidderId === player.id) {
          if (hand.bidder_failed) failedBids += 1;
          else successfulBids += 1;
        }
        if (hand.kaboot_team === team) kaboots += 1;
        if (hand.reverse_kaboot_team === team) reverseKaboots += 1;
        if (hand.multiplier === 152 && roundWinner(hand) === team) coffeeFinishes += 1;
        projectPoints += team === "A"
          ? hand.team_a_projects + hand.team_a_baloot
          : hand.team_b_projects + hand.team_b_baloot;
      }
    }

    const bestPartner = chooseRelation(partners, playerMap, (left, right) => {
      const leftRate = left[1].matches ? left[1].wins / left[1].matches : 0;
      const rightRate = right[1].matches ? right[1].wins / right[1].matches : 0;
      return right[1].wins - left[1].wins ||
        rightRate - leftRate ||
        right[1].matches - left[1].matches ||
        nameFor(playerMap, left[0]).localeCompare(nameFor(playerMap, right[0]), "ar");
    });
    const mostFrequentPartner = chooseRelation(partners, playerMap, (left, right) =>
      right[1].matches - left[1].matches ||
      right[1].wins - left[1].wins ||
      nameFor(playerMap, left[0]).localeCompare(nameFor(playerMap, right[0]), "ar"));
    const hardestOpponent = chooseRelation(opponents, playerMap, (left, right) =>
      right[1].losses - left[1].losses ||
      right[1].matches - left[1].matches ||
      nameFor(playerMap, left[0]).localeCompare(nameFor(playerMap, right[0]), "ar"));

    profiles[player.id] = {
      playerId: player.id,
      matchesPlayed: relevant.length,
      wins,
      losses,
      winPercentage: relevant.length ? Math.round((wins / relevant.length) * 100) : 0,
      currentWinningStreak,
      longestWinningStreak,
      currentLosingStreak,
      longestLosingStreak,
      successfulBids,
      failedBids,
      kaboots,
      reverseKaboots,
      coffeeFinishes,
      projectPoints,
      bestPartner,
      mostFrequentPartner,
      hardestOpponent,
    };
  }
  return profiles;
}

type SummaryInput = {
  matchKey: string;
  playerIds: [string, string, string, string];
  playerNames: [string, string, string, string];
  scoreA: number;
  scoreB: number;
  rounds: Round[];
  historicalProfiles?: Record<string, PlayerProfile>;
  excludedJokeIds?: string[];
};

type Contribution = {
  id: string;
  seat: number;
  team: TeamCode;
  score: number;
  successfulBids: number;
  failedBids: number;
  importantRoundWins: number;
  roundWins: number;
  roundLosses: number;
  projectPoints: number;
  kabootWins: number;
  reverseKabootWins: number;
  coffeeFinishes: number;
};

function multiplierLabel(round: Round) {
  if (round.multiplier === 152) return "قهوة";
  return round.multiplier === 1
    ? "عادي"
    : ({ 2: "دبل", 3: "ثري", 4: "فور" } as const)[round.multiplier];
}

function contributions(input: SummaryInput, winner: TeamCode): Contribution[] {
  return input.playerIds.map((id, seat) => {
    const team = teamForSeat(seat);
    const result: Contribution = {
      id,
      seat,
      team,
      score: team === winner ? 35 : -20,
      successfulBids: 0,
      failedBids: 0,
      importantRoundWins: 0,
      roundWins: 0,
      roundLosses: 0,
      projectPoints: 0,
      kabootWins: 0,
      reverseKabootWins: 0,
      coffeeFinishes: 0,
    };

    for (const round of input.rounds) {
      const handWinner = roundWinner(round);
      const teamPoints = team === "A" ? round.team_a_total : round.team_b_total;
      const teamProjects = team === "A"
        ? round.team_a_projects + round.team_a_baloot
        : round.team_b_projects + round.team_b_baloot;
      result.projectPoints += teamProjects;

      if (handWinner === team) {
        result.roundWins += 1;
        result.score += 3 + Math.min(12, Math.round(teamPoints / 12));
      } else if (handWinner) {
        result.roundLosses += 1;
        result.score -= 2;
      }

      if (round.bidder_position === seat) {
        if (round.bidder_failed) {
          result.failedBids += 1;
          result.score -= 18;
        } else {
          result.successfulBids += 1;
          result.score += 12;
          const important = round.multiplier > 1 || Boolean(round.kaboot_team) || Boolean(round.reverse_kaboot_team);
          if (important && handWinner === team) {
            result.importantRoundWins += 1;
            result.score += 12;
          }
        }
      }

      result.score += Math.min(20, teamProjects);
      if (round.kaboot_team === team) {
        result.kabootWins += 1;
        result.score += 18;
      }
      if (round.reverse_kaboot_team === team) {
        result.reverseKabootWins += 1;
        result.score += 25;
      }
      if (round.multiplier === 152 && handWinner === team) {
        result.coffeeFinishes += 1;
        result.score += 30;
      }
    }
    return result;
  });
}

function starReasons(player: Contribution) {
  const reasons: string[] = [];
  if (player.successfulBids > 0) reasons.push(`${player.successfulBids} طلب ناجح`);
  if (player.importantRoundWins > 0) reasons.push(`حسم ${player.importantRoundWins} راوند مهم`);
  if (player.projectPoints > 0) reasons.push(`${player.projectPoints} نقطة مشاريع لفريقه`);
  if (player.reverseKabootWins > 0) reasons.push("ساهم في كبوت عكسي");
  else if (player.kabootWins > 0) reasons.push("ساهم في كبوت");
  if (player.coffeeFinishes > 0) reasons.push("ساهم في نهاية قهوة");
  if (reasons.length === 0) reasons.push(`ساهم في ${player.roundWins} راوند فائز`);
  return reasons.slice(0, 3);
}

function bankruptReasons(player: Contribution) {
  const reasons: string[] = [];
  if (player.failedBids > 0) reasons.push(`${player.failedBids} طلب فاشل`);
  if (player.roundLosses >= 2) reasons.push(`${player.roundLosses} راوندات خاسرة`);
  if (player.successfulBids === 0 && player.projectPoints === 0) reasons.push("مساهمة منخفضة");
  reasons.push("كان في الفريق الخاسر");
  return reasons.slice(0, 3);
}

export function calculateMatchAwards(input: SummaryInput) {
  const winner: TeamCode = input.scoreA > input.scoreB ? "A" : "B";
  const loser: TeamCode = winner === "A" ? "B" : "A";
  const performance = contributions(input, winner);
  const star = performance
    .filter((player) => player.team === winner)
    .sort((left, right) => right.score - left.score || left.seat - right.seat)[0];
  const bankrupt = performance
    .filter((player) => player.team === loser)
    .sort((left, right) => {
      const leftPenalty = left.failedBids * 25 + left.roundLosses * 4 - left.successfulBids * 5 - left.projectPoints;
      const rightPenalty = right.failedBids * 25 + right.roundLosses * 4 - right.successfulBids * 5 - right.projectPoints;
      return rightPenalty - leftPenalty || right.seat - left.seat;
    })[0];
  return {
    star,
    bankrupt,
    starReasons: starReasons(star),
    bankruptReasons: bankruptReasons(bankrupt),
  };
}

export function buildMatchSummary(input: SummaryInput): MatchSummary {
  const winner: TeamCode = input.scoreA > input.scoreB ? "A" : "B";
  const loser: TeamCode = winner === "A" ? "B" : "A";
  const winningSeats = winner === "A" ? [0, 2] : [1, 3];
  const losingSeats = loser === "A" ? [0, 2] : [1, 3];
  const margin = Math.abs(input.scoreA - input.scoreB);
  const awards = calculateMatchAwards(input);
  const jokeResult = buildMatchJokes(input);

  const storyline: string[] = [];
  if (jokeResult.comebackDeficit >= 40) {
    storyline.push(`الفريق الفائز رجع بعد تأخر وصل إلى ${jokeResult.comebackDeficit} نقطة.`);
  }

  for (const round of input.rounds) {
    if (storyline.length >= 4) break;
    const originalName = input.playerNames[round.original_bidder_position];
    const currentName = input.playerNames[round.bidder_position];
    if (round.reverse_kaboot_team) {
      storyline.push(`الراوند ${round.sequence_no} شهد كبوتاً عكسياً بقيمة ٨٨ نقطة.`);
    } else if (round.multiplier === 152) {
      storyline.push(`الراوند ${round.sequence_no} أنهى الصكة بقهوة ١٥٢–٠.`);
    } else if (round.kaboot_team) {
      storyline.push(`الراوند ${round.sequence_no} حُسم بكبوت ${round.game_type} كامل.`);
    } else if (round.bidder_failed) {
      storyline.push(round.multiplier > 1 && round.bidder_position !== round.original_bidder_position
        ? `في الراوند ${round.sequence_no}، ${originalName} بدأ الطلب و${currentName} رفعه إلى ${multiplierLabel(round)} ثم خسر الرفع.`
        : `في الراوند ${round.sequence_no}، طلب ${currentName} وسقط طلبه.`);
    } else if (projectsStronglyAffectedRound(round)) {
      storyline.push(`في الراوند ${round.sequence_no}، المشاريع غيرت اتجاه النتيجة لصالح الفريق الفائز.`);
    }
  }

  if (margin >= 80 && storyline.length < 5) storyline.push(`انتهت الصكة بفارق كبير بلغ ${margin} نقطة.`);
  else if (margin <= 15 && storyline.length < 5) storyline.push(`حُسمت الصكة بفارق بسيط بلغ ${margin} نقطة.`);
  if (storyline.length === 0) storyline.push("الصكة كانت متوازنة وحُسمت في الراوندات الأخيرة.");

  const winnerNames = winningSeats.map((seat) => input.playerNames[seat]).join(" و ");
  const loserNames = losingSeats.map((seat) => input.playerNames[seat]).join(" و ");
  return {
    headline: `فاز ${winnerNames}`,
    resultLine: `${input.scoreA} - ${input.scoreB} بفارق ${margin} نقطة أمام ${loserNames}`,
    starPlayerId: awards.star.id,
    starPlayerName: input.playerNames[awards.star.seat],
    bankruptPlayerId: awards.bankrupt.id,
    bankruptPlayerName: input.playerNames[awards.bankrupt.seat],
    starReasons: awards.starReasons,
    bankruptReasons: awards.bankruptReasons,
    eventLabels: jokeResult.eventLabels,
    detectedEvents: jokeResult.detectedEvents,
    storyline,
    jokeIds: jokeResult.jokeIds,
    jokes: jokeResult.jokes,
  };
}
