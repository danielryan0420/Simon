export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  totalXpForLevel: number;
}

/** XP needed to go from `level` to `level + 1`. Gentle ramp so early levels come fast. */
export function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function levelForXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = totalXp;
  let req = xpRequiredForLevel(level);
  while (remaining >= req) {
    remaining -= req;
    level += 1;
    req = xpRequiredForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: req, totalXpForLevel: totalXp };
}

/** XP awarded for a single answer, independent of the raw score display. */
export function xpForAnswer(totalPoints: number, rating: string): number {
  const base = Math.round(totalPoints / 10);
  const bonus = rating === "perfect" ? 15 : rating === "great" ? 8 : 0;
  return Math.max(1, base + bonus);
}

export interface Unlockable {
  id: string;
  name: string;
  kind: "skin" | "theme";
  unlockLevel: number;
}

export const UNLOCKABLES: Unlockable[] = [
  { id: "plane-classic", name: "Classic Biplane", kind: "skin", unlockLevel: 1 },
  { id: "theme-blue", name: "Ocean Blue", kind: "theme", unlockLevel: 1 },
  { id: "plane-jet", name: "Jet Streak", kind: "skin", unlockLevel: 3 },
  { id: "theme-sunset", name: "Sunset Globe", kind: "theme", unlockLevel: 4 },
  { id: "plane-rocket", name: "Rocket", kind: "skin", unlockLevel: 6 },
  { id: "theme-neon", name: "Neon Night", kind: "theme", unlockLevel: 8 },
  { id: "plane-ufo", name: "UFO", kind: "skin", unlockLevel: 10 },
  { id: "theme-aurora", name: "Aurora", kind: "theme", unlockLevel: 12 },
  { id: "plane-dragon", name: "Dragon Flyer", kind: "skin", unlockLevel: 15 },
  { id: "theme-gold", name: "Golden Globe", kind: "theme", unlockLevel: 18 },
];

export function unlockedAtLevel(level: number): Unlockable[] {
  return UNLOCKABLES.filter((u) => u.unlockLevel <= level);
}

export function newlyUnlockedForLevel(level: number): Unlockable[] {
  return UNLOCKABLES.filter((u) => u.unlockLevel === level);
}
