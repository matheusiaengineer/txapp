import { COUNTRIES_CONFIG, getCountryByCode, getCityById, getActiveCities } from "./cities";
import { CityConfig, CountryConfig, VehicleCategoryConfig, PricingConfig, CommissionConfig, DocumentRequirement, PaymentMethodConfig, FeatureFlag } from "./schema";

class GlobalConfigEngine {
  private cache = new Map<string, any>();

  getCountries(): CountryConfig[] {
    return COUNTRIES_CONFIG;
  }

  getActiveCountries(): CountryConfig[] {
    return COUNTRIES_CONFIG.filter(c => c.active);
  }

  getCountry(code: string): CountryConfig | undefined {
    return getCountryByCode(code);
  }

  getCity(cityId: string) {
    return getCityById(cityId);
  }

  getActiveCities() {
    return getActiveCities();
  }

  getCityConfig(cityId: string): CityConfig | undefined {
    return getCityById(cityId)?.city;
  }

  getPricing(cityId: string): PricingConfig | undefined {
    return this.getCityConfig(cityId)?.pricing;
  }

  getCommission(cityId: string): CommissionConfig | undefined {
    return this.getCityConfig(cityId)?.commission;
  }

  getVehicles(cityId: string): VehicleCategoryConfig[] {
    return this.getCityConfig(cityId)?.vehicles.filter(v => v.enabled) || [];
  }

  getDocuments(cityId: string, role: string): DocumentRequirement[] {
    return this.getCityConfig(cityId)?.documents.filter(d =>
      d.requiredFor.includes(role as any)
    ) || [];
  }

  getPayments(cityId: string): PaymentMethodConfig[] {
    return this.getCityConfig(cityId)?.payments.filter(p => p.enabled) || [];
  }

  getFeatures(cityId: string): FeatureFlag[] {
    return this.getCityConfig(cityId)?.features || [];
  }

  isFeatureEnabled(cityId: string, featureId: string): boolean {
    const feature = this.getFeatures(cityId).find(f => f.id === featureId);
    if (!feature || !feature.enabled) return false;
    return Math.random() * 100 <= feature.rolloutPercentage;
  }

  getSurgeMultiplier(cityId: string, demandLevel: number): number {
    const surge = this.getCityConfig(cityId)?.surge;
    if (!surge || !surge.enabled) return 1;
    const level = [...surge.levels].reverse().find(l => demandLevel >= l.threshold);
    return level?.multiplier || surge.baseMultiplier;
  }

  calculateTripPrice(cityId: string, categoryId: string, distanceKm: number, durationMin: number, demandLevel = 0, isNight = false): {
    baseFare: number; distanceFare: number; timeFare: number;
    surgeMultiplier: number; nightMultiplier: number; total: number;
    commission: number; driverEarnings: number;
  } {
    const pricing = this.getPricing(cityId);
    const vehicle = this.getVehicles(cityId).find(v => v.id === categoryId);
    const commission = this.getCommission(cityId);
    if (!pricing || !vehicle || !commission) throw new Error(`Config not found for ${cityId}/${categoryId}`);

    const baseFare = vehicle.baseFare;
    const distanceFare = distanceKm * vehicle.pricePerKm;
    const timeFare = durationMin * vehicle.pricePerMin;
    const surgeMultiplier = vehicle.surgeMultiplier ? this.getSurgeMultiplier(cityId, demandLevel) : 1;
    const nightMultiplier = isNight ? pricing.nightMultiplier : 1;
    const subtotal = (baseFare + distanceFare + timeFare) * surgeMultiplier * nightMultiplier;
    const total = Math.max(subtotal, vehicle.minFare);
    const commissionAmount = total * ((100 - commission.driverPercentage) / 100);
    const driverEarnings = total - commissionAmount;

    return { baseFare, distanceFare, timeFare, surgeMultiplier, nightMultiplier, total, commission: commissionAmount, driverEarnings };
  }

  validateDocument(documentType: string, value: string, cityId: string): { valid: boolean; message?: string } {
    const config = this.getCityConfig(cityId);
    const doc = config?.documents.find(d => d.documentTypeId === documentType);
    if (!doc) return { valid: false, message: "Tipo de documento não encontrado" };
    if (doc.validateRegex) {
      const regex = new RegExp(doc.validateRegex);
      if (!regex.test(value)) return { valid: false, message: `Formato inválido para ${doc.namePt}` };
    }
    return { valid: true };
  }

  getRegulations(countryCode: string) {
    return this.getCountry(countryCode)?.regulations;
  }

  supportsPayment(cityId: string, paymentId: string): boolean {
    return this.getPayments(cityId).some(p => p.id === paymentId);
  }

  getMaxCommission(cityId: string): number {
    const city = this.getCityConfig(cityId);
    if (!city) return 30;
    const country = this.getCountry(city.countryCode);
    return country?.regulations.maxCommissionPercent || 30;
  }

  getLaunchConfig(cityId: string, userId?: string): {
    pricing: PricingConfig;
    vehicles: VehicleCategoryConfig[];
    payments: PaymentMethodConfig[];
    features: FeatureFlag[];
    surge: { enabled: boolean; multiplier: number };
  } {
    const city = this.getCityConfig(cityId);
    if (!city) throw new Error(`City ${cityId} not found`);
    return {
      pricing: city.pricing,
      vehicles: this.getVehicles(cityId),
      payments: this.getPayments(cityId),
      features: this.getFeatures(cityId),
      surge: { enabled: city.surge.enabled, multiplier: city.surge.baseMultiplier },
    };
  }
}

export const globalConfig = new GlobalConfigEngine();
