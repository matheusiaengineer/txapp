import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const cookiesToForward: { name: string; value: string; options?: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookiesToForward.push({ name, value, options })
          })
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // If Supabase is unreachable, allow the request through
    // Protected routes will handle auth on the client side
  }

  const pathname = request.nextUrl.pathname

  cookiesToForward.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  )

  const protectedRoutes = ["/dashboard", "/admin", "/payment", "/settings", "/ride"]
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]
  if (user && authRoutes.some(r => pathname.startsWith(r))) {
    let role = "passenger"
    let accountType = "passenger"
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_type")
        .eq("id", user.id)
        .limit(1)
        .single()
      if (profile?.role) role = profile.role
      if (profile?.account_type) accountType = profile.account_type
    } catch {
      // If profiles table doesn't exist, default to passenger
    }

      const roleRoutes: Record<string, string> = {
      passenger: "/dashboard/passenger",
      driver_moto: "/dashboard/driver",
      driver_car: "/dashboard/driver",
      freight: "/dashboard/driver",
      driver: "/dashboard/driver", // Legacy drivers
      transporter: "/dashboard/transporter", // For compatibility
      business: "/dashboard/company",
      company: "/dashboard/company", // Legacy companies
      employee: "/dashboard/employee",
      admin: "/admin",
    }
    
    // Prefer account_type if set, otherwise use role
    const targetRoute = roleRoutes[accountType] || roleRoutes[role] || "/dashboard/passenger"

    const url = request.nextUrl.clone()
    url.pathname = targetRoute
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
