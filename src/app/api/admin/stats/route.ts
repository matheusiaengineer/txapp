import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const [totalProfiles, totalDrivers, onlineDrivers, todayTrips, todayRevenue, pendingVerifications] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("driver_profiles").select("id", { count: "exact", head: true }),
    supabase.from("driver_heartbeats").select("id", { count: "exact", head: true }).eq("status", "ONLINE"),
    supabase.from("trips").select("id, estimated_fare, final_fare").gte("created_at", todayStr),
    supabase.from("trips").select("final_fare").gte("created_at", todayStr),
    supabase.from("driver_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const todayRevenueVal = (todayRevenue.data || []).reduce((acc, t: any) => acc + (t.final_fare || 0), 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weeklyRevenue: { day: string; value: number }[] = [];
  for (const day of last7Days) {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const { data } = await supabase
      .from("trips")
      .select("final_fare")
      .gte("created_at", day.toISOString())
      .lt("created_at", nextDay.toISOString());
    weeklyRevenue.push({
      day: day.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
      value: (data || []).reduce((acc: number, t: any) => acc + (t.final_fare || 0), 0),
    });
  }

  const { data: recentTripsData } = await supabase
    .from("trips")
    .select("id, passenger_id, driver_id, origin_address, dest_address, estimated_fare, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentTrips = await Promise.all((recentTripsData || []).map(async (t: any) => {
    let passengerName = "Passageiro";
    let driverName = "Motorista";
    if (t.passenger_id) {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", t.passenger_id).single();
      if (p) passengerName = p.full_name;
    }
    if (t.driver_id) {
      const { data: d } = await supabase.from("profiles").select("full_name").eq("id", t.driver_id).single();
      if (d) driverName = d.full_name;
    }
    return {
      id: t.id?.slice(0, 8),
      passenger: passengerName,
      driver: driverName,
      route: `${t.origin_address?.slice(0, 20)} → ${t.dest_address?.slice(0, 20)}`,
      amount: t.estimated_fare ? `R$ ${t.estimated_fare.toFixed(2)}` : "—",
      status: t.status,
    };
  }));

  const { data: pendingVerificationsData } = await supabase
    .from("driver_profiles")
    .select("id, cpf, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(4);

  const pendingVerificationsList = await Promise.all((pendingVerificationsData || []).map(async (v: any) => {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", v.id).single();
    return {
      id: `DP-${v.id?.slice(0, 6)}`,
      name: p?.full_name || "Motorista",
      document: `CPF: ${v.cpf}`,
      date: new Date(v.created_at).toLocaleDateString("pt-BR"),
      status: "pending",
      driverId: v.id,
    };
  }));

  return NextResponse.json({
    totalUsers: totalProfiles.count || 0,
    totalDrivers: totalDrivers.count || 0,
    onlineNow: onlineDrivers.count || 0,
    todayTrips: todayTrips.count || 0,
    todayRevenue: todayRevenueVal,
    pendingVerificationsCount: pendingVerifications.count || 0,
    weeklyRevenue,
    recentTrips,
    pendingVerifications: pendingVerificationsList,
  });
}
