export type Region =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export type Difficulty = "rookie" | "pilot" | "ace";

export interface CountryEntry {
  id: string;
  country: string;
  lat: number;
  lon: number;
  capital: string;
  capitalLat: number;
  capitalLon: number;
  region: Region;
  difficulty: Difficulty;
  fact: string;
  capitalFact: string;
}

export interface LandmarkEntry {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  region: Region;
  difficulty: Difficulty;
  fact: string;
}

export interface StateEntry {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capital: string;
  difficulty: Difficulty;
  fact: string;
}

/** Shape the game engine actually quizzes on, regardless of source mode. */
export interface GeoTarget {
  id: string;
  /** Name shown to the player as the answer / label, e.g. "Kenya" or "Nairobi". */
  name: string;
  /** Prompt text, e.g. "Fly to: Kenya" or "Capital of Kenya?". */
  prompt: string;
  lat: number;
  lon: number;
  region: Region;
  difficulty: Difficulty;
  fact: string;
}
