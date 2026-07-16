import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface DriverPosition {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  lastUpdated: string;
}

export class RealtimeTracker {
  private channel: RealtimeChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private watchId: number | null = null;
  private driverId: string | null = null;

  async startTracking(driverId: string) {
    this.driverId = driverId;
    const supabase = createClient();

    this.channel = supabase.channel("driver-tracking");

    this.channel.on("broadcast", { event: "position" }, (payload) => {
      if (payload.payload.driverId !== driverId) return;
    }).subscribe();

    await this.startHeartbeat();
    await this.startGPSWatch();
  }

  private async startHeartbeat() {
    if (!this.driverId) return;
    const supabase = createClient();

    this.heartbeatInterval = setInterval(async () => {
      try {
        const pos = await this.getCurrentPosition();
        if (!pos) return;

        await supabase.from("driver_heartbeats").upsert({
          driver_id: this.driverId,
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading || 0,
          speed: pos.speed || 0,
          accuracy: pos.accuracy || 0,
          battery_level: await this.getBatteryLevel(),
          status: "ONLINE",
          last_updated_at: new Date().toISOString(),
        }, { onConflict: "driver_id" });
      } catch {}
    }, 3000);
  }

  private startGPSWatch(): Promise<void> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(); return; }
      this.watchId = navigator.geolocation.watchPosition(
        () => {},
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
      );
      resolve();
    });
  }

  private getCurrentPosition(): Promise<{ lat: number; lng: number; heading: number | null; speed: number | null; accuracy: number | null } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 },
      );
    });
  }

  private async getBatteryLevel(): Promise<number | null> {
    try {
      const battery = await (navigator as any).getBattery?.();
      return battery ? Math.round(battery.level * 100) : null;
    } catch { return null; }
  }

  subscribeToDriverPosition(driverId: string, callback: (pos: DriverPosition) => void): () => void {
    const supabase = createClient();
    const channel = supabase.channel(`driver-${driverId}`);

    const subscription = supabase
      .channel("driver-heartbeats")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "driver_heartbeats",
        filter: `driver_id=eq.${driverId}`,
      }, (payload) => {
        const newData = payload.new as any;
        if (newData) {
          callback({
            driverId: newData.driver_id,
            lat: newData.lat,
            lng: newData.lng,
            heading: newData.heading || 0,
            speed: newData.speed || 0,
            status: newData.status,
            lastUpdated: newData.last_updated_at,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  subscribeToNearbyDrivers(callback: (drivers: DriverPosition[]) => void): () => void {
    const supabase = createClient();

    const subscription = supabase
      .channel("nearby-drivers")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "driver_heartbeats",
        filter: "status=neq.OFFLINE",
      }, async () => {
        const { data } = await supabase
          .from("driver_heartbeats")
          .select("*")
          .neq("status", "OFFLINE")
          .limit(50);

        if (data) {
          callback(data.map((d: any) => ({
            driverId: d.driver_id,
            lat: d.lat,
            lng: d.lng,
            heading: d.heading || 0,
            speed: d.speed || 0,
            status: d.status,
            lastUpdated: d.last_updated_at,
          })));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }

  stopTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.channel) {
      const supabase = createClient();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.driverId = null;
  }
}

export const realtimeTracker = new RealtimeTracker();
