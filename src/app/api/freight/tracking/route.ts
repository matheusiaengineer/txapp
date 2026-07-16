import { NextRequest, NextResponse } from "next/server";

function generateId(): string {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = generateId();

    const store = (globalThis as any).__txd_tracking || {};
    store[code] = {
      id: code,
      loadId: body.load_id,
      status: body.status || "pending",
      origin: body.origin,
      destination: body.destination,
      driverName: body.driver_name || "Motorista",
      vehicleType: body.vehicle_type || "Veículo",
      vehiclePlate: body.vehicle_plate || "",
      estimatedDelivery: body.estimated_delivery || "",
      currentLocation: body.current_location || "",
      events: [{ status: "Carga registrada", location: body.origin, time: new Date().toLocaleString("pt-BR") }],
      createdAt: new Date().toISOString(),
    };
    (globalThis as any).__txd_tracking = store;

    return NextResponse.json({ code, url: `/rastreio/${code}` });
  } catch {
    return NextResponse.json({ error: "Erro ao criar rastreamento" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

  const store = (globalThis as any).__txd_tracking || {};
  const data = store[code];

  if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(data);
}
