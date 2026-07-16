export interface MicroService {
  id: string;
  name: string;
  description: string;
  status: "healthy" | "degraded" | "down";
  version: string;
  endpoints: string[];
  dependencies: string[];
  uptime: number;
  lastChecked: string;
}

export const MICRO_SERVICES: MicroService[] = [
  { id: "auth", name: "Auth Service", description: "Authentication & authorization", status: "healthy", version: "2.1.0", endpoints: ["/api/auth/login", "/api/auth/register", "/api/auth/verify"], dependencies: ["database"], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "kyc", name: "KYC Service", description: "Identity verification & document validation", status: "healthy", version: "1.8.3", endpoints: ["/api/kyc/upload", "/api/kyc/verify", "/api/kyc/status"], dependencies: ["auth", "file-storage"], uptime: 99.7, lastChecked: new Date().toISOString() },
  { id: "mobility", name: "Mobility Service", description: "Trip management & dispatching", status: "healthy", version: "3.0.1", endpoints: ["/api/ride/request", "/api/ride/cancel", "/api/ride/status"], dependencies: ["auth", "dispatch", "pricing"], uptime: 99.95, lastChecked: new Date().toISOString() },
  { id: "freight", name: "Freight Service", description: "Cargo & logistics management", status: "healthy", version: "2.0.0", endpoints: ["/api/freight/quote", "/api/freight/ship", "/api/freight/track"], dependencies: ["auth", "pricing"], uptime: 99.8, lastChecked: new Date().toISOString() },
  { id: "dispatch", name: "Dispatch Service", description: "Smart driver-passenger matching", status: "healthy", version: "1.5.2", endpoints: ["/api/dispatch/find", "/api/dispatch/offer"], dependencies: ["mobility", "location"], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "payment", name: "Payment Service", description: "Payment processing with Stripe & wallets", status: "healthy", version: "2.3.0", endpoints: ["/api/payment/charge", "/api/payment/refund", "/api/payment/wallet"], dependencies: ["auth"], uptime: 99.99, lastChecked: new Date().toISOString() },
  { id: "notification", name: "Notification Service", description: "Push, SMS, email notifications", status: "healthy", version: "1.9.1", endpoints: ["/api/notify/send", "/api/notify/templates"], dependencies: ["auth"], uptime: 99.6, lastChecked: new Date().toISOString() },
  { id: "chat", name: "Chat Service", description: "Real-time messaging with E2EE", status: "healthy", version: "2.1.2", endpoints: ["/api/chat/send", "/api/chat/conversations"], dependencies: ["auth", "realtime"], uptime: 99.8, lastChecked: new Date().toISOString() },
  { id: "rating", name: "Rating Service", description: "Driver and passenger reviews", status: "healthy", version: "1.2.0", endpoints: ["/api/rating/submit", "/api/rating/profile"], dependencies: ["auth", "mobility"], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "location", name: "Location Service", description: "Real-time GPS tracking & geofencing", status: "healthy", version: "1.7.4", endpoints: ["/api/location/update", "/api/location/nearby"], dependencies: ["realtime"], uptime: 99.5, lastChecked: new Date().toISOString() },
  { id: "pricing", name: "Pricing Service", description: "Dynamic pricing & surge calculation", status: "healthy", version: "1.4.1", endpoints: ["/api/pricing/estimate", "/api/pricing/surge"], dependencies: [], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "commission", name: "Commission Service", description: "Commission calculation & split", status: "healthy", version: "1.1.0", endpoints: ["/api/commission/calculate", "/api/commission/rules"], dependencies: ["pricing", "payment"], uptime: 99.8, lastChecked: new Date().toISOString() },
  { id: "fraud", name: "Fraud Detection Service", description: "AI-powered fraud analysis", status: "healthy", version: "2.0.0", endpoints: ["/api/fraud/analyze", "/api/fraud/report"], dependencies: ["auth", "payment"], uptime: 99.7, lastChecked: new Date().toISOString() },
  { id: "file-storage", name: "File Storage Service", description: "Document & image upload/CDN", status: "healthy", version: "1.3.0", endpoints: ["/api/files/upload", "/api/files/delete"], dependencies: [], uptime: 99.99, lastChecked: new Date().toISOString() },
  { id: "realtime", name: "Realtime Service", description: "WebSocket connections & presence", status: "healthy", version: "2.0.2", endpoints: ["wss://txd.realtime.com"], dependencies: [], uptime: 99.95, lastChecked: new Date().toISOString() },
  { id: "translation", name: "Translation Service", description: "i18n & real-time translation", status: "healthy", version: "1.6.0", endpoints: ["/api/translate", "/api/i18n/keys"], dependencies: [], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "ai", name: "AI Service", description: "ML models for prediction & moderation", status: "healthy", version: "1.0.0", endpoints: ["/api/ai/predict", "/api/ai/moderate"], dependencies: [], uptime: 99.5, lastChecked: new Date().toISOString() },
  { id: "webhook", name: "Webhook Gateway", description: "External event delivery", status: "healthy", version: "1.2.1", endpoints: ["/api/webhooks/send", "/api/webhooks/logs"], dependencies: [], uptime: 99.9, lastChecked: new Date().toISOString() },
  { id: "admin", name: "Admin API", description: "Backoffice management API", status: "healthy", version: "3.1.0", endpoints: ["/api/admin/*"], dependencies: ["auth", "all"], uptime: 99.8, lastChecked: new Date().toISOString() },
  { id: "analytics", name: "Analytics Service", description: "Usage metrics & business intelligence", status: "healthy", version: "1.5.0", endpoints: ["/api/analytics/events", "/api/analytics/reports"], dependencies: ["database"], uptime: 99.6, lastChecked: new Date().toISOString() },
];

export class ServiceRegistry {
  private services: Map<string, MicroService> = new Map(MICRO_SERVICES.map(s => [s.id, s]));

  get(id: string): MicroService | undefined { return this.services.get(id); }
  getAll(): MicroService[] { return Array.from(this.services.values()); }
  getByStatus(status: MicroService["status"]): MicroService[] { return this.getAll().filter(s => s.status === status); }

  async checkHealth(id: string): Promise<MicroService["status"]> {
    const service = this.services.get(id);
    if (!service) return "down";
    const statuses: MicroService["status"][] = ["healthy", "healthy", "healthy", "healthy", "degraded"];
    service.status = statuses[Math.floor(Math.random() * statuses.length)];
    service.lastChecked = new Date().toISOString();
    return service.status;
  }

  async checkAllHealth(): Promise<Record<string, MicroService["status"]>> {
    const results: Record<string, MicroService["status"]> = {};
    for (const [id] of this.services) results[id] = await this.checkHealth(id);
    return results;
  }

  getSystemStatus() {
    const all = this.getAll();
    return {
      total: all.length,
      healthy: all.filter(s => s.status === "healthy").length,
      degraded: all.filter(s => s.status === "degraded").length,
      down: all.filter(s => s.status === "down").length,
      uptime: Math.round(all.reduce((acc, s) => acc + s.uptime, 0) / all.length * 100) / 100,
    };
  }
}

export const serviceRegistry = new ServiceRegistry();
