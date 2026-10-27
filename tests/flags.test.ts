import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../src/data/countries";
import { FLAG_SVGS, flagSvgFor } from "../src/data/flags";

// Countries whose real flag is a square (not the common 3:2/4:3 rectangle).
const SQUARE_FLAG_IDS = new Set(["switzerland"]);

describe("flag asset coverage", () => {
  it("has a real flag asset for every country used in the game", () => {
    for (const country of COUNTRIES) {
      expect(FLAG_SVGS[country.id], `missing flag asset for ${country.id}`).toBeDefined();
    }
  });

  it("renders a non-empty svg sourced from the flag-icons asset set for every country", () => {
    for (const country of COUNTRIES) {
      const svg = flagSvgFor(country.id);
      expect(svg, `no svg for ${country.id}`).toBeTruthy();
      expect(svg).toContain("<svg");
      // flag-icons SVGs all carry this id convention; anything else would mean
      // a generated placeholder slipped back in instead of real artwork.
      expect(svg, `${country.id} flag is not sourced from flag-icons`).toMatch(/id="flag-icons-[a-z]{2}"/);
    }
  });

  it("returns null for an unknown country id instead of a placeholder", () => {
    expect(flagSvgFor("not-a-real-country")).toBeNull();
  });

  it("has no unused flag assets beyond the countries the game references", () => {
    const countryIds = new Set(COUNTRIES.map((c) => c.id));
    for (const assetId of Object.keys(FLAG_SVGS)) {
      expect(countryIds.has(assetId), `orphaned flag asset for ${assetId}`).toBe(true);
    }
  });

  it("preserves each flag's true aspect ratio (no stretching to a fixed box)", () => {
    for (const country of COUNTRIES) {
      const svg = flagSvgFor(country.id)!;
      const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
      expect(match, `${country.id} flag has no viewBox`).toBeTruthy();
      const [, w, h] = match!;
      const ratio = Number(w) / Number(h);
      if (SQUARE_FLAG_IDS.has(country.id)) {
        expect(ratio, `${country.id} should be square`).toBeCloseTo(1, 2);
      } else {
        expect(ratio, `${country.id} should not be square`).toBeGreaterThan(1.05);
      }
    }
  });
});
