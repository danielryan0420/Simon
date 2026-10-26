import { describe, expect, it } from "vitest";
import { buildRoundQueue, filterTargets } from "../src/game/questions";
import { mulberry32 } from "../src/game/rng";
import { getTargets } from "../src/game/targets";

const countries = getTargets("countries");

describe("filterTargets", () => {
  it("filters by difficulty", () => {
    const rookies = filterTargets(countries, { difficulty: "rookie" });
    expect(rookies.length).toBeGreaterThan(0);
    expect(rookies.every((t) => t.difficulty === "rookie")).toBe(true);
  });

  it("filters by region", () => {
    const europe = filterTargets(countries, { regions: ["Europe"] });
    expect(europe.length).toBeGreaterThan(0);
    expect(europe.every((t) => t.region === "Europe")).toBe(true);
  });

  it("returns everything when no filter given", () => {
    expect(filterTargets(countries, {})).toHaveLength(countries.length);
  });
});

describe("buildRoundQueue", () => {
  it("returns a queue of the requested length", () => {
    const queue = buildRoundQueue(countries, {}, 10, mulberry32(1));
    expect(queue).toHaveLength(10);
  });

  it("can exceed the pool size by reshuffling", () => {
    const small = countries.slice(0, 3);
    const queue = buildRoundQueue(small, {}, 10, mulberry32(1));
    expect(queue).toHaveLength(10);
  });

  it("never repeats the same target back-to-back when pool > 1", () => {
    const queue = buildRoundQueue(countries, {}, 50, mulberry32(5));
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i].id).not.toBe(queue[i - 1].id);
    }
  });

  it("returns an empty queue when the filtered pool is empty", () => {
    const queue = buildRoundQueue(countries, { regions: ["Antarctica" as any] }, 5, mulberry32(1));
    expect(queue).toHaveLength(0);
  });

  it("is deterministic for the same rng seed", () => {
    const a = buildRoundQueue(countries, {}, 10, mulberry32(123));
    const b = buildRoundQueue(countries, {}, 10, mulberry32(123));
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
  });
});
