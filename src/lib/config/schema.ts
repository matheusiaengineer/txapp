export interface CityConfig {
  id: string;
  countryCode: string;
  name: string;
  namePt?: string;
  state?: string;
  timezone: string;
  locale: string;
  currency: string;
  currencySymbol: string;
  language: string;
  phoneCode: string;
  active: boolean;
  launchDate: string;

  pricing: PricingConfig;
  commission: CommissionConfig;
  vehicles: VehicleCategoryConfig[];
  documents: DocumentRequirement[];
  payments: PaymentMethodConfig[];
  kyc: KYCConfig;
  restrictions: RestrictionConfig;
  surge: SurgeConfig;
  features: FeatureFlag[];
}

export interface PricingConfig {
  baseFare: number;
  pricePerKm: number;
  pricePerMin: number;
  minFare: number;
  cancellationFee: number;
  waitingFeePerMin: number;
  nightMultiplier: number;
  nightStart: string;
  nightEnd: string;
  currency: string;
  surgeEnabled: boolean;
  maxSurgeMultiplier: number;
  tollIncluded: boolean;
}

export interface CommissionConfig {
  driverPercentage: number;
  companyPercentage: number;
  referralBonus: number;
  firstRideCommission: number;
  topRatedDiscount: number;
  withdrawalFee: number;
  instantWithdrawalFee: number;
  taxRate: number;
}

export interface VehicleCategoryConfig {
  id: string;
  name: string;
  namePt: string;
  icon: string;
  color: string;
  type: "passenger" | "freight" | "both";
  maxPassengers: number;
  maxWeight?: number;
  maxVolume?: number;
  enabled: boolean;
  baseFare: number;
  pricePerKm: number;
  pricePerMin: number;
  minFare: number;
  surgeMultiplier: boolean;
  requiresCarSeat?: boolean;
  accessible?: boolean;
  petFriendly?: boolean;
  womenOnly?: boolean;
}

export interface DocumentRequirement {
  documentTypeId: string;
  name: string;
  namePt: string;
  requiredFor: ("driver" | "passenger" | "company" | "transporter")[];
  acceptImage: boolean;
  acceptDigital: boolean;
  acceptPDF: boolean;
  validateRegex?: string;
  ocrEnabled: boolean;
  expiryRequired: boolean;
  verificationRequired: boolean;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  enabled: boolean;
  processingFee: number;
  settlementDays: number;
  minAmount: number;
  maxAmount: number;
  countries: string[];
}

export interface KYCConfig {
  required: boolean;
  documentsRequired: number;
  facialRecognition: boolean;
  livenessCheck: boolean;
  videoCallOption: boolean;
  autoApprove: boolean;
  maxAttempts: number;
  reviewTime: string;
}

export interface RestrictionConfig {
  minAge: number;
  maxAge?: number;
  minDriverAge: number;
  driverExperienceYears: number;
  vehicleMaxAge: number;
  passengerLimit?: number;
  radiusKm?: number;
  allowedHours?: { start: string; end: string };
  blacklistedZones?: { lat: number; lng: number; radius: number }[];
}

export interface SurgeConfig {
  enabled: boolean;
  baseMultiplier: number;
  maxMultiplier: number;
  levels: { threshold: number; multiplier: number }[];
  areas: { lat: number; lng: number; radius: number; multiplier: number }[];
  timeRanges: { start: string; end: string; multiplier: number; days: number[] }[];
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  dependencies?: string[];
}

export interface CountryConfig {
  code: string;
  name: string;
  namePt: string;
  flag: string;
  phoneCode: string;
  defaultCurrency: string;
  defaultLocale: string;
  defaultLanguage: string;
  active: boolean;
  cities: CityConfig[];
  regulations: RegulationConfig;
}

export interface RegulationConfig {
  dataPrivacy: "lgpd" | "gdpr" | "ccpa" | "none";
  taxRules: TaxRule[];
  maxCommissionPercent: number;
  minDriverPayPercent: number;
  requiresReceipt: boolean;
  requiresInsurance: boolean;
  reportToGovernment: boolean;
}

export interface TaxRule {
  name: string;
  rate: number;
  appliesTo: "driver" | "company" | "passenger" | "all";
  type: "percentage" | "fixed";
  threshold?: number;
}
