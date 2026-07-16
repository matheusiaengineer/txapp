import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { credentialId, rawId, attestationObject, clientDataJSON, transports } = await req.json();

    const { error } = await supabase.from("biometric_credentials").insert({
      user_id: user.id,
      credential_id: credentialId,
      public_key: rawId,
      counter: 0,
      device_type: transports?.includes("internal") ? "platform" : "cross-platform",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
