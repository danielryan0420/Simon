import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../src/data/countries";
import { DETECTIVE_CLUES } from "../src/data/detectiveClues";
import {
  buildDetectiveCases,
  CLUE_ORDER,
  isCorrectGuess,
  MAX_CLUES,
  pointsForClues,
  xpForCase,
  type ClueKind,
} from "../src/game/detective";

describe("DETECTIVE_CLUES", () => {
  it("only references real COUNTRIES ids", () => {
    const countryIds = new Set(COUNTRIES.map((c) => c.id));
    for (const id of Object.keys(DETECTIVE_CLUES)) {
      expect(countryIds.has(id)).toBe(true);
    }
  });

  it("gives every entry a non-empty language, landmark, and population clue", () => {
    for (const clue of Object.values(DETECTIVE_CLUES)) {
      expect(clue.language.length).toBeGreaterThan(0);
      expect(clue.landmark.length).toBeGreaterThan(0);
      expect(clue.population.length).toBeGreaterThan(0);
      expect(Array.isArray(clue.neighbors)).toBe(true);
    }
  });
});

describe("buildDetectiveCases", () => {
  const cases = buildDetectiveCases();

  it("builds one case per curated country with all six clues populated", () => {
    expect(cases.length).toBe(Object.keys(DETECTIVE_CLUES).length);
    expect(cases.length).toBeGreaterThan(30);
    for (const detectiveCase of cases) {
      expect(CLUE_ORDER.length).toBe(MAX_CLUES);
      for (const kind of CLUE_ORDER) {
        expect(detectiveCase.clues[kind as ClueKind].length).toBeGreaterThan(0);
      }
    }
  });

  it("uses the real capital and continent in their respective clues", () => {
    const japan = cases.find((c) => c.id === "japan")!;
    expect(japan.clues.capital).toContain("Tokyo");
    expect(japan.clues.continent).toContain("Asia");
  });

  it("calls out island nations with no land borders", () => {
    const australia = cases.find((c) => c.id === "australia")!;
    expect(australia.clues.neighbors.toLowerCase()).toContain("no land borders");
  });

  it("lists bordering countries by name for a bordered country", () => {
    const canada = cases.find((c) => c.id === "canada")!;
    expect(canada.clues.neighbors).toContain("United States");
  });
});

describe("pointsForClues", () => {
  it("awards strictly fewer points for each extra clue revealed", () => {
    const scores = [1, 2, 3, 4, 5, 6].map((n) => pointsForClues(n, "rookie"));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1]);
    }
  });

  it("never drops below a minimum floor even at max clues", () => {
    expect(pointsForClues(6, "rookie")).toBeGreaterThanOrEqual(50);
  });

  it("scales up with difficulty multiplier", () => {
    const rookie = pointsForClues(3, "rookie");
    const pilot = pointsForClues(3, "pilot");
    expect(pilot).toBeGreaterThan(rookie);
  });
});

describe("xpForCase", () => {
  it("is always at least 1 and grows with points", () => {
    expect(xpForCase(0)).toBe(1);
    expect(xpForCase(800)).toBeGreaterThan(xpForCase(80));
  });
});

describe("isCorrectGuess", () => {
  it("accepts guesses within the good-or-better accuracy band", () => {
    expect(isCorrectGuess(0)).toBe(true);
    expect(isCorrectGuess(600)).toBe(true);
  });

  it("rejects guesses beyond the good threshold", () => {
    expect(isCorrectGuess(601)).toBe(false);
    expect(isCorrectGuess(3000)).toBe(false);
  });
});
