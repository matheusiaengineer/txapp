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

    const body = await req.json();
    const { negotiation_id, action, counter_price, message } = body;

    if (!negotiation_id || !action) {
      return NextResponse.json({ error: "negotiation_id e action obrigatórios" }, { status: 400 });
    }

    if (!["accepted", "rejected", "countered"].includes(action)) {
      return NextResponse.json({ error: "action deve ser accepted, rejected ou countered" }, { status: 400 });
    }

    const { data: negotiation } = await supabase
      .from("negotiations")
      .select("*")
      .eq("id", negotiation_id)
      .single();

    if (!negotiation) {
      return NextResponse.json({ error: "Negociação não encontrada" }, { status: 404 });
    }

    if (negotiation.status !== "pending" && negotiation.status !== "countered") {
      return NextResponse.json({ error: "Negociação já foi respondida" }, { status: 400 });
    }

    if (negotiation.expires_at && new Date(negotiation.expires_at) < new Date()) {
      await supabase.from("negotiations").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", negotiation_id);
      return NextResponse.json({ error: "Negociação expirou" }, { status: 400 });
    }

    const isDriver = negotiation.driver_id === user.id;
    const isPassenger = negotiation.passenger_id === user.id;

    if (action === "accepted") {
      if (!isDriver && !isPassenger) {
        return NextResponse.json({ error: "Apenas motorista ou passageiro pode aceitar" }, { status: 403 });
      }
      const updates: Record<string, any> = { status: "accepted", updated_at: new Date().toISOString() };
      if (message) updates.driver_message = message;
      if (counter_price) updates.counter_price = counter_price;

      const { data, error } = await supabase
        .from("negotiations")
        .update(updates)
        .eq("id", negotiation_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (action === "rejected") {
      if (!isDriver && !isPassenger) {
        return NextResponse.json({ error: "Apenas motorista ou passageiro pode recusar" }, { status: 403 });
      }
      const { data, error } = await supabase
        .from("negotiations")
        .update({ status: "rejected", driver_message: message || null, updated_at: new Date().toISOString() })
        .eq("id", negotiation_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (action === "countered") {
      if (!isDriver) {
        return NextResponse.json({ error: "Apenas motorista pode contra-ofertar" }, { status: 403 });
      }
      if (!counter_price || counter_price <= 0) {
        return NextResponse.json({ error: "counter_price obrigatório para contra-oferta" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("negotiations")
        .update({
          status: "countered",
          counter_price,
          driver_message: message || null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq("id", negotiation_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao responder negociação" }, { status: 500 });
  }
};

export const PATCH = withRateLimit(handler, "default");