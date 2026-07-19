"use client";

import { api } from "@/lib/services/api-service";

export class GeofencingService {
  private coverageCache: Map<string, boolean> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 60000; // 1 min

  /**
   * Check if a point is within coverage area.
   * Uses backend RPC function is_point_in_coverage.
   */
  async isInCoverage(lat: number, lng: number): Promise<boolean> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    // Check cache
    const cached = this.coverageCache.get(cacheKey);
    if (cached !== undefined && Date.now() - this.lastFetch < this.CACHE_TTL) {
      return cached;
    }

    try {
      const res = await api.get<{ in_coverage: boolean }>(
        `/api/location/coverage?lat=${lat}&lng=${lng}`
      );
      const result = res.data?.in_coverage ?? true;
      this.coverageCache.set(cacheKey, result);
      this.lastFetch = Date.now();
      return result;
    } catch {
      return true; // Fallback: allow if can't check
    }
  }

  /**
   * Get nearest coverage area info
   */
  async getNearestCoverageCity(lat: number, lng: number): Promise<string | null> {
    try {
      const res = await api.get<{ city: string }>(
        `/api/location/coverage/nearest?lat=${lat}&lng=${lng}`
      );
      return res.data?.city || null;
    } catch {
      return null;
    }
  }

  clearCache(): void {
    this.coverageCache.clear();
  }
}

export const geofencing = new GeofencingService();
