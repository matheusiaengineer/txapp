import { CountryConfig } from "./schema";

export const COUNTRIES_CONFIG: CountryConfig[] = [
  {
    code: "BR", name: "Brazil", namePt: "Brasil", flag: "🇧🇷", phoneCode: "+55",
    defaultCurrency: "BRL", defaultLocale: "pt-BR", defaultLanguage: "pt-BR", active: true,
    regulations: {
      dataPrivacy: "lgpd", maxCommissionPercent: 35, minDriverPayPercent: 65,
      requiresReceipt: true, requiresInsurance: true, reportToGovernment: false,
      taxRules: [
        { name: "ISS", rate: 0.05, appliesTo: "company", type: "percentage" },
        { name: "IRRF", rate: 0.015, appliesTo: "driver", type: "percentage" },
      ],
    },
    cities: [
      {
        id: "sao-paulo", countryCode: "BR", name: "São Paulo", state: "SP",
        timezone: "America/Sao_Paulo", locale: "pt-BR", currency: "BRL",
        currencySymbol: "R$", language: "pt-BR", phoneCode: "+55", active: true,
        launchDate: "2024-01-15",
        pricing: { baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.4, minFare: 10, cancellationFee: 7, waitingFeePerMin: 0.5, nightMultiplier: 1.3, nightStart: "22:00", nightEnd: "06:00", currency: "BRL", surgeEnabled: true, maxSurgeMultiplier: 2.5, tollIncluded: true },
        commission: { driverPercentage: 75, companyPercentage: 25, referralBonus: 20, firstRideCommission: 0, topRatedDiscount: 5, withdrawalFee: 1.99, instantWithdrawalFee: 3.99, taxRate: 0.065 },
        vehicles: [
          { id: "moto", name: "TXD Moto", namePt: "TXD Moto", icon: "bike", color: "#FF6B35", type: "passenger", maxPassengers: 1, enabled: true, baseFare: 3, pricePerKm: 1.5, pricePerMin: 0.3, minFare: 7, surgeMultiplier: true },
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.4, minFare: 10, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 7, pricePerKm: 2.5, pricePerMin: 0.6, minFare: 15, surgeMultiplier: true },
          { id: "black", name: "TXD Black", namePt: "TXD Black", icon: "car", color: "#1A1A2E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 12, pricePerKm: 4, pricePerMin: 1, minFare: 25, surgeMultiplier: true },
          { id: "van", name: "TXD Van", namePt: "TXD Van", icon: "truck", color: "#9B59B6", type: "passenger", maxPassengers: 15, enabled: true, baseFare: 15, pricePerKm: 3.5, pricePerMin: 0.8, minFare: 30, surgeMultiplier: true },
          { id: "feminino", name: "TXD Feminino", namePt: "TXD Feminino", icon: "venus", color: "#FF69B4", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.4, minFare: 10, surgeMultiplier: true, womenOnly: true },
          { id: "carga_leve", name: "TXD Carga Leve", namePt: "TXD Carga Leve", icon: "package", color: "#E74C3C", type: "freight", maxPassengers: 1, maxWeight: 100, enabled: true, baseFare: 10, pricePerKm: 2.5, pricePerMin: 0.5, minFare: 15, surgeMultiplier: true },
          { id: "mudanca", name: "TXD Mudança", namePt: "TXD Mudança", icon: "home", color: "#D35400", type: "freight", maxPassengers: 1, maxWeight: 3000, enabled: true, baseFare: 80, pricePerKm: 8, pricePerMin: 2, minFare: 100, surgeMultiplier: false },
        ],
        documents: [
          { documentTypeId: "cpf", name: "CPF", namePt: "CPF", requiredFor: ["driver", "passenger", "company", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "cnh", name: "CNH", namePt: "CNH", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "rg", name: "RG", namePt: "RG", requiredFor: ["passenger"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "cnpj", name: "CNPJ", namePt: "CNPJ", requiredFor: ["company", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: true, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "crlv", name: "CRLV", namePt: "CRLV", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: true, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "pix", name: "PIX", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 0.01, maxAmount: 50000, countries: ["BR"] },
          { id: "credit_card", name: "Cartão de Crédito", enabled: true, processingFee: 3.99, settlementDays: 2, minAmount: 1, maxAmount: 25000, countries: ["BR"] },
          { id: "debit_card", name: "Cartão de Débito", enabled: true, processingFee: 2.49, settlementDays: 1, minAmount: 1, maxAmount: 5000, countries: ["BR"] },
          { id: "boleto", name: "Boleto Bancário", enabled: true, processingFee: 1.5, settlementDays: 3, minAmount: 5, maxAmount: 10000, countries: ["BR"] },
        ],
        kyc: { required: true, documentsRequired: 3, facialRecognition: true, livenessCheck: true, videoCallOption: false, autoApprove: false, maxAttempts: 3, reviewTime: "24h" },
        restrictions: { minAge: 18, minDriverAge: 21, driverExperienceYears: 2, vehicleMaxAge: 15 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 2.5, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 2.5 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Chat em Tempo Real", enabled: true, rolloutPercentage: 100 },
          { id: "scheduling", name: "Agendamento de Corridas", enabled: true, rolloutPercentage: 100 },
          { id: "split_payment", name: "Divisão de Pagamento", enabled: true, rolloutPercentage: 50 },
          { id: "favorite_drivers", name: "Motoristas Favoritos", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "Botão de Emergência", enabled: true, rolloutPercentage: 100 },
          { id: "ai_pricing", name: "Precificação por IA", enabled: false, rolloutPercentage: 0 },
          { id: "marketplace", name: "Marketplace de Fretes", enabled: false, rolloutPercentage: 0 },
        ],
      },
      {
        id: "rio-de-janeiro", countryCode: "BR", name: "Rio de Janeiro", state: "RJ",
        timezone: "America/Sao_Paulo", locale: "pt-BR", currency: "BRL",
        currencySymbol: "R$", language: "pt-BR", phoneCode: "+55", active: true,
        launchDate: "2024-03-01",
        pricing: { baseFare: 5.5, pricePerKm: 2, pricePerMin: 0.45, minFare: 12, cancellationFee: 7, waitingFeePerMin: 0.5, nightMultiplier: 1.4, nightStart: "22:00", nightEnd: "06:00", currency: "BRL", surgeEnabled: true, maxSurgeMultiplier: 3, tollIncluded: true },
        commission: { driverPercentage: 73, companyPercentage: 27, referralBonus: 20, firstRideCommission: 0, topRatedDiscount: 5, withdrawalFee: 1.99, instantWithdrawalFee: 3.99, taxRate: 0.065 },
        vehicles: [
          { id: "moto", name: "TXD Moto", namePt: "TXD Moto", icon: "bike", color: "#FF6B35", type: "passenger", maxPassengers: 1, enabled: true, baseFare: 3, pricePerKm: 1.5, pricePerMin: 0.3, minFare: 7, surgeMultiplier: true },
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 5.5, pricePerKm: 2, pricePerMin: 0.45, minFare: 12, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 8, pricePerKm: 2.8, pricePerMin: 0.65, minFare: 18, surgeMultiplier: true },
          { id: "van", name: "TXD Van", namePt: "TXD Van", icon: "truck", color: "#9B59B6", type: "passenger", maxPassengers: 15, enabled: true, baseFare: 18, pricePerKm: 4, pricePerMin: 0.9, minFare: 35, surgeMultiplier: true },
        ],
        documents: [
          { documentTypeId: "cpf", name: "CPF", namePt: "CPF", requiredFor: ["driver", "passenger", "company", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "cnh", name: "CNH", namePt: "CNH", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "crlv", name: "CRLV", namePt: "CRLV", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: true, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "pix", name: "PIX", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 0.01, maxAmount: 50000, countries: ["BR"] },
          { id: "credit_card", name: "Cartão de Crédito", enabled: true, processingFee: 3.99, settlementDays: 2, minAmount: 1, maxAmount: 25000, countries: ["BR"] },
          { id: "dinheiro", name: "Dinheiro", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 1, maxAmount: 500, countries: ["BR"] },
        ],
        kyc: { required: true, documentsRequired: 2, facialRecognition: true, livenessCheck: true, videoCallOption: false, autoApprove: false, maxAttempts: 3, reviewTime: "24h" },
        restrictions: { minAge: 18, minDriverAge: 21, driverExperienceYears: 2, vehicleMaxAge: 15 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 3, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 3.0 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Chat em Tempo Real", enabled: true, rolloutPercentage: 100 },
          { id: "scheduling", name: "Agendamento de Corridas", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "Botão de Emergência", enabled: true, rolloutPercentage: 100 },
        ],
      },
      {
        id: "brasilia", countryCode: "BR", name: "Brasília", state: "DF",
        timezone: "America/Sao_Paulo", locale: "pt-BR", currency: "BRL",
        currencySymbol: "R$", language: "pt-BR", phoneCode: "+55", active: true,
        launchDate: "2024-06-01",
        pricing: { baseFare: 6, pricePerKm: 2.2, pricePerMin: 0.5, minFare: 13, cancellationFee: 8, waitingFeePerMin: 0.5, nightMultiplier: 1.3, nightStart: "22:00", nightEnd: "06:00", currency: "BRL", surgeEnabled: true, maxSurgeMultiplier: 2.5, tollIncluded: false },
        commission: { driverPercentage: 75, companyPercentage: 25, referralBonus: 25, firstRideCommission: 0, topRatedDiscount: 5, withdrawalFee: 1.99, instantWithdrawalFee: 3.99, taxRate: 0.065 },
        vehicles: [
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 6, pricePerKm: 2.2, pricePerMin: 0.5, minFare: 13, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 8.5, pricePerKm: 3, pricePerMin: 0.7, minFare: 20, surgeMultiplier: true },
          { id: "executivo", name: "TXD Executivo", namePt: "TXD Executivo", icon: "briefcase", color: "#2C3E50", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 15, pricePerKm: 4.5, pricePerMin: 1, minFare: 35, surgeMultiplier: false },
        ],
        documents: [
          { documentTypeId: "cpf", name: "CPF", namePt: "CPF", requiredFor: ["driver", "passenger", "company", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "cnh", name: "CNH", namePt: "CNH", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "pix", name: "PIX", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 0.01, maxAmount: 50000, countries: ["BR"] },
          { id: "credit_card", name: "Cartão de Crédito", enabled: true, processingFee: 3.99, settlementDays: 2, minAmount: 1, maxAmount: 25000, countries: ["BR"] },
        ],
        kyc: { required: true, documentsRequired: 2, facialRecognition: true, livenessCheck: true, videoCallOption: false, autoApprove: false, maxAttempts: 3, reviewTime: "24h" },
        restrictions: { minAge: 18, minDriverAge: 21, driverExperienceYears: 2, vehicleMaxAge: 12 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 2.5, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 2.5 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Chat em Tempo Real", enabled: true, rolloutPercentage: 100 },
          { id: "scheduling", name: "Agendamento de Corridas", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "Botão de Emergência", enabled: true, rolloutPercentage: 100 },
          { id: "corporate", name: "Corporativo", enabled: true, rolloutPercentage: 100 },
        ],
      },
    ],
  },
  {
    code: "US", name: "United States", namePt: "Estados Unidos", flag: "🇺🇸", phoneCode: "+1",
    defaultCurrency: "USD", defaultLocale: "en-US", defaultLanguage: "en-US", active: true,
    regulations: {
      dataPrivacy: "ccpa", maxCommissionPercent: 30, minDriverPayPercent: 70,
      requiresReceipt: true, requiresInsurance: true, reportToGovernment: false,
      taxRules: [
        { name: "Federal Tax", rate: 0.15, appliesTo: "driver", type: "percentage" },
        { name: "Sales Tax", rate: 0.08, appliesTo: "passenger", type: "percentage" },
      ],
    },
    cities: [
      {
        id: "new-york", countryCode: "US", name: "New York", state: "NY",
        timezone: "America/New_York", locale: "en-US", currency: "USD",
        currencySymbol: "$", language: "en-US", phoneCode: "+1", active: true,
        launchDate: "2025-01-01",
        pricing: { baseFare: 2.5, pricePerKm: 1.5, pricePerMin: 0.35, minFare: 8, cancellationFee: 5, waitingFeePerMin: 0.5, nightMultiplier: 1.5, nightStart: "00:00", nightEnd: "06:00", currency: "USD", surgeEnabled: true, maxSurgeMultiplier: 4, tollIncluded: true },
        commission: { driverPercentage: 73, companyPercentage: 27, referralBonus: 10, firstRideCommission: 0, topRatedDiscount: 3, withdrawalFee: 0.5, instantWithdrawalFee: 1.5, taxRate: 0.08 },
        vehicles: [
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 2.5, pricePerKm: 1.5, pricePerMin: 0.35, minFare: 8, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 3.5, pricePerKm: 2.2, pricePerMin: 0.5, minFare: 12, surgeMultiplier: true },
          { id: "black", name: "TXD Black", namePt: "TXD Black", icon: "car", color: "#1A1A2E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 7, pricePerKm: 3.5, pricePerMin: 0.8, minFare: 20, surgeMultiplier: true },
          { id: "van", name: "TXD Van", namePt: "TXD Van", icon: "truck", color: "#9B59B6", type: "passenger", maxPassengers: 6, enabled: true, baseFare: 5, pricePerKm: 3, pricePerMin: 0.7, minFare: 15, surgeMultiplier: true },
          { id: "acessivel", name: "TXD Accessible", namePt: "TXD Acessível", icon: "accessibility", color: "#8E44AD", type: "passenger", maxPassengers: 3, enabled: true, baseFare: 5, pricePerKm: 2.8, pricePerMin: 0.6, minFare: 15, surgeMultiplier: false, accessible: true },
        ],
        documents: [
          { documentTypeId: "ssn", name: "SSN", namePt: "SSN", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "drivers_license", name: "Driver's License", namePt: "Carteira de Motorista", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "credit_card", name: "Credit Card", enabled: true, processingFee: 2.9, settlementDays: 2, minAmount: 1, maxAmount: 10000, countries: ["US"] },
          { id: "apple_pay", name: "Apple Pay", enabled: true, processingFee: 2.9, settlementDays: 1, minAmount: 1, maxAmount: 10000, countries: ["US"] },
          { id: "google_pay", name: "Google Pay", enabled: true, processingFee: 2.9, settlementDays: 1, minAmount: 1, maxAmount: 10000, countries: ["US"] },
          { id: "paypal", name: "PayPal", enabled: true, processingFee: 3.5, settlementDays: 1, minAmount: 1, maxAmount: 5000, countries: ["US"] },
        ],
        kyc: { required: true, documentsRequired: 2, facialRecognition: true, livenessCheck: true, videoCallOption: true, autoApprove: false, maxAttempts: 5, reviewTime: "48h" },
        restrictions: { minAge: 18, minDriverAge: 19, driverExperienceYears: 1, vehicleMaxAge: 12 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 4, levels: [{ threshold: 0.3, multiplier: 1.3 }, { threshold: 0.5, multiplier: 1.8 }, { threshold: 0.7, multiplier: 2.5 }, { threshold: 0.9, multiplier: 4 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Real-time Chat", enabled: true, rolloutPercentage: 100 },
          { id: "scheduling", name: "Trip Scheduling", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "Emergency SOS", enabled: true, rolloutPercentage: 100 },
          { id: "split_payment", name: "Split Payment", enabled: true, rolloutPercentage: 75 },
          { id: "ai_pricing", name: "AI Pricing", enabled: false, rolloutPercentage: 0 },
        ],
      },
      {
        id: "miami", countryCode: "US", name: "Miami", state: "FL",
        timezone: "America/New_York", locale: "en-US", currency: "USD",
        currencySymbol: "$", language: "en-US", phoneCode: "+1", active: true,
        launchDate: "2025-03-01",
        pricing: { baseFare: 2, pricePerKm: 1.3, pricePerMin: 0.3, minFare: 7, cancellationFee: 5, waitingFeePerMin: 0.4, nightMultiplier: 1.3, nightStart: "23:00", nightEnd: "06:00", currency: "USD", surgeEnabled: true, maxSurgeMultiplier: 3, tollIncluded: true },
        commission: { driverPercentage: 75, companyPercentage: 25, referralBonus: 10, firstRideCommission: 0, topRatedDiscount: 3, withdrawalFee: 0.5, instantWithdrawalFee: 1.5, taxRate: 0.07 },
        vehicles: [
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 2, pricePerKm: 1.3, pricePerMin: 0.3, minFare: 7, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 3, pricePerKm: 2, pricePerMin: 0.45, minFare: 10, surgeMultiplier: true },
          { id: "van", name: "TXD Van", namePt: "TXD Van", icon: "truck", color: "#9B59B6", type: "passenger", maxPassengers: 6, enabled: true, baseFare: 4, pricePerKm: 2.5, pricePerMin: 0.6, minFare: 12, surgeMultiplier: true },
        ],
        documents: [
          { documentTypeId: "drivers_license", name: "Driver's License", namePt: "Carteira de Motorista", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "credit_card", name: "Credit Card", enabled: true, processingFee: 2.9, settlementDays: 2, minAmount: 1, maxAmount: 10000, countries: ["US"] },
          { id: "cash", name: "Cash", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 1, maxAmount: 500, countries: ["US"] },
        ],
        kyc: { required: true, documentsRequired: 2, facialRecognition: true, livenessCheck: true, videoCallOption: true, autoApprove: false, maxAttempts: 5, reviewTime: "48h" },
        restrictions: { minAge: 18, minDriverAge: 19, driverExperienceYears: 1, vehicleMaxAge: 12 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 3, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 3 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Real-time Chat", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "Emergency SOS", enabled: true, rolloutPercentage: 100 },
        ],
      },
    ],
  },
  {
    code: "PT", name: "Portugal", namePt: "Portugal", flag: "🇵🇹", phoneCode: "+351",
    defaultCurrency: "EUR", defaultLocale: "pt-PT", defaultLanguage: "pt-PT", active: true,
    regulations: {
      dataPrivacy: "gdpr", maxCommissionPercent: 30, minDriverPayPercent: 70,
      requiresReceipt: true, requiresInsurance: true, reportToGovernment: true,
      taxRules: [
        { name: "IVA", rate: 0.23, appliesTo: "passenger", type: "percentage" },
        { name: "IRS", rate: 0.10, appliesTo: "driver", type: "percentage" },
      ],
    },
    cities: [
      {
        id: "lisboa", countryCode: "PT", name: "Lisbon", namePt: "Lisboa", state: "Lisboa",
        timezone: "Europe/Lisbon", locale: "pt-PT", currency: "EUR",
        currencySymbol: "€", language: "pt-PT", phoneCode: "+351", active: true,
        launchDate: "2025-06-01",
        pricing: { baseFare: 3.5, pricePerKm: 1.2, pricePerMin: 0.3, minFare: 6.5, cancellationFee: 4, waitingFeePerMin: 0.4, nightMultiplier: 1.25, nightStart: "22:00", nightEnd: "06:00", currency: "EUR", surgeEnabled: true, maxSurgeMultiplier: 2.5, tollIncluded: true },
        commission: { driverPercentage: 75, companyPercentage: 25, referralBonus: 15, firstRideCommission: 0, topRatedDiscount: 5, withdrawalFee: 0.5, instantWithdrawalFee: 1, taxRate: 0.23 },
        vehicles: [
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 3.5, pricePerKm: 1.2, pricePerMin: 0.3, minFare: 6.5, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 5, pricePerKm: 1.8, pricePerMin: 0.45, minFare: 10, surgeMultiplier: true },
          { id: "black", name: "TXD Black", namePt: "TXD Black", icon: "car", color: "#1A1A2E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 8, pricePerKm: 3, pricePerMin: 0.7, minFare: 18, surgeMultiplier: true },
        ],
        documents: [
          { documentTypeId: "cc", name: "Citizen Card", namePt: "Cartão de Cidadão", requiredFor: ["driver", "passenger", "company", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "nif", name: "NIF", namePt: "NIF", requiredFor: ["driver", "company", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "drivers_license", name: "Carta de Condução", namePt: "Carta de Condução", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
          { documentTypeId: "selfie", name: "Selfie", namePt: "Selfie", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: false, acceptPDF: false, ocrEnabled: false, expiryRequired: false, verificationRequired: true },
        ],
        payments: [
          { id: "credit_card", name: "Cartão de Crédito", enabled: true, processingFee: 2.5, settlementDays: 2, minAmount: 1, maxAmount: 5000, countries: ["PT"] },
          { id: "mbway", name: "MB Way", enabled: true, processingFee: 0.5, settlementDays: 0, minAmount: 0.01, maxAmount: 2500, countries: ["PT"] },
          { id: "multibanco", name: "Multibanco", enabled: true, processingFee: 0.8, settlementDays: 1, minAmount: 1, maxAmount: 5000, countries: ["PT"] },
          { id: "paypal", name: "PayPal", enabled: true, processingFee: 3.5, settlementDays: 1, minAmount: 1, maxAmount: 3000, countries: ["PT"] },
        ],
        kyc: { required: true, documentsRequired: 3, facialRecognition: true, livenessCheck: true, videoCallOption: true, autoApprove: false, maxAttempts: 3, reviewTime: "48h" },
        restrictions: { minAge: 18, minDriverAge: 21, driverExperienceYears: 1, vehicleMaxAge: 15 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 2.5, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 2.5 }], areas: [], timeRanges: [] },
        features: [
          { id: "chat", name: "Chat em Tempo Real", enabled: true, rolloutPercentage: 100 },
          { id: "scheduling", name: "Agendamento", enabled: true, rolloutPercentage: 100 },
          { id: "emergency_sos", name: "SOS Emergência", enabled: true, rolloutPercentage: 100 },
          { id: "gdpr_consent", name: "Consentimento GDPR", enabled: true, rolloutPercentage: 100 },
        ],
      },
    ],
  },
  {
    code: "MX", name: "Mexico", namePt: "México", flag: "🇲🇽", phoneCode: "+52",
    defaultCurrency: "MXN", defaultLocale: "es-MX", defaultLanguage: "es-MX", active: false,
    regulations: { dataPrivacy: "none", maxCommissionPercent: 30, minDriverPayPercent: 70, requiresReceipt: true, requiresInsurance: true, reportToGovernment: false, taxRules: [] },
    cities: [
      {
        id: "cidade-mexico", countryCode: "MX", name: "Mexico City", namePt: "Cidade do México",
        timezone: "America/Mexico_City", locale: "es-MX", currency: "MXN",
        currencySymbol: "$", language: "es-MX", phoneCode: "+52", active: false,
        launchDate: "2025-09-01",
        pricing: { baseFare: 15, pricePerKm: 8, pricePerMin: 2, minFare: 30, cancellationFee: 10, waitingFeePerMin: 1, nightMultiplier: 1.2, nightStart: "23:00", nightEnd: "06:00", currency: "MXN", surgeEnabled: true, maxSurgeMultiplier: 2.5, tollIncluded: true },
        commission: { driverPercentage: 75, companyPercentage: 25, referralBonus: 50, firstRideCommission: 0, topRatedDiscount: 5, withdrawalFee: 5, instantWithdrawalFee: 10, taxRate: 0.16 },
        vehicles: [
          { id: "pop", name: "TXD Pop", namePt: "TXD Pop", icon: "car", color: "#3ECB8E", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 15, pricePerKm: 8, pricePerMin: 2, minFare: 30, surgeMultiplier: true },
          { id: "comfort", name: "TXD Comfort", namePt: "TXD Comfort", icon: "car", color: "#4A90D9", type: "passenger", maxPassengers: 4, enabled: true, baseFare: 20, pricePerKm: 12, pricePerMin: 3, minFare: 45, surgeMultiplier: true },
        ],
        documents: [
          { documentTypeId: "curp", name: "CURP", namePt: "CURP", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: false, verificationRequired: true },
          { documentTypeId: "drivers_license", name: "Licencia", namePt: "Licencia", requiredFor: ["driver", "transporter"], acceptImage: true, acceptDigital: true, acceptPDF: false, ocrEnabled: true, expiryRequired: true, verificationRequired: true },
        ],
        payments: [
          { id: "credit_card", name: "Tarjeta", enabled: true, processingFee: 3.5, settlementDays: 2, minAmount: 1, maxAmount: 20000, countries: ["MX"] },
          { id: "cash", name: "Efectivo", enabled: true, processingFee: 0, settlementDays: 0, minAmount: 1, maxAmount: 1000, countries: ["MX"] },
        ],
        kyc: { required: true, documentsRequired: 2, facialRecognition: true, livenessCheck: true, videoCallOption: false, autoApprove: false, maxAttempts: 3, reviewTime: "24h" },
        restrictions: { minAge: 18, minDriverAge: 21, driverExperienceYears: 2, vehicleMaxAge: 15 },
        surge: { enabled: true, baseMultiplier: 1, maxMultiplier: 2.5, levels: [{ threshold: 0.3, multiplier: 1.2 }, { threshold: 0.5, multiplier: 1.5 }, { threshold: 0.7, multiplier: 2.0 }, { threshold: 0.9, multiplier: 2.5 }], areas: [], timeRanges: [] },
        features: [],
      },
    ],
  },
];

export function getCountryByCode(code: string): CountryConfig | undefined {
  return COUNTRIES_CONFIG.find(c => c.code === code);
}

export function getCityById(cityId: string): { country: CountryConfig; city: import("./schema").CityConfig } | undefined {
  for (const country of COUNTRIES_CONFIG) {
    const city = country.cities.find(c => c.id === cityId);
    if (city) return { country, city };
  }
  return undefined;
}

export function getActiveCities(): { country: CountryConfig; city: import("./schema").CityConfig }[] {
  const result: { country: CountryConfig; city: import("./schema").CityConfig }[] = [];
  for (const country of COUNTRIES_CONFIG) {
    for (const city of country.cities) {
      if (city.active && country.active) result.push({ country, city });
    }
  }
  return result;
}
