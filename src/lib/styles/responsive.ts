/* Responsive utility helpers */

import { breakpoints } from "./theme";

export function up(breakpoint: keyof typeof breakpoints): string {
  return `(min-width: ${breakpoints[breakpoint]})`;
}

export function down(breakpoint: keyof typeof breakpoints): string {
  const bp = parseInt(breakpoints[breakpoint]);
  return `(max-width: ${bp - 1}px)`;
}

export function between(min: keyof typeof breakpoints, max: keyof typeof breakpoints): string {
  return `(min-width: ${breakpoints[min]}) and (max-width: ${parseInt(breakpoints[max]) - 1}px)`;
}

export function containerClass(size: "sm" | "md" | "lg" | "xl" = "xl"): string {
  const widths = { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" };
  return `w-full mx-auto px-4 sm:px-6`; // container handled by max-w-*
}

export function gridCols(mobile: number, tablet?: number, desktop?: number): string {
  const parts = [`grid-cols-${mobile}`];
  if (tablet) parts.push(`md:grid-cols-${tablet}`);
  if (desktop) parts.push(`lg:grid-cols-${desktop}`);
  return parts.join(" ");
}

export const responsivePadding = "px-4 sm:px-6 lg:px-8";
export const responsiveSection = "py-12 md:py-16 lg:py-24";
