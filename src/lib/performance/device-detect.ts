"use client";

export type DeviceTier = "low" | "medium" | "high";

export interface DeviceInfo {
  tier: DeviceTier;
  isLowEnd: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  memory: number | null;
  cores: number | null;
  connectionType: string | null;
  saveData: boolean;
  reducedMotion: boolean;
  hasWebGL: boolean;
  hasWebGPU: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  batteryLow: boolean | null;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      tier: "medium", isLowEnd: false, isMobile: false, isIOS: false, isAndroid: false,
      isStandalone: false, memory: null, cores: null, connectionType: null, saveData: false,
      reducedMotion: false, hasWebGL: false, hasWebGPU: false, screenWidth: 0, screenHeight: 0,
      pixelRatio: 1, batteryLow: null,
    };
  }

  const nav = navigator;
  const mem = (nav as any).deviceMemory || null;
  const cores = nav.hardwareConcurrency || null;
  const conn = (nav as any).connection || null;
  const saveData = conn?.saveData || false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ua = nav.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const pixelRatio = window.devicePixelRatio || 1;

  let hasWebGL = false;
  try {
    const c = document.createElement("canvas");
    hasWebGL = !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {}

  let hasWebGPU = false;
  try {
    hasWebGPU = "gpu" in nav && !!(nav as any).gpu;
  } catch {}

  let tier: DeviceTier = "high";

  if (
    mem !== null && mem <= 2 ||
    cores !== null && cores <= 2 ||
    pixelRatio <= 1 ||
    reducedMotion ||
    saveData ||
    !hasWebGL ||
    (isMobile && cores !== null && cores <= 4)
  ) {
    tier = "low";
  } else if (
    mem !== null && mem <= 4 ||
    cores !== null && cores <= 4
  ) {
    tier = "medium";
  }

  return {
    tier,
    isLowEnd: tier === "low",
    isMobile,
    isIOS,
    isAndroid,
    isStandalone: standalone,
    memory: mem,
    cores,
    connectionType: conn?.effectiveType || null,
    saveData,
    reducedMotion,
    hasWebGL,
    hasWebGPU,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    pixelRatio,
    batteryLow: null,
  };
}

let cachedDevice: DeviceInfo | null = null;

export function getDeviceInfo(): DeviceInfo {
  if (!cachedDevice) {
    cachedDevice = detectDevice();
  }
  return cachedDevice;
}

export function useReducedAnimations(): boolean {
  if (typeof window === "undefined") return false;
  return getDeviceInfo().isLowEnd || getDeviceInfo().reducedMotion;
}