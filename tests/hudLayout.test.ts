import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Regression test for the iPhone HUD bug: the fixed mute/music buttons sit
// top-right (pinned via inline styles in main.ts), and the in-flow score/
// streak pills (.hud-stats) are also right-aligned at the top of the screen.
// Without a vertical offset reserving space for the button row, the pills
// render underneath the buttons on every screen width.

describe("HUD top bar layout", () => {
  const css = readFileSync("src/style.css", "utf8");
  const mainTs = readFileSync("src/main.ts", "utf8");

  it("defines a reserved height for the fixed top-right button row", () => {
    expect(css).toMatch(/--topbar-controls-h:\s*(\d+)px/);
  });

  it("pushes .hud-stats down by at least the reserved button-row height", () => {
    const iconBtnMatch = css.match(/\.icon-btn\s*\{[^}]*height:\s*(\d+)px/);
    const reservedMatch = css.match(/--topbar-controls-h:\s*(\d+)px/);
    const hudStatsBlock = css.match(/\.hud-stats\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(iconBtnMatch, "icon-btn height not found").toBeTruthy();
    expect(reservedMatch, "--topbar-controls-h not found").toBeTruthy();

    const iconBtnHeight = Number(iconBtnMatch![1]);
    const reserved = Number(reservedMatch![1]);

    // The reserved gap must cover the full button height (not just part of
    // it), or the pills would still clip under the buttons.
    expect(reserved).toBeGreaterThanOrEqual(iconBtnHeight);
    expect(hudStatsBlock).toMatch(/margin-top:\s*var\(--topbar-controls-h\)/);
  });

  it("keeps the mute and music buttons from overlapping each other", () => {
    const muteRight = mainTs.match(/muteBtn\.style\.right = "max\((\d+)px/)?.[1];
    const musicRight = mainTs.match(/musicBtn\.style\.right = "max\((\d+)px,\s*calc\(var\(--safe-right\)\s*\+\s*(\d+)px\)/);
    const iconBtnWidthMatch = css.match(/\.icon-btn\s*\{[^}]*width:\s*(\d+)px/);

    expect(muteRight, "mute button right offset not found").toBeTruthy();
    expect(musicRight, "music button right offset not found").toBeTruthy();
    expect(iconBtnWidthMatch, "icon-btn width not found").toBeTruthy();

    const iconBtnWidth = Number(iconBtnWidthMatch![1]);
    const musicRightOffset = Number(musicRight![2]);

    // Music button's right offset must clear the mute button's full width.
    expect(musicRightOffset).toBeGreaterThanOrEqual(iconBtnWidth);
  });

  it("anchors both buttons to the safe-area insets so they clear the notch", () => {
    expect(mainTs).toMatch(/muteBtn\.style\.top = "max\(\d+px, var\(--safe-top\)\)"/);
    expect(mainTs).toMatch(/muteBtn\.style\.right = "max\(\d+px, var\(--safe-right\)\)"/);
    expect(mainTs).toMatch(/musicBtn\.style\.top = "max\(\d+px, var\(--safe-top\)\)"/);
    expect(mainTs).toMatch(/musicBtn\.style\.right = "max\(\d+px, calc\(var\(--safe-right\)/);
  });
});
