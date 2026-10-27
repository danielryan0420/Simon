import { COUNTRIES } from "../data/countries";
import type { Difficulty, Region } from "../data/types";
import type { Rating } from "./scoring";

/** Fixed continent order the World Tour campaign progresses through. */
export const CAMPAIGN_REGIONS: Region[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

export const LEVELS_PER_REGION = 3;

const DIFFICULTY_ORDER: Record<Difficulty, number> = { rookie: 0, pilot: 1, ace: 2, hard: 3 };

export interface CampaignLevel {
  id: string;
  region: Region;
  /** 0-based index among the region's normal (non-boss) levels. */
  levelIndex: number;
  isBoss: boolean;
  label: string;
  countryIds: string[];
}

/** Splits `items` into `parts` contiguous, non-empty (when possible) groups. */
function splitContiguous<T>(items: T[], parts: number): T[][] {
  const result: T[][] = [];
  let start = 0;
  for (let i = 0; i < parts; i++) {
    const remainingParts = parts - i;
    const size = Math.ceil((items.length - start) / remainingParts);
    result.push(items.slice(start, start + size));
    start += size;
  }
  return result;
}

let cachedCampaign: CampaignLevel[] | null = null;

/** Builds the full World Tour: `LEVELS_PER_REGION` difficulty-ordered levels plus a boss round per continent. */
export function buildCampaign(): CampaignLevel[] {
  if (cachedCampaign) return cachedCampaign;
  const levels: CampaignLevel[] = [];
  for (const region of CAMPAIGN_REGIONS) {
    const regionCountries = COUNTRIES.filter((c) => c.region === region)
      .slice()
      .sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.id.localeCompare(b.id)
      );
    const chunks = splitContiguous(regionCountries, LEVELS_PER_REGION);
    chunks.forEach((chunk, i) => {
      levels.push({
        id: `${region}-${i}`,
        region,
        levelIndex: i,
        isBoss: false,
        label: `Level ${i + 1}`,
        countryIds: chunk.map((c) => c.id),
      });
    });
    levels.push({
      id: `${region}-boss`,
      region,
      levelIndex: LEVELS_PER_REGION,
      isBoss: true,
      label: "Boss Round",
      countryIds: regionCountries.map((c) => c.id),
    });
  }
  cachedCampaign = levels;
  return levels;
}

export function levelsForRegion(region: Region): CampaignLevel[] {
  return buildCampaign().filter((l) => l.region === region);
}

export function isRegionBossCleared(region: Region, campaignStars: Record<string, number>): boolean {
  return (campaignStars[`${region}-boss`] ?? 0) >= 1;
}

export function isRegionUnlocked(region: Region, campaignStars: Record<string, number>): boolean {
  const idx = CAMPAIGN_REGIONS.indexOf(region);
  return idx <= 0 || isRegionBossCleared(CAMPAIGN_REGIONS[idx - 1], campaignStars);
}

/** A level is unlocked once the previous level in its region has at least 1 star; bosses need every normal level cleared. */
export function isLevelUnlocked(level: CampaignLevel, campaignStars: Record<string, number>): boolean {
  if (!isRegionUnlocked(level.region, campaignStars)) return false;
  if (level.isBoss) {
    return levelsForRegion(level.region)
      .filter((l) => !l.isBoss)
      .every((l) => (campaignStars[l.id] ?? 0) >= 1);
  }
  if (level.levelIndex === 0) return true;
  return (campaignStars[`${level.region}-${level.levelIndex - 1}`] ?? 0) >= 1;
}

/**
 * Stars for a completed level: 3 for a flawless, mostly-perfect run, 2 for a
 * flawless run, 1 for any completion with at least one non-miss, 0 otherwise.
 */
export function starsForRatings(ratings: Rating[]): 0 | 1 | 2 | 3 {
  if (ratings.length === 0) return 0;
  const nonMiss = ratings.filter((r) => r !== "miss").length;
  if (nonMiss === 0) return 0;
  if (nonMiss < ratings.length) return 1;
  const perfect = ratings.filter((r) => r === "perfect").length;
  return perfect >= Math.ceil(ratings.length / 2) ? 3 : 2;
}
