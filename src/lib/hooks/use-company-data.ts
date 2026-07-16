"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface CompanyData {
  id: string;
  corporate_name: string;
  trade_name?: string;
  cnpj: string;
  responsible_name: string;
  address?: string;
  opening_hours?: string;
  service_description?: string;
  status: string;
}

export function useCompanyData(userId: string | undefined) {
  const supabase = createClient();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeDrivers, setActiveDrivers] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      supabase.from("companies").select("*").eq("id", userId).single(),
      supabase.from("driver_profiles").select("id, current_live_status").eq("company_id", userId),
      supabase.from("trips").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("id").eq("id", userId),
    ]).then(([compRes, driversRes, tripsRes]) => {
      if (compRes.data) setCompany(compRes.data as CompanyData);

      if (driversRes.data) {
        setTotalDrivers(driversRes.data.length);
        setActiveDrivers(driversRes.data.filter((d: any) => d.current_live_status === "online").length);
      }

      if (tripsRes.data) {
        setRecentDeliveries(tripsRes.data.slice(0, 5));
        const now = new Date();
        const today = tripsRes.data.filter((t: any) => new Date(t.created_at).toDateString() === now.toDateString());
        setTodayCount(today.length);
        const completed = tripsRes.data.filter((t: any) => t.status === "PAYMENT_CONFIRMED" || t.status === "COMPLETED");
        setSuccessRate(tripsRes.data.length > 0 ? (completed.length / tripsRes.data.length) * 100 : 0);
        const monthTrips = tripsRes.data.filter((t: any) => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setMonthlyCount(monthTrips.length);
        setRevenue(completed.reduce((acc: number, t: any) => acc + (t.final_fare || t.estimated_fare || 0), 0));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  return { company, activeDrivers, totalDrivers, recentDeliveries, todayCount, successRate, monthlyCount, revenue, loading };
}
