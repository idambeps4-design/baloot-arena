import type { MatchHandRow, MatchRow, Round } from "./types";

export function mergeCompletedMatchSnapshot(
  matches: MatchRow[],
  hands: MatchHandRow[],
  match: MatchRow,
  rounds: Round[],
) {
  const nextMatches = [match, ...matches.filter((item) => item.id !== match.id)]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  const savedHands = rounds.map((round) => ({ ...round, match_id: match.id }));
  const nextHands = [
    ...hands.filter((hand) => hand.match_id !== match.id),
    ...savedHands,
  ];
  return { matches: nextMatches, hands: nextHands };
}
