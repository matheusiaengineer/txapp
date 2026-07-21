import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-[100dvh] relative bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-light mx-4 mt-2 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg text-white">TXAP</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-sm text-gray-300 px-4 py-2">Entrar</Link>
          <Link href="/auth/register" className="text-sm bg-primary text-black font-bold px-4 py-2 rounded-full">Criar conta</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-8 txd-radial-glow">
        <div className="absolute inset-0 txd-grid-bg opacity-30" />
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Brasil · Portugal · Inglaterra
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15] mb-4">
            Mobilidade inteligente para{" "}
            <span className="txd-gradient-text txd-text-glow">todos</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md mx-auto">
            Solicite corridas, entregas e fretes. Motorista define o preço. Você escolhe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="bg-primary hover:bg-primary-hover text-black font-bold px-8 py-3.5 rounded-full txd-green-glow-sm text-center">
              Começar agora
            </Link>
            <Link href="/auth/login"
              className="border border-white/10 hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-full text-center">
              Já tenho conta
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-500">
            <span className="flex items-center gap-1">✓ Motoristas verificados</span>
            <span className="flex items-center gap-1">✓ Rastreamento em tempo real</span>
            <span className="flex items-center gap-1">✓ Pagamento flexível</span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">Como funciona</span>
          <h2 className="text-2xl font-bold">5 passos simples</h2>
        </div>
        <div className="max-w-lg mx-auto space-y-3">
          {[
            { step: "01", title: "Solicitar", desc: "Origem, destino e categoria. Veja o preço." },
            { step: "02", title: "Motorista aceita", desc: "Notificação em tempo real para motoristas próximos." },
            { step: "03", title: "Acompanhar", desc: "Mapa ao vivo com ETA do motorista." },
            { step: "04", title: "Pagamento", desc: "Carteira TXAP ou QR Code na hora." },
            { step: "05", title: "Avaliar", desc: "Motorista e passageiro se avaliam." },
          ].map((s) => (
            <div key={s.step} className="txd-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{s.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="py-12 px-4 txd-radial-glow">
        <div className="max-w-lg mx-auto text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">Categorias</span>
          <h2 className="text-2xl font-bold">Para todo tipo de viagem</h2>
        </div>
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          {[
            { name: "Carro", desc: "Passageiros", color: "#3ECB8E" },
            { name: "Moto", desc: "Mototáxi", color: "#60a5fa" },
            { name: "Motoboy", desc: "Entregas rápidas", color: "#f59e0b" },
            { name: "Caminhão", desc: "Fretes", color: "#fb923c" },
            { name: "Van", desc: "Grupos", color: "#6ee7b7" },
            { name: "Fiorino", desc: "Cargas leves", color: "#a78bfa" },
          ].map((cat) => (
            <div key={cat.name} className="txd-card p-4 text-center">
              <h3 className="font-semibold text-sm" style={{ color: cat.color }}>{cat.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto txd-card p-8 text-center relative overflow-hidden border-primary/20"
          style={{ background: "linear-gradient(135deg, rgba(62,203,142,0.08), transparent)" }}>
          <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
          <p className="text-sm text-gray-400 mb-6">Milhares de pessoas já usam. Junte-se você também.</p>
          <Link href="/auth/register"
            className="bg-primary hover:bg-primary-hover text-black font-bold px-8 py-3.5 rounded-full txd-green-glow-sm inline-block">
            Criar conta grátis
          </Link>
          <p className="text-xs text-gray-500 mt-4">Sem cartão de crédito · Cadastro em 30 segundos</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-lg mx-auto text-center text-xs text-gray-600">
          <p>© 2026 TXAP. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
