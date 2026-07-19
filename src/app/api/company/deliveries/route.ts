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

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const search = searchParams.get("search");

      let query = supabase
        .from("loads")
        .select("*, bids(*)")
        .eq("customer_id", company.id)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`origin_address.ilike.%${search}%,dest_address.ilike.%${search}%`);
      }

      const { data: deliveries } = await query;

      const mapped = (deliveries || []).map((d: any) => ({
        id: d.id,
        origin: d.origin_address,
        destination: d.dest_address,
        description: d.description,
        weight: d.weight_kg,
        status: d.status,
        budgetMin: d.budget_min,
        budgetMax: d.budget_max,
        pickupDate: d.pickup_date,
        deliveryDate: d.delivery_date,
        bidCount: d.bids?.length || 0,
        acceptedBidId: d.accepted_bid_id,
        createdAt: d.created_at,
      }));

      return NextResponse.json(mapped);
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const GET = withRateLimit(handler, "default");
