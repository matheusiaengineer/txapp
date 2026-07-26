import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { offer_id, action } = await req.json()
    if (!offer_id || !action) {
      return NextResponse.json({ error: "offer_id e action obrigatorios" }, { status: 400 })
    }

    const { data: offer, error: offerErr } = await supabase
      .from("trip_offers")
      .select("id, trip_id, driver_id, status, expires_at")
      .eq("id", offer_id)
      .single()

    if (offerErr || !offer) {
      return NextResponse.json({ error: "Oferta nao encontrada" }, { status: 404 })
    }

    if (offer.driver_id !== user.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 })
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "Oferta ja processada" }, { status: 400 })
    }

    if (new Date(offer.expires_at) < new Date()) {
      await supabase.from("trip_offers").update({ status: "expired" }).eq("id", offer_id)
      return NextResponse.json({ error: "Oferta expirada" }, { status: 400 })
    }

    if (action === "accept") {
      await supabase.from("trip_offers").update({ status: "accepted" }).eq("id", offer_id)
      await supabase.from("trips").update({
        status: "DRIVER_ACCEPTED",
        driver_id: user.id,
        accepted_at: new Date().toISOString(),
      }).eq("id", offer.trip_id)
      return NextResponse.json({ success: true, tripId: offer.trip_id })
    }

    if (action === "reject") {
      await supabase.from("trip_offers").update({ status: "rejected" }).eq("id", offer_id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
