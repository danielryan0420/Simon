import { COUNTRIES } from "../data/countries";
import { LANDMARKS } from "../data/landmarks";
import { US_STATES } from "../data/usStates";
import type { Region } from "../data/types";
import { CAMPAIGN_REGIONS } from "./campaign";
import { levelForXp } from "./progression";
import type { SaveData } from "./storage";

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: (save: SaveData) => boolean;
}

const REGIONS: Region[] = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

function masteredCountryIds(save: SaveData): Set<string> {
  const countryIds = new Set(COUNTRIES.map((c) => c.id));
  return new Set(save.learnedIds.filter((id) => countryIds.has(id)));
}

function allLearned(save: SaveData, ids: string[]): boolean {
  if (ids.length === 0) return false;
  const learned = new Set(save.learnedIds);
  return ids.every((id) => learned.has(id));
}

function regionFullyMastered(save: SaveData, region: Region): boolean {
  const ids = COUNTRIES.filter((c) => c.region === region).map((c) => c.id);
  const mastered = masteredCountryIds(save);
  return ids.length > 0 && ids.every((id) => mastered.has(id));
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-flight", name: "First Flight", icon: "\u{1F6EB}", description: "Complete your first round.", isUnlocked: (s) => s.gamesPlayed >= 1 },
  { id: "level-5", name: "Rising Pilot", icon: "\u{1F949}", description: "Reach level 5.", isUnlocked: (s) => levelForXp(s.xp).level >= 5 },
  { id: "level-10", name: "Ace Navigator", icon: "\u{1F948}", description: "Reach level 10.", isUnlocked: (s) => levelForXp(s.xp).level >= 10 },
  { id: "level-20", name: "Globe Legend", icon: "\u{1F947}", description: "Reach level 20.", isUnlocked: (s) => levelForXp(s.xp).level >= 20 },

  { id: "streak-5", name: "Warming Up", icon: "\u{1F525}", description: "Hit a 5-answer streak.", isUnlocked: (s) => s.bestStreak >= 5 },
  { id: "streak-10", name: "On Fire", icon: "\u{1F525}", description: "Hit a 10-answer streak.", isUnlocked: (s) => s.bestStreak >= 10 },
  { id: "streak-20", name: "Unstoppable", icon: "\u{1F525}", description: "Hit a 20-answer streak.", isUnlocked: (s) => s.bestStreak >= 20 },

  { id: "perfect-1", name: "Bullseye", icon: "\u{1F3AF}", description: "Land your first Perfect.", isUnlocked: (s) => s.perfectCount >= 1 },
  { id: "perfect-25", name: "Sharp Shooter", icon: "\u{1F3AF}", description: "Land 25 Perfects.", isUnlocked: (s) => s.perfectCount >= 25 },
  { id: "perfect-100", name: "Deadeye", icon: "\u{1F3AF}", description: "Land 100 Perfects.", isUnlocked: (s) => s.perfectCount >= 100 },

  { id: "learned-10", name: "Explorer", icon: "\u{1F5FA}️", description: "Master 10 targets.", isUnlocked: (s) => s.learnedIds.length >= 10 },
  { id: "learned-50", name: "Globe Trotter", icon: "\u{1F5FA}️", description: "Master 50 targets.", isUnlocked: (s) => s.learnedIds.length >= 50 },
  { id: "learned-100", name: "World Wise", icon: "\u{1F5FA}️", description: "Master 100 targets.", isUnlocked: (s) => s.learnedIds.length >= 100 },
  { id: "learned-200", name: "Master Cartographer", icon: "\u{1F5FA}️", description: "Master 200 targets.", isUnlocked: (s) => s.learnedIds.length >= 200 },

  {
    id: "countries-all",
    name: "Countries Complete",
    icon: "\u{1F30D}",
    description: "Master every country.",
    isUnlocked: (s) => allLearned(s, COUNTRIES.map((c) => c.id)),
  },
  {
    id: "capitals-all",
    name: "Capital Expert",
    icon: "\u{1F3DB}️",
    description: "Master every capital city.",
    isUnlocked: (s) => allLearned(s, COUNTRIES.map((c) => `${c.id}-capital`)),
  },
  {
    id: "flags-all",
    name: "Flag Fanatic",
    icon: "\u{1F6A9}",
    description: "Master every flag.",
    isUnlocked: (s) => allLearned(s, COUNTRIES.map((c) => `${c.id}-flag`)),
  },
  {
    id: "hard-capitals-all",
    name: "World Capitals Master",
    icon: "\u{1F310}",
    description: "Master every Hard-tier capital.",
    isUnlocked: (s) =>
      allLearned(
        s,
        COUNTRIES.filter((c) => c.difficulty === "hard").map((c) => `${c.id}-capital`)
      ),
  },
  { id: "landmarks-25", name: "Landmark Explorer", icon: "\u{1F3EF}", description: "Master 25 landmarks.", isUnlocked: (s) => LANDMARKS.filter((l) => s.learnedIds.includes(l.id)).length >= 25 },
  { id: "landmarks-all", name: "Landmark Legend", icon: "\u{1F3EF}", description: "Master every landmark.", isUnlocked: (s) => allLearned(s, LANDMARKS.map((l) => l.id)) },
  { id: "states-all", name: "All 50 States", icon: "\u{1F5FD}", description: "Master every US state.", isUnlocked: (s) => allLearned(s, US_STATES.map((st) => st.id)) },

  {
    id: "region-champion",
    name: "Regional Champion",
    icon: "\u{1F9ED}",
    description: "Master every country in one region.",
    isUnlocked: (s) => REGIONS.some((r) => regionFullyMastered(s, r)),
  },
  {
    id: "world-champion",
    name: "World Champion",
    icon: "\u{1F3C6}",
    description: "Master every country in all six regions.",
    isUnlocked: (s) => REGIONS.every((r) => regionFullyMastered(s, r)),
  },

  { id: "daily-1", name: "Daily Flyer", icon: "\u{2B50}", description: "Complete a Daily Challenge.", isUnlocked: (s) => s.dailyCompletedCount >= 1 },
  { id: "daily-7-total", name: "Daily Regular", icon: "\u{1F4C5}", description: "Complete 7 Daily Challenges.", isUnlocked: (s) => s.dailyCompletedCount >= 7 },
  { id: "daily-streak-7", name: "Weekly Streak", icon: "\u{1F525}", description: "Play the Daily Challenge 7 days in a row.", isUnlocked: (s) => s.dailyStreak >= 7 },

  { id: "race-1", name: "First Race", icon: "\u{1F3C1}", description: "Finish a 2-Player Race.", isUnlocked: (s) => s.racesPlayed >= 1 },
  { id: "race-wins-10", name: "Rival Crusher", icon: "\u{1F3C6}", description: "Win 10 races.", isUnlocked: (s) => s.raceWins >= 10 },

  { id: "collector", name: "Collector", icon: "\u{1F381}", description: "Reach the level that unlocks every skin and theme.", isUnlocked: (s) => levelForXp(s.xp).level >= 18 },

  {
    id: "campaign-boss-1",
    name: "Boss Slayer",
    icon: "\u{1F451}",
    description: "Clear your first World Tour boss round.",
    isUnlocked: (s) => CAMPAIGN_REGIONS.some((r) => (s.campaignStars[`${r}-boss`] ?? 0) >= 1),
  },
  {
    id: "campaign-world-champion",
    name: "World Tour Champion",
    icon: "\u{1F3C6}",
    description: "Clear every World Tour boss round.",
    isUnlocked: (s) => CAMPAIGN_REGIONS.every((r) => (s.campaignStars[`${r}-boss`] ?? 0) >= 1),
  },
  {
    id: "time-attack-20",
    name: "Speed Demon",
    icon: "⚡",
    description: "Score 20 correct answers in one Time Attack run.",
    isUnlocked: (s) => s.timeAttackBestCorrect >= 20,
  },

  {
    id: "detective-1",
    name: "Rookie Detective",
    icon: "\u{1F50E}",
    description: "Crack your first Globe Detective case.",
    isUnlocked: (s) => s.detectiveCasesSolved >= 1,
  },
  {
    id: "detective-25",
    name: "Master Detective",
    icon: "\u{1F575}️",
    description: "Solve 25 Globe Detective cases.",
    isUnlocked: (s) => s.detectiveCasesSolved >= 25,
  },
  {
    id: "detective-flawless-10",
    name: "One-Clue Wonder",
    icon: "\u{1F9E0}",
    description: "Solve 10 Globe Detective cases using only the first clue.",
    isUnlocked: (s) => s.detectiveFlawlessSolves >= 10,
  },
];

/** Achievements that just became unlocked by this save state and aren't recorded yet. */
export function newlyUnlockedAchievements(save: SaveData): Achievement[] {
  const already = new Set(save.unlockedAchievementIds);
  return ACHIEVEMENTS.filter((a) => !already.has(a.id) && a.isUnlocked(save));
}
