import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findStateFeature, stateContainsPoint } from "../src/game/stateHitTest";
import type { GeoCollection, GeoFeature } from "../src/data/worldGeo";

const geoPath = path.resolve(__dirname, "../public/data/us_ca_states.geojson");
const realGeo: GeoCollection = JSON.parse(readFileSync(geoPath, "utf-8"));

function square(name: string, minLon: number, maxLon: number, minLat: number, maxLat: number): GeoFeature {
  return {
    type: "Feature",
    properties: { name },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
}

function collection(features: GeoFeature[]): GeoCollection {
  return { type: "FeatureCollection", features };
}

describe("stateContainsPoint (synthetic shapes)", () => {
  const target = square("Smallia", 0, 1, 0, 1); // ~111km x 111km near the equator
  const neighbor = square("Bigland", 1, 10, 0, 10);
  const geo = collection([target, neighbor]);

  it("hits anywhere inside the shape", () => {
    expect(stateContainsPoint(geo, "Smallia", 0.05, 0.95).hit).toBe(true);
  });

  it("applies a small tolerance buffer just outside the border", () => {
    const result = stateContainsPoint(geo, "Smallia", -0.05, 0.5, 15);
    expect(result.hit).toBe(true);
  });

  it("never steals a tap that actually landed inside a neighboring state", () => {
    const result = stateContainsPoint(geo, "Smallia", 0.5, 1.001, 15);
    expect(result.hit).toBe(false);
  });

  it("reports hasGeometry:false for a state with no bundled polygon", () => {
    const result = stateContainsPoint(geo, "Nowhereland", 0, 0);
    expect(result.hit).toBe(false);
    expect(result.hasGeometry).toBe(false);
  });
});

describe("findStateFeature", () => {
  it("resolves a real state by its exact name", () => {
    expect(findStateFeature(realGeo, "California")?.properties.name).toBe("California");
  });

  it("returns null for a name not present in the dataset", () => {
    expect(findStateFeature(realGeo, "Not A State")).toBeNull();
  });
});

describe("stateContainsPoint against the real bundled borders", () => {
  it("scores a tap on a state capital as a hit", () => {
    expect(stateContainsPoint(realGeo, "California", 38.58, -121.49).hit).toBe(true); // Sacramento
    expect(stateContainsPoint(realGeo, "Texas", 30.27, -97.74).hit).toBe(true); // Austin
  });

  it("gives tiny states (RI, DE, CT, NJ, DC) enough tap tolerance to stay tappable", () => {
    expect(stateContainsPoint(realGeo, "Rhode Island", 41.82, -71.41).hit).toBe(true); // Providence
    expect(stateContainsPoint(realGeo, "Delaware", 39.16, -75.52).hit).toBe(true); // Dover
    expect(stateContainsPoint(realGeo, "Connecticut", 41.76, -72.69).hit).toBe(true); // Hartford
    expect(stateContainsPoint(realGeo, "New Jersey", 40.22, -74.76).hit).toBe(true); // Trenton
    expect(stateContainsPoint(realGeo, "District of Columbia", 38.9072, -77.0369).hit).toBe(true); // Washington
  });

  it("does not count a tap clearly inside a different state", () => {
    expect(stateContainsPoint(realGeo, "California", 30.27, -97.74).hit).toBe(false); // Austin, TX
  });

  it("falls back gracefully for a state absent from the bundled dataset", () => {
    const result = stateContainsPoint(realGeo, "Narnia", 0, 0);
    expect(result.hit).toBe(false);
    expect(result.hasGeometry).toBe(false);
  });
});
