"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";
import { useUser } from "@/lib/hooks/use-user";
import { createClient } from "@/lib/supabase/browser";

export default function TripsPage() {
  const { user } = useUser();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("trips")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setTrips(data);
        setLoading(false);
      });
  }, [user?.id]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}>
        <h1 className="text-2xl font-bold">Viagens</h1>

        {loading ? (
          <SkeletonList count={3} />
        ) : trips.length === 0 ? (
          <div className="glass-panel p-8 text-center text-gray-500">
            <p className="font-semibold">Nenhuma viagem ainda</p>
            <p className="text-xs mt-1">Suas corridas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((t: any) => (
              <div key={t.id} className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-medium text-primary">{t.status}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-primary" />{t.origin_address}</div>
                  <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-red-400" />{t.dest_address}</div>
                </div>
                <div className="mt-2 text-right font-bold text-primary">R$ {(t.final_fare || t.estimated_fare || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
