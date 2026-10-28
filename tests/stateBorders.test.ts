import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBorderSegments } from "../src/render/borderGeo";
import type { GeoCollection } from "../src/data/worldGeo";
import { US_STATES } from "../src/data/usStates";

const geoPath = path.resolve(__dirname, "../public/data/us_ca_states.geojson");
const geo: GeoCollection = JSON.parse(readFileSync(geoPath, "utf-8"));

describe("bundled US state / Canadian province borders data", () => {
  it("stays well under the ~300KB offline-bundle budget", () => {
    expect(statSync(geoPath).size).toBeLessThan(300 * 1024);
  });

  it("parses to every US state (+DC) plus Canadian provinces/territories", () => {
    expect(geo.type).toBe("FeatureCollection");
    expect(geo.features.length).toBeGreaterThanOrEqual(63); // 50 states + DC + 13 CA provinces/territories
  });

  it("every feature has a name and Polygon/MultiPolygon geometry", () => {
    for (const feature of geo.features) {
      expect(typeof feature.properties.name).toBe("string");
      expect(["Polygon", "MultiPolygon"]).toContain(feature.geometry.type);
    }
  });

  it("has a matching shape for every state in usStates.ts", () => {
    const names = new Set(geo.features.map((f) => f.properties.name));
    for (const state of US_STATES) {
      expect(names.has(state.name), `missing shape for ${state.name}`).toBe(true);
    }
  });
});

describe("buildBorderSegments against the state/province data", () => {
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
});
