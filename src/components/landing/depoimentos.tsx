const testimonials = [
  {
    name: "Carlos Silva",
    role: "Passageiro",
    text: "Uso o TXAP para ir ao trabalho todos os dias. Muito mais barato que outros aplicativos e os motoristas são super profissionais.",
    stars: 5,
    initials: "CS",
  },
  {
    name: "Ana Oliveira",
    role: "Motoboy",
    text: "Consigo fazer entregas e receber no mesmo dia. A plataforma me deu liberdade financeira que eu nunca tive antes.",
    stars: 5,
    initials: "AO",
  },
  {
    name: "Marcos Santos",
    role: "Motorista de Táxi",
    text: "Melhor decisão foi migrar para o TXAP. Os passageiros são qualificados e o suporte é rápido quando preciso.",
    stars: 5,
    initials: "MS",
  },
  {
    name: "Juliana Costa",
    role: "Empresária (Frete)",
    text: "Preciso fretar caminhões semanalmente para minha loja. O TXAP simplificou todo o processo de logística pra mim.",
    stars: 5,
    initials: "JC",
  },
]

export function Depoimentos() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Quem usa, recomenda</h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">Veja o que nossos usuários estão falando</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="txd-card p-6 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
