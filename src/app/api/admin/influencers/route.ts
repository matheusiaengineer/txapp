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

    const body = await req.json()
    const { data, error } = await supabase.from("influencers").insert({
      ...body,
      created_by: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

    const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores" }, { status: 403 })
    }

    const { id, ...updates } = await req.json()
    const { data, error } = await supabase.from("influencers").update(updates).eq("id", id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
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
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 })

    await supabase.from("influencers").delete().eq("id", id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
