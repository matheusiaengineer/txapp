import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  let next = searchParams.get("next") ?? "/"
  if (!next.startsWith("/") || next.startsWith("//")) next = "/"

  if (code) {
    const cookiesToForward: { name: string; value: string; options?: any }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              cookiesToForward.push({ name, value, options })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      let role = "passenger"
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        if (profile?.role) role = profile.role
      }

      const roleRoute: Record<string, string> = {
          admin: "/admin/dashboard",
          passenger: "/dashboard/passenger",
          driver: "/dashboard/driver",
          driver_moto: "/dashboard/driver",
          driver_car: "/dashboard/driver",
          freight: "/dashboard/driver",
          transporter: "/dashboard/transporter",
          company: "/dashboard/company",
          business: "/dashboard/company",
          employee: "/dashboard/employee",
        }
        const url = new URL(`${origin}${next === "/" ? roleRoute[role] || `/dashboard/${role}` : next}`)
      const res = NextResponse.redirect(url)
      cookiesToForward.forEach(({ name, value, options }) =>
        res.cookies.set(name, value, options)
      )
      return res
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
