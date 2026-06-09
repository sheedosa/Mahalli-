// Mahalli service worker — weak-network resilience (spec §7).
//
// Strategy:
//  - Precache a tiny app shell so the dashboard can boot offline.
//  - Navigations: network-first, fall back to cache, then the offline shell.
//  - Static assets (_next/static, images, fonts): stale-while-revalidate.
//  - NEVER cache Supabase / API / auth responses (data must stay fresh and
//    tenant-correct). A future offline mutation queue (IndexedDB) will handle
//    writes during dropouts; this SW only covers reads/shell.

const VERSION = "mahalli-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = "/offline";

const SHELL_ASSETS = ["/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isBypassed(url) {
  return (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth") ||
    url.hostname.endsWith("supabase.co") ||
    url.hostname.endsWith("supabase.in")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isBypassed(url)) return; // let the network handle data/auth directly

  // App navigations: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Static assets + optimized images: stale-while-revalidate. `/_next/image`
  // (the Next image optimizer that serves resized WebP product photos) has no
  // file extension, so it's matched explicitly — this makes repeat
  // storefront/dashboard visits load images instantly.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/brand") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
