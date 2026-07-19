import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

const rpId = process.env.VERCEL_URL || "localhost:3000";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const { data: stored } = await supabase
      .from("biometric_credentials")
      .select("public_key")
      .eq("credential_id", `challenge:${user.id}`)
      .single();

    const expectedChallenge = stored?.public_key
      ? JSON.parse(stored.public_key as string).currentChallenge
      : null;

    if (!expectedChallenge) {
      return NextResponse.json({ error: "Challenge não encontrado. Refaça o registro." }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [
        `https://${rpId}`,
        `http://${rpId}`,
        "http://localhost:3000",
        "capacitor://localhost",
        "https://txap.vercel.app",
      ],
      expectedRPID: rpId,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verificação biométrica falhou" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    const { error } = await supabase.from("biometric_credentials").insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: JSON.stringify(credential),
      counter: credential.counter,
      device_type: body.response?.transports?.includes("internal") ? "platform" : "cross-platform",
    });

    await supabase.from("biometric_credentials")
      .delete()
      .eq("credential_id", `challenge:${user.id}`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao registrar biometria" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
