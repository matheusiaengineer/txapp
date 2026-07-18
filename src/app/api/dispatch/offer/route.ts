import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { offer_id, action } = body;

    if (!offer_id || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "offer_id e action (accept|reject) obrigatórios" }, { status: 400 });
    }

    const { data: offer } = await supabase
      .from("trip_offers")
      .select("id, trip_id, driver_id, status, expires_at")
      .eq("id", offer_id)
      .single();

    if (!offer) {
      return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
    }

    if (offer.driver_id !== user.id) {
      return NextResponse.json({ error: "Oferta não pertence a este motorista" }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "Oferta já foi respondida" }, { status: 400 });
    }

    if (new Date(offer.expires_at) < new Date()) {
      await supabase.from("trip_offers").update({ status: "EXPIRED" }).eq("id", offer_id);
      return NextResponse.json({ error: "Oferta expirou" }, { status: 408 });
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    await supabase.from("trip_offers").update({ status: newStatus }).eq("id", offer_id);

    if (action === "accept") {
      await supabase.from("trips").update({
        driver_id: user.id,
        status: "DRIVER_ACCEPTED",
        accepted_at: new Date().toISOString(),
      }).eq("id", offer.trip_id);

      await supabase.from("trip_offers").update({ status: "EXPIRED" })
        .eq("trip_id", offer.trip_id)
        .neq("id", offer_id);

      return NextResponse.json({ success: true, status: "accepted", tripId: offer.trip_id });
    }

    return NextResponse.json({ success: true, status: "rejected" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao responder oferta" }, { status: 500 });
  }
}
