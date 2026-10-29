import { describe, expect, it } from "vitest";
import { getTargets, cluesForTarget, factDetailsForTarget, memoryTipForTarget, MODES } from "../src/game/targets";
import { memoryTipForTeam } from "../src/game/sportsMap";
import { SPORTS_TEAMS } from "../src/data/sportsTeams";

describe("factDetailsForTarget", () => {
  it("returns at least one non-empty teaching line for every target in every mode", () => {
    for (const { id: mode } of MODES) {
      for (const target of getTargets(mode)) {
        const details = factDetailsForTarget(mode, target.id);
        expect(details.length, `${mode}:${target.id} has no fact details`).toBeGreaterThan(0);
        for (const line of details) expect(line.length).toBeGreaterThan(0);
      }
    }
  });

  it("surfaces a country's continent and capital", () => {
    const usa = getTargets("countries").find((t) => t.id === "usa")!;
    const details = factDetailsForTarget("countries", usa.id);
    expect(details.join(" ")).toContain("North America");
    expect(details.join(" ")).toContain("Washington");
  });

  it("surfaces a state's capital", () => {
    const alaska = getTargets("states").find((t) => t.name === "Alaska")!;
    expect(factDetailsForTarget("states", alaska.id).join(" ")).toContain("Juneau");
  });
});

describe("memoryTipForTarget", () => {
  it("returns a non-empty tip for every target in every mode", () => {
    for (const { id: mode } of MODES) {
      for (const target of getTargets(mode)) {
        const tip = memoryTipForTarget(mode, target.id);
        expect(tip, `${mode}:${target.id} has no memory tip`).toBeTruthy();
        expect(tip!.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("cluesForTarget", () => {
  it("gives countries, capitals, landmarks, and flags at least one progressive clue", () => {
    for (const mode of ["countries", "capitals", "landmarks", "flags"] as const) {
      const targets = getTargets(mode);
      expect(targets.length).toBeGreaterThan(0);
      for (const target of targets) {
        expect(cluesForTarget(mode, target.id).length).toBeGreaterThan(0);
      }
    }
  });

  it("reveals clues vaguest-first (continent before capital) for countries", () => {
    const clues = cluesForTarget("countries", "usa");
    expect(clues[0]).toContain("North America");
    expect(clues[1]).toContain("Washington");
  });

  it("does not throw for states, which have no progressive clue set", () => {
    const states = getTargets("states");
    for (const s of states) expect(() => cluesForTarget("states", s.id)).not.toThrow();
  });
});

describe("memoryTipForTeam", () => {
  it("returns a non-empty tip naming the team's city for every sports team", () => {
    for (const team of SPORTS_TEAMS) {
      const tip = memoryTipForTeam(team);
      expect(tip.length).toBeGreaterThan(0);
      expect(tip).toContain(team.city.split(",")[0]);
    }
  });
});
