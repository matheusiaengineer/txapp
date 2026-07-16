import { Coordinates, RouteInfo } from "../engine";

export class GoogleMapsProvider {
  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat * Math.PI/180) * Math.cos(destination.lat * Math.PI/180) * Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    const distanceMeters = distanceKm * 1000;
    const avgSpeedKph = 30 + Math.random() * 20;
    const durationSeconds = (distanceKm / avgSpeedKph) * 3600;
    return { distance_meters: Math.round(distanceMeters), duration_seconds: Math.round(durationSeconds), polyline: "mock_polyline" };
  }

  async getETA(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return route.duration_seconds;
  }

  async searchPlaces(query: string, location?: Coordinates): Promise<any[]> {
    const places = [
      { id: "1", name: "Shopping Center", address: "Av. Paulista, 1000", lat: -23.561, lng: -46.656 },
      { id: "2", name: "Aeroporto Internacional", address: "Guarulhos, SP", lat: -23.435, lng: -46.473 },
      { id: "3", name: "Parque Ibirapuera", address: "Av. Pedro Álvares Cabral", lat: -23.587, lng: -46.657 },
      { id: "4", name: "Praia de Copacabana", address: "Rio de Janeiro", lat: -22.971, lng: -43.182 },
      { id: "5", name: "Centro Histórico", address: "Praça da Sé", lat: -23.550, lng: -46.633 },
    ];
    return places.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.address.toLowerCase().includes(query.toLowerCase()));
  }

  async reverseGeocode(coord: Coordinates): Promise<string> {
    const streets = ["Av. Paulista", "Rua Augusta", "Rua Oscar Freire", "Av. Brigadeiro Faria Lima", "Rua da Consolação"];
    return `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(Math.random() * 2000)}`;
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    return { id: placeId, name: "Place Detail", address: "Full address", phone: "+55 11 99999-9999", rating: 4.5, photos: [] };
  }

  async getTravelTime(origin: Coordinates, destinations: Coordinates[]): Promise<number[]> {
    return Promise.all(destinations.map(d => this.getETA(origin, d)));
  }

  async snapToRoad(lat: number, lng: number): Promise<Coordinates> {
    return { lat: lat + 0.0001, lng: lng - 0.0001 };
  }

  async getAddressComponents(coord: Coordinates): Promise<{ street: string; number: string; neighborhood: string; city: string; state: string; country: string; zip: string }> {
    return { street: "Av. Paulista", number: "1000", neighborhood: "Bela Vista", city: "São Paulo", state: "SP", country: "Brasil", zip: "01310-100" };
  }
}
