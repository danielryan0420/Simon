import type { Mode } from "./targets";

function saveKey(profileId: string): string {
  return `geo-racer:save:v1:${profileId}`;
}

const SETTINGS_KEY = "geo-racer:settings:v1";

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

/** Device-wide preferences shared by every profile on this device. */
export interface AppSettings {
  selectedSkin: string;
  selectedTheme: string;
  accessibility: AccessibilitySettings;
  hasSeenTutorial: boolean;
}

/** ISO 8601 week key, e.g. "2026-W43", so the family leaderboard resets every Monday. */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday decides the ISO year/week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Per-profile progress: XP/level, learned targets, achievements, campaign stars, and mode stats. */
export interface SaveData {
  xp: number;
  learnedIds: string[];
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
  /** Stars (0-3) earned per World Tour campaign level id, e.g. "Africa-boss". */
  campaignStars: Record<string, number>;
  timeAttackBestScore: number;
  timeAttackBestCorrect: number;
  /** Globe Detective: total cases solved, how many were solved on the very first clue, and best single-round score. */
  detectiveCasesSolved: number;
  detectiveFlawlessSolves: number;
  detectiveBestScore: number;
  /** Family weekly leaderboard: resets every ISO week (see isoWeekKey). */
  weeklyScore: number;
  weekKey: string;
  bestWeeklyScore: number;
  totalScore: number;
}

export function defaultSave(): SaveData {
  return {
    xp: 0,
    learnedIds: [],
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
    campaignStars: {},
    timeAttackBestScore: 0,
    timeAttackBestCorrect: 0,
    detectiveCasesSolved: 0,
    detectiveFlawlessSolves: 0,
    detectiveBestScore: 0,
    weeklyScore: 0,
    weekKey: isoWeekKey(),
    bestWeeklyScore: 0,
    totalScore: 0,
  };
}

export function defaultSettings(): AppSettings {
  return {
    selectedSkin: "plane-classic",
    selectedTheme: "theme-blue",
    accessibility: { largeText: false, colorBlindMode: false, reducedMotion: false },
    hasSeenTutorial: false,
  };
}

export function loadSave(profileId: string): SaveData {
  try {
    const raw = localStorage.getItem(saveKey(profileId));
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed };
  } catch {
    return defaultSave();
  }
}

export function saveSave(profileId: string, data: SaveData): void {
  try {
    localStorage.setItem(saveKey(profileId), JSON.stringify(data));
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}

/** Removes a profile's progress entirely (called when a profile is deleted). */
export function deleteSave(profileId: string): void {
  try {
    localStorage.removeItem(saveKey(profileId));
  } catch {
    /* ignore storage errors */
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings(),
      ...parsed,
      accessibility: { ...defaultSettings().accessibility, ...parsed.accessibility },
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(data: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
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

/** Rolls a profile's weekly score to 0 if it's a new ISO week, then adds `points`. */
export function recordWeeklyScore(data: SaveData, points: number, now: Date = new Date()): SaveData {
  const currentWeek = isoWeekKey(now);
  const weeklyScore = (data.weekKey === currentWeek ? data.weeklyScore : 0) + points;
  return {
    ...data,
    weekKey: currentWeek,
    weeklyScore,
    bestWeeklyScore: Math.max(data.bestWeeklyScore, weeklyScore),
    totalScore: data.totalScore + points,
  };
}
