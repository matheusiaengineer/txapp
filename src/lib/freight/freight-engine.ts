import { SERVICE_CATEGORIES } from "@/lib/mobility/service-categories";

export interface FreightQuote {
  id: string;
  categoryId: string;
  categoryName: string;
  weight: number;
  volume: number;
  distanceKm: number;
  basePrice: number;
  weightPrice: number;
  volumePrice: number;
  distancePrice: number;
  insurance: number;
  total: number;
  estimatedPickup: string;
  estimatedDelivery: string;
  requiresRefrigeration: boolean;
  requiresDangerousLicense: boolean;
  requiresSpecialPermit: boolean;
}

export interface FreightShipment {
  id: string;
  quoteId: string;
  status: "pending_pickup" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled";
  pickupAddress: string;
  deliveryAddress: string;
  pickupContact: string;
  deliveryContact: string;
  pickupCode: string;
  deliveryCode: string;
  weight: number;
  volume: number;
  description: string;
  declaredValue: number;
  insuredValue: number;
  photos: string[];
  notes: string;
  createdAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  trackingEvents: { status: string; location: string; timestamp: string; photo?: string }[];
}

export class FreightEngine {
  async calculateQuote(weight: number, volume: number, distanceKm: number, categoryId = "carga_leve", declaredValue = 0, requiresRefrigeration = false): Promise<FreightQuote> {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    const basePrice = category?.baseFare || 10;
    const weightPrice = weight * 0.5;
    const volumePrice = volume * 10;
    const distancePrice = distanceKm * (category?.pricePerKm || 2.5);
    const insurance = declaredValue * 0.01;
    const total = basePrice + weightPrice + volumePrice + distancePrice + insurance;

    return {
      id: "fq_" + Date.now(),
      categoryId, categoryName: category?.namePt || "Frete",
      weight, volume, distanceKm,
      basePrice, weightPrice, volumePrice, distancePrice,
      insurance, total,
      estimatedPickup: new Date(Date.now() + 3600000).toISOString(),
      estimatedDelivery: new Date(Date.now() + distanceKm * 120000).toISOString(),
      requiresRefrigeration,
      requiresDangerousLicense: false,
      requiresSpecialPermit: weight > 3000,
    };
  }

  async createShipment(quote: FreightQuote, pickup: { address: string; contact: string }, delivery: { address: string; contact: string }, description: string, declaredValue: number): Promise<FreightShipment> {
    return {
      id: "fs_" + Date.now(),
      quoteId: quote.id,
      status: "pending_pickup",
      pickupAddress: pickup.address,
      deliveryAddress: delivery.address,
      pickupContact: pickup.contact,
      deliveryContact: delivery.contact,
      pickupCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      deliveryCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      weight: quote.weight,
      volume: quote.volume,
      description, declaredValue,
      insuredValue: declaredValue,
      photos: [], notes: "",
      createdAt: new Date().toISOString(),
      trackingEvents: [{ status: "shipment_created", location: pickup.address, timestamp: new Date().toISOString() }],
    };
  }

  async updateStatus(shipmentId: string, status: FreightShipment["status"], location: string, photo?: string): Promise<FreightShipment> {
    const event = { status, location, timestamp: new Date().toISOString(), photo };
    console.log(`[Freight] Shipment ${shipmentId} -> ${status} at ${location}`);
    return { id: shipmentId } as FreightShipment;
  }
}

export const freightEngine = new FreightEngine();
