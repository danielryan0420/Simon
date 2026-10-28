import { describe, expect, it } from "vitest";
import { MLB_TEAMS, NBA_TEAMS, SPORTS_TEAMS, teamById } from "../src/data/sportsTeams";

function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}
function isValidLon(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

describe("MLB_TEAMS and NBA_TEAMS", () => {
  it("has exactly 30 MLB teams and 30 NBA teams", () => {
    expect(MLB_TEAMS).toHaveLength(30);
    expect(NBA_TEAMS).toHaveLength(30);
    expect(SPORTS_TEAMS).toHaveLength(60);
  });

  it("has unique ids across both leagues", () => {
    const ids = SPORTS_TEAMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tags every id with its own league prefix", () => {
    for (const t of MLB_TEAMS) expect(t.id.startsWith("mlb-")).toBe(true);
    for (const t of NBA_TEAMS) expect(t.id.startsWith("nba-")).toBe(true);
  });

  it("gives every team valid coordinates inside North America", () => {
    for (const t of SPORTS_TEAMS) {
      expect(isValidLat(t.lat)).toBe(true);
      expect(isValidLon(t.lon)).toBe(true);
      // Every current MLB/NBA market (including Toronto) sits within this bounding box.
      expect(t.lat).toBeGreaterThan(24);
      expect(t.lat).toBeLessThan(50);
      expect(t.lon).toBeGreaterThan(-125);
      expect(t.lon).toBeLessThan(-65);
    }
  });

  it("gives every team a name, nickname, city, venue, fact, and 2-3 letter abbreviation", () => {
    for (const t of SPORTS_TEAMS) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.nickname.length).toBeGreaterThan(0);
      expect(t.city.length).toBeGreaterThan(0);
      expect(t.venue.length).toBeGreaterThan(0);
      expect(t.fact.length).toBeGreaterThan(10);
      expect(t.abbr.length).toBeGreaterThanOrEqual(2);
      expect(t.abbr.length).toBeLessThanOrEqual(3);
      expect(t.colors).toHaveLength(2);
      for (const c of t.colors) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("places the Toronto teams in Canada, not confused with any US city", () => {
    const jays = teamById("mlb-tor")!;
    const raptors = teamById("nba-tor")!;
    expect(jays.city).toContain("Canada");
    expect(raptors.city).toContain("Canada");
    expect(jays.lat).toBeCloseTo(43.64, 0);
    expect(raptors.lat).toBeCloseTo(43.64, 0);
  });

  it("marks exactly the Brewers and Bucks as the hometown highlight", () => {
    const hometown = SPORTS_TEAMS.filter((t) => t.isHometown).map((t) => t.id);
    expect(hometown.sort()).toEqual(["mlb-mil", "nba-mil"]);
  });

  it("notes the Athletics' temporary West Sacramento home and Las Vegas plan as a fun fact only", () => {
    const athletics = teamById("mlb-ath")!;
    expect(athletics.city).toContain("Sacramento");
    expect(athletics.fact.toLowerCase()).toContain("las vegas");
  });

  it("resolves teamById for a known id and returns undefined for an unknown one", () => {
    expect(teamById("mlb-nyy")?.name).toBe("New York Yankees");
    expect(teamById("nope")).toBeUndefined();
  });
});
