import { describe, expect, it } from "vitest";
import {
  angleBetweenUnitVectors,
  autoRotateStepRad,
  clampAngularStep,
  flyToDurationMs,
  timeNormalizedDampingFactor,
  zoomScaledRotateSpeed,
} from "../src/render/rotationMath";

describe("autoRotateStepRad", () => {
  it("is linear in deltaSeconds (frame-rate independent)", () => {
    const speed = 0.4;
    const stepAt60fps = autoRotateStepRad(speed, 1 / 60);
    const stepAt120fps = autoRotateStepRad(speed, 1 / 120);
    // Half the elapsed time should produce exactly half the rotation.
    expect(stepAt120fps).toBeCloseTo(stepAt60fps / 2, 10);
  });

  it("two 120Hz frames add up to the same rotation as one 60Hz frame over the same real time", () => {
    const speed = 0.4;
    const oneSixtieth = autoRotateStepRad(speed, 1 / 60);
    const twoOneTwentieths = autoRotateStepRad(speed, 1 / 120) * 2;
    expect(twoOneTwentieths).toBeCloseTo(oneSixtieth, 10);
  });

  it("zero elapsed time produces zero rotation", () => {
    expect(autoRotateStepRad(0.4, 0)).toBe(0);
  });
});

describe("timeNormalizedDampingFactor", () => {
  it("returns the base factor when deltaSeconds matches the reference frame time", () => {
    const factor = timeNormalizedDampingFactor(0.08, 1 / 60, 1 / 60);
    expect(factor).toBeCloseTo(0.08, 10);
  });

  it("total momentum decay over equal real time matches regardless of frame rate", () => {
    // Simulate a flick's residual angle decaying over exactly 0.5s of real time,
    // once at 60fps and once at 120fps, and compare how much angle remains.
    const base = 0.08;
    const simulate = (fps: number, totalSeconds: number) => {
      const dt = 1 / fps;
      const frames = Math.round(totalSeconds / dt);
      let remaining = 1; // starting "pending" angle, normalized to 1
      for (let i = 0; i < frames; i++) {
        const factor = timeNormalizedDampingFactor(base, dt);
        remaining *= 1 - factor;
      }
      return remaining;
    };
    const remainingAt60 = simulate(60, 0.5);
    const remainingAt120 = simulate(120, 0.5);
    expect(remainingAt60).toBeCloseTo(remainingAt120, 3);
  });

  it("returns 0 for non-positive deltaSeconds", () => {
    expect(timeNormalizedDampingFactor(0.08, 0)).toBe(0);
    expect(timeNormalizedDampingFactor(0.08, -1)).toBe(0);
  });
});

describe("clampAngularStep", () => {
  it("passes through steps within the velocity limit", () => {
    const step = clampAngularStep(0.01, 1 / 60, 10);
    expect(step).toBeCloseTo(0.01, 10);
  });

  it("clamps a step that implies a too-high angular velocity", () => {
    const deltaSeconds = 1 / 60;
    const maxVelocity = 10;
    const hugeStep = 5; // would imply 300 rad/s, way over the cap
    const clamped = clampAngularStep(hugeStep, deltaSeconds, maxVelocity);
    expect(clamped).toBeCloseTo(maxVelocity * deltaSeconds, 10);
  });

  it("clamps symmetrically for negative steps", () => {
    const deltaSeconds = 1 / 60;
    const maxVelocity = 10;
    const clamped = clampAngularStep(-5, deltaSeconds, maxVelocity);
    expect(clamped).toBeCloseTo(-maxVelocity * deltaSeconds, 10);
  });

  it("never exceeds the max velocity across a range of frame rates", () => {
    const maxVelocity = 12;
    for (const fps of [30, 60, 90, 120, 144, 240]) {
      const dt = 1 / fps;
      const clamped = clampAngularStep(100, dt, maxVelocity);
      const impliedVelocity = Math.abs(clamped) / dt;
      expect(impliedVelocity).toBeLessThanOrEqual(maxVelocity + 1e-9);
    }
  });
});

