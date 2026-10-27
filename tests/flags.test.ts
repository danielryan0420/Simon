import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../src/data/countries";
import { FLAG_SPECS } from "../src/data/flagSpecs";
import { FLAG_SVGS, flagSvgFor } from "../src/data/flags";

describe("flag data coverage", () => {
  it("has a flag spec for every country", () => {
    for (const country of COUNTRIES) {
      expect(FLAG_SPECS[country.id], `missing flag spec for ${country.id}`).toBeDefined();
    }
  });

  it("renders a non-empty svg for every country", () => {
    for (const country of COUNTRIES) {
      const svg = flagSvgFor(country.id);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
    }
  });

  it("returns null for an unknown country id", () => {
    expect(flagSvgFor("not-a-real-country")).toBeNull();
  });

  it("precomputes exactly one svg per flag spec", () => {
    expect(Object.keys(FLAG_SVGS)).toHaveLength(Object.keys(FLAG_SPECS).length);
  });
});
