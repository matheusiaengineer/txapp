const CACHE_NAME = "txd-v1";
const urlsToCache = [
  "/",
  "/auth/login",
  "/auth/register",
  "/dashboard/passenger",
  "/dashboard/driver",
  "/chat",
  "/ride",
  "/freight",
  "/payment",
  "/notifications",
  "/settings",
  "/community",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "offline", message: "Você está offline. Algumas funcionalidade podem não estar disponíveis." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "TXD", body: "Nova notificação" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      badge: "/badge.png",
      vibrate: [200, 100, 200],
      data: data.data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
