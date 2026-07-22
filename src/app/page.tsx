"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Influencer {
  id: string
  instagram_handle: string
  display_name: string
  avatar_url: string
  bio: string
  is_founder: boolean
}

function InfluencerSection() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/influencers")
      .then(r => r.json())
      .then(data => {
        setInfluencers(data.influencers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-card-bg-2 rounded-full mx-auto" />
          <div className="h-8 w-64 bg-card-bg-2 rounded-lg mx-auto" />
          <div className="flex gap-4 justify-center mt-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-64 h-40 bg-card-bg-2 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  if (influencers.length === 0) return null

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 txd-radial-glow opacity-50" />
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">
            🎤 Parceiros Oficiais
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Quem já está usando o <span className="txd-gradient-text">TXAP</span>
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Influenciadores e parceiros que confiam na nossa plataforma
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
          {influencers.map((inf) => (
            <a
              key={inf.id}
              href={`https://instagram.com/${inf.instagram_handle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start flex-shrink-0 w-72 bg-gradient-to-b from-card-bg-2 to-card-bg border border-card-border rounded-3xl p-6 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ring-2 ring-transparent group-hover:ring-primary/30 transition-all ${
                    inf.is_founder
                      ? "bg-gradient-to-br from-[#ffd700] to-[#ffaa00]"
                      : "bg-gradient-to-br from-primary to-[#00a884]"
                  }`}>
                    {inf.avatar_url ? (
                      <img src={inf.avatar_url} alt={inf.display_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      inf.is_founder ? "👑" : "📸"
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-card-bg" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white text-base truncate">{inf.display_name}</div>
                  <div className="text-primary text-xs font-medium">{inf.instagram_handle}</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{inf.bio}</p>
              {inf.is_founder && (
                <div className="mt-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#ffd700]/15 to-[#ffaa00]/15 text-[#ffd700] text-xs font-bold px-3 py-1.5 rounded-full border border-[#ffd700]/20">
                  ⭐ Fundador
                </div>
              )}
              <div className="mt-4 flex items-center gap-1 text-xs text-gray-500 group-hover:text-primary transition-colors">
                Ver no Instagram
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-[100dvh] relative bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#00a884] flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg text-white">TXAP</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-gray-300 font-medium hover:text-white transition-colors">Entrar</Link>
          <Link href="/auth/register" className="text-sm bg-primary hover:bg-primary-hover text-black font-bold px-5 py-2 rounded-full transition-all active:scale-[0.97]">Criar conta</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 txd-grid-bg opacity-20" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-5 animate-float">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Brasil · Portugal · Inglaterra
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            Mobilidade inteligente para{" "}
            <span className="txd-gradient-text txd-text-glow">todos</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 mb-10 max-w-lg mx-auto">
            Solicite corridas, entregas e fretes. Motorista define o preço. Você escolhe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="bg-primary hover:bg-primary-hover text-black font-bold px-10 py-4 rounded-full txd-green-glow-sm text-center text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
              Começar agora
            </Link>
            <Link href="/auth/login"
              className="border border-white/10 hover:bg-white/10 text-white font-medium px-10 py-4 rounded-full text-center text-base transition-all">
              Já tenho conta
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Motoristas verificados
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Rastreamento em tempo real
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Pagamento flexível
            </span>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{animation: "bounce 2s infinite"}}>
          <div className="w-6 h-10 rounded-full border-2 border-gray-700 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" style={{animation: "scrollDot 2s infinite"}} />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">Como funciona</span>
            <h2 className="text-3xl sm:text-4xl font-bold">5 passos simples</h2>
            <p className="text-sm text-gray-400 mt-2">Solicitar nunca foi tão fácil</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { step: "01", title: "Solicitar", desc: "Informe origem, destino e escolha a categoria. Veja o preço antes de confirmar.", color: "from-primary/20 to-primary/5" },
              { step: "02", title: "Motorista aceita", desc: "Motoristas próximos recebem sua solicitação em tempo real.", color: "from-blue-500/20 to-blue-500/5" },
              { step: "03", title: "Acompanhar", desc: "Mapa ao vivo com a localização do motorista e ETA atualizado.", color: "from-amber-500/20 to-amber-500/5" },
              { step: "04", title: "Pagamento", desc: "Pague com carteira TXAP, PIX ou cartão. Sem dinheiro vivo.", color: "from-purple-500/20 to-purple-500/5" },
              { step: "05", title: "Avaliar", desc: "Motorista e passageiro se avaliam para manter a qualidade.", color: "from-green-500/20 to-green-500/5" },
            ].map((s) => (
              <div key={s.step} className="txd-card p-5 flex items-center gap-5 hover:border-primary/20 transition-all group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="text-primary font-bold text-base">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{s.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-20 px-4 txd-radial-glow relative">
        <div className="absolute inset-0 txd-grid-bg opacity-10" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">Categorias</span>
            <h2 className="text-3xl sm:text-4xl font-bold">Para todo tipo de viagem</h2>
            <p className="text-sm text-gray-400 mt-2">Escolha o veículo ideal para cada necessidade</p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: "Carro", desc: "Passageiros", color: "#3ECB8E", icon: "🚗" },
              { name: "Moto", desc: "Mototáxi", color: "#60a5fa", icon: "🏍️" },
              { name: "Motoboy", desc: "Entregas rápidas", color: "#f59e0b", icon: "📦" },
              { name: "Caminhão", desc: "Fretes", color: "#fb923c", icon: "🚛" },
              { name: "Van", desc: "Grupos", color: "#6ee7b7", icon: "🚐" },
              { name: "Fiorino", desc: "Cargas leves", color: "#a78bfa", icon: "🚚" },
            ].map((cat) => (
              <div key={cat.name} className="txd-card p-5 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group">
                <span className="text-3xl mb-3 block">{cat.icon}</span>
                <h3 className="font-semibold text-white text-sm mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-400">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Influenciadores - Destaque */}
      <InfluencerSection />

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto txd-card p-10 text-center relative overflow-hidden border-primary/20"
          style={{ background: "linear-gradient(135deg, rgba(62,203,142,0.1), transparent)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3">Pronto para começar?</h2>
            <p className="text-sm text-gray-400 mb-8">Milhares de pessoas já usam o TXAP. Junte-se você também.</p>
            <Link href="/auth/register"
              className="bg-primary hover:bg-primary-hover text-black font-bold px-10 py-4 rounded-full txd-green-glow-sm inline-block transition-all hover:scale-[1.02] active:scale-[0.98]">
              Criar conta grátis
            </Link>
            <p className="text-xs text-gray-500 mt-5">Sem cartão de crédito · Cadastro em 30 segundos</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-xs">T</span>
            </div>
            <span className="text-sm text-gray-500">TXAP</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span>Termos de Uso</span>
            <span>Privacidade</span>
            <span>Ajuda</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 TXAP. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
