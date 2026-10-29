const CACHE_VERSION = "geo-racer-v5";
const BASE = self.registration ? new URL(self.registration.scope).pathname : "/";

const PRECACHE_URLS = [
  `${BASE}`,
  `${BASE}manifest.json`,
  `${BASE}textures/earth_atmos_2048.jpg`,
  `${BASE}textures/earth_normal_2048.jpg`,
  `${BASE}textures/earth_specular_2048.jpg`,
  `${BASE}textures/earth_clouds_1024.png`,
  `${BASE}data/countries.geojson`,
  `${BASE}data/us_ca_states.geojson`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations (the HTML shell) go network-first so a fresh deploy's new
  // hashed JS/CSS filenames are picked up as soon as the device is online;
  // without this, "cache forever" would wedge installed PWAs on old builds.
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch (err) {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          const shell = await cache.match(BASE);
          if (shell) return shell;
          throw err;
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
});
