"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PassengerFavoritesPage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-background p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/dashboard/passenger" className="text-gray-400 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Favoritos</h1>
      <div className="txd-card p-6 text-center">
        <p className="text-3xl mb-3">❤️</p>
        <p className="text-sm text-gray-400">Salve seus endereços favoritos para pedir corrida mais rápido.</p>
        <button onClick={() => router.push("/dashboard/passenger")}
          className="mt-4 bg-primary text-black font-bold px-6 py-3 rounded-full text-sm">
          Solicitar corrida
        </button>
      </div>
    </main>
  );
}
