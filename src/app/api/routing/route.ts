import { NextRequest, NextResponse } from "next/server";

const OSRM_BASE = "https://router.project-osrm.org";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin and destination required (lat,lng format)" },
      { status: 400 }
    );
  }

  const [oLat, oLng] = origin.split(",").map(Number);
  const [dLat, dLng] = destination.split(",").map(Number);

  if ([oLat, oLng, dLat, dLng].some(isNaN)) {
    return NextResponse.json(
      { error: "Invalid coordinates. Use lat,lng format." },
      { status: 400 }
    );
  }

  try {
    const url = `${OSRM_BASE}/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&steps=true`;
    const res = await fetch(url, {
      headers: { "User-Agent": "TXAP/1.0" },
    });
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json(
        { error: "No route found", osrm: data },
        { status: 404 }
      );
    }

    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    return NextResponse.json({
      polyline: coords,
      distance: route.distance,
      duration: route.duration,
      legs: route.legs?.map((leg: any) => ({
        distance: leg.distance,
        duration: leg.duration,
        summary: leg.summary,
      })),
    });
  } catch (err) {
    console.error("[ROUTING] OSRM error:", err);
    return NextResponse.json(
      { error: "Failed to fetch route" },
      { status: 500 }
    );
  }
}
