import { NextRequest, NextResponse } from "next/server";

const STORAGE_KEY = "txd_freight_loads";

function getStorage() {
  if (typeof globalThis !== "undefined") {
    return (globalThis as any).__txd_freight_loads || [];
  }
  return [];
}

function setStorage(data: any[]) {
  if (typeof globalThis !== "undefined") {
    (globalThis as any).__txd_freight_loads = data;
  }
}

function generateId(): string {
  return "fl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || "anon";

    const load = {
      id: generateId(),
      customer_id: userId,
      origin_address: body.origin_address,
      origin_lat: body.origin_lat || null,
      origin_lng: body.origin_lng || null,
      dest_address: body.dest_address,
      dest_lat: body.dest_lat || null,
      dest_lng: body.dest_lng || null,
      description: body.description,
      weight_kg: body.weight_kg || null,
      volume_m3: body.volume_m3 || null,
      vehicle_type: body.vehicle_type || "carro",
      photos: body.photos || [],
      pickup_date: body.pickup_date || null,
      delivery_date: body.delivery_date || null,
      budget_min: body.budget_min || null,
      budget_max: body.budget_max || null,
      status: "open",
      accepted_bid_id: null,
      created_at: new Date().toISOString(),
      customer_name: body.customer_name || "Cliente",
      customer_phone: body.customer_phone || "",
    };

    const loads = getStorage();
    loads.push(load);
    setStorage(loads);

    return NextResponse.json({ load });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar carga" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");

  let loads = getStorage();

  if (status) {
    loads = loads.filter((l: any) => l.status === status);
  }
  if (customerId) {
    loads = loads.filter((l: any) => l.customer_id === customerId);
  }

  loads.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ loads });
}
