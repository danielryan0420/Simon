import { COUNTRIES } from "../data/countries";
import { LANDMARKS } from "../data/landmarks";
import { US_STATES } from "../data/usStates";
import { flagSvgFor } from "../data/flags";
import { DETECTIVE_CLUES } from "../data/detectiveClues";
import type { GeoTarget } from "../data/types";

export type Mode = "countries" | "capitals" | "landmarks" | "states" | "flags";

export const MODES: { id: Mode; label: string }[] = [
  { id: "countries", label: "Countries" },
  { id: "capitals", label: "Capitals" },
  { id: "landmarks", label: "Landmarks" },
  { id: "states", label: "US States" },
  { id: "flags", label: "Flags" },
];

export function getTargets(mode: Mode): GeoTarget[] {
  switch (mode) {
    case "countries":
      return COUNTRIES.map((c) => ({
        id: c.id,
        name: c.country,
        prompt: `Fly to: ${c.country}`,
        lat: c.lat,
        lon: c.lon,
        region: c.region,
        difficulty: c.difficulty,
        fact: c.fact,
      }));
    case "capitals":
      return COUNTRIES.map((c) => ({
        id: `${c.id}-capital`,
        name: c.capital,
        prompt: `Capital of ${c.country}?`,
        lat: c.capitalLat,
        lon: c.capitalLon,
        region: c.region,
        difficulty: c.difficulty,
        fact: c.capitalFact,
      }));
    case "landmarks":
      return LANDMARKS.map((l) => ({
        id: l.id,
        name: l.name,
        prompt: `Where is the ${l.name}?`,
        lat: l.lat,
        lon: l.lon,
        region: l.region,
        difficulty: l.difficulty,
        fact: l.fact,
      }));
    case "states":
      return US_STATES.map((s) => ({
        id: s.id,
        name: s.name,
        prompt: `Fly to: ${s.name}`,
        lat: s.lat,
        lon: s.lon,
        region: "North America",
        difficulty: s.difficulty,
        fact: s.fact,
      }));
    case "flags":
      return COUNTRIES.map((c) => ({
        id: `${c.id}-flag`,
        name: c.country,
        prompt: "Which country does this flag belong to?",
        lat: c.lat,
        lon: c.lon,
        region: c.region,
        difficulty: c.difficulty,
        fact: c.fact,
        promptImage: flagSvgFor(c.id) ?? undefined,
      }));
  }
}

/** Resolves the underlying COUNTRIES entry for a countries/capitals/flags target id, stripping the mode suffix. */
function countryForTargetId(mode: Mode, targetId: string): (typeof COUNTRIES)[number] | null {
  const id = mode === "capitals" ? targetId.replace(/-capital$/, "") : mode === "flags" ? targetId.replace(/-flag$/, "") : targetId;
  return COUNTRIES.find((c) => c.id === id) ?? null;
}

/**
 * Progressive clues for a target, vaguest first — shown one at a time behind a
 * "Hint" button during normal play so a bare name isn't the only way in.
 * Built only from data already shown elsewhere in the app (region, capital,
 * bordering countries), so every clue stays verifiably accurate.
 */
export function cluesForTarget(mode: Mode, targetId: string): string[] {
  switch (mode) {
    case "countries":
    case "flags": {
      const c = countryForTargetId(mode, targetId);
      if (!c) return [];
      const clues = [`It's in ${c.region}.`, `Its capital is ${c.capital}.`];
      const detective = DETECTIVE_CLUES[c.id];
      if (detective && detective.neighbors.length > 0) {
        clues.push(`It borders ${detective.neighbors.slice(0, 2).join(" and ")}.`);
      }
      return clues;
    }
    case "capitals": {
      const c = countryForTargetId(mode, targetId);
      return c ? [`This country is in ${c.region}.`] : [];
    }
    case "landmarks": {
      const l = LANDMARKS.find((x) => x.id === targetId);
      return l ? [`It's in ${l.region}.`, `It's located in ${l.country}.`] : [];
    }
    case "states":
      return [];
  }
}

/** Extra teaching facts shown on every result screen, beyond the base `fact` field. */
export function factDetailsForTarget(mode: Mode, targetId: string): string[] {
  switch (mode) {
    case "countries":
    case "flags": {
      const c = countryForTargetId(mode, targetId);
      if (!c) return [];
      const details = [`Continent: ${c.region}`, `Capital: ${c.capital}`];
      const detective = DETECTIVE_CLUES[c.id];
      if (detective && detective.neighbors.length > 0) details.push(`Borders: ${detective.neighbors.join(", ")}`);
      return details;
    }
    case "capitals": {
      const c = countryForTargetId(mode, targetId);
      return c ? [`Capital of: ${c.country}`, `Continent: ${c.region}`] : [];
    }
    case "landmarks": {
      const l = LANDMARKS.find((x) => x.id === targetId);
      return l ? [`Country: ${l.country}`, `Continent: ${l.region}`] : [];
    }
    case "states": {
      const s = US_STATES.find((x) => x.id === targetId);
      return s ? [`Capital: ${s.capital}`] : [];
    }
  }
}

/** A short memory aid shown when the player misses, built from verified fields rather than hand-written trivia. */
export function memoryTipForTarget(mode: Mode, targetId: string): string | null {
  switch (mode) {
    case "countries":
    case "flags": {
      const c = countryForTargetId(mode, targetId);
      if (!c) return null;
      const detective = DETECTIVE_CLUES[c.id];
      if (detective && detective.neighbors.length > 0) {
        return `Tip: picture ${c.country} in ${c.region}, right next to ${detective.neighbors[0]}.`;
      }
      return `Tip: picture ${c.country} in ${c.region} — its capital is ${c.capital}.`;
    }
    case "capitals": {
      const c = countryForTargetId(mode, targetId);
      return c ? `Tip: ${c.capital} is the capital of ${c.country}, in ${c.region}.` : null;
    }
    case "landmarks": {
      const l = LANDMARKS.find((x) => x.id === targetId);
      return l ? `Tip: the ${l.name} is in ${l.country}, ${l.region}.` : null;
    }
    case "states": {
      const s = US_STATES.find((x) => x.id === targetId);
      return s ? `Tip: ${s.name}'s capital is ${s.capital} — that can help you place it on the map.` : null;
    }
  }
}

/** Maps a mastered target back to its world-map country name, for the Learned map (countries/capitals only). */
export function countryNameForTargetId(mode: Mode, targetId: string): string | null {
  if (mode === "countries") {
    return COUNTRIES.find((c) => c.id === targetId)?.country ?? null;
  }
  if (mode === "capitals") {
    const countryId = targetId.replace(/-capital$/, "");
    return COUNTRIES.find((c) => c.id === countryId)?.country ?? null;
  }
  if (mode === "flags") {
    const countryId = targetId.replace(/-flag$/, "");
    return COUNTRIES.find((c) => c.id === countryId)?.country ?? null;
  }
  return null;
}
