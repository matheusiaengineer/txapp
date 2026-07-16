import { NextRequest, NextResponse } from "next/server";

const STORAGE_KEY = "txd_qualified_clients";

function getQualified(): string[] {
  if (typeof globalThis !== "undefined") {
    return (globalThis as any).__txd_qualified || [];
  }
  return [];
}

function addQualified(userId: string) {
  const q = getQualified();
  if (!q.includes(userId)) {
    q.push(userId);
    (globalThis as any).__txd_qualified = q;
  }
}

function getBalance(userId: string): number {
  const store = (globalThis as any).__txd_wallets || {};
  return store[userId] || 0;
}

function setBalance(userId: string, amount: number): number {
  const store = (globalThis as any).__txd_wallets || {};
  store[userId] = amount;
  (globalThis as any).__txd_wallets = store;
  return amount;
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("user_id") || "anon";
  const serviceType = request.nextUrl.searchParams.get("service") || "carro";

  const required: Record<string, number> = { moto: 15, carro: 25, freight: 30 };
  const requiredDeposit = required[serviceType] || 25;
  const balance = getBalance(userId);
  const qualified = balance >= requiredDeposit;
  const qualifiedUsers = getQualified();

  return NextResponse.json({
    qualified,
    balance,
    requiredDeposit,
    serviceType,
    canRequest: qualified,
    missingAmount: qualified ? 0 : requiredDeposit - balance,
    qualifiedCount: qualifiedUsers.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id || "anon";
    const amount = body.amount || 0;
    const serviceType = body.service_type || "carro";

    if (amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const required: Record<string, number> = { moto: 15, carro: 25, freight: 30 };
    const requiredDeposit = required[serviceType] || 25;
    const currentBalance = getBalance(userId);
    const newBalance = currentBalance + amount;

    setBalance(userId, newBalance);

    if (newBalance >= requiredDeposit) {
      addQualified(userId);
    }

    const qualified = newBalance >= requiredDeposit;

    return NextResponse.json({
      success: true,
      balance: newBalance,
      deposited: amount,
      qualified,
      requiredDeposit,
      serviceType,
      canRequest: qualified,
      missingAmount: qualified ? 0 : requiredDeposit - newBalance,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao processar depósito" }, { status: 500 });
  }
}
