/**
 * Point-in-polygon scoring for US States mode: a tap anywhere inside a
 * state's real borders counts the same as tapping dead center, mirroring
 * countryHitTest.ts. Pure (no three.js/DOM) so it can run against the
 * bundled GeoJSON in tests.
 */
import type { GeoCollection, GeoFeature } from "../data/worldGeo";
import { featureContainsPoint, type FeatureHitTest } from "./geoHitTest";

/**
 * How close (km) a tap may land outside a state's polygon and still count.
 * Several US states (RI, DE, CT, NJ, DC) are small enough that a plain
 * dead-center-only tap would be nearly impossible on a phone.
 */
export const STATE_TAP_TOLERANCE_KM = 15;

export function findStateFeature(geo: GeoCollection, stateName: string): GeoFeature | null {
  return geo.features.find((f) => f.properties.name === stateName) ?? null;
}

export type StateHitTest = FeatureHitTest;

/**
 * Tests whether a tap at (lat, lon) counts as landing on `stateName`. Falls
 * back to a small tolerance buffer near the border, but only if the tap
 * didn't land inside a *different* state's own polygon.
 */
export function stateContainsPoint(
  geo: GeoCollection,
  stateName: string,
  lat: number,
  lon: number,
  toleranceKm = STATE_TAP_TOLERANCE_KM
): StateHitTest {
  return featureContainsPoint(geo, findStateFeature(geo, stateName), lat, lon, toleranceKm);
}
