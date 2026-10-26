import { describe, expect, it } from "vitest";
import { getTargets, MODES } from "../src/game/targets";

describe("getTargets data integrity", () => {
  for (const { id } of MODES) {
    it(`${id} has a healthy pool with valid coordinates and unique ids`, () => {
      const targets = getTargets(id);
      expect(targets.length).toBeGreaterThanOrEqual(10);

      const ids = new Set<string>();
      for (const t of targets) {
        expect(t.lat).toBeGreaterThanOrEqual(-90);
        expect(t.lat).toBeLessThanOrEqual(90);
        expect(t.lon).toBeGreaterThanOrEqual(-180);
        expect(t.lon).toBeLessThanOrEqual(180);
        expect(t.name.length).toBeGreaterThan(0);
        expect(t.prompt.length).toBeGreaterThan(0);
        expect(t.fact.length).toBeGreaterThan(0);
        expect(ids.has(t.id)).toBe(false);
        ids.add(t.id);
      }
    });
  }
});
