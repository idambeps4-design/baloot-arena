import type { MatchHandRow, MatchRow, Player, PlayerProfile, TeamCode } from "./types";

export type PlayerAdvancedStat = {
  playerId: string;
  name: string;
  matches: number;
  wins: number;
  winRate: number;
  rounds: number;
  averagePointsPerRound: number;
  hokmRoundWins: number;
  sunRoundWins: number;
  kaboots: number;
  longestWinningStreak: number;
};

function teamForPlayer(match: MatchRow, playerId: string): TeamCode | null {
  if ([match.team_a_player_1, match.team_a_player_2].includes(playerId)) return "A";
  if ([match.team_b_player_1, match.team_b_player_2].includes(playerId)) return "B";
  return null;
}

export function buildAdvancedStats(
  players: Player[],
  matches: MatchRow[],
  hands: MatchHandRow[],
  profiles: Record<string, PlayerProfile>,
): PlayerAdvancedStat[] {
  const handsByMatch = new Map<string, MatchHandRow[]>();
  for (const hand of hands) handsByMatch.set(hand.match_id, [...(handsByMatch.get(hand.match_id) ?? []), hand]);

  return players.map((player) => {
    let matchesPlayed = 0;
    let wins = 0;
    let rounds = 0;
    let points = 0;
    let hokmRoundWins = 0;
    let sunRoundWins = 0;
    let kaboots = 0;

    for (const match of matches) {
      const team = teamForPlayer(match, player.id);
      if (!team) continue;
      matchesPlayed += 1;
      const wonMatch = team === "A" ? match.score_a > match.score_b : match.score_b > match.score_a;
      if (wonMatch) wins += 1;
      const matchHands = handsByMatch.get(match.id) ?? [];
      for (const hand of matchHands) {
        rounds += 1;
        points += team === "A" ? hand.team_a_total : hand.team_b_total;
        const wonRound = team === "A" ? hand.team_a_total > hand.team_b_total : hand.team_b_total > hand.team_a_total;
        if (wonRound && hand.game_type === "حكم") hokmRoundWins += 1;
        if (wonRound && hand.game_type === "صن") sunRoundWins += 1;
        if (hand.kaboot_team === team || hand.reverse_kaboot_team === team) kaboots += 1;
      }
    }

    return {
      playerId: player.id,
      name: player.name,
      matches: matchesPlayed,
      wins,
      winRate: matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0,
      rounds,
      averagePointsPerRound: rounds ? Math.round((points / rounds) * 10) / 10 : 0,
      hokmRoundWins,
      sunRoundWins,
      kaboots,
      longestWinningStreak: profiles[player.id]?.longestWinningStreak ?? 0,
    };
  }).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || a.name.localeCompare(b.name, "ar"));
}

export function completedMatchesCsv(matches: MatchRow[], players: Player[]) {
  const names = new Map(players.map((player) => [player.id, player.name]));
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["التاريخ", "الفريق الأول", "الفريق الثاني", "نتيجة الأول", "نتيجة الثاني"]];
  for (const match of matches) {
    rows.push([
      new Date(match.created_at).toLocaleDateString("ar-AE"),
      `${names.get(match.team_a_player_1) ?? "—"} + ${names.get(match.team_a_player_2) ?? "—"}`,
      `${names.get(match.team_b_player_1) ?? "—"} + ${names.get(match.team_b_player_2) ?? "—"}`,
      String(match.score_a),
      String(match.score_b),
    ]);
  }
  return "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\n");
}
