import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBorderSegments } from "../src/render/borderGeo";
import type { GeoCollection } from "../src/data/worldGeo";

const geoPath = path.resolve(__dirname, "../public/data/countries.geojson");
const geo: GeoCollection = JSON.parse(readFileSync(geoPath, "utf-8"));

describe("bundled world borders data", () => {
  it("parses to more than 150 countries", () => {
    expect(geo.type).toBe("FeatureCollection");
    expect(geo.features.length).toBeGreaterThan(150);
  });

  it("every feature has a name and Polygon/MultiPolygon geometry", () => {
    for (const feature of geo.features) {
      expect(typeof feature.properties.name).toBe("string");
      expect(["Polygon", "MultiPolygon"]).toContain(feature.geometry.type);
    }
  });
});

describe("buildBorderSegments", () => {
  const radius = 1;
  const segments = buildBorderSegments(geo, radius);

  it("produces a non-empty, segment-aligned buffer (6 floats per segment)", () => {
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length % 6).toBe(0);
  });

  it("places every point on the sphere of the given radius", () => {
    for (let i = 0; i < segments.length; i += 3) {
      const x = segments[i];
      const y = segments[i + 1];
      const z = segments[i + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      expect(dist).toBeCloseTo(radius, 5);
    }
  });

  it("scales linearly with radius", () => {
    const bigger = buildBorderSegments(geo, radius * 2);
    expect(bigger.length).toBe(segments.length);
    expect(bigger[0]).toBeCloseTo(segments[0] * 2, 5);
  });
});
