import { describe, expect, it } from "vitest";
import { resolvePinColor, PIN_COLORS } from "../src/render/pinColors";

describe("resolvePinColor", () => {
  it("uses the default palette when color-blind mode is off", () => {
    expect(resolvePinColor("tap", false)).toBe(PIN_COLORS.tap);
    expect(resolvePinColor("miss", false)).toBe(PIN_COLORS.miss);
    expect(resolvePinColor("target", false)).toBe(PIN_COLORS.target);
  });

  it("swaps miss/target to color-blind-safe hues, leaving tap untouched", () => {
    expect(resolvePinColor("tap", true)).toBe(PIN_COLORS.tap);
    expect(resolvePinColor("miss", true)).toBe(PIN_COLORS.missColorBlind);
    expect(resolvePinColor("target", true)).toBe(PIN_COLORS.targetColorBlind);
  });

  it("keeps every pin color distinct within a palette", () => {
    const normal = [resolvePinColor("tap", false), resolvePinColor("miss", false), resolvePinColor("target", false)];
    const colorBlind = [resolvePinColor("tap", true), resolvePinColor("miss", true), resolvePinColor("target", true)];
    expect(new Set(normal).size).toBe(3);
    expect(new Set(colorBlind).size).toBe(3);
  });
});
