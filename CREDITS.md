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

## Gameplay data (`src/data/*.ts`)

- Country/capital/landmark/US-state names, approximate lat/lon coordinates,
  regions, and fun facts were hand-authored for this project from general
  public knowledge (geographic coordinates, capital cities, well-known
  landmark locations). No scraped or copyrighted database was used.

## App icons (`public/icons/`)

- Original vector artwork (rocket + globe), created for this project and
  rasterized locally. No external icon assets used. Released under the same
  license as this repository.

## Sound effects

- All sound effects are synthesized at runtime with the Web Audio API
  (oscillators/noise + envelopes) in `src/game/sfx.ts` — no audio files are
  bundled, so there is nothing third-party to credit, and there is zero
  network dependency for audio.

## Fonts

- UI uses the system font stack (`-apple-system, Segoe UI, Roboto, sans-serif`)
  — no bundled font files, no Google Fonts network requests.

## Code

- Built with [three.js](https://threejs.org/) (MIT), [Vite](https://vitejs.dev/)
  (MIT), [TypeScript](https://www.typescriptlang.org/) (Apache-2.0), and
  [Vitest](https://vitest.dev/) (MIT).
