import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";
import { generateRegistrationOptions, generateAuthenticationOptions } from "@simplewebauthn/server";

const RP_NAME = "TXDAPP";
const rpId = process.env.VERCEL_URL || "localhost:3000";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();
    const { action } = body;

    if (action === "register_start") {
      if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }

      const { data: existing } = await supabase
        .from("biometric_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      const excludeCredentials = (existing || []).map((c: any) => ({
        id: c.credential_id,
        type: "public-key" as const,
        transports: ["internal"] as AuthenticatorTransport[],
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpId,
        userName: user.email || user.id,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
      });

      await supabase.from("biometric_credentials").upsert({
        user_id: user.id,
        credential_id: `challenge:${user.id}`,
        public_key: JSON.stringify({ currentChallenge: options.challenge }),
        counter: 0,
        device_type: "challenge",
      }, { onConflict: "credential_id" });

      return NextResponse.json(options);
    }

    if (action === "login_start") {
      const options = await generateAuthenticationOptions({
        rpID: rpId,
        userVerification: "required",
        allowCredentials: [],
      });

      await supabase.from("biometric_credentials").upsert({
        user_id: "challenge-storage",
        credential_id: "current-challenge",
        public_key: JSON.stringify({ currentChallenge: options.challenge }),
        counter: 0,
        device_type: "challenge",
      }, { onConflict: "credential_id" });

      return NextResponse.json(options);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
