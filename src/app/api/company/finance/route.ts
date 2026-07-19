import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "overview";

    if (req.method === "GET") {
      const { data: trips } = await supabase
        .from("trips")
        .select("created_at, estimated_fare, final_fare, status, driver_id, id")
        .or(`passenger_id.eq.${user.id},and(driver_id.in.(select id from driver_profiles where company_id = '${company.id}'))`)
        .order("created_at", { ascending: false });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthTrips = (trips || []).filter((t: any) => new Date(t.created_at) >= monthStart);
      const completedTrips = (trips || []).filter((t: any) => t.status === "PAYMENT_CONFIRMED" || t.status === "FINISHED" || t.status === "COMPLETED");

      const totalRevenue = completedTrips.reduce((sum: number, t: any) => sum + (t.final_fare || t.estimated_fare || 0), 0);
      const monthRevenue = monthTrips.reduce((sum: number, t: any) => sum + (t.final_fare || t.estimated_fare || 0), 0);
      const platformFees = totalRevenue * 0.1;
      const netRevenue = totalRevenue - platformFees;

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, deposit_required, is_qualified")
        .eq("profile_id", user.id)
        .maybeSingle();

      const { data: invoices } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const mappedInvoices = (invoices || []).map((t: any) => ({
        id: t.id,
        period: new Date(t.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        amount: t.amount,
        status: t.status,
        type: t.type,
        description: t.description,
        date: new Date(t.created_at).toLocaleDateString("pt-BR"),
      }));

      return NextResponse.json({
        overview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          monthRevenue: Math.round(monthRevenue * 100) / 100,
          platformFees: Math.round(platformFees * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          totalTrips: completedTrips.length,
          monthTrips: monthTrips.length,
        },
        wallet: wallet ? { balance: 0, depositRequired: wallet.deposit_required, isQualified: wallet.is_qualified } : null,
        transactions: mappedInvoices,
      });
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const GET = withRateLimit(handler, "default");
