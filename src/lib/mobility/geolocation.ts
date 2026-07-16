export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export class GeolocationService {
  private watchId: number | null = null;
  private lastPosition: GeoPosition | null = null;
  private listeners: Array<(pos: GeoPosition) => void> = [];

  async getCurrentPosition(options?: PositionOptions): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        pos => {
          const gp: GeoPosition = {
            lat: pos.coords.latitude, lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy, altitude: pos.coords.altitude,
            speed: pos.coords.speed, heading: pos.coords.heading,
            timestamp: pos.timestamp,
          };
          this.lastPosition = gp;
          resolve(gp);
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options }
      );
    });
  }

  startWatching(options?: PositionOptions): void {
    if (this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        const gp: GeoPosition = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy, altitude: pos.coords.altitude,
          speed: pos.coords.speed, heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };
        this.lastPosition = gp;
        this.listeners.forEach(fn => fn(gp));
      },
      err => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000, ...options }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  onPosition(callback: (pos: GeoPosition) => void): () => void {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(fn => fn !== callback); };
  }

  getLastPosition(): GeoPosition | null {
    return this.lastPosition;
  }

  calculateDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const A = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1-A));
  }

  isInGeofence(center: { lat: number; lng: number }, radiusMeters: number, point: { lat: number; lng: number }): boolean {
    return this.calculateDistance(center, point) * 1000 <= radiusMeters;
  }
}

export const geoService = new GeolocationService();
