/* Service worker: keeps Chromedeck working offline.
   Bump CACHE on every release (match APP_VERSION in js/app.js) and add any new
   file to APP_FILES, or installed copies keep serving the old version. */
const CACHE = "chromedeck-0.9.1";
const FONTS = "chromedeck-fonts";
const IMAGES = "chromedeck-images-2";   // wiki images, cached as they're viewed (-2: drops broken copies cached by 0.9.0 and earlier)
const APP_FILES = [
  "./", "index.html", "manifest.webmanifest",
  "css/tokens.css", "css/app.css",
  "js/app.js", "js/store.js", "js/rules.js", "js/journal.js", "js/ui.js",
  "js/views/cyberware.js", "js/views/perks.js", "js/views/capacity.js", "js/views/builds.js", "js/views/system.js", "js/views/journal.js", "js/views/weapons.js", "js/views/collection.js", "js/views/collectibles.js", "js/views/overview.js", "js/views/soon.js",
  "data/index.js", "data/core.js", "data/perks.js", "data/cyberware.js", "data/missions.js", "data/weapons.js", "data/vehicles.js", "data/collectibles.js", "data/examples.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES.map(u => new Request(u, { cache: "reload" })))));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("chromedeck-") && ![CACHE, FONTS, IMAGES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // app files: cache first, so it opens instantly and offline
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).catch(() => req.mode === "navigate" ? caches.match("index.html") : Response.error())));
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(staleWhileRevalidate(FONTS, req));
  } else if (url.hostname.endsWith("nocookie.net")) {
    e.respondWith(wikiImage(req));
  }
});
async function staleWhileRevalidate(name, req) {
  const cache = await caches.open(name); const hit = await cache.match(req);
  const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") cache.put(req, r.clone()); return r; }).catch(() => hit || Response.error());
  return hit || net;
}
/* Wiki pictures: cache first. Fetched with CORS and no referrer (Fandom answers other sites'
   referrers with a "not found" placeholder), and only real pictures are kept, so a failed
   download is retried next time instead of being stored. */
async function wikiImage(req) {
  const cache = await caches.open(IMAGES); const hit = await cache.match(req.url); if (hit) return hit;
  // give up after 15 s so a weak signal shows the "unavailable" placeholder instead of hanging
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
  const r = await fetch(req.url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal: ctl.signal }).finally(() => clearTimeout(t));
  if (r.ok) cache.put(req.url, r.clone());
  return r;
}
