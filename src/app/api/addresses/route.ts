import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-middleware";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=pt`,
      { headers: { "User-Agent": "TXDAPP/1.0" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt`,
      { headers: { "User-Agent": "TXDAPP/1.0" } }
    );
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
}

const handler = async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (req.method === "GET") {
      const { data: addresses } = await supabase
        .from("addresses")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      return NextResponse.json(addresses || []);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { full_address, type, lat, lng } = body;

      if (!full_address) {
        return NextResponse.json({ error: "full_address é obrigatório" }, { status: 400 });
      }

      let finalLat = lat;
      let finalLng = lng;
      let finalAddress = full_address;

      if (lat !== undefined && lng !== undefined) {
        const reversed = await reverseGeocode(lat, lng);
        finalAddress = reversed;
      } else {
        const coords = await geocodeAddress(full_address);
        if (coords) {
          finalLat = coords.lat;
          finalLng = coords.lng;
        }
      }

      const { data, error } = await supabase
        .from("addresses")
        .insert({
          profile_id: user.id,
          type: type || "other",
          full_address: finalAddress,
          lat: finalLat || null,
          lng: finalLng || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const GET = withRateLimit(handler, "default");
export const POST = withRateLimit(handler, "default");