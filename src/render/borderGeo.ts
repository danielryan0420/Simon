/** Pure (three.js-free) geometry math for turning country polygons into line segments. */

import { latLonToVector3 } from "../game/geo";
import type { GeoCollection, GeoFeature } from "../data/worldGeo";

function ringsFromGeometry(geometry: GeoFeature["geometry"]): number[][][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates as number[][][];
  }
  return (geometry.coordinates as number[][][][]).flat();
}

/**
 * Flattens every country ring into (x,y,z,x,y,z) segment pairs suitable for a
 * THREE.LineSegments buffer, at the given sphere radius. GeoJSON rings are
 * already closed (first coordinate === last), so consecutive points are
 * connected without wrapping.
 */
export function buildBorderSegments(geo: GeoCollection, radius: number): Float32Array {
  const points: number[] = [];
  for (const feature of geo.features) {
    for (const ring of ringsFromGeometry(feature.geometry)) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        const a = latLonToVector3(lat1, lon1, radius);
        const b = latLonToVector3(lat2, lon2, radius);
        points.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
  }
  return new Float32Array(points);
}
