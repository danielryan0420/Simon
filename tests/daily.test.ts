import { describe, expect, it } from "vitest";
import { buildDailyChallenge, dateKey, isNextDay } from "../src/game/daily";
import { getTargets, type Mode } from "../src/game/targets";

const byMode: Record<Mode, ReturnType<typeof getTargets>> = {
  countries: getTargets("countries"),
  capitals: getTargets("capitals"),
  landmarks: getTargets("landmarks"),
  states: getTargets("states"),
  flags: getTargets("flags"),
};

describe("dateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(dateKey(new Date("2026-10-26T15:30:00Z"))).toBe("2026-10-26");
  });
});

describe("buildDailyChallenge", () => {
  it("is the same for everyone on the same calendar day", () => {
    const a = buildDailyChallenge(byMode, new Date("2026-10-26T01:00:00Z"));
    const b = buildDailyChallenge(byMode, new Date("2026-10-26T23:00:00Z"));
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
  });

  it("differs across days (with overwhelming likelihood)", () => {
    const a = buildDailyChallenge(byMode, new Date("2026-10-26T01:00:00Z"));
    const b = buildDailyChallenge(byMode, new Date("2026-10-27T01:00:00Z"));
    expect(a.map((t) => t.id)).not.toEqual(b.map((t) => t.id));
  });

  it("returns a fixed-length round", () => {
    const a = buildDailyChallenge(byMode, new Date("2026-01-01T00:00:00Z"));
    expect(a.length).toBe(10);
  });
});

describe("isNextDay", () => {
  it("is true for consecutive calendar days", () => {
    expect(isNextDay("2026-10-26", "2026-10-27")).toBe(true);
  });

  it("is true across a month boundary", () => {
    expect(isNextDay("2026-01-31", "2026-02-01")).toBe(true);
  });

  it("is false for the same day or a gap", () => {
    expect(isNextDay("2026-10-26", "2026-10-26")).toBe(false);
    expect(isNextDay("2026-10-26", "2026-10-28")).toBe(false);
  });
});
