import type { Mode } from "./targets";

const KEY = "geo-racer:save:v1";

export interface LeaderboardEntry {
  name: string;
  mode: Mode;
  score: number;
  date: string;
}

export interface SaveData {
  xp: number;
  learnedIds: string[];
  selectedSkin: string;
  selectedTheme: string;
  leaderboard: LeaderboardEntry[];
  lastDailyKey: string | null;
  lastDailyScore: number | null;
  gamesPlayed: number;
  bestStreak: number;
}

function defaultSave(): SaveData {
  return {
    xp: 0,
    learnedIds: [],
    selectedSkin: "plane-classic",
    selectedTheme: "theme-blue",
    leaderboard: [],
    lastDailyKey: null,
    lastDailyScore: null,
    gamesPlayed: 0,
    bestStreak: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed };
  } catch {
    return defaultSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}

export function recordLearned(data: SaveData, targetId: string): SaveData {
  if (data.learnedIds.includes(targetId)) return data;
  return { ...data, learnedIds: [...data.learnedIds, targetId] };
}

export function addLeaderboardEntry(
  data: SaveData,
  entry: LeaderboardEntry,
  maxEntries = 10
): SaveData {
  const list = [...data.leaderboard, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries);
  return { ...data, leaderboard: list };
}
