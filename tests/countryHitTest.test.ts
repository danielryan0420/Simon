import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { countryContainsPoint, findCountryFeature, isPointInFeature } from "../src/game/countryHitTest";
import type { GeoCollection, GeoFeature } from "../src/data/worldGeo";

const geoPath = path.resolve(__dirname, "../public/data/countries.geojson");
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

describe("isPointInFeature (synthetic shapes)", () => {
  it("is true for a point inside a simple square", () => {
    const feature = square("Squareland", 0, 10, 0, 10);
    expect(isPointInFeature(feature, 5, 5)).toBe(true);
  });

  it("is false for a point outside the square", () => {
    const feature = square("Squareland", 0, 10, 0, 10);
    expect(isPointInFeature(feature, 50, 50)).toBe(false);
  });

  it("excludes a hole: a point inside an interior hole does not count", () => {
    const feature: GeoFeature = {
      type: "Feature",
      properties: { name: "Donutland" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          [
            [4, 4],
            [6, 4],
            [6, 6],
            [4, 6],
            [4, 4],
          ],
        ],
      },
    };
    expect(isPointInFeature(feature, 5, 5)).toBe(false); // inside the hole
    expect(isPointInFeature(feature, 1, 1)).toBe(true); // inside the donut body
  });

  it("MultiPolygon: a point in either island counts", () => {
    const feature: GeoFeature = {
      type: "Feature",
      properties: { name: "Archipelago" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
          [
            [
              [20, 20],
              [22, 20],
              [22, 22],
              [20, 22],
              [20, 20],
            ],
          ],
        ],
      },
    };
    expect(isPointInFeature(feature, 1, 1)).toBe(true);
    expect(isPointInFeature(feature, 21, 21)).toBe(true);
    expect(isPointInFeature(feature, 11, 11)).toBe(false);
  });

  it("handles a polygon that crosses the antimeridian", () => {
    // A ring that hops straight across the 180/-180 seam, like Russia's does:
    // vertices run 170 -> 180 -> (jump to) -180 -> -170, tracing a short step
    // across the dateline rather than the long way around the globe.
    const feature: GeoFeature = {
      type: "Feature",
      properties: { name: "Dateline-crosser" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [170, -10],
            [180, -10],
            [-180, -10],
            [-170, -10],
            [-170, 10],
            [-180, 10],
            [180, 10],
            [170, 10],
            [170, -10],
          ],
        ],
      },
    };
    expect(isPointInFeature(feature, 0, 180)).toBe(true);
    expect(isPointInFeature(feature, 0, -175)).toBe(true);
    expect(isPointInFeature(feature, 0, 175)).toBe(true);
    expect(isPointInFeature(feature, 0, 160)).toBe(false);
  });
});

describe("countryContainsPoint (synthetic shapes)", () => {
  const target = square("Smallia", 0, 1, 0, 1); // ~111km x 111km near the equator
  const neighbor = square("Bigland", 1, 10, 0, 10);
  const geo = collection([target, neighbor]);

  it("hits dead center", () => {
    expect(countryContainsPoint(geo, "Smallia", 0.5, 0.5).hit).toBe(true);
  });

  it("hits anywhere inside the shape, not just near the center point", () => {
    expect(countryContainsPoint(geo, "Smallia", 0.05, 0.95).hit).toBe(true);
  });

  it("applies a small tolerance buffer just outside the border", () => {
    // ~0.05 degrees past the edge, away from the neighbor, is a few km outside.
    const result = countryContainsPoint(geo, "Smallia", -0.05, 0.5, 15);
    expect(result.hit).toBe(true);
  });

  it("does not extend the tolerance buffer far outside the border", () => {
    const result = countryContainsPoint(geo, "Smallia", -5, 0.5, 15);
    expect(result.hit).toBe(false);
  });

  it("never steals a tap that actually landed inside a neighboring country", () => {
    // This point is inside Bigland, right next to the Smallia border.
    const result = countryContainsPoint(geo, "Smallia", 0.5, 1.001, 15);
    expect(result.hit).toBe(false);
  });

  it("reports hasGeometry:false for a country with no bundled polygon", () => {
    const result = countryContainsPoint(geo, "Nowhereland", 0, 0);
    expect(result.hit).toBe(false);
    expect(result.hasGeometry).toBe(false);
  });
});

describe("findCountryFeature", () => {
  it("resolves aliased names (e.g. United States -> United States of America)", () => {
    const feature = findCountryFeature(realGeo, "United States");
    expect(feature?.properties.name).toBe("United States of America");
  });

  it("returns null for countries missing from the bundled dataset", () => {
    expect(findCountryFeature(realGeo, "Liechtenstein")).toBeNull();
  });
});

describe("countryContainsPoint against the real bundled borders", () => {
  it("scores a tap inside mainland France as a hit, even though France is a MultiPolygon", () => {
    expect(countryContainsPoint(realGeo, "France", 48.85, 2.35).hit).toBe(true);
  });

  it("scores a tap on Hokkaido as Japan, the same as a tap on Honshu (separate islands of one MultiPolygon)", () => {
    expect(countryContainsPoint(realGeo, "Japan", 35.7, 139.7).hit).toBe(true); // Honshu (Tokyo)
    expect(countryContainsPoint(realGeo, "Japan", 43.06, 141.35).hit).toBe(true); // Hokkaido (Sapporo)
  });

  it("excludes Lesotho from a tap inside South Africa's borders (hole)", () => {
    expect(countryContainsPoint(realGeo, "South Africa", -25.7, 28.2).hit).toBe(true); // Pretoria
    expect(countryContainsPoint(realGeo, "South Africa", -29.31, 27.48).hit).toBe(false); // Maseru, Lesotho
  });

  it("handles Russia's antimeridian-crossing Chukotka peninsula", () => {
    expect(countryContainsPoint(realGeo, "Russia", 66, 179.5).hit).toBe(true);
    expect(countryContainsPoint(realGeo, "Russia", 66, -178.5).hit).toBe(true);
  });

  it("gives small-country tap tolerance without reaching across to open ocean", () => {
    const justOutside = countryContainsPoint(realGeo, "Jamaica", 18.47, -76.85); // ~9km from the coast
    expect(justOutside.hit).toBe(true);
    const farOutside = countryContainsPoint(realGeo, "Jamaica", 19.45, -76.85); // ~117km out
    expect(farOutside.hit).toBe(false);
  });

  it("falls back gracefully for a country absent from the bundled dataset", () => {
    const result = countryContainsPoint(realGeo, "Liechtenstein", 47.14, 9.55);
    expect(result.hit).toBe(false);
    expect(result.hasGeometry).toBe(false);
  });
});
