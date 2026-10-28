import * as THREE from "three";
import { loadWorldGeo, loadStatesGeo } from "../data/worldGeo";
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

/**
 * Builds a single merged LineSegments mesh of every US state / Canadian
 * province border, at `radius` (just above the country-border radius so it
 * never z-fights with it). Thinner/dimmer than country borders (lower
 * opacity — WebGL line width itself is not reliably adjustable across
 * platforms) but uses the same additive blending so it stays visible on both
 * the day and night side of the globe.
 */
export async function buildStateBorderLines(radius: number): Promise<THREE.LineSegments> {
  const geo = await loadStatesGeo();
  const segments = buildBorderSegments(geo, radius);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(segments, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xaef2ff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.LineSegments(geometry, material);
}
