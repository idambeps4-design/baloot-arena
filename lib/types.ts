export type Player = {
  id: string;
  name: string;
  nickname?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type GameType = "حكم" | "صن" | "أشكل";
export type Multiplier = 1 | 2 | 3 | 4 | 152;
export type TeamCode = "A" | "B";
export type ProjectType = "سرى" | "خمسين" | "مية" | "أربعمئة" | "بلوت";

export type ProjectItem = {
  team: TeamCode;
  type: ProjectType;
  quantity: number;
};

export type Round = {
  id?: string;
  sequence_no: number;
  dealer_position: number;
  bidder_position: number;
  original_bidder_position: number;
  exposed_card_receiver_position: number | null;
  bidding_stage: "أول" | "ثاني";
  game_type: GameType;
  multiplier: Multiplier;
  multiplier_announcer_position: number | null;
  entered_team: TeamCode;
  raw_card_score: number;
  projects: ProjectItem[];
  tied_project_winner: TeamCode | null;
  team_a_base: number;
  team_b_base: number;
  team_a_projects: number;
  team_b_projects: number;
  team_a_baloot: number;
  team_b_baloot: number;
  counted_project_team: TeamCode | null;
  kaboot_team: TeamCode | null;
  reverse_kaboot_team: TeamCode | null;
  bidder_failed: boolean;
  team_a_total: number;
  team_b_total: number;
};

export type JokeEvent =
  | "abdullah"
  | "failed"
  | "kaboot"
  | "reverse"
  | "coffee"
  | "comeback"
  | "large"
  | "close"
  | "losingStreak"
  | "winningStreak"
  | "projects";

export type MatchSummary = {
  headline: string;
  resultLine: string;
  starPlayerId: string;
  starPlayerName: string;
  bankruptPlayerId: string;
  bankruptPlayerName: string;
  starReasons: string[];
  bankruptReasons: string[];
  eventLabels: string[];
  detectedEvents: JokeEvent[];
  storyline: string[];
  jokeIds: string[];
  jokes: string[];
};

export type RoundAnnouncement = {
  id: string;
  title: string;
  text: string;
  special: boolean;
};

export type MatchRow = {
  id: string;
  score_a: number;
  score_b: number;
  created_at: string;
  team_a_player_1: string;
  team_a_player_2: string;
  team_b_player_1: string;
  team_b_player_2: string;
  kaboot_count_a?: number;
  kaboot_count_b?: number;
  match_key?: string | null;
  summary_json?: MatchSummary | null;
};

export type MatchHandRow = Round & {
  match_id: string;
};

export type PlayerProfile = {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  currentWinningStreak: number;
  longestWinningStreak: number;
  currentLosingStreak: number;
  longestLosingStreak: number;
  successfulBids: number;
  failedBids: number;
  kaboots: number;
  reverseKaboots: number;
  coffeeFinishes: number;
  projectPoints: number;
  bestPartner: string;
  mostFrequentPartner: string;
  hardestOpponent: string;
};
