import Link from "next/link"

const benefits = [
  {
    title: "Horários flexíveis",
    desc: "Trabalhe quando quiser. Sem escalas, sem patrão. Você decide seus horários.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Ganhe mais a cada corrida",
    desc: "Tarifas dinâmicas e bônus por horário de pico. Seu esforço vira dinheiro na hora.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Suporte 24h",
    desc: "Equipe dedicada para resolver qualquer problema. Motorista TXAP nunca fica sem resposta.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Seguro incluso",
    desc: "Todos os motoristas têm cobertura durante as corridas. Sua segurança é prioridade.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export function TrabalheConosco() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Trabalhe conosco
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Seja motorista parceiro TXAP
          </h2>
          <p className="text-sm text-muted mt-2 max-w-lg mx-auto">
            Junte-se a milhares de motoristas que já escolheram a liberdade de trabalhar com o TXAP
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {benefits.map((b) => (
            <div key={b.title} className="txd-card p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                {b.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{b.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/auth/register?type=motorista"
            className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full inline-block transition-all hover:scale-[1.02] active:scale-[0.98] txd-green-glow-sm">
            Cadastre-se como motorista
          </Link>
          <p className="text-xs text-muted mt-3">Documentos necessários: CNH, CPF, selfie e foto do veículo</p>
        </div>
      </div>
    </section>
  )
}
