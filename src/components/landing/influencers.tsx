"use client"
import { useEffect, useState } from "react"

interface Influencer {
  id: string
  instagram_handle: string
  display_name: string
  avatar_url: string
  bio: string
  is_founder: boolean
}

export function Influencers() {
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded-full mx-auto" />
          <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto" />
          <div className="flex gap-4 justify-center mt-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-64 h-40 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  if (influencers.length === 0) return null

  return (
    <section className="py-20 px-4 bg-gray-50 relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
            Parceiros Oficiais
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Quem já está usando o <span className="text-primary">TXAP</span>
          </h2>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">
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
              className="snap-start flex-shrink-0 w-72 bg-white border border-gray-100 rounded-3xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ring-2 ring-gray-100 group-hover:ring-primary/30 transition-all ${
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground text-base truncate">{inf.display_name}</div>
                  <div className="text-primary text-xs font-medium">{inf.instagram_handle}</div>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed line-clamp-2">{inf.bio}</p>
              {inf.is_founder && (
                <div className="mt-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#ffd700]/15 to-[#ffaa00]/15 text-[#cc9900] text-xs font-bold px-3 py-1.5 rounded-full border border-[#ffd700]/20">
                  ⭐ Fundador
                </div>
              )}
              <div className="mt-4 flex items-center gap-1 text-xs text-muted group-hover:text-primary transition-colors">
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
