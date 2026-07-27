import Link from "next/link"

export function SejaRemunerado() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
              Para motoristas
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
              Seja remunerado instantaneamente a cada entrega
            </h2>
            <p className="text-base text-muted leading-relaxed mb-6">
              No TXAP, você recebe por cada corrida ou entrega realizada. Sem esperar fim de semana, sem burocracia.
              O dinheiro cai na sua conta na hora.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Pagamento imediato após cada corrida",
                "Saques para sua conta bancária ou PIX",
                "Carteira digital TXAP com saldo em tempo real",
                "Sem taxas escondidas — você sabe exatamente quanto ganhou",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                  <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?type=motoboy"
              className="bg-primary hover:bg-primary-hover text-white font-bold px-8 py-3.5 rounded-full inline-block transition-all hover:scale-[1.02] active:scale-[0.98]">
              Quero ganhar dinheiro
            </Link>
          </div>
          <div className="relative">
            <div className="txd-card p-8 bg-white max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-semibold text-foreground">Saldo TXAP</span>
                </div>
                <span className="text-xs text-muted">Atualizado agora</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 127,50</span>
                <span className="text-sm text-muted ml-2">disponível</span>
              </div>
              <div className="space-y-3">
                {[
                  { desc: "Corrida - Centro → Zona Sul", value: "+ R$ 24,50", time: "10 min atrás" },
                  { desc: "Entrega - Restaurante XP", value: "+ R$ 15,00", time: "25 min atrás" },
                  { desc: "Corrida - Aeroporto", value: "+ R$ 38,00", time: "1h atrás" },
                ].map((t) => (
                  <div key={t.desc} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.desc}</div>
                      <div className="text-xs text-muted">{t.time}</div>
                    </div>
                    <span className="text-sm font-bold text-primary">{t.value}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all">
                Sacar agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
