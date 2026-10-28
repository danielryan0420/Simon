import { isoWeekKey, loadSave, type LeaderboardEntry } from "./storage";

const KEY = "geo-racer:profiles:v1";

/** Kid-friendly avatar emoji, cycled in order as new profiles are created. */
export const AVATARS = ["\u{1F981}", "\u{1F438}", "\u{1F984}", "\u{1F433}", "\u{1F435}", "\u{1F427}", "\u{1F98A}", "\u{1F436}", "\u{1F431}", "\u{1F43C}", "\u{1F98B}", "\u{1F422}"];

/** Kid-friendly color swatches, cycled in order as new profiles are created. */
export const PROFILE_COLORS = ["#ff5a5f", "#38bdf8", "#3ddc84", "#ffcc33", "#a78bfa", "#ff8a4c", "#f472b6", "#2dd4bf"];

export interface ProfileMeta {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface ProfilesData {
  profiles: ProfileMeta[];
  activeProfileId: string | null;
}

function defaultProfiles(): ProfilesData {
  return { profiles: [], activeProfileId: null };
}

export function loadProfiles(): ProfilesData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfiles();
    const parsed = JSON.parse(raw);
    return { ...defaultProfiles(), ...parsed };
  } catch {
    return defaultProfiles();
  }
}

export function saveProfiles(data: ProfilesData): void {
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

export function nextAvatar(data: ProfilesData): string {
  return AVATARS[data.profiles.length % AVATARS.length];
}

export function nextColor(data: ProfilesData): string {
  return PROFILE_COLORS[data.profiles.length % PROFILE_COLORS.length];
}

/** Adds a new named profile (no-op on blank names), activating it if it's the first one. */
export function addProfile(data: ProfilesData, name: string, avatar?: string, color?: string): ProfilesData {
  const trimmed = name.trim();
  if (!trimmed) return data;
  const id = `${slugify(trimmed) || "player"}-${Date.now().toString(36)}`;
  const profile: ProfileMeta = {
    id,
    name: trimmed,
    avatar: avatar ?? nextAvatar(data),
    color: color ?? nextColor(data),
  };
  return {
    profiles: [...data.profiles, profile],
    activeProfileId: data.activeProfileId ?? id,
  };
}

export function removeProfile(data: ProfilesData, id: string): ProfilesData {
  const profiles = data.profiles.filter((p) => p.id !== id);
  const activeProfileId = data.activeProfileId === id ? profiles[0]?.id ?? null : data.activeProfileId;
  return { profiles, activeProfileId };
}

export function setActiveProfile(data: ProfilesData, id: string): ProfilesData {
  if (!data.profiles.some((p) => p.id === id)) return data;
  return { ...data, activeProfileId: id };
}

/** Looks up the currently active profile's metadata, or null if none is set/found. */
export function activeProfileMeta(data: ProfilesData): ProfileMeta | null {
  return data.profiles.find((p) => p.id === data.activeProfileId) ?? null;
}

/** Builds a leaderboard entry attributed to the active profile, falling back to "Player 1". */
export function leaderboardEntryForActiveProfile(
  data: ProfilesData,
  mode: LeaderboardEntry["mode"],
  score: number,
  date: string
): LeaderboardEntry {
  const profile = activeProfileMeta(data);
  return {
    name: profile?.name ?? "Player 1",
    mode,
    score,
    date,
    avatar: profile?.avatar,
    color: profile?.color,
  };
}

/** Guarantees there's always a valid active profile, creating a default one if needed. */
export function ensureActiveProfile(data: ProfilesData): ProfilesData {
  if (data.profiles.length === 0) return addProfile(data, "Player 1");
  if (!data.activeProfileId || !data.profiles.some((p) => p.id === data.activeProfileId)) {
    return { ...data, activeProfileId: data.profiles[0].id };
  }
  return data;
}

export interface LeaderboardRow extends ProfileMeta {
  weeklyScore: number;
  totalScore: number;
  gamesPlayed: number;
}

/** Weekly leaderboard built from each profile's own save data, sorted by this week's score descending. */
export function weeklyLeaderboard(data: ProfilesData): LeaderboardRow[] {
  const currentWeek = isoWeekKey();
  return data.profiles
    .map((p) => {
      const save = loadSave(p.id);
      const weeklyScore = save.weekKey === currentWeek ? save.weeklyScore : 0;
      return { ...p, weeklyScore, totalScore: save.totalScore, gamesPlayed: save.gamesPlayed };
    })
    .sort((a, b) => b.weeklyScore - a.weeklyScore);
}
