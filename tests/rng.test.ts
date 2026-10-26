import { describe, expect, it } from "vitest";
import { mulberry32, seedFromString, shuffle } from "../src/game/rng";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});

describe("seedFromString", () => {
  it("is deterministic", () => {
    expect(seedFromString("2026-10-26")).toBe(seedFromString("2026-10-26"));
  });
  it("differs for different strings", () => {
    expect(seedFromString("2026-10-26")).not.toBe(seedFromString("2026-10-27"));
  });
});

describe("shuffle", () => {
  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const rng = mulberry32(7);
    shuffle(input, rng);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const rng = mulberry32(7);
    const out = shuffle(input, rng);
    expect(out.slice().sort()).toEqual(input.slice().sort());
  });

  it("is deterministic for the same seed", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const outA = shuffle(input, mulberry32(99));
    const outB = shuffle(input, mulberry32(99));
    expect(outA).toEqual(outB);
  });
});
