import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const ALLOWED_ORIGINS = ["https://txdapp.com", "http://localhost:3000"];

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { user_id, title, body, type, data } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id e title obrigatórios" }), { status: 400, headers });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_subscription, push_enabled")
      .eq("id", user_id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404, headers });
    }

    await supabase
      .from("notifications")
      .insert({
        user_id,
        type: type || "system",
        title,
        body: body || "",
        data: data || {},
        read: false,
      });

    const pushSubscription = profile?.push_subscription;

    if (pushSubscription && profile?.push_enabled !== false) {
      try {
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

        if (vapidPublicKey && vapidPrivateKey) {
          const webpush = await import("https://esm.sh/web-push@3.6.6");
          webpush.setVapidDetails("mailto:suporte@txdapp.com", vapidPublicKey, vapidPrivateKey);

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title,
              body: body || "",
              icon: "/icon.svg",
              badge: "/icon.svg",
              data: data || {},
            })
          );
        }
      } catch (pushError) {
        console.error("Push notification failed:", pushError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification_sent: true }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers }
    );
  }
});
