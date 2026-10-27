import * as THREE from "three";
import { loadWorldGeo } from "../data/worldGeo";
import { buildBorderSegments } from "./borderGeo";

/** Builds a single merged LineSegments mesh of every country border, at `radius` (slightly above globe surface). */
export async function buildBorderLines(radius: number): Promise<THREE.LineSegments> {
  const geo = await loadWorldGeo();
  const segments = buildBorderSegments(geo, radius);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(segments, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xaef2ff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.LineSegments(geometry, material);
}
