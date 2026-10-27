import { describe, expect, it } from "vitest";
import { renderFlagSvg } from "../src/render/flagSvg";

describe("renderFlagSvg", () => {
  it("renders a solid-background flag as a valid svg string", () => {
    const svg = renderFlagSvg({ bg: "#ff0000" });
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 90 60"');
    expect(svg).toContain("#ff0000");
  });

  it("renders even stripes across the full canvas", () => {
    const svg = renderFlagSvg({ bg: "#000000", stripes: { dir: "h", colors: ["#111111", "#222222", "#333333"] } });
    expect(svg).toContain("#111111");
    expect(svg).toContain("#222222");
    expect(svg).toContain("#333333");
  });

  it("renders a canton with nested shapes", () => {
    const svg = renderFlagSvg({
      bg: "#ffffff",
      canton: { x: 0, y: 0, w: 10, h: 10, bg: "#0000ff", shapes: [{ t: "star", cx: 5, cy: 5, r: 2, fill: "#ffffff" }] },
    });
    expect(svg).toContain("#0000ff");
    expect(svg).toContain("<polygon");
  });

  it("renders a star grid with rows*cols stars", () => {
    const svg = renderFlagSvg({ bg: "#fff", shapes: [{ t: "starGrid", x: 0, y: 0, w: 20, h: 20, rows: 2, cols: 3, r: 1, fill: "#000" }] });
    expect(svg.match(/<polygon/g)?.length).toBe(6);
  });

  it("renders a crescent as a masked circle", () => {
    const svg = renderFlagSvg({ bg: "#ff0000", shapes: [{ t: "crescent", cx: 10, cy: 10, r: 5, offset: 2, fill: "#ffffff" }] });
    expect(svg).toContain("<mask");
    expect(svg).toContain("<circle");
  });
});
