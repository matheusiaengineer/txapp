import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { subscription } = await req.json();
    if (!subscription) {
      return NextResponse.json({ error: "Subscription é obrigatório" }, { status: 400 });
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      push_subscription: subscription,
    }, { onConflict: "id" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
