import { describe, expect, it } from "vitest";
import { HOW_TO } from "../src/game/howTo";

describe("HOW_TO", () => {
  const keys = Object.keys(HOW_TO) as (keyof typeof HOW_TO)[];

  it("covers every mode/activity", () => {
    expect(keys.sort()).toEqual(
      [
        "countries",
        "capitals",
        "landmarks",
        "states",
        "flags",
        "daily",
        "worldTour",
        "timeAttack",
        "detective",
        "sportsFind",
        "sportsName",
        "race",
      ].sort()
    );
  });

  it("gives every entry a title, icon, and 1-3 short steps", () => {
    for (const key of keys) {
      const content = HOW_TO[key];
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.icon.length).toBeGreaterThan(0);
      expect(content.steps.length).toBeGreaterThanOrEqual(1);
      expect(content.steps.length).toBeLessThanOrEqual(3);
      for (const step of content.steps) {
        expect(step.length).toBeGreaterThan(0);
        expect(step.length).toBeLessThan(140);
      }
    }
  });
});
