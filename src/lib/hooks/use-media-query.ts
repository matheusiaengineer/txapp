"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function usePrefersDark(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

export function usePrefersContrast(): "more" | "less" | "no-preference" {
  const more = useMediaQuery("(prefers-contrast: more)");
  const less = useMediaQuery("(prefers-contrast: less)");
  if (more) return "more";
  if (less) return "less";
  return "no-preference";
}

export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return size;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useBreakpoint(): "mobile" | "tablet" | "desktop" {
  const mobile = useIsMobile();
  const tablet = useIsTablet();
  if (mobile) return "mobile";
  if (tablet) return "tablet";
  return "desktop";
}

export function useSafeArea(): { top: number; bottom: number; left: number; right: number } {
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    const getSafeArea = () => ({
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sat")) || 0,
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sab")) || 0,
      left: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sal")) || 0,
      right: parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sar")) || 0,
    });
    setSafeArea(getSafeArea());
    const handler = () => setSafeArea(getSafeArea());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return safeArea;
}

export function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const lastCall = useRef(0);
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return fn(...args);
    }
  }, [fn, delay]) as T;
}
