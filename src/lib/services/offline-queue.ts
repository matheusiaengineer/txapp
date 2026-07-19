"use client";

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  body?: any;
  timestamp: number;
}

const QUEUE_KEY = "txd-offline-queue";

export const offlineQueue = {
  add(request: Omit<QueuedRequest, "id" | "timestamp">) {
    const queue = this.getAll();
    queue.push({ ...request, id: crypto.randomUUID(), timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getAll(): QueuedRequest[] {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch { return []; }
  },

  remove(id: string) {
    const queue = this.getAll().filter(r => r.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async processAll() {
    const queue = this.getAll();
    for (const req of queue) {
      try {
        const res = await fetch(req.endpoint, {
          method: req.method,
          headers: { "Content-Type": "application/json" },
          body: req.body ? JSON.stringify(req.body) : undefined,
        });
        if (res.ok) this.remove(req.id);
        // If still fails, keep in queue for next retry
      } catch {
        // Keep in queue
      }
    }
  },

  clear() {
    localStorage.removeItem(QUEUE_KEY);
  },

  get length(): number {
    return this.getAll().length;
  },
};

// Setup global online/offline listeners
export function setupOfflineDetection() {
  if (typeof window === "undefined") return;

  window.addEventListener("offline", () => {
    document.body.dataset.online = "false";
    import("@/lib/store/ui-store").then(({ useUIStore }) => {
      useUIStore.getState().setOnline(false);
    });
  });

  window.addEventListener("online", async () => {
    document.body.dataset.online = "true";
    const { useUIStore } = await import("@/lib/store/ui-store");
    useUIStore.getState().setOnline(true);
    await offlineQueue.processAll();
  });
}
