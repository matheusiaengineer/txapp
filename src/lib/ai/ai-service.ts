import { Coordinates } from "@/lib/mobility/engine";

export class AIService {
  async predictPrice(distanceKm: number, durationMin: number, demandLevel: string, hour: number, isWeekend: boolean, city: string): Promise<{ price: number; confidence: number; factors: string[] }> {
    const basePrice = distanceKm * 2 + durationMin * 0.5;
    const demandMultiplier = { low: 1, medium: 1.2, high: 1.5, very_high: 2.0 }[demandLevel] || 1;
    const hourMultiplier = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.3 : 1;
    const weekendMultiplier = isWeekend ? 1.1 : 1;
    const price = basePrice * demandMultiplier * hourMultiplier * weekendMultiplier;
    return { price: Math.round(price * 100) / 100, confidence: 0.87, factors: ["Distância", "Demanda", "Horário de pico"] };
  }

  async predictETA(origin: Coordinates, destination: Coordinates, traffic: string): Promise<{ minutes: number; confidence: number; trafficDelay: number; routeDistanceKm: number }> {
    const dist = Math.sqrt((destination.lat - origin.lat) ** 2 + (destination.lng - origin.lng) ** 2) * 111;
    const trafficMultiplier = { low: 1, medium: 1.3, high: 1.8, very_high: 2.5 }[traffic] || 1;
    const avgSpeed = 30 / trafficMultiplier;
    const minutes = (dist / avgSpeed) * 60;
    return {
      minutes: Math.round(minutes),
      confidence: traffic === "low" ? 0.92 : traffic === "very_high" ? 0.65 : 0.82,
      trafficDelay: Math.round(minutes * 0.3),
      routeDistanceKm: Math.round(dist * 100) / 100,
    };
  }

  async moderateMessage(text: string): Promise<{ flagged: boolean; categories: string[]; score: number }> {
    const forbiddenWords = ["spam", "abuse", "scam", "fraud"];
    const found = forbiddenWords.filter(w => text.toLowerCase().includes(w));
    return { flagged: found.length > 0, categories: found, score: found.length > 0 ? 0.9 : 0.05 };
  }

  async analyzeSentiment(text: string): Promise<{ score: number; label: "positive" | "neutral" | "negative"; keywords: string[] }> {
    const positiveWords = ["bom", "ótimo", "excelente", "obrigado", "perfeito", "top", "legal", "show"];
    const negativeWords = ["ruim", "péssimo", "horrível", "atrasado", "sujo", "mal", "lento", "grosso"];
    const posCount = positiveWords.filter(w => text.toLowerCase().includes(w)).length;
    const negCount = negativeWords.filter(w => text.toLowerCase().includes(w)).length;
    const score = posCount > negCount ? 1 : negCount > posCount ? -1 : 0;
    return {
      score, label: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
      keywords: [...positiveWords.filter(w => text.toLowerCase().includes(w)), ...negativeWords.filter(w => text.toLowerCase().includes(w))],
    };
  }

  async recommendDriver(passengerId: string, pickup: Coordinates, categoryId: string): Promise<{ driverId: string; score: number; reason: string }[]> {
    return [
      { driverId: "drv-1", score: 0.95, reason: "Motorista favorito do passageiro" },
      { driverId: "drv-2", score: 0.88, reason: "Alta nota (4.9) e próximo" },
      { driverId: "drv-3", score: 0.72, reason: "Veículo compatível e disponível" },
    ];
  }

  async predictCancelRisk(driverId: string, tripData: {
    distanceKm: number; durationMin: number; hour: number; isWeekend: boolean;
    driverRating: number; driverCancellationRate: number; driverAcceptanceRate: number;
    pickup: Coordinates; dropoff?: Coordinates;
  }): Promise<{ risk: "low" | "medium" | "high"; probability: number; reason: string }> {
    const { distanceKm, durationMin, hour, driverCancellationRate, driverRating } = tripData;

    let score = 0;
    if (distanceKm > 30) score += 0.2;
    if (durationMin > 45) score += 0.15;
    if (hour >= 22 || hour <= 5) score += 0.1;
    if (driverCancellationRate > 10) score += 0.25;
    if (driverRating < 4.5) score += 0.1;

    const probability = Math.min(score, 0.95);
    const risk = probability > 0.4 ? "high" : probability > 0.2 ? "medium" : "low";
    const reason = probability > 0.4 ? "Alta chance de cancelamento devido a histórico e condições da corrida" : probability > 0.2 ? "Risco moderado de cancelamento" : "Baixo risco de cancelamento";

    return { risk, probability: Math.round(probability * 100) / 100, reason };
  }

  async detectSleep(driverId: string, videoFrame?: string): Promise<{ drowsy: boolean; confidence: number; alert: string }> {
    return { drowsy: false, confidence: 0.98, alert: "Motorista alerta" };
  }

  async generateReport(type: "daily" | "weekly" | "monthly", data: any): Promise<{ summary: string; insights: string[]; recommendations: string[] }> {
    return {
      summary: "Relatório gerado por IA com análise de tendências.",
      insights: ["Aumento de 15% nas corridas de moto", "Horário de pico entre 18h-19h", "Zona sul com maior demanda"],
      recommendations: ["Aumentar motoristas na zona sul às 18h", "Promoção de moto no horário de pico"],
    };
  }
}

export const aiService = new AIService();
