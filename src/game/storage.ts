import type { Mode } from "./targets";

const KEY = "geo-racer:save:v1";

export interface LeaderboardEntry {
  name: string;
  mode: Mode;
  score: number;
  date: string;
}

export interface AccessibilitySettings {
  largeText: boolean;
  colorBlindMode: boolean;
  reducedMotion: boolean;
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
  perfectCount: number;
  greatCount: number;
  dailyCompletedCount: number;
  dailyStreak: number;
  racesPlayed: number;
  raceWins: number;
  unlockedAchievementIds: string[];
  hasSeenTutorial: boolean;
  accessibility: AccessibilitySettings;
  /** Stars (0-3) earned per World Tour campaign level id, e.g. "Africa-boss". */
  campaignStars: Record<string, number>;
  timeAttackBestScore: number;
  timeAttackBestCorrect: number;
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
    perfectCount: 0,
    greatCount: 0,
    dailyCompletedCount: 0,
    dailyStreak: 0,
    racesPlayed: 0,
    raceWins: 0,
    unlockedAchievementIds: [],
    hasSeenTutorial: false,
    accessibility: { largeText: false, colorBlindMode: false, reducedMotion: false },
    campaignStars: {},
    timeAttackBestScore: 0,
    timeAttackBestCorrect: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return {
      ...defaultSave(),
      ...parsed,
      accessibility: { ...defaultSave().accessibility, ...parsed.accessibility },
    };
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
