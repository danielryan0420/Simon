import { beforeEach, describe, expect, it } from "vitest";
import { addLeaderboardEntry, loadSave, recordLearned, saveSave } from "../src/game/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadSave", () => {
  it("returns sane defaults when nothing is saved", () => {
    const data = loadSave();
    expect(data.xp).toBe(0);
    expect(data.learnedIds).toEqual([]);
    expect(data.leaderboard).toEqual([]);
    expect(data.hasSeenTutorial).toBe(false);
    expect(data.accessibility).toEqual({ largeText: false, colorBlindMode: false, reducedMotion: false });
  });

  it("round-trips through saveSave", () => {
    const data = loadSave();
    data.xp = 500;
    saveSave(data);
    const reloaded = loadSave();
    expect(reloaded.xp).toBe(500);
  });

  it("backfills accessibility defaults for saves written before the field existed", () => {
    localStorage.setItem("geo-racer:save:v1", JSON.stringify({ xp: 42 }));
    const data = loadSave();
    expect(data.xp).toBe(42);
    expect(data.accessibility).toEqual({ largeText: false, colorBlindMode: false, reducedMotion: false });
    expect(data.hasSeenTutorial).toBe(false);
  });

  it("preserves a partially-set accessibility object while filling in the rest", () => {
    localStorage.setItem(
      "geo-racer:save:v1",
      JSON.stringify({ accessibility: { largeText: true } })
    );
    const data = loadSave();
    expect(data.accessibility).toEqual({ largeText: true, colorBlindMode: false, reducedMotion: false });
  });
});

describe("recordLearned", () => {
  it("adds a new id", () => {
    const data = loadSave();
    const next = recordLearned(data, "kenya");
    expect(next.learnedIds).toContain("kenya");
  });

  it("does not duplicate an existing id", () => {
    const data = loadSave();
    const once = recordLearned(data, "kenya");
    const twice = recordLearned(once, "kenya");
    expect(twice.learnedIds).toEqual(["kenya"]);
  });
});

describe("addLeaderboardEntry", () => {
  it("keeps entries sorted by score descending", () => {
    let data = loadSave();
    data = addLeaderboardEntry(data, { name: "Alex", mode: "countries", score: 500, date: "2026-10-26" });
    data = addLeaderboardEntry(data, { name: "Sam", mode: "countries", score: 900, date: "2026-10-26" });
    expect(data.leaderboard.map((e) => e.name)).toEqual(["Sam", "Alex"]);
  });

  it("caps the leaderboard at maxEntries", () => {
    let data = loadSave();
    for (let i = 0; i < 15; i++) {
      data = addLeaderboardEntry(data, { name: `P${i}`, mode: "countries", score: i, date: "2026-10-26" }, 10);
    }
    expect(data.leaderboard).toHaveLength(10);
  });
});
