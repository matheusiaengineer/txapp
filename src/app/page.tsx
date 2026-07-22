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

  if (loading) return <div className="text-center py-8 text-gray-500">Carregando...</div>
  if (influencers.length === 0) return null

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-3">
            🎤 Parceiros
          </span>
          <h2 className="text-2xl font-bold">Quem já está usando o TXAP</h2>
          <p className="text-sm text-gray-400 mt-1">Influenciadores e parceiros que confiam na gente</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {influencers.map((inf) => (
            <a
              key={inf.id}
              href={`https://instagram.com/${inf.instagram_handle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-64 bg-card-bg-2 border border-card-border rounded-2xl p-5 hover:border-primary/40 hover:bg-card-bg-2/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
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
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{inf.display_name}</div>
                  <div className="text-primary text-xs">{inf.instagram_handle}</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{inf.bio}</p>
              {inf.is_founder && (
                <div className="mt-3 inline-flex items-center gap-1 bg-[#ffd700]/10 text-[#ffd700] text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ Fundador
                </div>
              )}
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

      {/* Influenciadores */}
      <InfluencerSection />

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
