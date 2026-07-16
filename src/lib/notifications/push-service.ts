export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    if (!isPushSupported()) return null;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const publicKey = await fetchPushPublicKey();
    if (!publicKey) return null;

    const keyBuffer = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBuffer.buffer as ArrayBuffer,
    });

    await saveSubscription(subscription);
    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    await subscription.unsubscribe();
    return true;
  } catch { return false; }
}

async function fetchPushPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    return data.vapidPublicKey || null;
  } catch { return null; }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
  } catch {}
}

export async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    (registration as any).showNotification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      ...options,
    });
  } catch {
    new Notification(title, options);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
