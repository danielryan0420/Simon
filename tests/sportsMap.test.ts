import { describe, expect, it } from "vitest";
import { mulberry32 } from "../src/game/rng";
import { MLB_TEAMS, NBA_TEAMS, SPORTS_TEAMS, teamById } from "../src/data/sportsTeams";
import {
  badgeSvgFor,
  buildReverseChoices,
  buildSportsRoundQueue,
  pointsForReverseGuess,
  scoreSportsGuess,
  teamsForLeague,
  xpForSportsPoints,
} from "../src/game/sportsMap";

describe("teamsForLeague", () => {
  it("filters by league and returns everyone for 'mixed'", () => {
    expect(teamsForLeague("MLB")).toEqual(MLB_TEAMS);
    expect(teamsForLeague("NBA")).toEqual(NBA_TEAMS);
    expect(teamsForLeague("mixed")).toEqual(SPORTS_TEAMS);
  });
});

describe("buildSportsRoundQueue", () => {
  it("builds a queue of the requested length from the chosen league", () => {
    const rng = mulberry32(42);
    const queue = buildSportsRoundQueue("NBA", 8, rng);
    expect(queue).toHaveLength(8);
    for (const t of queue) expect(t.league).toBe("NBA");
  });

  it("is deterministic for a fixed seed", () => {
    const q1 = buildSportsRoundQueue("MLB", 10, mulberry32(7));
    const q2 = buildSportsRoundQueue("MLB", 10, mulberry32(7));
    expect(q1.map((t) => t.id)).toEqual(q2.map((t) => t.id));
  });
});

describe("scoreSportsGuess", () => {
  it("rates a tap right on the venue as perfect", () => {
    const result = scoreSportsGuess(0, 1000, 0);
    expect(result.rating).toBe("perfect");
    expect(result.totalPoints).toBeGreaterThan(0);
  });

  it("awards full accuracy within the 60km reasonable-radius band", () => {
    const close = scoreSportsGuess(40, 3000, 0);
    const far = scoreSportsGuess(2000, 3000, 0);
    expect(close.rating).toBe("perfect");
    expect(close.totalPoints).toBeGreaterThan(far.totalPoints);
  });

  it("scores a continent-away miss as zero accuracy", () => {
    expect(scoreSportsGuess(4000, 3000, 0).rating).toBe("miss");
  });
});

describe("pointsForReverseGuess", () => {
  it("awards zero points for a wrong guess", () => {
    expect(pointsForReverseGuess(false, 1000)).toBe(0);
  });

  it("awards positive points for a correct guess, more when faster", () => {
    const fast = pointsForReverseGuess(true, 500);
    const slow = pointsForReverseGuess(true, 9000);
    expect(fast).toBeGreaterThan(0);
    expect(fast).toBeGreaterThanOrEqual(slow);
  });
});

describe("xpForSportsPoints", () => {
  it("never drops below 1 xp, even for zero points", () => {
    expect(xpForSportsPoints(0)).toBeGreaterThanOrEqual(1);
  });
});

describe("buildReverseChoices", () => {
  it("always includes the correct team exactly once among same-league distractors", () => {
    const team = teamById("mlb-nyy")!;
    const choices = buildReverseChoices(team, MLB_TEAMS, mulberry32(3), 4);
    expect(choices).toHaveLength(4);
    expect(choices.filter((c) => c.id === team.id)).toHaveLength(1);
    for (const c of choices) expect(c.league).toBe("MLB");
  });

  it("never offers a distractor from the other league", () => {
    const team = teamById("nba-lal")!;
    const choices = buildReverseChoices(team, SPORTS_TEAMS, mulberry32(9), 4);
    for (const c of choices) expect(c.league).toBe("NBA");
  });
});

describe("badgeSvgFor", () => {
  it("draws a plain colored circle with the team's abbreviation text, no external image", () => {
    const team = teamById("mlb-mil")!;
    const svg = badgeSvgFor(team);
    expect(svg).toContain("<svg");
    expect(svg).toContain(team.colors[0]);
    expect(svg).toContain(team.colors[1]);
    expect(svg).toContain(`>${team.abbr}<`);
  });
});
