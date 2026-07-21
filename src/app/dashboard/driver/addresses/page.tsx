"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DriverAddressesPage() {
  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/driver" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Endereços</h1>
      <div className="txd-card p-6 text-center">
        <p className="text-sm text-gray-400">Gerencie seus endereços de partida e destino favoritos.</p>
      </div>
    </main>
  );
}
