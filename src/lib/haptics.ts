export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "medium") {
  if (typeof window === "undefined" || !navigator.vibrate) {
    return; // Fallback para devices não suportados (ex: iOS web)
  }

  switch (type) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(30);
      break;
    case "heavy":
      navigator.vibrate(50);
      break;
    case "success":
      navigator.vibrate([10, 30, 20]);
      break;
    case "warning":
      navigator.vibrate([30, 50, 30]);
      break;
    case "error":
      navigator.vibrate([50, 100, 50, 100, 50]);
      break;
  }
}
