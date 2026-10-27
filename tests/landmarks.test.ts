import { describe, expect, it } from "vitest";
import { LANDMARKS } from "../src/data/landmarks";

describe("LANDMARKS", () => {
  it("has at least 150 entries", () => {
    expect(LANDMARKS.length).toBeGreaterThanOrEqual(150);
  });

  it("has unique ids", () => {
    expect(new Set(LANDMARKS.map((l) => l.id)).size).toBe(LANDMARKS.length);
  });

  it("covers every region", () => {
    const regions = new Set(LANDMARKS.map((l) => l.region));
    expect(regions.size).toBe(6);
  });

  it("has plausible lat/lon for every entry", () => {
    for (const l of LANDMARKS) {
      expect(l.lat).toBeGreaterThanOrEqual(-90);
      expect(l.lat).toBeLessThanOrEqual(90);
      expect(l.lon).toBeGreaterThanOrEqual(-180);
      expect(l.lon).toBeLessThanOrEqual(180);
    }
  });
});
