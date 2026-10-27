# GEO RACER 🌍✈️

A fast, arcade-y 3D geography racing game. Spin a gorgeous rotating Earth,
tap to drop a pin on the right country, capital, landmark, or US state, and
race the clock for points, combos, and XP. Built with [three.js](https://threejs.org/),
TypeScript, and Vite — no accounts, no ads, no tracking, and no network calls
during play.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm test          # run the vitest unit-test suite
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

The app is configured with Vite `base: "/Simon/"` for GitHub Pages deploys.
Pushing to `main` runs `.github/workflows/pages.yml`, which builds and
publishes `dist/` to GitHub Pages (Pages itself must be enabled once in the
repo settings — this repo does not enable it automatically).

## How to play

1. Pick **Play**, choose a mode (Countries / Capitals / Landmarks / US
   States / Flags) and a difficulty (Rookie / Pilot / Ace / Hard — Hard adds
   tricky, lesser-known World Capitals), optionally filtering by region.
2. Read the prompt (e.g. "Fly to: Kenya"), then drag to spin the globe and
   **tap/click** the spot you think is correct.
3. A little plane flies to your pin and the game scores you on distance
   (great-circle, in km) and speed, with streak combos for back-to-back good
   answers.
4. After each answer, see a fun fact and the real location, then move to the
   next question. Finish a round to earn XP, level up, and unlock new
   plane/rocket skins and globe themes.
5. Try the **Daily Challenge** (same 10 questions for everyone, once per
   day), or pass the device for a **2-player hot-seat Race**. Check your
   **Learned Map** to see which countries you've mastered, your **Stats &
   Leaderboard** for personal bests, and **Achievements** for 25+ badges to
   unlock (all stored locally in your browser). Toggle sound effects and
   background music independently with the two buttons in the top-right
   corner.

Works offline after the first load (installable as a home-screen app on
iPhone/Android via the PWA manifest + service worker) and is mobile-first:
touch-drag to spin, pinch to zoom, tap to pin, safe-area insets for notches,
and a capped pixel ratio for smooth performance on phones.

## Project structure

- `src/data/` — hand-authored gameplay data (countries, capitals, landmarks, US states)
- `src/game/` — pure, unit-tested TypeScript: distance math, scoring, question
  picking, daily seed, progression/XP, sound synthesis, localStorage saves
- `src/render/` — three.js globe, atmosphere glow, starfield, projectile trail,
  confetti, camera fly-to, themes/skins, learned-map canvas renderer
- `src/ui/` + `src/main.ts` — screens, HUD, and the app controller
- `public/` — textures, country GeoJSON, icons, PWA manifest + service worker

See `docs/REBUILD.md` for an architecture deep-dive and `docs/USER_GUIDE.md`
for a kid-friendly how-to-play guide. See `CREDITS.md` for the full list of
asset sources and licenses — everything is free and openly licensed.
