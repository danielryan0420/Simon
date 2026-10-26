import { COUNTRIES } from "../data/countries";
import { LANDMARKS } from "../data/landmarks";
import { US_STATES } from "../data/usStates";
import type { GeoTarget } from "../data/types";

export type Mode = "countries" | "capitals" | "landmarks" | "states";

export const MODES: { id: Mode; label: string }[] = [
  { id: "countries", label: "Countries" },
  { id: "capitals", label: "Capitals" },
  { id: "landmarks", label: "Landmarks" },
  { id: "states", label: "US States" },
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
  return null;
}
