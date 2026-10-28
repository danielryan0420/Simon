/**
 * Point-in-polygon scoring for "pick the whole country" targets: a tap anywhere
 * inside a country's real borders (including islands/multipolygons and holes
 * like Lesotho-in-South-Africa) should count the same as tapping dead center.
 * Pure (no three.js/DOM) so it can run against the bundled GeoJSON in tests.
 */
import type { GeoCollection, GeoFeature } from "../data/worldGeo";
import { NATURAL_EARTH_NAME_ALIASES } from "../data/countryNameAliases";
import { featureContainsPoint, isPointInFeature, type FeatureHitTest } from "./geoHitTest";

export { isPointInFeature };

/**
 * How close (km) a tap may land outside a country's polygon and still count,
 * so small countries stay tappable on phones. Small enough to not reach across
 * a shared border into a neighbor's own buffer zone.
 */
export const COUNTRY_TAP_TOLERANCE_KM = 15;

export function findCountryFeature(geo: GeoCollection, countryName: string): GeoFeature | null {
  const naturalEarthName = NATURAL_EARTH_NAME_ALIASES[countryName] ?? countryName;
  return geo.features.find((f) => f.properties.name === naturalEarthName) ?? null;
}

export type CountryHitTest = FeatureHitTest;

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
  return featureContainsPoint(geo, findCountryFeature(geo, countryName), lat, lon, toleranceKm);
}
