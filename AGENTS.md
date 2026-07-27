<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TXAP — Platform Architecture

## Stack
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS 4
- **Mobile**: PWA (installable), future React Native
- **Backend**: Next.js API Routes (server-side)
- **Database**: Supabase (PostgreSQL + PostGIS + RLS)
- **Auth**: Supabase Auth (JWT + Refresh Token)
- **Payments**: Stripe + PIX (internal wallet)
- **Maps**: Leaflet + OSRM (routing), PostGIS (nearby drivers)
- **Realtime**: Supabase Realtime (trips, heartbeats, messages, notifications)
- **Cache**: Upstash Redis (rate limiting)
- **Hosting**: Vercel (auto-deploy from GitHub)

---

## 🔒 CONFIGURAÇÃO PERMANENTE (NÃO PERDER!)

### Vercel Project
- **Nome:** txapp
- **Org:** matheuss-projects-c3850443
- **Project ID:** prj_3ZeaIRgwlAoNyEnpLgGjtAeyRyHW
- **URL Produção:** https://txapp-sepia.vercel.app
- **GitHub:** https://github.com/matheusiaengineer/txapp.git
- **Auto-deploy:** push to `main` branch

### Supabase
- **URL:** https://hqydwwfulatawjpottlf.supabase.co (público)
- **Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY):** sb_publishable_p3LRTvqfIu6-3L0j1AvsDQ_zvdmKbWx (público)
- **Service Role Key (SUPABASE_SERVICE_ROLE_KEY):** (Vercel env — secret)
- **Service Role Key NOTAS:** sb_secret_xT3b... (só no Vercel, não commitar)

### Stripe (Live)
- **Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY):** pk_live_51TsXuPB9FwQfzeDPfyJm1TzgQxupZqMSjpLnmeT6EScIDuxnNGesHXjK3x63a55bZgIyHv2tN9W15NrbRsEo1RRt00WC00LD8P (público)
- **Secret Key (STRIPE_SECRET_KEY):** (Vercel env — secret)
- **Webhook Secret (STRIPE_WEBHOOK_SECRET):** (Vercel env — secret)
- **Conta Stripe:** live (não test mode)
- **Stripe Connect:** habilitado para motoristas (Express onboarding)
- **Preço assinatura empresa:** R$ 99,00/mês (price_id: price_XXXX)

### Upstash Redis
- **UPSTASH_REDIS_REST_URL:** (Vercel env — non-sensitive)
- **UPSTASH_REDIS_REST_TOKEN:** (Vercel env — non-sensitive)
- **UPSTASH_REDIS_URL:** (Vercel env — non-sensitive)
- **UPSTASH_REDIS_TOKEN:** (Vercel env — non-sensitive)
- **NOTAS:** rediss://default:gQAA...@fluent-joey-127478.upstash.io:6379 (valores no Vercel)
- **Resumo:** Todas as 4 Upstash vars são NON-SENSITIVE no Vercel

### Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
- **Valor:** (não documentado localmente — deve ser obtido do Vercel env vars do projeto txap original, está como [SENSITIVE] no pull)

### Outros
- **NEXT_PUBLIC_APP_URL:** https://txapp.vercel.app (Non-sensitive type)

---

## 🔧 FIXES APLICADOS (NÃO REFATORAR)

### 1. rate-limit.ts — Redis LAZY + fallback in-memory
**Problema:** `new Redis()` era chamado no topo do módulo. Vercel build sandbox bloqueia rede → módulo quebrava.
**Solução:** Lazy init com `getRedis()` + try/catch + fallback in-memory se Redis falhar.
**Arquivo:** `src/lib/rate-limit.ts`

### 2. Env vars tipo — NEXT_PUBLIC_* como Non-sensitive
**Problema:** TODOS os NEXT_PUBLIC_ vars foram adicionados com `vercel env add` sem `--no-sensitive` → tipo "Sensitive/Encrypted" → NÃO disponíveis no browser.
**Solução:** Re-adicionar com `vercel env add KEY production --value "VALOR" --no-sensitive --yes`
**Comando exemplo:** `vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://hqydwwfulatawjpottlf.supabase.co" --no-sensitive --yes`

### 3. vercel.json — @app-url inválido
**Problema:** `"env": { "NEXT_PUBLIC_APP_URL": "@app-url" }` referenciava secret `app-url` que não existe.
**Solução:** Remover env section do vercel.json (agora as env vars são gerenciadas pelo Vercel project, não pelo vercel.json).

### 4. admin dashboard — force-dynamic em client component
**Problema:** `export const dynamic = "force-dynamic"` em client component (`"use client"`) causava erro no Vercel.
**Solução:** Remover — client components não precisam de `force-dynamic`.

### 5. Limpeza dados de teste
**Realizado em:** 26/07/2026
**O que foi deletado:**
- Auth user: `teste20260723225409@teste.com` + profile
- Auth user: `test1784859988134@example.com`
**O que foi criado:** Profile admin para `awqy@awqy.com`
**Estado atual:** Banco limpo — só `awqy@awqy.com` (admin)

---

## 🧪 CREDENCIAIS DE TESTE
- **Email:** awqy@awqy.com
- **Senha:** 123456789
- **Role:** admin

---

## 🚨 PROBLEMAS CONHECIDOS

### Rate limit muito agressivo
**Fix:** Já foi aumentado de 5 → 30 req/min no tier `auth`. Se ainda reclamar, aumentar para 60.

### CPF "já cadastrado" mesmo sendo novo
**Causa:** Pode ser resquício de dados de teste no banco (já fizeram limpeza em 26/07/2026).
**Se acontecer:** Verificar se `profiles` ou `driver_profiles` tem registro com aquele CPF.

### Stripe Webhooks — parciais
**Implementado:** `checkout.session.completed`, `account.updated`
**Falta:** `payout.paid`, `charge.refunded`

---

## 📦 ENV VARS (Vercel Project — Production)

| Nome | Tipo | Status |
|------|------|--------|
| NEXT_PUBLIC_APP_URL | Non-sensitive | ✅ |
| NEXT_PUBLIC_SUPABASE_URL | Non-sensitive | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Non-sensitive | ✅ |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Non-sensitive | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | Sensitive/Encrypted | ✅ |
| STRIPE_SECRET_KEY | Sensitive/Encrypted | ✅ |
| STRIPE_WEBHOOK_SECRET | Sensitive/Encrypted | ✅ |
| UPSTASH_REDIS_URL | Non-sensitive | ✅ |
| UPSTASH_REDIS_TOKEN | Non-sensitive | ✅ |
| UPSTASH_REDIS_REST_URL | Non-sensitive | ✅ |
| UPSTASH_REDIS_REST_TOKEN | Non-sensitive | ✅ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Sensitive/Encrypted | ✅ (obter do txap original se precisar resetar) |

---

## ✅ PRÓXIMOS PASSOS (prioridade)

1. **PIX Saque** — endpoint `/api/wallet/withdraw` + webhook Stripe/MercadoPago
2. **Push Notifications (FCM)** — Firebase project + service worker
3. **Chat motorista-passageiro** — UI realtime com Supabase Realtime
4. **Tracking ao vivo** — passageiro ver motoboy no mapa
5. **Testar fluxo completo:** passageiro registra → pede → motoboy aceita → paga → avalia
6. **KYC driver → admin approve/reject** — UI admin completa + notificação ao motorista
7. **Documentação API pública** — para futuras integrações
