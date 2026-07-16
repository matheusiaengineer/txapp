/**
 * TXD Event Bus
 * 
 * Camada de comunicação centralizada. Módulos não conversam diretamente,
 * eles emitem eventos aqui. Isso desacopla o sistema e permite plugar
 * analytics, notificações e automações facilmente no futuro.
 */

type EventMap = {
  "driver.online": { driverId: string; lat: number; lng: number };
  "driver.offline": { driverId: string };
  "driver.location.updated": { driverId: string; lat: number; lng: number; speed: number };
  "trip.created": { tripId: string; passengerId: string };
  "trip.search.started": { tripId: string };
  "trip.cancelled": { tripId: string; reason: string };
  "trip.accepted": { tripId: string; driverId: string };
  "trip.started": { tripId: string };
  "trip.completed": { tripId: string; fare: number };
  "trip.driver.notified": { tripId: string; driverId: string };
  "trip.driver.accepted": { tripId: string; driverId: string };
  "trip.driver.timeout": { tripId: string; driverId: string };
  "payment.authorized": { tripId: string; amount: number };
  "payment.completed": { tripId: string; amount: number };
  "document.approved": { documentId: string; driverId: string };
};

type EventName = keyof EventMap;
type EventHandler<T extends EventName> = (payload: EventMap[T]) => void;

class TXDEventBus {
  private listeners: { [K in EventName]?: EventHandler<K>[] } = {};

  on<T extends EventName>(event: T, handler: EventHandler<T>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);
  }

  off<T extends EventName>(event: T, handler: EventHandler<T>) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter((h) => h !== handler) as any;
  }

  emit<T extends EventName>(event: T, payload: EventMap[T]) {
    console.log(`[EVENT BUS] 📣 Emitindo evento: ${event}`, payload);
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EVENT BUS] ❌ Erro no handler do evento ${event}:`, error);
        }
      });
    }
  }
}

export const eventBus = new TXDEventBus();
