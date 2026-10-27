const KEY = "geo-racer:family:v1";

export interface FamilyProfile {
  id: string;
  name: string;
  weeklyScore: number;
  weekKey: string;
  bestWeeklyScore: number;
  totalScore: number;
  gamesPlayed: number;
}

export interface FamilyData {
  profiles: FamilyProfile[];
  activeProfileId: string | null;
}

function defaultFamily(): FamilyData {
  return { profiles: [], activeProfileId: null };
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

export function loadFamily(): FamilyData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultFamily();
    const parsed = JSON.parse(raw);
    return { ...defaultFamily(), ...parsed };
  } catch {
    return defaultFamily();
  }
}

export function saveFamily(data: FamilyData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Adds a new named profile (no-op on blank names), activating it if it's the first one. */
export function addProfile(data: FamilyData, name: string): FamilyData {
  const trimmed = name.trim();
  if (!trimmed) return data;
  const id = `${slugify(trimmed) || "player"}-${Date.now().toString(36)}`;
  const profile: FamilyProfile = {
    id,
    name: trimmed,
    weeklyScore: 0,
    weekKey: isoWeekKey(),
    bestWeeklyScore: 0,
    totalScore: 0,
    gamesPlayed: 0,
  };
  return {
    profiles: [...data.profiles, profile],
    activeProfileId: data.activeProfileId ?? id,
  };
}

export function removeProfile(data: FamilyData, id: string): FamilyData {
  const profiles = data.profiles.filter((p) => p.id !== id);
  const activeProfileId = data.activeProfileId === id ? profiles[0]?.id ?? null : data.activeProfileId;
  return { profiles, activeProfileId };
}

export function setActiveProfile(data: FamilyData, id: string): FamilyData {
  if (!data.profiles.some((p) => p.id === id)) return data;
  return { ...data, activeProfileId: id };
}

/** Rolls a profile's weekly score to 0 if it's a new ISO week, then adds `points`. */
function rollAndAdd(profile: FamilyProfile, points: number, currentWeek: string): FamilyProfile {
  const weeklyScore = (profile.weekKey === currentWeek ? profile.weeklyScore : 0) + points;
  return {
    ...profile,
    weekKey: currentWeek,
    weeklyScore,
    bestWeeklyScore: Math.max(profile.bestWeeklyScore, weeklyScore),
    totalScore: profile.totalScore + points,
    gamesPlayed: profile.gamesPlayed + 1,
  };
}

export function recordFamilyScore(data: FamilyData, profileId: string, points: number): FamilyData {
  const currentWeek = isoWeekKey();
  return {
    ...data,
    profiles: data.profiles.map((p) => (p.id === profileId ? rollAndAdd(p, points, currentWeek) : p)),
  };
}

/** Profiles with stale weekly scores rolled to 0, sorted by this week's score descending. */
export function weeklyLeaderboard(data: FamilyData): FamilyProfile[] {
  const currentWeek = isoWeekKey();
  return data.profiles
    .map((p) => (p.weekKey === currentWeek ? p : { ...p, weekKey: currentWeek, weeklyScore: 0 }))
    .sort((a, b) => b.weeklyScore - a.weeklyScore);
}
