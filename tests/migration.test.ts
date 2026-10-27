import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacySave } from "../src/game/migration";
import { loadProfiles } from "../src/game/profiles";
import { loadSave, loadSettings } from "../src/game/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("migrateLegacySave", () => {
  it("does nothing when there is no legacy data (fresh install)", () => {
    migrateLegacySave();
    expect(loadProfiles().profiles).toEqual([]);
    expect(localStorage.getItem("geo-racer:profiles:v1")).toBeNull();
  });

  it("is a no-op once profiles already exist", () => {
    localStorage.setItem(
      "geo-racer:save:v1",
      JSON.stringify({ xp: 999 })
    );
    localStorage.setItem("geo-racer:profiles:v1", JSON.stringify({ profiles: [], activeProfileId: null }));
    migrateLegacySave();
    expect(loadProfiles().profiles).toEqual([]);
    // the legacy save is untouched since migration short-circuited
    expect(localStorage.getItem("geo-racer:save:v1")).not.toBeNull();
  });

  it("creates a single default profile and carries over progress when there was no family data", () => {
    localStorage.setItem(
      "geo-racer:save:v1",
      JSON.stringify({
        xp: 1234,
        learnedIds: ["kenya", "france"],
        campaignStars: { "Africa-boss": 3 },
        selectedSkin: "plane-jet",
        hasSeenTutorial: true,
      })
    );

    migrateLegacySave();

    const profiles = loadProfiles();
    expect(profiles.profiles).toHaveLength(1);
    const id = profiles.activeProfileId!;
    expect(id).toBeTruthy();

    const save = loadSave(id);
    expect(save.xp).toBe(1234);
    expect(save.learnedIds).toEqual(["kenya", "france"]);
    expect(save.campaignStars).toEqual({ "Africa-boss": 3 });

    const settings = loadSettings();
    expect(settings.selectedSkin).toBe("plane-jet");
    expect(settings.hasSeenTutorial).toBe(true);

    expect(localStorage.getItem("geo-racer:save:v1")).toBeNull();
  });

  it("maps legacy family profiles to new profiles, giving the active one the old global progress", () => {
    localStorage.setItem(
      "geo-racer:save:v1",
      JSON.stringify({ xp: 500, learnedIds: ["kenya"] })
    );
    localStorage.setItem(
      "geo-racer:family:v1",
      JSON.stringify({
        profiles: [
          { id: "sam-1", name: "Sam", weeklyScore: 200, weekKey: "2026-W43", bestWeeklyScore: 400, totalScore: 900, gamesPlayed: 5 },
          { id: "alex-1", name: "Alex", weeklyScore: 50, weekKey: "2026-W43", bestWeeklyScore: 50, totalScore: 50, gamesPlayed: 1 },
        ],
        activeProfileId: "sam-1",
      })
    );

    migrateLegacySave();

    const profiles = loadProfiles();
    expect(profiles.profiles.map((p) => p.id)).toEqual(["sam-1", "alex-1"]);
    expect(profiles.activeProfileId).toBe("sam-1");

    const samSave = loadSave("sam-1");
    expect(samSave.xp).toBe(500); // active profile inherits the old global XP/progress
    expect(samSave.learnedIds).toEqual(["kenya"]);
    expect(samSave.weeklyScore).toBe(200);
    expect(samSave.totalScore).toBe(900);

    const alexSave = loadSave("alex-1");
    expect(alexSave.xp).toBe(0); // no way to know Alex's share of the old shared XP
    expect(alexSave.weeklyScore).toBe(50);
    expect(alexSave.totalScore).toBe(50);

    expect(localStorage.getItem("geo-racer:family:v1")).toBeNull();
  });

  it("does not lose progress: total XP across profiles after migration equals the legacy XP", () => {
    localStorage.setItem("geo-racer:save:v1", JSON.stringify({ xp: 777 }));
    localStorage.setItem(
      "geo-racer:family:v1",
      JSON.stringify({ profiles: [{ id: "kid-1", name: "Kid" }], activeProfileId: "kid-1" })
    );

    migrateLegacySave();

    const profiles = loadProfiles();
    const totalXp = profiles.profiles.reduce((sum, p) => sum + loadSave(p.id).xp, 0);
    expect(totalXp).toBe(777);
  });
});
