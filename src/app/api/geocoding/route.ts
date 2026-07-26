import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api-middleware";

export const dynamic = "force-dynamic"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const limit = searchParams.get("limit") || "5";

  if (!q && (!lat || !lng)) {
    return NextResponse.json(
      { error: "q (query) or lat/lng required" },
      { status: 400 }
    );
  }

  try {
    let url: string;

    if (q) {
      url = `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&accept-language=pt&addressdetails=1`;
    } else {
      url = `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt&addressdetails=1`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "TXAP-App/1.0 (contact@txap.com)",
      },
    });

    if (!q) {
      const data = await res.json();
      return NextResponse.json({
        display: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        address: data.address,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      suggestions: data.map((r: any) => ({
        display: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        type: r.type,
        importance: r.importance,
      })),
    });
  } catch (err) {
    console.error("[GEOCODING] Error:", err);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 }
    );
  }
};

export const GET = withRateLimit(handler, 'default');
