export const EARTH_RADIUS_KM = 6371;

export interface LatLon {
  lat: number;
  lon: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle (haversine) distance between two lat/lon points, in km. */
export function greatCircleDistanceKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

/** Convert lat/lon (degrees) to a unit vector on the sphere, Three.js Y-up convention. */
export function latLonToVector3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = toRad(90 - lat);
  const theta = toRad(lon + 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/** Inverse of latLonToVector3: unit vector -> lat/lon degrees. */
export function vector3ToLatLon(x: number, y: number, z: number): LatLon {
  const radius = Math.sqrt(x * x + y * y + z * z) || 1;
  const phi = Math.acos(Math.max(-1, Math.min(1, y / radius)));
  let theta = Math.atan2(z, -x);
  if (theta < 0) theta += 2 * Math.PI;
  const lat = 90 - (phi * 180) / Math.PI;
  let lon = (theta * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}
