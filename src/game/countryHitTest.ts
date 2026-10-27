/**
 * Point-in-polygon scoring for "pick the whole country" targets: a tap anywhere
 * inside a country's real borders (including islands/multipolygons and holes
 * like Lesotho-in-South-Africa) should count the same as tapping dead center.
 * Pure (no three.js/DOM) so it can run against the bundled GeoJSON in tests.
 */
import type { GeoCollection, GeoFeature } from "../data/worldGeo";
import { NATURAL_EARTH_NAME_ALIASES } from "../data/countryNameAliases";

/**
 * How close (km) a tap may land outside a country's polygon and still count,
 * so small countries stay tappable on phones. Small enough to not reach across
 * a shared border into a neighbor's own buffer zone.
 */
export const COUNTRY_TAP_TOLERANCE_KM = 15;

/** Shifts `lon` by a multiple of 360° so it lands within 180° of `referenceLon`. */
function unwrapLongitude(lon: number, referenceLon: number): number {
  const delta = (((lon - referenceLon + 180) % 360) + 360) % 360 - 180;
  return referenceLon + delta;
}

/**
 * Unwraps a ring's longitudes relative to *each other* (chained from the first
 * vertex), not relative to the query point. This keeps a ring crossing the
 * antimeridian (e.g. Russia's Chukotka peninsula) geometrically continuous,
 * without distorting rings that are simply far away from the query — unwrapping
 * each vertex independently against a distant query point can flip adjacent
 * vertices to opposite sides of the wrap, turning an unrelated country's ring
 * into a self-intersecting mess that spuriously "contains" far-off points.
 */
function unwrapRing(ring: number[][]): [number, number][] {
  const out: [number, number][] = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    out.push([unwrapLongitude(ring[i][0], out[i - 1][0]), ring[i][1]]);
  }
  return out;
}

/** Places `lon` on the same unwrapped "cylinder" as `ring`, near its own longitude span. */
function placeLonNearRing(lon: number, ring: [number, number][]): number {
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const [x] of ring) {
    if (x < minLon) minLon = x;
    if (x > maxLon) maxLon = x;
  }
  return unwrapLongitude(lon, (minLon + maxLon) / 2);
}

/** Ray-casting point-in-ring test, operating on an already-unwrapped ring and a matching query longitude. */
function isPointInUnwrappedRing(lat: number, lon: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function isPointInRing(lat: number, lon: number, ring: number[][]): boolean {
  const unwrapped = unwrapRing(ring);
  return isPointInUnwrappedRing(lat, placeLonNearRing(lon, unwrapped), unwrapped);
}

/** Normalizes Polygon/MultiPolygon coordinates to a list of polygons, each [exterior, ...holes]. */
function polygonsOf(geometry: GeoFeature["geometry"]): number[][][][] {
  return geometry.type === "Polygon"
    ? [geometry.coordinates as number[][][]]
    : (geometry.coordinates as number[][][][]);
}

/** A point is in a polygon if inside its exterior ring and outside every hole. */
function isPointInPolygon(lat: number, lon: number, polygon: number[][][]): boolean {
  if (!isPointInRing(lat, lon, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (isPointInRing(lat, lon, polygon[i])) return false;
  }
  return true;
}

/** True if the point is inside any polygon/island making up this feature. */
export function isPointInFeature(feature: GeoFeature, lat: number, lon: number): boolean {
  return polygonsOf(feature.geometry).some((polygon) => isPointInPolygon(lat, lon, polygon));
}

/**
 * Distance (km) from (lat, lon) to the segment (x1,y1)-(x2,y2) — both already
 * unwrapped into the same longitude frame as the query — via a local flat-earth
 * projection centered on the query point. Accurate enough for our small
 * tap-tolerance distances (tens of km); no need for exact geodesic math there.
 */
function pointToSegmentDistanceKm(qLat: number, qLon: number, x1: number, y1: number, x2: number, y2: number): number {
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos((qLat * Math.PI) / 180);
  const px1 = (x1 - qLon) * kmPerDegLon;
  const py1 = (y1 - qLat) * kmPerDegLat;
  const px2 = (x2 - qLon) * kmPerDegLon;
  const py2 = (y2 - qLat) * kmPerDegLat;
  const dx = px2 - px1;
  const dy = py2 - py1;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (-px1 * dx - py1 * dy) / lenSq));
  const px = px1 + t * dx;
  const py = py1 + t * dy;
  return Math.hypot(px, py);
}

/** Distance from a point to a feature's boundary, in km — the minimum over every ring edge, not just its vertices. */
function distanceToFeatureKm(feature: GeoFeature, lat: number, lon: number): number {
  let min = Infinity;
  for (const polygon of polygonsOf(feature.geometry)) {
    for (const ring of polygon) {
      const unwrapped = unwrapRing(ring);
      const qLon = placeLonNearRing(lon, unwrapped);
      for (let i = 0; i < unwrapped.length - 1; i++) {
        const [x1, y1] = unwrapped[i];
        const [x2, y2] = unwrapped[i + 1];
        const d = pointToSegmentDistanceKm(lat, qLon, x1, y1, x2, y2);
        if (d < min) min = d;
      }
    }
  }
  return min;
}

export function findCountryFeature(geo: GeoCollection, countryName: string): GeoFeature | null {
  const naturalEarthName = NATURAL_EARTH_NAME_ALIASES[countryName] ?? countryName;
  return geo.features.find((f) => f.properties.name === naturalEarthName) ?? null;
}

export interface CountryHitTest {
  /** True if the tap should score as landing inside the target country. */
  hit: boolean;
  /** False when the country has no bundled polygon (a few micro-states are missing from the dataset) — caller should fall back to distance scoring. */
  hasGeometry: boolean;
}

/**
 * Tests whether a tap at (lat, lon) counts as landing on `countryName`.
 * Falls back to a small tolerance buffer near the border, but only if the tap
 * didn't land inside a *different* country's own polygon (so a tap that's
 * genuinely inside a neighbor never gets stolen by the target's buffer).
 */
export function countryContainsPoint(
  geo: GeoCollection,
  countryName: string,
  lat: number,
  lon: number,
  toleranceKm = COUNTRY_TAP_TOLERANCE_KM
): CountryHitTest {
  const feature = findCountryFeature(geo, countryName);
  if (!feature) return { hit: false, hasGeometry: false };

  if (isPointInFeature(feature, lat, lon)) return { hit: true, hasGeometry: true };

  if (toleranceKm > 0) {
    const insideAnotherCountry = geo.features.some((f) => f !== feature && isPointInFeature(f, lat, lon));
    if (!insideAnotherCountry && distanceToFeatureKm(feature, lat, lon) <= toleranceKm) {
      return { hit: true, hasGeometry: true };
    }
  }

  return { hit: false, hasGeometry: true };
}
