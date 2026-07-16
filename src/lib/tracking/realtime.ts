import { createClient } from "../supabase/browser";
import { eventBus } from "../events/bus";

export class RealtimeTrackingService {
  private supabase = createClient();
  private channel: ReturnType<typeof this.supabase.channel> | null = null;

  /**
   * Assina atualizações em tempo real da tabela de heartbeats.
   * Usado pelo App do Passageiro para ver os carrinhos movendo no mapa.
   */
  subscribeToNearbyDrivers(cityId: string, onUpdate: (payload: any) => void) {
    // Usando Postgres Changes para simplicidade. 
    // Em produção extrema, usar Supabase Presence + Broadcast.
    this.channel = this.supabase
      .channel('public:driver_heartbeats')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'driver_heartbeats' },
        (payload) => {
          // Quando o banco atualiza, propagamos para o UI do passageiro
          onUpdate(payload.new);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeTracking = new RealtimeTrackingService();
