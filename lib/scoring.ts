import type { GameType, Multiplier, ProjectItem, ProjectType, Round, TeamCode } from "./types";

const SUN_PROJECT_VALUES: Record<ProjectType, number> = {
  "سرى": 4,
  "خمسين": 10,
  "مية": 20,
  "أربعمئة": 40,
  "بلوت": 0,
};

const HOKUM_PROJECT_VALUES: Record<ProjectType, number> = {
  "سرى": 2,
  "خمسين": 5,
  "مية": 10,
  "أربعمئة": 0,
  "بلوت": 2,
};

export function nextDealerToRight(index: number) {
  // Seat order is top, right, bottom, left. The person on the dealer's right
  // is therefore the previous item in this array.
  return (index + 3) % 4;
}

export function dealerArrow(index: number) {
  return ["↑", "→", "↓", "←"][index % 4];
}

export function teamForSeat(index: number): TeamCode {
  return index % 2 === 0 ? "A" : "B";
}

export function oppositeTeam(team: TeamCode): TeamCode {
  return team === "A" ? "B" : "A";
}

export function defaultScoreTeamForBidder(index: number): TeamCode {
  return oppositeTeam(teamForSeat(index));
}

export function teammateSeat(index: number) {
  return (index + 2) % 4;
}

export function dealerLeftSeat(index: number) {
  return (index + 1) % 4;
}

export function roundSunRaw(raw: number) {
  const safe = Math.max(0, Math.min(130, Math.trunc(raw)));
  const ones = safe % 10;
  if (ones < 5) return safe - ones;
  if (ones === 5) return safe;
  return safe + (10 - ones);
}

export function roundHokumRaw(raw: number) {
  const safe = Math.max(0, Math.min(162, Math.trunc(raw)));
  const ones = safe % 10;
  return ones <= 5 ? safe - ones : safe + (10 - ones);
}

export function baseScores(gameType: GameType, enteredTeam: TeamCode, raw: number) {
  const sunLike = gameType === "صن" || gameType === "أشكل";
  const converted = sunLike ? (roundSunRaw(raw) * 2) / 10 : roundHokumRaw(raw) / 10;
  const roundTotal = sunLike ? 26 : 16;
  const remainder = roundTotal - converted;
  return enteredTeam === "A"
    ? { a: converted, b: remainder, roundTotal }
    : { a: remainder, b: converted, roundTotal };
}

function projectValue(gameType: GameType, type: ProjectType) {
  return gameType === "حكم" ? HOKUM_PROJECT_VALUES[type] : SUN_PROJECT_VALUES[type];
}

export function projectSummary(gameType: GameType, projects: ProjectItem[], tieWinner: TeamCode | null) {
  const nonBaloot = projects.filter((p) => p.type !== "بلوت" && p.quantity > 0);
  const highest = (team: TeamCode) => nonBaloot
    .filter((p) => p.team === team)
    .reduce((max, p) => Math.max(max, projectValue(gameType, p.type)), 0);

  const highA = highest("A");
  const highB = highest("B");
  let countedTeam: TeamCode | null = null;
  if (highA > highB) countedTeam = "A";
  else if (highB > highA) countedTeam = "B";
  else if (highA > 0 && highA === highB) countedTeam = tieWinner;

  const sumFor = (team: TeamCode) => nonBaloot
    .filter((p) => p.team === team && countedTeam === team)
    .reduce((sum, p) => sum + projectValue(gameType, p.type) * p.quantity, 0);

  const balootFor = (team: TeamCode) => gameType === "حكم"
    ? projects
      .filter((p) => p.team === team && p.type === "بلوت")
      .reduce((sum, p) => sum + 2 * p.quantity, 0)
    : 0;

  return {
    countedTeam,
    tied: highA > 0 && highA === highB,
    aProjects: sumFor("A"),
    bProjects: sumFor("B"),
    aBaloot: balootFor("A"),
    bBaloot: balootFor("B"),
  };
}

export type CalculateRoundInput = Omit<Round,
  "team_a_base" | "team_b_base" | "team_a_projects" | "team_b_projects" |
  "team_a_baloot" | "team_b_baloot" | "counted_project_team" | "bidder_failed" |
  "team_a_total" | "team_b_total"
>;

export type MatchScoreContext = {
  currentA: number;
  currentB: number;
};

export function multiplierTeamIsValid(
  originalBidderPosition: number,
  announcerPosition: number | null,
  multiplier: Multiplier,
) {
  if (multiplier === 1) return announcerPosition === null;
  if (announcerPosition === null) return false;
  const originalTeam = teamForSeat(originalBidderPosition);
  const announcerTeam = teamForSeat(announcerPosition);
  const expectedTeam = multiplier === 2 || multiplier === 4
    ? (originalTeam === "A" ? "B" : "A")
    : originalTeam;
  return announcerTeam === expectedTeam;
}

