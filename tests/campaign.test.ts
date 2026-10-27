import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../src/data/countries";
import {
  CAMPAIGN_REGIONS,
  LEVELS_PER_REGION,
  buildCampaign,
  isLevelUnlocked,
  isRegionUnlocked,
  levelsForRegion,
  starsForRatings,
} from "../src/game/campaign";

describe("buildCampaign", () => {
  const campaign = buildCampaign();

  it("builds LEVELS_PER_REGION normal levels plus one boss per region", () => {
    for (const region of CAMPAIGN_REGIONS) {
      const levels = campaign.filter((l) => l.region === region);
      expect(levels).toHaveLength(LEVELS_PER_REGION + 1);
      expect(levels.filter((l) => l.isBoss)).toHaveLength(1);
    }
  });

  it("covers every country in the region across its normal levels, with no overlap", () => {
    for (const region of CAMPAIGN_REGIONS) {
      const normalLevels = levelsForRegion(region).filter((l) => !l.isBoss);
      const allIds = normalLevels.flatMap((l) => l.countryIds);
      const expectedIds = COUNTRIES.filter((c) => c.region === region).map((c) => c.id);
      expect(new Set(allIds)).toEqual(new Set(expectedIds));
      expect(allIds).toHaveLength(expectedIds.length);
      for (const level of normalLevels) {
        expect(level.countryIds.length).toBeGreaterThan(0);
      }
    }
  });

  it("boss level includes every country in the region", () => {
    for (const region of CAMPAIGN_REGIONS) {
      const boss = levelsForRegion(region).find((l) => l.isBoss)!;
      const expectedIds = COUNTRIES.filter((c) => c.region === region).map((c) => c.id);
      expect(new Set(boss.countryIds)).toEqual(new Set(expectedIds));
    }
  });

  it("handles a region smaller than LEVELS_PER_REGION without empty levels", () => {
    const smallest = CAMPAIGN_REGIONS.map((r) => ({
      region: r,
      count: COUNTRIES.filter((c) => c.region === r).length,
    })).sort((a, b) => a.count - b.count)[0];
    expect(smallest.count).toBeLessThan(LEVELS_PER_REGION * 3);
    const levels = levelsForRegion(smallest.region).filter((l) => !l.isBoss);
    for (const level of levels) {
      expect(level.countryIds.length).toBeGreaterThan(0);
    }
  });
});

describe("unlock progression", () => {
  it("unlocks the first region and its first level by default", () => {
    const first = CAMPAIGN_REGIONS[0];
    expect(isRegionUnlocked(first, {})).toBe(true);
    const firstLevel = levelsForRegion(first)[0];
    expect(isLevelUnlocked(firstLevel, {})).toBe(true);
  });

  it("locks the second region until the first region's boss is cleared", () => {
    const second = CAMPAIGN_REGIONS[1];
    expect(isRegionUnlocked(second, {})).toBe(false);
    expect(isRegionUnlocked(second, { [`${CAMPAIGN_REGIONS[0]}-boss`]: 1 })).toBe(true);
  });

  it("locks a level until the previous level in its region has at least 1 star", () => {
    const region = CAMPAIGN_REGIONS[0];
    const levels = levelsForRegion(region).filter((l) => !l.isBoss);
    expect(levels.length).toBeGreaterThan(1);
    expect(isLevelUnlocked(levels[1], {})).toBe(false);
    expect(isLevelUnlocked(levels[1], { [levels[0].id]: 1 })).toBe(true);
  });

  it("locks the boss until every normal level in the region is cleared", () => {
    const region = CAMPAIGN_REGIONS[0];
    const normalLevels = levelsForRegion(region).filter((l) => !l.isBoss);
    const boss = levelsForRegion(region).find((l) => l.isBoss)!;
    const partial = Object.fromEntries(normalLevels.slice(0, -1).map((l) => [l.id, 1]));
    expect(isLevelUnlocked(boss, partial)).toBe(false);
    const allCleared = Object.fromEntries(normalLevels.map((l) => [l.id, 1]));
    expect(isLevelUnlocked(boss, allCleared)).toBe(true);
  });
});

describe("starsForRatings", () => {
  it("awards 0 stars for an empty or all-miss run", () => {
    expect(starsForRatings([])).toBe(0);
    expect(starsForRatings(["miss", "miss"])).toBe(0);
  });

  it("awards 1 star for a run with at least one miss", () => {
    expect(starsForRatings(["perfect", "miss", "great"])).toBe(1);
  });

  it("awards 2 stars for a flawless run that isn't mostly perfect", () => {
    expect(starsForRatings(["ok", "good", "great"])).toBe(2);
  });

  it("awards 3 stars for a flawless, mostly-perfect run", () => {
    expect(starsForRatings(["perfect", "perfect", "good"])).toBe(3);
  });
});
