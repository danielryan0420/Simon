import { MLB_TEAMS, NBA_TEAMS, SPORTS_TEAMS, type SportsTeam } from "../data/sportsTeams";
import { shuffle } from "./rng";
import { scoreAnswer, timeBonus, type AnswerScore } from "./scoring";

export type LeagueFilter = "MLB" | "NBA" | "mixed";

export const SPORTS_ROUND_LENGTH = 8;

export function teamsForLeague(filter: LeagueFilter): SportsTeam[] {
  if (filter === "MLB") return MLB_TEAMS;
  if (filter === "NBA") return NBA_TEAMS;
  return SPORTS_TEAMS;
}

/** Shuffles the league pool into a round queue, reshuffling if the pool is smaller than the round. */
export function buildSportsRoundQueue(filter: LeagueFilter, roundLength: number, rng: () => number): SportsTeam[] {
  const pool = teamsForLeague(filter);
  if (pool.length === 0) return [];
  const queue: SportsTeam[] = [];
  while (queue.length < roundLength) queue.push(...shuffle(pool, rng));
  return queue.slice(0, roundLength);
}

/** "Find the City" forward round: same distance-based accuracy curve as every other mode, pinned to a flat difficulty since Sports Map has no difficulty tiers. */
export function scoreSportsGuess(distanceKm: number, timeMs: number, streak: number): AnswerScore {
  return scoreAnswer(distanceKm, timeMs, "rookie", streak);
}

const REVERSE_BASE_POINTS = 500;

/** "Which Team Plays Here?" reverse round: correctness is a multiple-choice boolean, with a speed bonus on top. */
export function pointsForReverseGuess(correct: boolean, timeMs: number): number {
  return correct ? REVERSE_BASE_POINTS + timeBonus(timeMs) : 0;
}

export function xpForSportsPoints(points: number): number {
  return Math.max(1, Math.round(points / 10));
}

/** Builds the multiple-choice options for a reverse question: the correct team plus same-league distractors. */
export function buildReverseChoices(team: SportsTeam, pool: SportsTeam[], rng: () => number, count = 4): SportsTeam[] {
  const sameLeague = pool.filter((t) => t.league === team.league && t.id !== team.id);
  const distractors = shuffle(sameLeague, rng).slice(0, Math.max(0, count - 1));
  return shuffle([team, ...distractors], rng);
}

/** Simple code-drawn badge: a colored circle with a scoreboard-style abbreviation. No logos or trademarked artwork. */
export function badgeSvgFor(team: SportsTeam): string {
  const [primary, secondary] = team.colors;
  const fontSize = team.abbr.length >= 3 ? 30 : 36;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${team.name} badge"><circle cx="50" cy="50" r="45" fill="${primary}" stroke="${secondary}" stroke-width="7"/><text x="50" y="61" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" fill="${secondary}" text-anchor="middle">${team.abbr}</text></svg>`;
}

export const MLB_TEAM_IDS = MLB_TEAMS.map((t) => t.id);
export const NBA_TEAM_IDS = NBA_TEAMS.map((t) => t.id);
