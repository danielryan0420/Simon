import { defaultSave, defaultSettings, saveSave, saveSettings, type SaveData } from "./storage";
import { AVATARS, PROFILE_COLORS, saveProfiles, type ProfileMeta, type ProfilesData } from "./profiles";

const PROFILES_KEY = "geo-racer:profiles:v1";
const LEGACY_SAVE_KEY = "geo-racer:save:v1";
const LEGACY_FAMILY_KEY = "geo-racer:family:v1";

interface LegacyFamilyProfile {
  id: string;
  name: string;
  weeklyScore?: number;
  weekKey?: string;
  bestWeeklyScore?: number;
  totalScore?: number;
}

function parseJson(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * One-time migration from the old single-save format (one global SaveData plus a
 * separate family-leaderboard-only profile list) to the current per-profile format.
 * All existing progress lands on the active (or first) family profile, so nothing
 * is lost. Safe to call on every startup: no-ops once "geo-racer:profiles:v1" exists.
 */
export function migrateLegacySave(): void {
  if (localStorage.getItem(PROFILES_KEY) !== null) return;

  const legacySave = parseJson(localStorage.getItem(LEGACY_SAVE_KEY));
  const legacyFamily = parseJson(localStorage.getItem(LEGACY_FAMILY_KEY));
  if (!legacySave && !legacyFamily) return; // nothing to migrate; caller creates a default profile

  const legacyProfiles: LegacyFamilyProfile[] = Array.isArray(legacyFamily?.profiles) ? legacyFamily.profiles : [];

  const profiles: ProfileMeta[] =
    legacyProfiles.length > 0
      ? legacyProfiles.map((p, i) => ({
          id: p.id,
          name: p.name,
          avatar: AVATARS[i % AVATARS.length],
          color: PROFILE_COLORS[i % PROFILE_COLORS.length],
        }))
      : [{ id: `player-${Date.now().toString(36)}`, name: "Player 1", avatar: AVATARS[0], color: PROFILE_COLORS[0] }];

  const activeProfileId: string =
    (legacyFamily?.activeProfileId && profiles.some((p) => p.id === legacyFamily.activeProfileId)
      ? legacyFamily.activeProfileId
      : profiles[0].id);

  const profilesData: ProfilesData = { profiles, activeProfileId };

  for (const profile of profiles) {
    const legacyFamilyProfile = legacyProfiles.find((p) => p.id === profile.id);
    const isActive = profile.id === activeProfileId;
    const save: SaveData = {
      ...defaultSave(),
      ...(isActive && legacySave
        ? {
            xp: legacySave.xp ?? 0,
            learnedIds: legacySave.learnedIds ?? [],
            leaderboard: legacySave.leaderboard ?? [],
            lastDailyKey: legacySave.lastDailyKey ?? null,
            lastDailyScore: legacySave.lastDailyScore ?? null,
            gamesPlayed: legacySave.gamesPlayed ?? 0,
            bestStreak: legacySave.bestStreak ?? 0,
            perfectCount: legacySave.perfectCount ?? 0,
            greatCount: legacySave.greatCount ?? 0,
            dailyCompletedCount: legacySave.dailyCompletedCount ?? 0,
            dailyStreak: legacySave.dailyStreak ?? 0,
            racesPlayed: legacySave.racesPlayed ?? 0,
            raceWins: legacySave.raceWins ?? 0,
            unlockedAchievementIds: legacySave.unlockedAchievementIds ?? [],
            campaignStars: legacySave.campaignStars ?? {},
            timeAttackBestScore: legacySave.timeAttackBestScore ?? 0,
            timeAttackBestCorrect: legacySave.timeAttackBestCorrect ?? 0,
          }
        : {}),
      ...(legacyFamilyProfile
        ? {
            weeklyScore: legacyFamilyProfile.weeklyScore ?? 0,
            weekKey: legacyFamilyProfile.weekKey ?? defaultSave().weekKey,
            bestWeeklyScore: legacyFamilyProfile.bestWeeklyScore ?? 0,
            totalScore: legacyFamilyProfile.totalScore ?? 0,
          }
        : {}),
    };
    saveSave(profile.id, save);
  }

  saveSettings({
    ...defaultSettings(),
    selectedSkin: legacySave?.selectedSkin ?? defaultSettings().selectedSkin,
    selectedTheme: legacySave?.selectedTheme ?? defaultSettings().selectedTheme,
    accessibility: { ...defaultSettings().accessibility, ...(legacySave?.accessibility ?? {}) },
    hasSeenTutorial: legacySave?.hasSeenTutorial ?? false,
  });

  saveProfiles(profilesData);

  localStorage.removeItem(LEGACY_SAVE_KEY);
  localStorage.removeItem(LEGACY_FAMILY_KEY);
}
