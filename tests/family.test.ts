import { beforeEach, describe, expect, it } from "vitest";
import {
  addProfile,
  isoWeekKey,
  loadFamily,
  recordFamilyScore,
  removeProfile,
  saveFamily,
  setActiveProfile,
  weeklyLeaderboard,
} from "../src/game/family";

beforeEach(() => {
  localStorage.clear();
});

describe("isoWeekKey", () => {
  it("is stable across the same ISO week", () => {
    expect(isoWeekKey(new Date("2026-10-26T00:00:00Z"))).toBe(isoWeekKey(new Date("2026-10-29T23:00:00Z")));
  });

  it("changes across an ISO week boundary (Monday)", () => {
    const sunday = isoWeekKey(new Date("2026-10-25T12:00:00Z"));
    const nextMonday = isoWeekKey(new Date("2026-10-26T12:00:00Z"));
    expect(sunday).not.toBe(nextMonday);
  });

  it("formats as YYYY-Www", () => {
    expect(isoWeekKey(new Date("2026-10-26T12:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("loadFamily / saveFamily", () => {
  it("returns sane defaults when nothing is saved", () => {
    const data = loadFamily();
    expect(data.profiles).toEqual([]);
    expect(data.activeProfileId).toBeNull();
  });

  it("round-trips through saveFamily", () => {
    const data = addProfile(loadFamily(), "Sam");
    saveFamily(data);
    expect(loadFamily().profiles).toHaveLength(1);
  });
});

describe("addProfile / removeProfile", () => {
  it("ignores blank names", () => {
    const data = addProfile(loadFamily(), "   ");
    expect(data.profiles).toHaveLength(0);
  });

  it("activates the first profile automatically", () => {
    const data = addProfile(loadFamily(), "Sam");
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });

  it("does not change the active profile when adding a second one", () => {
    let data = addProfile(loadFamily(), "Sam");
    const activeId = data.activeProfileId;
    data = addProfile(data, "Alex");
    expect(data.activeProfileId).toBe(activeId);
    expect(data.profiles).toHaveLength(2);
  });

  it("falls back to another profile when the active one is removed", () => {
    let data = addProfile(loadFamily(), "Sam");
    data = addProfile(data, "Alex");
    const samId = data.profiles[0].id;
    data = removeProfile(data, samId);
    expect(data.profiles).toHaveLength(1);
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });
});

describe("recordFamilyScore / weeklyLeaderboard", () => {
  it("accumulates weekly and total score for the target profile only", () => {
    let data = addProfile(loadFamily(), "Sam");
    data = addProfile(data, "Alex");
    const [sam, alex] = data.profiles;
    data = recordFamilyScore(data, sam.id, 500);
    data = recordFamilyScore(data, sam.id, 300);

    const board = weeklyLeaderboard(data);
    const samEntry = board.find((p) => p.id === sam.id)!;
    const alexEntry = board.find((p) => p.id === alex.id)!;
    expect(samEntry.weeklyScore).toBe(800);
    expect(samEntry.totalScore).toBe(800);
    expect(samEntry.gamesPlayed).toBe(2);
    expect(alexEntry.weeklyScore).toBe(0);
  });

  it("sorts the leaderboard by weekly score descending", () => {
    let data = addProfile(loadFamily(), "Sam");
    data = addProfile(data, "Alex");
    const [sam, alex] = data.profiles;
    data = recordFamilyScore(data, sam.id, 100);
    data = recordFamilyScore(data, alex.id, 900);

    expect(weeklyLeaderboard(data).map((p) => p.id)).toEqual([alex.id, sam.id]);
  });

  it("rolls weeklyScore back to 0 once the stored week is stale, but keeps totalScore", () => {
    let data = addProfile(loadFamily(), "Sam");
    const sam = data.profiles[0];
    data = recordFamilyScore(data, sam.id, 500);
    data = { ...data, profiles: data.profiles.map((p) => ({ ...p, weekKey: "2000-W01" })) };

    const board = weeklyLeaderboard(data);
    expect(board[0].weeklyScore).toBe(0);
    expect(board[0].totalScore).toBe(500);
  });
});

describe("setActiveProfile", () => {
  it("switches the active profile to an existing id", () => {
    let data = addProfile(loadFamily(), "Sam");
    data = addProfile(data, "Alex");
    const alexId = data.profiles[1].id;
    data = setActiveProfile(data, alexId);
    expect(data.activeProfileId).toBe(alexId);
  });

  it("ignores unknown ids", () => {
    const data = addProfile(loadFamily(), "Sam");
    const result = setActiveProfile(data, "not-a-real-id");
    expect(result.activeProfileId).toBe(data.activeProfileId);
  });
});
