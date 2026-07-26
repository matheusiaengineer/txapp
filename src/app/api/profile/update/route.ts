import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { userId, updates } = await req.json()

    if (userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const ALLOWED_FIELDS = ["full_name", "email", "language", "country", "accepted_terms", "push_subscription", "can_change_name", "name_last_changed_at"]
    const safeUpdates: Record<string, any> = {}
    for (const key of Object.keys(updates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        safeUpdates[key] = updates[key]
      }
    }
    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 })
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await admin
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

    const { error } = await admin
      .from("profiles")
      .update(safeUpdates)
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
