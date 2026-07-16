export interface FraudRisk {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  flags: string[];
  recommendations: string[];
}

export class FraudDetectionService {
  async analyzeSignup(data: { name: string; email: string; phone: string; document: string; deviceId?: string; ip?: string }): Promise<FraudRisk> {
    const flags: string[] = [];
    if (data.email.includes("tempmail") || data.email.includes("throwaway")) flags.push("Email descartável detectado");
    if (data.phone.replace(/\D/g, "").length < 10) flags.push("Telefone inválido");
    if (!data.document) flags.push("Documento não fornecido");

    return {
      score: flags.length * 20,
      level: flags.length === 0 ? "low" : flags.length <= 1 ? "medium" : "high",
      flags,
      recommendations: flags.length > 0 ? ["Requer verificação manual de documentos", "Solicitar selfie com documento"] : ["Aprovado automaticamente"],
    };
  }

  async analyzePayment(amount: number, currency: string, userId: string, deviceId?: string, ip?: string): Promise<FraudRisk> {
    const flags: string[] = [];
    if (amount > 10000) flags.push("Valor acima do limite de segurança");
    if (amount > 50000) flags.push("Valor muito alto, requer verificação");

    return {
      score: flags.length * 25,
      level: flags.length === 0 ? "low" : flags.length === 1 ? "medium" : "high",
      flags,
      recommendations: flags.length > 0 ? ["Requer confirmação 2FA", "Verificar histórico do usuário"] : [],
    };
  }

  async analyzeTrip(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, userId: string): Promise<FraudRisk> {
    const flags: string[] = [];
    const dist = Math.sqrt((destination.lat - origin.lat) ** 2 + (destination.lng - origin.lng) ** 2);
    if (dist < 0.001) flags.push("Distância muito curta entre origem e destino");

    return {
      score: flags.length * 30,
      level: flags.length === 0 ? "low" : "medium",
      flags,
      recommendations: flags.length > 0 ? ["Verificar se é rota válida"] : [],
    };
  }

  async detectMockGPS(lat: number, lng: number, accuracy: number): Promise<boolean> {
    if (accuracy === 0 || accuracy > 1000) return true;
    if (lat === 0 && lng === 0) return true;
    return false;
  }
}

export const fraudDetection = new FraudDetectionService();
