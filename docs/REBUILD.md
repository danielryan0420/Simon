# REBUILD.md — architecture notes

## Stack

Vite + TypeScript + three.js. No UI framework — screens are built with a tiny
`el()` DOM helper (`src/ui/dom.ts`) and swapped by a single `GeoRacerApp`
controller class (`src/main.ts`). No runtime network calls; all data/assets
are bundled.

## Layering

```
src/data/        raw content (countries, landmarks, US states) — plain data, no logic
src/game/         pure TS: geo math, scoring, question selection, daily seed,
                  progression/XP, sound synthesis, localStorage persistence
src/render/       three.js: globe mesh, atmosphere shader, starfield, camera
                  fly-to, projectile/trail, confetti, themes, skins, learned map
src/ui/           DOM helper + (future) component extraction point
src/main.ts       app controller: screen state machine, wires game + render
```

`src/game/*` has zero dependency on `three` or the DOM (storage.ts and
sfx.ts touch `localStorage`/`AudioContext` but have no three.js imports), so
it's fully covered by `vitest` without a browser. `src/render/*` and
`src/main.ts` are the "glue" layer and are verified manually (see
USER_GUIDE / manual test steps below) rather than unit tested, since they're
mostly WebGL/DOM orchestration.

## Key modules

- `game/geo.ts` — haversine great-circle distance; lat/lon ⇄ unit-sphere
  vector conversion (shared between gameplay scoring and 3D placement).
- `game/scoring.ts` — distance → rating (perfect/great/good/ok/miss) →
  points, with time bonus, difficulty multiplier, and combo multiplier.
- `game/rng.ts` — mulberry32 PRNG + string→seed hashing, so the **Daily
  Challenge** is identical for every player on a given UTC date
  (`game/daily.ts`) while normal rounds use a fresh seed each time.
- `game/questions.ts` — filters a mode's target pool by difficulty/region and
  shuffles a non-repeating round queue.
- `game/progression.ts` — XP curve, level lookup, and the unlockable
  skins/themes table.
- `game/storage.ts` — single localStorage blob (`geo-racer:save:v1`) holding
  XP, learned-target ids, leaderboard, selected skin/theme, daily-challenge
  lock, best streak.
- `render/globe.ts` — owns the three.js scene/camera/renderer, `OrbitControls`
  (drag-to-orbit, pinch-to-zoom, no pan), pointer tap-vs-drag detection
  (raycasts the globe on short/low-movement pointer-up events), pin drop,
  camera `flyTo` (manual vector slerp since `THREE.Vector3` has no built-in
  slerp), and mobile-lighter settings (fewer segments, no normal map, no AA,
  capped `devicePixelRatio` at 2).
- `render/learnedMap.ts` — draws a flat equirectangular canvas map from the
  bundled Natural Earth GeoJSON, shading countries whose `countries`/
  `capitals` targets have been mastered (rating perfect/great).

## Data provenance

`public/data/countries.geojson` was generated once from the `world-atlas`
npm package's `countries-110m.json` (Natural Earth, public domain) via
`topojson-client`, then slimmed (name + geometry only, rounded coordinates)
and committed as a static asset — the conversion script itself is not part
of the repo; see `CREDITS.md` for full provenance of every bundled asset.

## Known trade-offs / follow-ups

- Sounds are synthesized via Web Audio oscillators/noise (`game/sfx.ts`)
  rather than bundled audio files — zero licensing risk, zero extra weight,
  but less rich than sampled SFX. Swapping in CC0 audio files later just
  means adding files to `public/sounds/` and pointing `sfx.ts` at them.
- `src/main.ts` is a single large controller rather than split into
  per-screen modules; fine at this size, but worth splitting if more modes
  are added.
- The JS bundle is ~560 KB (~145 KB gzip), mostly three.js — acceptable for
  a 3D game but could be trimmed further with manual chunking if needed.