export function sunMultiplierAllowed(
  gameType: GameType,
  originalBidderPosition: number,
  currentA: number,
  currentB: number,
) {
  if (gameType === "حكم") return true;
  const bidderTeam = teamForSeat(originalBidderPosition);
  const bidderScore = bidderTeam === "A" ? currentA : currentB;
  const opponentScore = bidderTeam === "A" ? currentB : currentA;
  return bidderScore >= 100 && opponentScore < 100;
}

export function validateRoundInput(input: CalculateRoundInput, matchScore?: MatchScoreContext) {
  const errors: string[] = [];
  const rawError = validateRawScore(input.game_type, input.raw_card_score);
  if (rawError) errors.push(rawError);

  if (![0, 1, 2, 3].includes(input.dealer_position)) errors.push("الموزع غير صحيح");
  if (![0, 1, 2, 3].includes(input.original_bidder_position)) errors.push("الطالع غير صحيح");
  if (![0, 1, 2, 3].includes(input.bidder_position)) errors.push("آخر طالع غير صحيح");

  if (input.game_type === "أشكل") {
    const eligible = input.original_bidder_position === input.dealer_position ||
      input.original_bidder_position === dealerLeftSeat(input.dealer_position);
    if (!eligible) errors.push("أشكل متاح للموزع أو اللاعب على يساره فقط");
    if (input.exposed_card_receiver_position !== teammateSeat(input.original_bidder_position)) {
      errors.push("في أشكل يجب أن تذهب الورقة المكشوفة لشريك الطالع");
    }
  }

  if (!multiplierTeamIsValid(
    input.original_bidder_position,
    input.multiplier_announcer_position,
    input.multiplier,
  )) {
    errors.push("تسلسل دبل وثري وفور وقهوة غير صحيح");
  }

  if (input.game_type !== "حكم" && ![1, 2].includes(input.multiplier)) {
    errors.push("في صن وأشكل تتوقف المضاعفة عند دبل");
  }

  if (input.game_type !== "حكم" && input.multiplier === 2) {
    if (!matchScore || !sunMultiplierAllowed(
      input.game_type,
      input.original_bidder_position,
      matchScore.currentA,
      matchScore.currentB,
    )) {
      errors.push("الدبل في صن وأشكل يحتاج الطالع ١٠٠ أو أكثر والخصم أقل من ١٠٠");
    }
  }

  if (input.multiplier > 1 && input.bidder_position !== input.multiplier_announcer_position) {
    errors.push("آخر من رفع الطلب يجب أن يكون هو الطالع الحالي");
  }

  if (input.multiplier === 1 && input.bidder_position !== input.original_bidder_position) {
    errors.push("الطالع الحالي يجب أن يطابق الطالع الأصلي بدون مضاعفة");
  }

  if (input.kaboot_team && input.reverse_kaboot_team) {
    errors.push("لا يمكن تسجيل كبوت وكبوت عكسي في نفس الراوند");
  }
  if (input.reverse_kaboot_team && input.game_type === "حكم") {
    errors.push("الكبوت العكسي متاح في صن وأشكل فقط");
  }

  const baloot = input.projects.filter((p) => p.type === "بلوت" && p.quantity > 0);
  if (input.game_type !== "حكم" && baloot.length) errors.push("بلوت متاح في الحكم فقط");
  if (baloot.reduce((sum, p) => sum + p.quantity, 0) > 1) errors.push("لا يمكن تسجيل أكثر من بلوت واحد في الراوند");
  if (input.game_type === "حكم" && input.projects.some((p) => p.type === "أربعمئة" && p.quantity > 0)) {
    errors.push("أربعمئة غير متاحة في الحكم");
  }

  if (input.projects.some((p) => !Number.isInteger(p.quantity) || p.quantity < 0)) {
    errors.push("كمية المشروع غير صحيحة");
  }

  const summary = projectSummary(input.game_type, input.projects, input.tied_project_winner);
  if (summary.tied && !input.tied_project_winner) {
    errors.push("المشاريع متساوية، اختر الفريق الذي تُحسب له");
  }

  return errors;
}

