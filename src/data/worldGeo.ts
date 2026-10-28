/** Shared loader for the bundled Natural Earth country-boundary GeoJSON (see CREDITS.md). */

export interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
}

export interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

let cached: Promise<GeoCollection> | null = null;

export function loadWorldGeo(): Promise<GeoCollection> {
  if (!cached) {
    const base = import.meta.env.BASE_URL;
    cached = fetch(`${base}data/countries.geojson`).then((res) => res.json());
  }
  return cached;
}

/** Bundled US state + Canadian province boundaries (see CREDITS.md). */
let cachedStatesGeo: Promise<GeoCollection> | null = null;

export function loadStatesGeo(): Promise<GeoCollection> {
  if (!cachedStatesGeo) {
    const base = import.meta.env.BASE_URL;
    cachedStatesGeo = fetch(`${base}data/us_ca_states.geojson`).then((res) => res.json());
  }
  return cachedStatesGeo;
}
