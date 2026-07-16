export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("[SW] Registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[SW] Nova versão disponível — recarregue para atualizar");
              }
            });
          }
        });
      } catch (error) {
        console.error("[SW] Registration failed:", error);
      }
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}

export function checkOnlineStatus(): boolean {
  return navigator.onLine;
}

export function setupOfflineDetection(onOffline: () => void, onOnline: () => void) {
  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);
  return () => {
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
  };
}

export function createOfflineQueue() {
  const queue: { action: string; data: any; timestamp: number }[] = [];

  function add(action: string, data: any) {
    queue.push({ action, data, timestamp: Date.now() });
    localStorage.setItem("txd-offline-queue", JSON.stringify(queue));
  }

  function getAll() { return [...queue]; }
  function clear() { queue.length = 0; localStorage.removeItem("txd-offline-queue"); }

  function restore() {
    const saved = localStorage.getItem("txd-offline-queue");
    if (saved) { const items = JSON.parse(saved); queue.push(...items); }
  }

  async function process(handler: (action: string, data: any) => Promise<boolean>) {
    restore();
    for (const item of queue) {
      try {
        const success = await handler(item.action, item.data);
        if (success) queue.splice(queue.indexOf(item), 1);
      } catch (e) { console.error("[Offline Queue] Failed:", item.action, e); }
    }
    localStorage.setItem("txd-offline-queue", JSON.stringify(queue));
  }

  return { add, getAll, clear, restore, process };
}

export const offlineQueue = createOfflineQueue();