export function calculateRound(input: CalculateRoundInput, matchScore?: MatchScoreContext): Round {
  const errors = validateRoundInput(input, matchScore);
  if (errors.length) throw new Error(errors[0]);

  const bases = baseScores(input.game_type, input.entered_team, input.raw_card_score);
  const summary = projectSummary(input.game_type, input.projects, input.tied_project_winner);
  const bidderTeam = teamForSeat(input.bidder_position);

  if (input.reverse_kaboot_team) {
    // Reverse kaboot keeps its fixed 88-point card value, then adds the
    // winning team's valid projects. Baloot is already excluded here because
    // reverse kaboot is only available in صن/أشكل.
    const winner = input.reverse_kaboot_team;
    const winnerProjects = winner === "A" ? summary.aProjects : summary.bProjects;
    const winnerBaloot = winner === "A" ? summary.aBaloot : summary.bBaloot;
    const winnerTotal = 88 + winnerProjects + winnerBaloot;
    return {
      ...input,
      team_a_base: bases.a,
      team_b_base: bases.b,
      team_a_projects: summary.aProjects,
      team_b_projects: summary.bProjects,
      team_a_baloot: summary.aBaloot,
      team_b_baloot: summary.bBaloot,
      counted_project_team: summary.countedTeam,
      bidder_failed: bidderTeam !== winner,
      team_a_total: winner === "A" ? winnerTotal : 0,
      team_b_total: winner === "B" ? winnerTotal : 0,
    };
  }

  if (input.kaboot_team) {
    // Kaboot keeps its fixed card value (44 in صن/أشكل, 25 in حكم), then
    // adds the winning team's valid projects. بلوت remains worth two points
    // and is never multiplied. The losing side stays at zero.
    const winner = input.kaboot_team;
    const kaboot = input.game_type === "حكم" ? 25 : 44;
    const winnerProjects = winner === "A" ? summary.aProjects : summary.bProjects;
    const winnerBaloot = winner === "A" ? summary.aBaloot : summary.bBaloot;
    const winnerTotal = kaboot + winnerProjects + winnerBaloot;
    return {
      ...input,
      team_a_base: bases.a,
      team_b_base: bases.b,
      team_a_projects: summary.aProjects,
      team_b_projects: summary.bProjects,
      team_a_baloot: summary.aBaloot,
      team_b_baloot: summary.bBaloot,
      counted_project_team: summary.countedTeam,
      bidder_failed: bidderTeam !== winner,
      team_a_total: winner === "A" ? winnerTotal : 0,
      team_b_total: winner === "B" ? winnerTotal : 0,
    };
  }

  const beforeA = bases.a + summary.aProjects + summary.aBaloot;
  const beforeB = bases.b + summary.bProjects + summary.bBaloot;
  const tied = beforeA === beforeB;
  const multiplierActive = input.multiplier !== 1;
  const bidderFailed = bidderTeam === "A"
    ? beforeA < beforeB || (tied && multiplierActive)
    : beforeB < beforeA || (tied && multiplierActive);

  let aBase = bases.a;
  let bBase = bases.b;
  let aProjects = summary.aProjects;
  let bProjects = summary.bProjects;

  if (bidderFailed) {
    if (bidderTeam === "A") {
      aBase = 0;
      aProjects = 0;
      bBase = bases.roundTotal;
    } else {
      bBase = 0;
      bProjects = 0;
      aBase = bases.roundTotal;
    }
  }

  let aTotal: number;
  let bTotal: number;
  if (input.multiplier === 152) {
    const winner = bidderFailed
      ? (bidderTeam === "A" ? "B" : "A")
      : (beforeA >= beforeB ? "A" : "B");
    aTotal = winner === "A" ? 152 : 0;
    bTotal = winner === "B" ? 152 : 0;
  } else if (input.multiplier > 1) {
    // In دبل/ثري/فور the losing side receives zero. Base and projects are
    // multiplied, while بلوت stays worth two points and is never multiplied.
    const winner = bidderFailed
      ? (bidderTeam === "A" ? "B" : "A")
      : (beforeA >= beforeB ? "A" : "B");
    const factor = input.multiplier as 2 | 3 | 4;
    const multipliedPool = (bases.roundTotal + summary.aProjects + summary.bProjects) * factor
      + summary.aBaloot + summary.bBaloot;
    aTotal = winner === "A" ? multipliedPool : 0;
    bTotal = winner === "B" ? multipliedPool : 0;
  } else {
    aTotal = aBase + aProjects + summary.aBaloot;
    bTotal = bBase + bProjects + summary.bBaloot;
  }

  return {
    ...input,
    team_a_base: bases.a,
    team_b_base: bases.b,
    team_a_projects: summary.aProjects,
    team_b_projects: summary.bProjects,
    team_a_baloot: summary.aBaloot,
    team_b_baloot: summary.bBaloot,
    counted_project_team: summary.countedTeam,
    bidder_failed: bidderFailed,
    team_a_total: aTotal,
    team_b_total: bTotal,
  };
}

export function validateRawScore(gameType: GameType, raw: number) {
  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 0) return "العدد المدخل غير صحيح";
  const max = gameType === "حكم" ? 162 : 130;
  if (raw > max) return `الحد الأعلى للعدد في ${gameType} هو ${max}`;
  return "";
}

export function gameEnded(a: number, b: number) {
  if (a < 152 && b < 152) return { ended: false, winner: null as TeamCode | null, suddenDeath: false };
  if (a === b) return { ended: false, winner: null as TeamCode | null, suddenDeath: true };
  return { ended: true, winner: a > b ? "A" as TeamCode : "B" as TeamCode, suddenDeath: false };
}
