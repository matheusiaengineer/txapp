import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-[85dvh] flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-b from-white via-green-50/30 to-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 text-center max-w-3xl mx-auto pt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Brasil · Portugal · Inglaterra
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-foreground">
          Mobilidade inteligente para{" "}
          <span className="text-primary">todos</span>
        </h1>
        <p className="text-base sm:text-lg text-muted mb-10 max-w-xl mx-auto leading-relaxed">
          Solicite corridas, entregas e fretes. Motorista define o preço. Você escolhe. Tudo em uma plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register"
            className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full txd-green-glow-sm text-center text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
            Começar agora
          </Link>
          <Link href="/auth/login"
            className="border border-gray-200 hover:border-gray-300 bg-white text-foreground font-medium px-10 py-4 rounded-full text-center text-base transition-all hover:shadow-sm">
            Já tenho conta
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted">
          {["Motoristas verificados", "Rastreamento em tempo real", "Pagamento flexível"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
