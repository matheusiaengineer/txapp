const CACHE_NAME = "txdapp-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "TXDAPP";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: "open", title: "Abrir app" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
