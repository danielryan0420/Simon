import type { Difficulty } from "../data/types";

export type Rating = "perfect" | "great" | "good" | "ok" | "miss";

const RATING_THRESHOLDS_KM: { rating: Rating; maxKm: number }[] = [
  { rating: "perfect", maxKm: 60 },
  { rating: "great", maxKm: 250 },
  { rating: "good", maxKm: 600 },
  { rating: "ok", maxKm: 1500 },
];

/** Distance beyond which an answer always scores zero accuracy points. */
export const MISS_DISTANCE_KM = 3000;

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  rookie: 1,
  pilot: 1.25,
  ace: 1.5,
};

export function rateDistance(distanceKm: number): Rating {
  for (const t of RATING_THRESHOLDS_KM) {
    if (distanceKm <= t.maxKm) return t.rating;
  }
  return "miss";
}

/** Combo multiplier grows with streak, capped so it never runs away. */
export function comboMultiplier(streak: number): number {
  return 1 + Math.min(Math.max(streak, 0), 10) * 0.05;
}

/** Faster answers earn a bonus, scaled to zero by 10 seconds. */
export function timeBonus(timeMs: number): number {
  const seconds = timeMs / 1000;
  if (seconds <= 2) return 200;
  if (seconds >= 10) return 0;
  return Math.round(200 * (1 - (seconds - 2) / 8));
}

export interface AnswerScore {
  distanceKm: number;
  rating: Rating;
  accuracyPoints: number;
  timeBonus: number;
  difficultyMultiplier: number;
  comboMultiplier: number;
  totalPoints: number;
}

export function scoreAnswer(
  distanceKm: number,
  timeMs: number,
  difficulty: Difficulty,
  streak: number
): AnswerScore {
  const rating = rateDistance(distanceKm);
  const accuracy = Math.max(0, 1 - distanceKm / MISS_DISTANCE_KM);
  const accuracyPoints = Math.round(1000 * Math.pow(accuracy, 1.3));
  const bonus = accuracyPoints > 0 ? timeBonus(timeMs) : 0;
  const diffMult = DIFFICULTY_MULTIPLIER[difficulty];
  const comboMult = comboMultiplier(streak);
  const totalPoints = Math.round((accuracyPoints + bonus) * diffMult * comboMult);

  return {
    distanceKm,
    rating,
    accuracyPoints,
    timeBonus: bonus,
    difficultyMultiplier: diffMult,
    comboMultiplier: comboMult,
    totalPoints,
  };
}
