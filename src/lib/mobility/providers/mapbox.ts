import { Coordinates, RouteInfo } from "../engine";

export class MapboxProvider {
  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat * Math.PI/180) * Math.cos(destination.lat * Math.PI/180) * Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    const distanceMeters = distanceKm * 1000;
    const avgSpeedKph = 25 + Math.random() * 25;
    const durationSeconds = (distanceKm / avgSpeedKph) * 3600;
    return { distance_meters: Math.round(distanceMeters), duration_seconds: Math.round(durationSeconds), polyline: "mapbox_polyline" };
  }

  async getETA(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return route.duration_seconds;
  }

  async searchPlaces(query: string, location?: Coordinates): Promise<any[]> {
    const places = [
      { id: "mb_1", name: "Mapbox Shopping", address: "Av. Paulista, 1500", lat: -23.562, lng: -46.655 },
      { id: "mb_2", name: "Mapbox Airport", address: "Guarulhos, SP", lat: -23.434, lng: -46.474 },
      { id: "mb_3", name: "Mapbox Park", address: "Av. Pedro Álvares Cabral", lat: -23.588, lng: -46.658 },
    ];
    return places.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.address.toLowerCase().includes(query.toLowerCase()));
  }

  async reverseGeocode(coord: Coordinates): Promise<string> {
    const streets = ["Av. Brasil", "Rua da Praia", "Rua das Flores", "Av. Central", "Rua do Comércio"];
    return `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(Math.random() * 2000)}`;
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    return { id: placeId, name: "Mapbox Detail", address: "Full address", phone: "+55 11 88888-8888", rating: 4.2, photos: [] };
  }

  async getTravelTime(origin: Coordinates, destinations: Coordinates[]): Promise<number[]> {
    return Promise.all(destinations.map(d => this.getETA(origin, d)));
  }

  async snapToRoad(lat: number, lng: number): Promise<Coordinates> {
    return { lat: lat + 0.0002, lng: lng - 0.0002 };
  }

  async getAddressComponents(coord: Coordinates): Promise<{ street: string; number: string; neighborhood: string; city: string; state: string; country: string; zip: string }> {
    return { street: "Av. Brasil", number: "500", neighborhood: "Centro", city: "Rio de Janeiro", state: "RJ", country: "Brasil", zip: "20040-001" };
  }
}
