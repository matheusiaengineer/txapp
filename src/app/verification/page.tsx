"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerificationPage() {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col p-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Verificação de conta</h1>
        <p className="text-sm text-gray-400 mb-8">
          Sua conta já está verificada. A verificação facial será feita na primeira corrida.
        </p>
        <Link href="/dashboard/passenger" className="bg-primary text-black font-bold px-8 py-3.5 rounded-full">
          Ir para o Dashboard
        </Link>
      </div>
    </main>
  );
}
