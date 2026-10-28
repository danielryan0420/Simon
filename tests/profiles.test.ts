import { beforeEach, describe, expect, it } from "vitest";
import {
  AVATARS,
  PROFILE_COLORS,
  activeProfileMeta,
  addProfile,
  ensureActiveProfile,
  leaderboardEntryForActiveProfile,
  loadProfiles,
  nextAvatar,
  nextColor,
  removeProfile,
  saveProfiles,
  setActiveProfile,
  weeklyLeaderboard,
} from "../src/game/profiles";
import { addLeaderboardEntry, loadSave, recordWeeklyScore, saveSave } from "../src/game/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadProfiles / saveProfiles", () => {
  it("returns sane defaults when nothing is saved", () => {
    const data = loadProfiles();
    expect(data.profiles).toEqual([]);
    expect(data.activeProfileId).toBeNull();
  });

  it("round-trips through saveProfiles", () => {
    const data = addProfile(loadProfiles(), "Sam");
    saveProfiles(data);
    expect(loadProfiles().profiles).toHaveLength(1);
  });
});

describe("addProfile / removeProfile", () => {
  it("ignores blank names", () => {
    const data = addProfile(loadProfiles(), "   ");
    expect(data.profiles).toHaveLength(0);
  });

  it("activates the first profile automatically", () => {
    const data = addProfile(loadProfiles(), "Sam");
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });

  it("does not change the active profile when adding a second one", () => {
    let data = addProfile(loadProfiles(), "Sam");
    const activeId = data.activeProfileId;
    data = addProfile(data, "Alex");
    expect(data.activeProfileId).toBe(activeId);
    expect(data.profiles).toHaveLength(2);
  });

  it("assigns the next avatar/color in the palette when none is given", () => {
    let data = addProfile(loadProfiles(), "Sam");
    expect(data.profiles[0].avatar).toBe(AVATARS[0]);
    expect(data.profiles[0].color).toBe(PROFILE_COLORS[0]);
    data = addProfile(data, "Alex");
    expect(data.profiles[1].avatar).toBe(AVATARS[1]);
    expect(data.profiles[1].color).toBe(PROFILE_COLORS[1]);
  });

  it("honors an explicit avatar/color choice", () => {
    const data = addProfile(loadProfiles(), "Sam", "\u{1F995}", "#123456");
    expect(data.profiles[0].avatar).toBe("\u{1F995}");
    expect(data.profiles[0].color).toBe("#123456");
  });

  it("falls back to another profile when the active one is removed", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    const samId = data.profiles[0].id;
    data = removeProfile(data, samId);
    expect(data.profiles).toHaveLength(1);
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });
});

describe("setActiveProfile", () => {
  it("switches the active profile to an existing id", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    const alexId = data.profiles[1].id;
    data = setActiveProfile(data, alexId);
    expect(data.activeProfileId).toBe(alexId);
  });

  it("ignores unknown ids", () => {
    const data = addProfile(loadProfiles(), "Sam");
    const result = setActiveProfile(data, "not-a-real-id");
    expect(result.activeProfileId).toBe(data.activeProfileId);
  });
});

describe("ensureActiveProfile", () => {
  it("creates a default profile when there are none", () => {
    const data = ensureActiveProfile(loadProfiles());
    expect(data.profiles).toHaveLength(1);
    expect(data.profiles[0].name).toBe("Player 1");
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });

  it("repairs a dangling activeProfileId", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = { ...data, activeProfileId: "deleted-profile" };
    const fixed = ensureActiveProfile(data);
    expect(fixed.activeProfileId).toBe(data.profiles[0].id);
  });

  it("leaves a valid state untouched", () => {
    const data = addProfile(loadProfiles(), "Sam");
    expect(ensureActiveProfile(data)).toEqual(data);
  });
});

describe("activeProfileMeta", () => {
  it("returns the active profile's metadata", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    const alexId = data.profiles[1].id;
    data = setActiveProfile(data, alexId);
    expect(activeProfileMeta(data)?.name).toBe("Alex");
  });

  it("returns null when there is no active profile", () => {
    expect(activeProfileMeta(loadProfiles())).toBeNull();
  });
});

describe("leaderboardEntryForActiveProfile", () => {
  it("records a finished round under the active profile's name, avatar, and color", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    data = setActiveProfile(data, data.profiles[1].id);

    const entry = leaderboardEntryForActiveProfile(data, "countries", 900, "2026-10-27");
    expect(entry.name).toBe("Alex");
    expect(entry.avatar).toBe(data.profiles[1].avatar);
    expect(entry.color).toBe(data.profiles[1].color);

    const save = addLeaderboardEntry(loadSave(data.profiles[1].id), entry);
    expect(save.leaderboard[0].name).toBe("Alex");
  });

  it("falls back to 'Player 1' when there is no active profile", () => {
    const entry = leaderboardEntryForActiveProfile(loadProfiles(), "countries", 500, "2026-10-27");
    expect(entry.name).toBe("Player 1");
    expect(entry.avatar).toBeUndefined();
  });
});

describe("weeklyLeaderboard", () => {
  it("reads each profile's own weekly score and sorts descending", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    const [sam, alex] = data.profiles;

    saveSave(sam.id, recordWeeklyScore(loadSave(sam.id), 100));
    saveSave(alex.id, recordWeeklyScore(loadSave(alex.id), 900));

    const board = weeklyLeaderboard(data);
    expect(board.map((p) => p.id)).toEqual([alex.id, sam.id]);
    expect(board.find((p) => p.id === alex.id)!.weeklyScore).toBe(900);
  });

  it("rolls a stale weekly score to 0 for display without touching storage", () => {
    let data = addProfile(loadProfiles(), "Sam");
    const sam = data.profiles[0];
    const stale = { ...recordWeeklyScore(loadSave(sam.id), 500), weekKey: "2000-W01" };
    saveSave(sam.id, stale);

    const board = weeklyLeaderboard(data);
    expect(board[0].weeklyScore).toBe(0);
    expect(board[0].totalScore).toBe(500);
    expect(loadSave(sam.id).weekKey).toBe("2000-W01");
  });

  it("keeps each profile's score isolated from the others", () => {
    let data = addProfile(loadProfiles(), "Sam");
    data = addProfile(data, "Alex");
    const [sam, alex] = data.profiles;
    saveSave(sam.id, recordWeeklyScore(loadSave(sam.id), 500));

    const board = weeklyLeaderboard(data);
    expect(board.find((p) => p.id === alex.id)!.weeklyScore).toBe(0);
  });
});
