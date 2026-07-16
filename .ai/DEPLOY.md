# TXAPP Deploy & CI/CD

## Visão Geral
Pipeline de deploy multi-ambiente: desenvolvimento → staging → produção. Cada país pode ter seu próprio deploy (white-label).

## Ambientes

### Desenvolvimento (localhost)
```bash
npm run dev
```
- Supabase local (supabase start)
- Stripe test keys
- Google Maps dev API key
- Hot reload ativo

### Staging
- URL: staging.txdapp.com
- Supabase project staging
- Stripe test keys
- Google Maps staging API key
- Deploy automático ao mergear em `develop`

### Produção
- URL: txdapp.com (ou por país: br.txdapp.com, us.txdapp.com...)
- Supabase production
- Stripe live keys
- Google Maps production API key
- Deploy manual via GitHub Actions (approval required)

## CI/CD (GitHub Actions)

### Workflows

1. **PR Check** (toda PR para main/develop)
   - Lint (ESLint)
   - Type Check (tsc --noEmit)
   - Unit Tests (jest)
   - Build (npx next build)

2. **Deploy Staging** (merge em develop)
   - Build Docker image
   - Push to registry
   - Deploy to staging server
   - Run E2E tests (Playwright)
   - Smoke test (verificar health endpoints)

3. **Deploy Production** (merge em main + approval)
   - Build Docker image
   - Push to registry
   - Deploy to production (rolling update)
   - Run smoke tests
   - Monitor (Sentry + DataDog)

## Infraestrutura

### Vercel (Recomendado para Next.js)
- Serverless functions para API Routes
- Edge Functions para middleware/proxy
- Automatic SSL
- CDN global (Vercel Edge Network)
- ISR para páginas semi-estáticas

### Docker (Alternativa / On-premise)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### Multi-país Deployment

Opção A: Single deploy + city config (recomendado)
- Um deploy serve todos os países
- Roteamento por subdomínio (br.txdapp.com → city_id = "sp")
- Config via banco de dados (Global Config Engine)

Opção B: Deploy por país
- Cada país tem seu próprio deploy (Vercel project ou Docker container)
- Código compartilhado, configuração independente
- Mais caro, mas isolamento total

### Monitoramento
- **Sentry:** error tracking (frontend + backend)
- **DataDog:** APM, logs, infra metrics
- **Vercel Analytics:** web vitals, page views
- **Custom:** Dispatch success rate, average match time, cancellation rate

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_API_KEY` (server-side)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `SENDGRID_API_KEY`
- `FIREBASE_SERVER_KEY`

### Per Environment
- `NODE_ENV`: development / staging / production
- `NEXT_PUBLIC_APP_URL`: URL do deploy
- `NEXT_PUBLIC_SENTRY_DSN`
- `DATADOG_API_KEY`

## Health Check Endpoint
```typescript
// GET /api/health
{
  status: "ok",
  version: "1.0.0",
  uptime: 3600,
  supabase: "connected",
  stripe: "configured",
  lastMigration: "2025-06-15"
}
```
