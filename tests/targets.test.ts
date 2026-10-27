import { describe, expect, it } from "vitest";
import { countryNameForTargetId, getTargets, MODES } from "../src/game/targets";
import { COUNTRIES } from "../src/data/countries";

describe("getTargets", () => {
  it("includes every mode declared in MODES", () => {
    for (const { id } of MODES) {
      expect(() => getTargets(id)).not.toThrow();
    }
  });

  it("builds a flags target per country with a flag image and fly-to coordinates", () => {
    const flags = getTargets("flags");
    expect(flags).toHaveLength(COUNTRIES.length);
    for (const target of flags) {
      expect(target.promptImage).toBeTruthy();
      expect(target.promptImage).toContain("<svg");
      expect(target.id.endsWith("-flag")).toBe(true);
    }
  });

  it("surfaces the new hard difficulty tier for countries and capitals", () => {
    const countries = getTargets("countries");
    const capitals = getTargets("capitals");
    expect(countries.some((t) => t.difficulty === "hard")).toBe(true);
    expect(capitals.some((t) => t.difficulty === "hard")).toBe(true);
  });
});

describe("countryNameForTargetId", () => {
  it("maps a flags target id back to its country name", () => {
    expect(countryNameForTargetId("flags", "japan-flag")).toBe("Japan");
  });

  it("returns null for modes without a country mapping", () => {
    expect(countryNameForTargetId("landmarks", "eiffel-tower")).toBeNull();
  });
});