describe("zoomScaledRotateSpeed", () => {
  const globeRadius = 1;
  const referenceDistance = 2.4;
  const minSpeed = 0.15;
  const maxSpeed = 1.2;

  it("matches the base speed at the reference distance", () => {
    const speed = zoomScaledRotateSpeed(0.5, referenceDistance, globeRadius, referenceDistance, minSpeed, maxSpeed);
    expect(speed).toBeCloseTo(0.5, 10);
  });

  it("is slower when zoomed in close to the surface", () => {
    const zoomedIn = zoomScaledRotateSpeed(0.5, 1.35, globeRadius, referenceDistance, minSpeed, maxSpeed);
    const atReference = zoomScaledRotateSpeed(0.5, referenceDistance, globeRadius, referenceDistance, minSpeed, maxSpeed);
    expect(zoomedIn).toBeLessThan(atReference);
  });

  it("is faster when zoomed out far from the surface", () => {
    const zoomedOut = zoomScaledRotateSpeed(0.5, 3.2, globeRadius, referenceDistance, minSpeed, maxSpeed);
    const atReference = zoomScaledRotateSpeed(0.5, referenceDistance, globeRadius, referenceDistance, minSpeed, maxSpeed);
    expect(zoomedOut).toBeGreaterThan(atReference);
  });

  it("clamps to the configured min/max bounds", () => {
    const extremelyClose = zoomScaledRotateSpeed(0.5, 1.001, globeRadius, referenceDistance, minSpeed, maxSpeed);
    expect(extremelyClose).toBeGreaterThanOrEqual(minSpeed);
    const extremelyFar = zoomScaledRotateSpeed(0.5, 100, globeRadius, referenceDistance, minSpeed, maxSpeed);
    expect(extremelyFar).toBeLessThanOrEqual(maxSpeed);
  });
});

describe("flyToDurationMs", () => {
  const speed = Math.PI / 1.4;
  const min = 500;
  const max = 2200;

  it("scales duration with angular distance", () => {
    const shortHop = flyToDurationMs(0.2, speed, min, max);
    const longHop = flyToDurationMs(Math.PI / 2, speed, min, max);
    expect(longHop).toBeGreaterThan(shortHop);
  });

  it("uses a fixed angular speed: duration is proportional to distance between the clamps", () => {
    const d1 = flyToDurationMs(1.5, speed, min, max);
    const d2 = flyToDurationMs(3.0, speed, min, max);
    expect(d2 / d1).toBeCloseTo(2, 2);
  });

  it("clamps very short trips to the minimum duration", () => {
    expect(flyToDurationMs(0.0001, speed, min, max)).toBe(min);
  });

  it("clamps very long trips (antipodal) to the maximum duration", () => {
    expect(flyToDurationMs(Math.PI, speed, min, max)).toBeLessThanOrEqual(max);
  });

  it("never whips: angular speed implied by duration never exceeds the fixed speed", () => {
    for (const angle of [0.05, 0.5, 1, 2, Math.PI]) {
      const ms = flyToDurationMs(angle, speed, min, max);
      const impliedSpeed = angle / (ms / 1000);
      expect(impliedSpeed).toBeLessThanOrEqual(speed + 1e-6);
    }
  });
});

describe("angleBetweenUnitVectors", () => {
  it("returns 0 for identical vectors", () => {
    expect(angleBetweenUnitVectors([1, 0, 0], [1, 0, 0])).toBeCloseTo(0, 10);
  });

  it("returns PI/2 for perpendicular vectors", () => {
    expect(angleBetweenUnitVectors([1, 0, 0], [0, 1, 0])).toBeCloseTo(Math.PI / 2, 10);
  });

  it("returns PI for opposite vectors", () => {
    expect(angleBetweenUnitVectors([1, 0, 0], [-1, 0, 0])).toBeCloseTo(Math.PI, 10);
  });
});
