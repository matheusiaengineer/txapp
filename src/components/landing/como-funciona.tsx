const steps = [
  { step: "01", title: "Solicitar", desc: "Informe origem, destino e escolha a categoria. Veja o preço antes de confirmar." },
  { step: "02", title: "Motorista aceita", desc: "Motoristas próximos recebem sua solicitação em tempo real e aceitam." },
  { step: "03", title: "Acompanhar", desc: "Mapa ao vivo com a localização do motorista e tempo estimado de chegada." },
  { step: "04", title: "Pagamento", desc: "Pague com carteira TXAP, PIX ou cartão. Sem dinheiro vivo." },
  { step: "05", title: "Avaliar", desc: "Motorista e passageiro se avaliam para manter a qualidade da plataforma." },
]

export function ComoFunciona() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">5 passos simples</h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">Solicitar nunca foi tão fácil</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <div key={s.step} className="txd-card p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-base">{s.step}</span>
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.step} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-8 bg-primary" : "w-1.5 bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
