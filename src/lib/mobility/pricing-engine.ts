import { globalConfig } from "@/lib/config/global-config";
import { SERVICE_CATEGORIES } from "./service-categories";

export interface PriceEstimate {
  categoryId: string;
  categoryName: string;
  estimatedFare: number;
  minFare: number;
  maxFare: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  nightMultiplier: number;
  totalFare: number;
  commission: number;
  driverEarnings: number;
  etaMinutes: number;
  distanceKm: number;
  durationMin: number;
}

export class PricingEngine {
  async estimatePrice(
    category: typeof SERVICE_CATEGORIES[0],
    distanceKm: number,
    durationMin: number,
    surgeMultiplier = 1,
    currency = "BRL",
    cityId?: string,
    isNight = false,
    demandLevel = 0,
  ): Promise<PriceEstimate> {
    if (cityId) {
      try {
        const result = globalConfig.calculateTripPrice(cityId, category.id, distanceKm, durationMin, demandLevel, isNight);
        return {
          categoryId: category.id,
          categoryName: category.namePt,
          estimatedFare: result.total,
          minFare: result.total * 0.95,
          maxFare: result.total * 1.05,
          baseFare: result.baseFare,
          distanceFare: result.distanceFare,
          timeFare: result.timeFare,
          surgeMultiplier: result.surgeMultiplier,
          nightMultiplier: result.nightMultiplier,
          totalFare: result.total,
          commission: result.commission,
          driverEarnings: result.driverEarnings,
          etaMinutes: durationMin,
          distanceKm, durationMin,
        };
      } catch {
      }
    }

    const distanceFare = distanceKm * category.pricePerKm;
    const timeFare = durationMin * category.pricePerMin;
    const surge = category.surgeMultiplier ? surgeMultiplier : 1;
    const totalBeforeSurge = category.baseFare + distanceFare + timeFare;
    const total = totalBeforeSurge * surge;
    const finalFare = Math.max(total, category.minFare);

    return {
      categoryId: category.id,
      categoryName: category.namePt,
      estimatedFare: finalFare,
      minFare: finalFare * 0.9,
      maxFare: finalFare * 1.1,
      baseFare: category.baseFare,
      distanceFare, timeFare,
      surgeMultiplier: surge,
      nightMultiplier: 1,
      totalFare: finalFare,
      commission: finalFare * 0.25,
      driverEarnings: finalFare * 0.75,
      etaMinutes: durationMin,
      distanceKm, durationMin,
    };
  }

  async estimateAllCategories(distKm: number, durMin: number, surge = 1, currency = "BRL", cityId?: string): Promise<PriceEstimate[]> {
    const estimates = await Promise.all(
      SERVICE_CATEGORIES.filter(c => c.type === "passenger").map(c =>
        this.estimatePrice(c, distKm, durMin, surge, currency, cityId)
      )
    );
    return estimates.sort((a, b) => a.totalFare - b.totalFare);
  }

  calculateSurgeMultiplier(demandLevel: "low" | "medium" | "high" | "very_high"): number {
    const multipliers = { low: 1, medium: 1.2, high: 1.5, very_high: 2.0 };
    return multipliers[demandLevel];
  }
}

export const pricingEngine = new PricingEngine();
