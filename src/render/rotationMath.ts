/**
 * Pure, frame-rate-independent math for globe rotation. Kept free of three.js/DOM
 * so it can be unit tested directly. Everything here takes elapsed real time
 * (seconds) rather than relying on "one call == one 60Hz frame", which is the
 * assumption that made the globe spin ~2x too fast on 120Hz (ProMotion) displays.
 */

const TAU = Math.PI * 2;

/**
 * Time-based auto-rotate step, in radians, for one frame.
 * `autoRotateSpeed` matches three.js OrbitControls' convention: the number of
 * degrees-equivalent such that speed=2 completes an orbit in ~30s at 60fps.
 */
export function autoRotateStepRad(autoRotateSpeed: number, deltaSeconds: number): number {
  return (TAU / 60) * autoRotateSpeed * deltaSeconds;
}

/**
 * Three.js OrbitControls' exponential damping (`theta += delta * dampingFactor`,
 * repeated once per call) converges in fewer *frames* than real time depends on
 * fps, so the same flick settles faster in real time on a 120Hz screen than a
 * 60Hz one. This recomputes an effective per-frame factor so the decay curve
 * (and thus the "spin down" duration) matches real elapsed time regardless of
 * how many frames occur per second.
 */
export function timeNormalizedDampingFactor(
  baseDampingFactor: number,
  deltaSeconds: number,
  referenceFrameSeconds = 1 / 60
): number {
  if (deltaSeconds <= 0) return 0;
  const ratio = deltaSeconds / referenceFrameSeconds;
  return 1 - Math.pow(1 - baseDampingFactor, ratio);
}

/** Clamps an angular step so the implied angular velocity never exceeds the given max (rad/s). */
export function clampAngularStep(
  deltaAngleRad: number,
  deltaSeconds: number,
  maxAngularVelocityRadPerSec: number
): number {
  if (deltaSeconds <= 0) return 0;
  const maxStep = maxAngularVelocityRadPerSec * deltaSeconds;
  return Math.max(-maxStep, Math.min(maxStep, deltaAngleRad));
}

/**
 * Scales drag-rotate sensitivity by zoom level so the point under the finger
 * tracks the finger consistently at any zoom. Physically, screen displacement
 * from a given rotation scales with 1/(distance - radius), so sensitivity must
 * scale the opposite way (proportional to distance - radius) to compensate.
 */
export function zoomScaledRotateSpeed(
  baseRotateSpeed: number,
  distance: number,
  globeRadius: number,
  referenceDistance: number,
  minSpeed: number,
  maxSpeed: number
): number {
  const scale = (distance - globeRadius) / (referenceDistance - globeRadius);
  const speed = baseRotateSpeed * scale;
  return Math.max(minSpeed, Math.min(maxSpeed, speed));
}

/**
 * Fly-to duration driven by a fixed angular speed, so a long trip across the
 * globe doesn't whip around just to fit the same duration as a short hop.
 * Clamped so very short/long trips stay within a sane animation length.
 */
export function flyToDurationMs(
  angularDistanceRad: number,
  angularSpeedRadPerSec: number,
  minDurationMs: number,
  maxDurationMs: number
): number {
  const ms = (Math.abs(angularDistanceRad) / angularSpeedRadPerSec) * 1000;
  return Math.max(minDurationMs, Math.min(maxDurationMs, ms));
}

/** Angle (radians, 0..PI) between two unit vectors given as plain tuples. */
export function angleBetweenUnitVectors(a: [number, number, number], b: [number, number, number]): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}
