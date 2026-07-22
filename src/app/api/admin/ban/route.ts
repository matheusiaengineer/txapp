import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { data: admin } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const { userId, reason, banDevice } = await req.json()
    if (!userId || !reason) {
      return NextResponse.json({ error: "userId e reason obrigatorios" }, { status: 400 })
    }

    const { data: target } = await supabase.from("profiles").select("id, device_fingerprint").eq("id", userId).single()
    if (!target) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 })

    const { error: banError } = await supabase.from("profiles").update({
      is_banned: true,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
      banned_by: user.id,
    }).eq("id", userId)

    if (banError) return NextResponse.json({ error: banError.message }, { status: 500 })

    if (banDevice && target.device_fingerprint) {
      const { data: existing } = await supabase.from("banned_devices").select("id").eq("device_fingerprint", target.device_fingerprint).maybeSingle()
      if (!existing) {
        await supabase.from("banned_devices").insert({
          device_fingerprint: target.device_fingerprint,
          reason,
          banned_by: user.id,
        })
      }
    }

    return NextResponse.json({ success: true, bannedAt: new Date().toISOString(), bannedBy: user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 })

    await supabase.from("profiles").update({
      is_banned: false,
      ban_reason: null,
      banned_at: null,
      banned_by: null,
    }).eq("id", userId)

    return NextResponse.json({ success: true, message: "Usuario desbanido" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
