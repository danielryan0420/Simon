# Credits & Licenses

GEO RACER ships with zero third-party runtime network calls and bundles only
free, openly licensed assets. All sources are listed below.

## Earth textures (`public/textures/`)

- `earth_atmos_2048.jpg` — color map (NASA Visible Earth / Blue Marble imagery)
- `earth_normal_2048.jpg` — normal/bump map
- `earth_specular_2048.jpg` — ocean specular/roughness map
- `earth_clouds_1024.png` — cloud layer

Source: official three.js project examples
(`https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets`),
derived from NASA Visible Earth / Blue Marble datasets. NASA imagery is public
domain (17 USC § 105); the three.js repository itself is MIT licensed. No
modifications beyond resizing were made upstream; files are used unmodified.

## Country boundaries (`public/data/countries.geojson`)

- Derived from Natural Earth 1:110m Admin-0 Countries dataset, redistributed
  via the `world-atlas` npm package (`countries-110m.json`,
  ISC license, https://github.com/topojson/world-atlas).
- Natural Earth data is explicitly released into the public domain by its
  authors (naturalearthdata.com — "No permission is needed to use Natural
  Earth. Give us credit where you can.").
- The repo's raw TopoJSON was converted to a slimmed GeoJSON at build time
  with `topojson-client` (ISC) and coordinates rounded for size; the
  conversion script was used once and is not part of the shipped bundle.

## US state & Canadian province boundaries (`public/data/us_ca_states.geojson`)

- Derived from the Natural Earth 1:50m Admin-1 States and Provinces dataset
  (`ne_50m_admin_1_states_provinces`, naturalearthdata.com), filtered to the
  United States (50 states + DC) and Canada (13 provinces/territories).
- Natural Earth data is public domain ("No permission is needed to use
  Natural Earth. Give us credit where you can.").
- Simplified with `mapshaper` (Douglas-Peucker, keeping ~30% of vertices,
  `-clean` to repair resulting self-intersections) and rounded to 4 decimal
  places to keep the bundled file under 160KB while preserving the small
  states (RI, DE, CT, NJ, DC) well enough for point-in-shape scoring.

## Gameplay data (`src/data/*.ts`)

- Country/capital/landmark/US-state names, approximate lat/lon coordinates,
  regions, and fun facts were hand-authored for this project from general
  public knowledge (geographic coordinates, capital cities, well-known
  landmark locations). No scraped or copyrighted database was used.

## App icons (`public/icons/`)

- Original vector artwork (rocket + globe), created for this project and
  rasterized locally. No external icon assets used. Released under the same
  license as this repository.

## Flags (Flags mode, `src/assets/flags/*.svg`)

- Flag artwork is bundled from the [`flag-icons`](https://github.com/lipis/flag-icons)
  npm package (v7.6.0), MIT licensed — see `src/assets/flags/LICENSE` for the
  full text. SVGs are copied locally at `src/assets/flags/<country-id>.svg`
  and inlined into the app bundle at build time (`src/data/flags.ts`), so
  there is no hotlinking and no network dependency; the PWA works fully
  offline. Each file keeps its true aspect ratio (e.g. Switzerland is square;
  Nepal is non-rectangular), so nothing is stretched to a fixed box.

## Sound effects & music

- All sound effects (`src/game/sfx.ts`) and the optional background music
  (`src/game/music.ts`, toggleable in-game) are synthesized at runtime with
  the Web Audio API (oscillators/noise + envelopes) — no audio files are
  bundled, so there is nothing third-party to credit, and there is zero
  network dependency for audio. This also sidesteps any CC0/attribution
  licensing concerns entirely, since no third-party audio asset is shipped.

## Fonts

- UI uses the system font stack (`-apple-system, Segoe UI, Roboto, sans-serif`)
  — no bundled font files, no Google Fonts network requests.

## Code

- Built with [three.js](https://threejs.org/) (MIT), [Vite](https://vitejs.dev/)
  (MIT), [TypeScript](https://www.typescriptlang.org/) (Apache-2.0), and
  [Vitest](https://vitest.dev/) (MIT).
