import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Rotas protegidas
  const protectedRoutes = ["/dashboard", "/admin", "/payment", "/settings", "/ride"];
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Se logado e tentando acessar auth, redireciona pro dashboard
  const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];
  if (user && authRoutes.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "passenger";
    const roleRoutes: Record<string, string> = {
      passenger: "/dashboard/passenger",
      driver: "/dashboard/driver",
      company: "/dashboard/company",
      transporter: "/dashboard/transporter",
      employee: "/dashboard/employee",
      admin: "/admin",
    };

    const url = request.nextUrl.clone();
    url.pathname = roleRoutes[role] || "/dashboard/passenger";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
