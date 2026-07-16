import { eventBus } from "../events/bus";
import { createClient } from "../supabase/browser";

export type DriverStatus = 'OFFLINE' | 'ONLINE' | 'AVAILABLE' | 'RESERVED' | 'GOING_TO_PICKUP' | 'WAITING_PASSENGER' | 'IN_TRIP' | 'IN_DELIVERY' | 'IN_FREIGHT' | 'PAUSED' | 'EMERGENCY';

interface HeartbeatPayload {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  battery_level?: number;
  status: DriverStatus;
}

export class HeartbeatService {
  private supabase = createClient();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Envia o ping de localização do motorista para o banco.
   * O intervalo de envio deve variar conforme o status (bateria vs precisão).
   */
  async sendHeartbeat(payload: HeartbeatPayload) {
    try {
      const { error } = await this.supabase
        .from("driver_heartbeats")
        .upsert({
          driver_id: payload.driverId,
          lat: payload.lat,
          lng: payload.lng,
          heading: payload.heading,
          speed: payload.speed,
          accuracy: payload.accuracy,
          battery_level: payload.battery_level,
          status: payload.status,
          last_updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Dispara o evento interno no barramento
      eventBus.emit("driver.location.updated", {
        driverId: payload.driverId,
        lat: payload.lat,
        lng: payload.lng,
        speed: payload.speed || 0
      });

    } catch (err) {
      console.error("[HeartbeatService] Falha ao enviar ping:", err);
    }
  }

  start(payloadGenerator: () => HeartbeatPayload, intervalMs: number = 5000) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    this.heartbeatInterval = setInterval(() => {
      const payload = payloadGenerator();
      this.sendHeartbeat(payload);
    }, intervalMs);
  }

  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const heartbeatService = new HeartbeatService();
