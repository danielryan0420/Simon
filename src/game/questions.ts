import type { Difficulty, GeoTarget, Region } from "../data/types";
import { shuffle } from "./rng";

export interface QuestionFilter {
  difficulty?: Difficulty;
  regions?: Region[];
}

export function filterTargets(targets: GeoTarget[], filter: QuestionFilter): GeoTarget[] {
  return targets.filter((t) => {
    if (filter.difficulty && t.difficulty !== filter.difficulty) return false;
    if (filter.regions && filter.regions.length > 0 && !filter.regions.includes(t.region)) return false;
    return true;
  });
}

/**
 * Build a round's question queue: shuffles the filtered pool with the given RNG
 * and repeats/reshuffles if the pool is smaller than the requested round length,
 * never placing the same target twice in a row.
 */
export function buildRoundQueue(
  targets: GeoTarget[],
  filter: QuestionFilter,
  roundLength: number,
  rng: () => number
): GeoTarget[] {
  const pool = filterTargets(targets, filter);
  if (pool.length === 0) return [];

  const queue: GeoTarget[] = [];
  let lastId: string | null = null;

  while (queue.length < roundLength) {
    const batch = shuffle(pool, rng);
    for (const target of batch) {
      if (queue.length >= roundLength) break;
      if (target.id === lastId && pool.length > 1) continue;
      queue.push(target);
      lastId = target.id;
    }
  }

  return queue;
}
