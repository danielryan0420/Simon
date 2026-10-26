import { describe, expect, it } from "vitest";
import {
  levelForXp,
  newlyUnlockedForLevel,
  unlockedAtLevel,
  xpForAnswer,
  xpRequiredForLevel,
} from "../src/game/progression";

describe("levelForXp", () => {
  it("starts at level 1 with 0 xp", () => {
    const info = levelForXp(0);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(0);
  });

  it("levels up exactly at the threshold", () => {
    const req = xpRequiredForLevel(1);
    const info = levelForXp(req);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(0);
  });

  it("accumulates across multiple level-ups", () => {
    const totalForThree = xpRequiredForLevel(1) + xpRequiredForLevel(2) + 10;
    const info = levelForXp(totalForThree);
    expect(info.level).toBe(3);
    expect(info.xpIntoLevel).toBe(10);
  });
});

describe("xpForAnswer", () => {
  it("awards at least 1 xp", () => {
    expect(xpForAnswer(0, "miss")).toBeGreaterThanOrEqual(1);
  });

  it("awards more for perfect than good", () => {
    const perfect = xpForAnswer(1000, "perfect");
    const good = xpForAnswer(1000, "good");
    expect(perfect).toBeGreaterThan(good);
  });
});

describe("unlockables", () => {
  it("unlocks starter items at level 1", () => {
    const items = unlockedAtLevel(1);
    expect(items.length).toBeGreaterThan(0);
  });

  it("unlocks more items at higher levels", () => {
    expect(unlockedAtLevel(10).length).toBeGreaterThan(unlockedAtLevel(1).length);
  });

  it("newlyUnlockedForLevel matches items whose unlockLevel equals the level", () => {
    const fresh = newlyUnlockedForLevel(6);
    expect(fresh.every((u) => u.unlockLevel === 6)).toBe(true);
    expect(fresh.length).toBeGreaterThan(0);
  });
});
