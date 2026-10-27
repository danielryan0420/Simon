import { beforeEach, describe, expect, it } from "vitest";
import {
  addLeaderboardEntry,
  loadSave,
  loadSettings,
  recordLearned,
  recordWeeklyScore,
  saveSave,
  saveSettings,
  deleteSave,
} from "../src/game/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadSave", () => {
  it("returns sane defaults when nothing is saved", () => {
    const data = loadSave("sam");
    expect(data.xp).toBe(0);
    expect(data.learnedIds).toEqual([]);
    expect(data.leaderboard).toEqual([]);
    expect(data.campaignStars).toEqual({});
    expect(data.timeAttackBestScore).toBe(0);
    expect(data.timeAttackBestCorrect).toBe(0);
    expect(data.weeklyScore).toBe(0);
    expect(data.totalScore).toBe(0);
  });

  it("round-trips through saveSave", () => {
    const data = loadSave("sam");
    data.xp = 500;
    saveSave("sam", data);
    const reloaded = loadSave("sam");
    expect(reloaded.xp).toBe(500);
  });

  it("backfills defaults for saves written before newer fields existed", () => {
    localStorage.setItem("geo-racer:save:v1:sam", JSON.stringify({ xp: 42 }));
    const data = loadSave("sam");
    expect(data.xp).toBe(42);
    expect(data.campaignStars).toEqual({});
    expect(data.timeAttackBestScore).toBe(0);
    expect(data.timeAttackBestCorrect).toBe(0);
    expect(data.weeklyScore).toBe(0);
  });

  it("keeps each profile's save under its own storage key", () => {
    saveSave("sam", { ...loadSave("sam"), xp: 100 });
    saveSave("alex", { ...loadSave("alex"), xp: 900 });
    expect(loadSave("sam").xp).toBe(100);
    expect(loadSave("alex").xp).toBe(900);
  });

  it("deleteSave removes only the targeted profile's data", () => {
    saveSave("sam", { ...loadSave("sam"), xp: 100 });
    saveSave("alex", { ...loadSave("alex"), xp: 900 });
    deleteSave("sam");
    expect(loadSave("sam").xp).toBe(0);
    expect(loadSave("alex").xp).toBe(900);
  });
});

describe("loadSettings / saveSettings", () => {
  it("returns sane defaults when nothing is saved", () => {
    const settings = loadSettings();
    expect(settings.selectedSkin).toBe("plane-classic");
    expect(settings.selectedTheme).toBe("theme-blue");
    expect(settings.accessibility).toEqual({ largeText: false, colorBlindMode: false, reducedMotion: false });
    expect(settings.hasSeenTutorial).toBe(false);
  });

  it("round-trips and is shared across profiles (device-wide, not per-profile)", () => {
    const settings = { ...loadSettings(), selectedSkin: "plane-jet", hasSeenTutorial: true };
    saveSettings(settings);
    expect(loadSettings().selectedSkin).toBe("plane-jet");
    expect(loadSettings().hasSeenTutorial).toBe(true);
  });

  it("preserves a partially-set accessibility object while filling in the rest", () => {
    localStorage.setItem("geo-racer:settings:v1", JSON.stringify({ accessibility: { largeText: true } }));
    const settings = loadSettings();
    expect(settings.accessibility).toEqual({ largeText: true, colorBlindMode: false, reducedMotion: false });
  });
});

describe("recordLearned", () => {
  it("adds a new id", () => {
    const data = loadSave("sam");
    const next = recordLearned(data, "kenya");
    expect(next.learnedIds).toContain("kenya");
  });

  it("does not duplicate an existing id", () => {
    const data = loadSave("sam");
    const once = recordLearned(data, "kenya");
    const twice = recordLearned(once, "kenya");
    expect(twice.learnedIds).toEqual(["kenya"]);
  });
});

describe("addLeaderboardEntry", () => {
  it("keeps entries sorted by score descending", () => {
    let data = loadSave("sam");
    data = addLeaderboardEntry(data, { name: "Alex", mode: "countries", score: 500, date: "2026-10-26" });
    data = addLeaderboardEntry(data, { name: "Sam", mode: "countries", score: 900, date: "2026-10-26" });
    expect(data.leaderboard.map((e) => e.name)).toEqual(["Sam", "Alex"]);
  });

  it("caps the leaderboard at maxEntries", () => {
    let data = loadSave("sam");
    for (let i = 0; i < 15; i++) {
      data = addLeaderboardEntry(data, { name: `P${i}`, mode: "countries", score: i, date: "2026-10-26" }, 10);
    }
    expect(data.leaderboard).toHaveLength(10);
  });
});

describe("recordWeeklyScore", () => {
  it("accumulates weekly and total score", () => {
    let data = loadSave("sam");
    data = recordWeeklyScore(data, 500, new Date("2026-10-26T12:00:00Z"));
    data = recordWeeklyScore(data, 300, new Date("2026-10-27T12:00:00Z"));
    expect(data.weeklyScore).toBe(800);
    expect(data.totalScore).toBe(800);
    expect(data.bestWeeklyScore).toBe(800);
  });

  it("rolls weeklyScore back to 0 once the stored week is stale, but keeps totalScore", () => {
    let data = loadSave("sam");
    data = recordWeeklyScore(data, 500, new Date("2026-10-26T12:00:00Z"));
    data = recordWeeklyScore(data, 100, new Date("2027-01-04T12:00:00Z"));
    expect(data.weeklyScore).toBe(100);
    expect(data.totalScore).toBe(600);
    expect(data.bestWeeklyScore).toBe(500);
  });
});
