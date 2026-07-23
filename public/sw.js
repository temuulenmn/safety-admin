// Minimal service worker for safety-admin PWA:
//   * installable on Android + iOS
//   * NEVER caches HTML / API (avoids stale-UI + broken auth after backend deploys)
//   * only caches immutable Vite build assets (hashed filenames)
//   * skipWaiting so a new version takes effect on the next navigation
//
// We intentionally do NOT ship offline mode — the app is useless without the
// API anyway, and caching auth state offline is a security footgun.

const VERSION = 'safety-admin-v1';
const IMMUTABLE = /\/assets\/.+\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp)$/;

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Skip everything cross-origin and everything API/auth-related.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for hashed static build assets only.
  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      const fresh = await fetch(req);
      if (fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    })());
  }
  // Everything else (HTML, manifest, icon) → network, no cache.
});
