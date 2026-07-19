export interface CommissionRule {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "mixed" | "tiered" | "dynamic";
  value: number;
  fixedValue?: number;
  minValue?: number;
  maxValue?: number;
  tiers?: { min: number; max: number; percentage: number }[];
  serviceCategory?: string[];
  vehicleCategory?: string[];
  cities?: string[];
  countries?: string[];
  timeRanges?: { start: string; end: string; multiplier: number }[];
  ratingMultiplier?: boolean;
  priority: number;
  active: boolean;
}

export interface CommissionResult {
  ruleId: string;
  ruleName: string;
  baseFare: number;
  commissionAmount: number;
  driverEarnings: number;
  txdFee: number;
  taxes: number;
  totalDeductions: number;
  netEarnings: number;
  breakdown: { label: string; amount: number; type: "positive" | "negative" }[];
}

export class CommissionEngine {
  private rules: CommissionRule[] = [
    { id: "standard", name: "Comiss\u00e3o Padr\u00e3o", type: "percentage", value: 25, priority: 1, active: true },
    { id: "moto", name: "Comiss\u00e3o Moto", type: "percentage", value: 15, serviceCategory: ["moto"], priority: 2, active: true },
    { id: "black", name: "Comiss\u00e3o Black", type: "percentage", value: 30, serviceCategory: ["black"], priority: 2, active: true },
    { id: "freight", name: "Comiss\u00e3o Frete", type: "mixed", value: 10, fixedValue: 5, serviceCategory: ["freight"], priority: 2, active: true },
    { id: "peak", name: "Comiss\u00e3o Hor\u00e1rio de Pico", type: "dynamic", value: 20, timeRanges: [{ start: "07:00", end: "09:00", multiplier: 1.2 }, { start: "17:00", end: "19:00", multiplier: 1.3 }], priority: 3, active: true },
    { id: "top_rated", name: "Comiss\u00e3o Reduzida Top Rated", type: "percentage", value: 15, ratingMultiplier: true, priority: 4, active: true },
    { id: "first_ride", name: "Primeira Corrida", type: "fixed", value: 0, priority: 5, active: true },
  ];

  async calculateCommission(fare: number, category: string, city: string, driverRating?: number, isFirstRide?: boolean, hour?: string): Promise<CommissionResult> {
    const breakdown: { label: string; amount: number; type: "positive" | "negative" }[] = [];
    breakdown.push({ label: "Tarifa Base", amount: fare, type: "positive" });

    let commissionPercent = 25;
    let fixedFee = 0;

    const marketplaceCategories = ["moto", "carro", "frete", "entregas", "mudanca"];
    if (marketplaceCategories.includes(category)) {
      commissionPercent = 10;
    } else {
      for (const rule of this.rules.sort((a, b) => b.priority - a.priority)) {
        if (!rule.active) continue;
        if (rule.serviceCategory && !rule.serviceCategory.includes(category)) continue;
        if (rule.timeRanges && hour) {
          const inRange = rule.timeRanges.some(r => hour >= r.start && hour <= r.end);
          if (!inRange) continue;
        }
        if (rule.ratingMultiplier && driverRating && driverRating < 4.7) continue;
        if (isFirstRide && rule.id !== "first_ride") continue;

        if (rule.type === "percentage") commissionPercent = rule.value;
        else if (rule.type === "fixed") { commissionPercent = 0; fixedFee = rule.value; }
        else if (rule.type === "mixed") { commissionPercent = rule.value; fixedFee = rule.fixedValue || 0; }
      }
    }

    const commissionAmount = fare * (commissionPercent / 100) + fixedFee;
    const txdFee = 0;
    const taxes = fare * 0.03;
    const totalDeductions = commissionAmount + txdFee + taxes;
    const netEarnings = fare - totalDeductions;

    breakdown.push({ label: `Comiss\u00e3o TXD (${commissionPercent}%)`, amount: commissionAmount, type: "negative" });
    breakdown.push({ label: "Impostos (3%)", amount: taxes, type: "negative" });
    breakdown.push({ label: "Ganho L\u00edquido do Motorista", amount: netEarnings, type: "positive" });

    return {
      ruleId: "marketplace", ruleName: "Comiss\u00e3o Marketplace (10%)",
      baseFare: fare, commissionAmount, driverEarnings: netEarnings,
      txdFee, taxes, totalDeductions, netEarnings, breakdown,
    };
  }

  async simulateCommission(fare: number, category: string, city: string): Promise<{ rules: CommissionRule[]; results: CommissionResult[] }> {
    const results = await Promise.all(this.rules.filter(r => r.active).map(async rule => {
      return this.calculateCommission(fare, category, city);
    }));
    return { rules: this.rules, results };
  }
}

export const commissionEngine = new CommissionEngine();
