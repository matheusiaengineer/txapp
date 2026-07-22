import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("global_config").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const config: Record<string, any> = {}
  for (const row of data || []) {
    config[row.key] = row.value
  }
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { data: admin } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const isTopAdmin = admin.email === process.env.ADMIN_EMAIL
    const updates = await req.json()

    const protectedKeys = ["platform_commission"]
    for (const [key, value] of Object.entries(updates)) {
      if (protectedKeys.includes(key) && !isTopAdmin) {
        return NextResponse.json({ error: "Apenas Matheus16k pode alterar esta configuracao" }, { status: 403 })
      }
      const { error: upsertError } = await supabase.from("global_config").upsert({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
