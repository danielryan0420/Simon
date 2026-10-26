import { describe, expect, it } from "vitest";
import { greatCircleDistanceKm, latLonToVector3, vector3ToLatLon } from "../src/game/geo";

describe("greatCircleDistanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(greatCircleDistanceKm({ lat: 10, lon: 20 }, { lat: 10, lon: 20 })).toBeCloseTo(0, 5);
  });

  it("matches a known distance (London to Paris, ~344 km)", () => {
    const london = { lat: 51.5074, lon: -0.1278 };
    const paris = { lat: 48.8566, lon: 2.3522 };
    const d = greatCircleDistanceKm(london, paris);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(360);
  });

  it("antipodal points are ~half the Earth's circumference", () => {
    const d = greatCircleDistanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 });
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20040);
  });

  it("is symmetric", () => {
    const a = { lat: 12.3, lon: 45.6 };
    const b = { lat: -10, lon: 90 };
    expect(greatCircleDistanceKm(a, b)).toBeCloseTo(greatCircleDistanceKm(b, a), 6);
  });
});

describe("latLonToVector3 / vector3ToLatLon round-trip", () => {
  const cases = [
    { lat: 0, lon: 0 },
    { lat: 90, lon: 0 },
    { lat: -90, lon: 0 },
    { lat: 45, lon: 90 },
    { lat: -33.9, lon: 151.2 },
    { lat: 12.3, lon: -179.9 },
  ];

  for (const c of cases) {
    it(`round-trips lat=${c.lat}, lon=${c.lon}`, () => {
      const [x, y, z] = latLonToVector3(c.lat, c.lon, 1);
      const back = vector3ToLatLon(x, y, z);
      expect(back.lat).toBeCloseTo(c.lat, 3);
      // Longitude is meaningless at the poles; skip it there.
      if (Math.abs(c.lat) < 89.9) {
        const lonDiff = Math.abs(((back.lon - c.lon + 540) % 360) - 180);
        expect(lonDiff).toBeLessThan(0.01);
      }
    });
  }
});
