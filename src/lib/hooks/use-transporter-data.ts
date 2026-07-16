"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export function useTransporterData(userId: string | undefined) {
  const supabase = createClient();
  const [activeFreights, setActiveFreights] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [earningsToday, setEarningsToday] = useState(0);
  const [earningsWeek, setEarningsWeek] = useState(0);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      supabase.from("trips").select("*").eq("driver_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("ratings").select("score").eq("rated_profile_id", userId),
    ]).then(([tripsRes, ratingsRes]) => {
      if (tripsRes.data) {
        setRecentTrips(tripsRes.data);
        const now = new Date();
        const active = tripsRes.data.filter((t: any) => t.status === "ACCEPTED" || t.status === "IN_PROGRESS" || t.status === "DRIVER_ARRIVED");
        setActiveFreights(active.length);
        const completed = tripsRes.data.filter((t: any) => t.status === "PAYMENT_CONFIRMED" || t.status === "COMPLETED");
        const todayTrips = completed.filter((t: any) => new Date(t.created_at).toDateString() === now.toDateString());
        setTodayDeliveries(todayTrips.length);
        const todayEarnings = todayTrips.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0);
        setEarningsToday(todayEarnings);
        const weekTrips = completed.filter((t: any) => {
          const d = new Date(t.created_at);
          return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
        });
        setEarningsWeek(weekTrips.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0));
      }
      if (ratingsRes.data && ratingsRes.data.length > 0) {
        setAverageRating(ratingsRes.data.reduce((acc: number, r: any) => acc + r.score, 0) / ratingsRes.data.length);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  return { activeFreights, todayDeliveries, earningsToday, earningsWeek, recentTrips, averageRating, loading };
}
