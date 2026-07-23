import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: URL) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit") || "10"
    const offset = searchParams.get("offset") || "0"

    const supabase = await createClient()
    let query = supabase
      .from("drone_captures")
      .select("id, location, heading, altitude, images, capture_type, user_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: count,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch drone captures" }, { status: 500 })
  }
}