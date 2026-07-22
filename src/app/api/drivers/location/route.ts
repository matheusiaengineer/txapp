import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { lat, lng } = await req.json()
    if (!lat || !lng) {
      return NextResponse.json({ error: "lat e lng obrigatorios" }, { status: 400 })
    }

    const { error } = await supabase.from("profiles").update({
      lat,
      lng,
      location_updated_at: new Date().toISOString(),
    }).eq("id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: "Localizacao atualizada" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
