import { COUNTRIES } from "../data/countries";
import { DETECTIVE_CLUES } from "../data/detectiveClues";
import type { Difficulty, GeoTarget } from "../data/types";
import { DIFFICULTY_MULTIPLIER, rateDistance } from "./scoring";

export type ClueKind = "continent" | "neighbors" | "language" | "capital" | "landmark" | "population";

/** Fixed clue reveal order: vaguest first, most identifying last. */
export const CLUE_ORDER: ClueKind[] = ["continent", "neighbors", "language", "capital", "landmark", "population"];

export interface DetectiveCase extends GeoTarget {
  clues: Record<ClueKind, string>;
}

function neighborsClue(neighbors: string[]): string {
  if (neighbors.length === 0) return "It has no land borders — it's surrounded by water.";
  if (neighbors.length === 1) return `It shares a border with only one country: ${neighbors[0]}.`;
  return `It borders ${neighbors.join(", ")}.`;
}

/** Builds every playable Globe Detective case from the curated clue dataset. */
export function buildDetectiveCases(): DetectiveCase[] {
  return COUNTRIES.filter((c) => DETECTIVE_CLUES[c.id]).map((c) => {
    const clue = DETECTIVE_CLUES[c.id];
    return {
      id: c.id,
      name: c.country,
      prompt: "Solve the case: which country is this?",
      lat: c.lat,
      lon: c.lon,
      region: c.region,
      difficulty: c.difficulty,
      fact: c.fact,
      clues: {
        continent: `This country is in ${c.region}.`,
        neighbors: neighborsClue(clue.neighbors),
        language: `The main language spoken here is ${clue.language}.`,
        capital: `Its capital city is ${c.capital}.`,
        landmark: `It's home to ${clue.landmark}.`,
        population: `${clue.population}.`,
      },
    };
  });
}

export const MAX_CLUES = CLUE_ORDER.length;

/** A guess counts as "found" once it lands within the same accuracy band as a normal good-or-better answer. */
export function isCorrectGuess(distanceKm: number): boolean {
  const rating = rateDistance(distanceKm);
  return rating === "perfect" || rating === "great" || rating === "good";
}

const BASE_POINTS = 600;
const CLUE_PENALTY = 100;
const MIN_POINTS = 50;

/** Points for solving a case after revealing `cluesRevealed` clues (1 = solved on the very first clue). */
export function pointsForClues(cluesRevealed: number, difficulty: Difficulty): number {
  const raw = Math.max(MIN_POINTS, BASE_POINTS - (cluesRevealed - 1) * CLUE_PENALTY);
  return Math.round(raw * DIFFICULTY_MULTIPLIER[difficulty]);
}

/** XP conversion for a solved case, kept independent of the normal round's accuracy-based XP curve. */
export function xpForCase(points: number): number {
  return Math.max(1, Math.round(points / 8));
}
