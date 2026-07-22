"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/browser"

export default function InfluencerDashboard() {
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    currentGoal: null as any,
  })
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadInfluencerData()
  }, [])

  async function loadInfluencerData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: influencer } = await supabase
      .from("influencers")
      .select("id")
      .eq("created_by", user.id)
      .single()

    if (!influencer) { setLoading(false); return }

    const res = await fetch(`/api/influencers/stats?influencerId=${influencer.id}`)
    const data = await res.json()
    setStats(data)

    // Generate referral link
    const linkRes = await fetch("/api/influencers/generate-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ influencerId: influencer.id }),
    })
    const linkData = await linkRes.json()
    if (linkData.link) setReferralLink(linkData.link)

    setLoading(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white p-4">
      <h1 className="text-xl font-bold mb-6">🎤 Painel do Influenciador</h1>

      {!referralLink ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">😕</div>
          <div className="text-gray-400">Você não está cadastrado como influenciador</div>
          <p className="text-gray-500 text-sm mt-1">Entre em contato com o admin para criar seu perfil</p>
        </div>
      ) : (
        <>
          <div className="bg-card-bg-2 border border-card-border rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-400 mb-2">Seu link de indicação:</div>
            <div className="flex gap-2">
              <input
                value={referralLink}
                readOnly
                className="flex-1 bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm text-gray-300"
              />
              <button
                onClick={copyLink}
                className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card-bg-2 border border-card-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
              <div className="text-xs text-gray-400">Indicações</div>
            </div>
            <div className="bg-card-bg-2 border border-card-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#ffd700]">{stats.completedReferrals}</div>
              <div className="text-xs text-gray-400">Convertidas</div>
            </div>
          </div>

          {stats.currentGoal && (
            <div className="bg-gradient-to-r from-primary/10 to-[#ffd700]/10 border border-primary/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold">Meta atual</span>
                <span className="text-sm text-[#ffd700]">🎁 {stats.currentGoal.reward_type === "free_ride" ? "1 corrida grátis" : stats.currentGoal.reward_value}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#ffd700] rounded-full transition-all"
                  style={{ width: `${Math.min((stats.currentGoal.current_count / stats.currentGoal.target_count) * 100, 100)}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-400">
                {stats.currentGoal.current_count} de {stats.currentGoal.target_count} cadastros
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
