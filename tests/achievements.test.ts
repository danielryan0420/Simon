import { beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, newlyUnlockedAchievements } from "../src/game/achievements";
import { defaultSave } from "../src/game/storage";
import { COUNTRIES } from "../src/data/countries";

beforeEach(() => {
  localStorage.clear();
});

describe("ACHIEVEMENTS", () => {
  it("defines at least 25 achievements with unique ids", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe("newlyUnlockedAchievements", () => {
  it("is empty for a fresh save", () => {
    expect(newlyUnlockedAchievements(defaultSave())).toHaveLength(0);
  });

  it("unlocks first-flight once a round has been played", () => {
    const save = { ...defaultSave(), gamesPlayed: 1 };
    const unlocked = newlyUnlockedAchievements(save);
    expect(unlocked.map((a) => a.id)).toContain("first-flight");
  });

  it("does not re-report an achievement already recorded as unlocked", () => {
    const save = { ...defaultSave(), gamesPlayed: 1, unlockedAchievementIds: ["first-flight"] };
    const unlocked = newlyUnlockedAchievements(save);
    expect(unlocked.map((a) => a.id)).not.toContain("first-flight");
  });

  it("unlocks streak milestones based on bestStreak", () => {
    const save = { ...defaultSave(), bestStreak: 10 };
    const ids = newlyUnlockedAchievements(save).map((a) => a.id);
    expect(ids).toContain("streak-5");
    expect(ids).toContain("streak-10");
    expect(ids).not.toContain("streak-20");
  });

  it("unlocks countries-all only once every country is learned", () => {
    const allButOne = COUNTRIES.slice(1).map((c) => c.id);
    const partial = { ...defaultSave(), learnedIds: allButOne };
    expect(newlyUnlockedAchievements(partial).map((a) => a.id)).not.toContain("countries-all");

    const all = { ...defaultSave(), learnedIds: COUNTRIES.map((c) => c.id) };
    expect(newlyUnlockedAchievements(all).map((a) => a.id)).toContain("countries-all");
  });

  it("unlocks region-champion once a full region's countries are learned", () => {
    const europeIds = COUNTRIES.filter((c) => c.region === "Europe").map((c) => c.id);
    const save = { ...defaultSave(), learnedIds: europeIds };
    expect(newlyUnlockedAchievements(save).map((a) => a.id)).toContain("region-champion");
  });
});
