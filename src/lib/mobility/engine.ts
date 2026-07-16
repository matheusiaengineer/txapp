/**
 * TXD Mobility Engine (Abstraction Layer)
 * 
 * Este arquivo atua como o cérebro central para todas as operações de mapa,
 * cálculo de rotas e despacho. NENHUM componente da interface deve importar 
 * o Google Maps diretamente. Tudo passa por esta camada.
 */

import { GoogleMapsProvider } from "./providers/google";
import { MapboxProvider } from "./providers/mapbox";

export type Coordinates = { lat: number; lng: number };
export type RouteInfo = { distance_meters: number; duration_seconds: number; polyline: string };
export type ProviderType = "google" | "mapbox" | "openstreetmap";

interface IMobilityProvider {
  calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo>;
  getETA(origin: Coordinates, destination: Coordinates): Promise<number>;
  searchPlaces(query: string, location?: Coordinates): Promise<any[]>;
  reverseGeocode(coord: Coordinates): Promise<string>;
}

class MobilityEngine {
  private provider: IMobilityProvider;

  constructor(providerType: ProviderType = "google") {
    // Factory pattern para trocar de provedor sem alterar o resto do app
    switch (providerType) {
      case "google":
        this.provider = new GoogleMapsProvider();
        break;
      case "mapbox":
        this.provider = new MapboxProvider();
        break;
      default:
        this.provider = new GoogleMapsProvider();
    }
  }

  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    return this.provider.calculateRoute(origin, destination);
  }

  async getETA(origin: Coordinates, destination: Coordinates): Promise<number> {
    return this.provider.getETA(origin, destination);
  }

  async searchPlaces(query: string, location?: Coordinates) {
    return this.provider.searchPlaces(query, location);
  }

  async getAddress(coord: Coordinates): Promise<string> {
    return this.provider.reverseGeocode(coord);
  }

  /**
   * TXD Smart Dispatcher (Algoritmo base)
   * Decide qual o melhor motorista baseado na proximidade, 
   * tipo de veículo necessário (carga/passageiro) e disponibilidade.
   */
  async findBestDriver(pickup: Coordinates, requiredCategoryId: string) {
    // 1. Fazer query no banco (via Supabase) para buscar drivers online em raio de 5km
    // 2. Filtrar drivers que possuem o veículo do categoryId correspondente
    // 3. Chamar this.getETA() para os 5 mais próximos
    // 4. Retornar o driver com menor ETA e melhor nota
    console.log("Executando TXD Smart Dispatcher para categoria:", requiredCategoryId);
    return null; // A ser implementado
  }
}

// Singleton export
export const mobilityEngine = new MobilityEngine();
