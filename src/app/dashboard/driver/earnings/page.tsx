"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { SkeletonStats, SkeletonList } from "@/components/ui/skeleton";
import { useUser } from "@/lib/hooks/use-user";
import { useDriverData } from "@/lib/hooks/use-driver-data";

export default function EarningsPage() {
  const { user, loading: userLoading } = useUser();
  const { trips, earnings, loading: dataLoading } = useDriverData(user?.id);
  const loading = userLoading || dataLoading;

  const completedTrips = trips.filter(
    (t: any) => t.status === "PAYMENT_CONFIRMED" || t.status === "COMPLETED" || t.status === "FINISHED"
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5" style={{paddingBottom:"calc(1.5rem + env(safe-area-inset-bottom,0px))"}}>
        <h1 className="text-2xl font-bold">Ganhos</h1>

        {loading ? (
          <>
            <SkeletonStats count={3} />
            <SkeletonList count={3} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 text-primary mb-2"><DollarSign className="w-5 h-5" /><span className="text-sm">Hoje</span></div>
                <div className="text-3xl font-bold">R$ {earnings.today.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{completedTrips.length} corridas</div>
              </div>
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 text-primary mb-2"><Calendar className="w-5 h-5" /><span className="text-sm">Esta Semana</span></div>
                <div className="text-3xl font-bold">R$ {earnings.week.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{completedTrips.length} corridas</div>
              </div>
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 text-primary mb-2"><TrendingUp className="w-5 h-5" /><span className="text-sm">Este Mês</span></div>
                <div className="text-3xl font-bold">R$ {earnings.month.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{completedTrips.length} corridas</div>
              </div>
            </div>
            <div className="glass-panel p-5">
              <h2 className="font-semibold mb-4">Últimos Ganhos</h2>
              <div className="space-y-3">
                {completedTrips.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum ganho ainda</p>
                ) : (
                  completedTrips.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-card-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-primary" /></div>
                        <div>
                          <div className="text-sm font-medium">R$ {(t.final_fare || t.estimated_fare || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{t.origin_address?.slice(0, 20)}...</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
