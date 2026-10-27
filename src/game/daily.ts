import type { GeoTarget } from "../data/types";
import { mulberry32, seedFromString } from "./rng";
import { buildRoundQueue } from "./questions";
import type { Mode } from "./targets";

export const DAILY_ROUND_LENGTH = 10;

/** YYYY-MM-DD in UTC, used so every player gets the same daily challenge. */
export function dateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Whether `key` is exactly one calendar day after `prevKey` (both YYYY-MM-DD, UTC). */
export function isNextDay(prevKey: string, key: string): boolean {
  const prev = new Date(`${prevKey}T00:00:00Z`).getTime();
  const next = new Date(`${key}T00:00:00Z`).getTime();
  return next - prev === 24 * 60 * 60 * 1000;
}

/** The daily challenge mixes every mode's targets so it always feels fresh. */
export function buildDailyChallenge(
  allTargetsByMode: Record<Mode, GeoTarget[]>,
  date: Date = new Date()
): GeoTarget[] {
  const seed = seedFromString(`geo-racer-daily-${dateKey(date)}`);
  const rng = mulberry32(seed);
  const combined = (Object.keys(allTargetsByMode) as Mode[]).flatMap(
    (mode) => allTargetsByMode[mode]
  );
  return buildRoundQueue(combined, {}, DAILY_ROUND_LENGTH, rng);
}
