const CACHE_NAME = "txd-v4";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/offline.html",
];
const API_CACHE = "txd-api-v1";
const MAP_CACHE = "txd-map-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE && k !== MAP_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.hostname === "tile.openstreetmap.org" || url.pathname.includes("/tile/")) {
    event.respondWith(mapStrategy(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/__next")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHE_NAME, "/offline.html"));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "TXDAPP", body: "" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      vibrate: [200, 100, 200],
      data: data.data || {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 408 });
  }
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function mapStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request, { mode: "cors" });
    if (response.ok) {
      const cache = await caches.open(MAP_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 204 });
  }
}