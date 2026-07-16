import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;
    const challenge = generateChallenge();

    if (action === "register_start") {
      await supabase.from("biometric_credentials").update({
        counter: 0,
      }).eq("user_id", user.id);

      return NextResponse.json({ challenge });
    }

    if (action === "login_start") {
      const { data: credentials } = await supabase
        .from("biometric_credentials")
        .select("credential_id, device_type")
        .eq("user_id", user.id);

      const creds = (credentials || []).map((c: any) => ({
        id: c.credential_id,
        transports: ["internal"],
      }));

      return NextResponse.json({ challenge, credentials: creds });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
