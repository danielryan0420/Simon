import { describe, expect, it } from "vitest";
import { comboMultiplier, rateDistance, scoreAnswer, timeBonus } from "../src/game/scoring";

describe("rateDistance", () => {
  it("rates close answers as perfect", () => {
    expect(rateDistance(0)).toBe("perfect");
    expect(rateDistance(59)).toBe("perfect");
  });
  it("rates far answers as miss", () => {
    expect(rateDistance(5000)).toBe("miss");
  });
  it("is monotonic across thresholds", () => {
    expect(rateDistance(60)).toBe("perfect");
    expect(rateDistance(61)).toBe("great");
    expect(rateDistance(250)).toBe("great");
    expect(rateDistance(251)).toBe("good");
    expect(rateDistance(600)).toBe("good");
    expect(rateDistance(601)).toBe("ok");
    expect(rateDistance(1500)).toBe("ok");
    expect(rateDistance(1501)).toBe("miss");
  });
});

describe("timeBonus", () => {
  it("is maximal for very fast answers", () => {
    expect(timeBonus(500)).toBe(200);
    expect(timeBonus(2000)).toBe(200);
  });
  it("is zero for slow answers", () => {
    expect(timeBonus(10000)).toBe(0);
    expect(timeBonus(20000)).toBe(0);
  });
  it("decreases monotonically between 2s and 10s", () => {
    const b4 = timeBonus(4000);
    const b6 = timeBonus(6000);
    const b8 = timeBonus(8000);
    expect(b4).toBeGreaterThan(b6);
    expect(b6).toBeGreaterThan(b8);
  });
});

describe("comboMultiplier", () => {
  it("is 1 at streak 0", () => {
    expect(comboMultiplier(0)).toBe(1);
  });
  it("caps at streak 10", () => {
    expect(comboMultiplier(10)).toBeCloseTo(1.5, 5);
    expect(comboMultiplier(50)).toBeCloseTo(1.5, 5);
  });
  it("never goes negative for negative streaks", () => {
    expect(comboMultiplier(-5)).toBe(1);
  });
});

describe("scoreAnswer", () => {
  it("awards max-ish points for a perfect, fast, ace, high-streak answer", () => {
    const result = scoreAnswer(0, 500, "ace", 10);
    expect(result.rating).toBe("perfect");
    expect(result.totalPoints).toBeGreaterThan(1500);
  });

  it("awards zero points for a total miss", () => {
    const result = scoreAnswer(4000, 5000, "rookie", 0);
    expect(result.rating).toBe("miss");
    expect(result.totalPoints).toBe(0);
  });

  it("gives no time bonus when the answer missed entirely", () => {
    const result = scoreAnswer(3500, 500, "rookie", 0);
    expect(result.timeBonus).toBe(0);
  });

  it("scales with difficulty", () => {
    const rookie = scoreAnswer(100, 3000, "rookie", 2);
    const ace = scoreAnswer(100, 3000, "ace", 2);
    const hard = scoreAnswer(100, 3000, "hard", 2);
    expect(ace.totalPoints).toBeGreaterThan(rookie.totalPoints);
    expect(hard.totalPoints).toBeGreaterThan(ace.totalPoints);
  });

  it("scales with streak via combo multiplier", () => {
    const low = scoreAnswer(100, 3000, "pilot", 0);
    const high = scoreAnswer(100, 3000, "pilot", 10);
    expect(high.totalPoints).toBeGreaterThan(low.totalPoints);
  });
});
