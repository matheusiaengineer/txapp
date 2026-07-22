import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  try {
    const { userId, updates } = await req.json()

    const { data: profile } = await supabase
      .from("profiles")
      .select("cpf, phone, can_change_name, name_last_changed_at, full_name")
      .eq("id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    if (updates.cpf !== undefined && updates.cpf !== profile.cpf) {
      return NextResponse.json({ error: "CPF não pode ser alterado" }, { status: 403 })
    }

    if (updates.phone !== undefined && updates.phone !== profile.phone) {
      return NextResponse.json({ error: "Celular não pode ser alterado" }, { status: 403 })
    }

    if (updates.full_name && updates.full_name !== profile.full_name) {
      if (!profile.can_change_name) {
        return NextResponse.json({ error: "Nome só pode ser alterado uma vez a cada 30 dias" }, { status: 403 })
      }
      updates.can_change_name = false
      updates.name_last_changed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
