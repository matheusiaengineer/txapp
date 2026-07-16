# TXAPP Testing Strategy

## Visão Geral
Testes automatizados em 3 níveis: unitários, integração, e2e. Meta: >80% de cobertura nas camadas críticas (dispatch, pricing, payment, fraud).

## Nível 1: Testes Unitários (Jest + React Testing Library)

### O que testar
- **Utils:** formatters (currency, date, distance), validators (documentos por país), i18n helpers
- **Hooks:** useGeolocation, useOffline, useNotification
- **Services:** pricing-engine, commission-engine, wallet-service, ai-service, fraud-detection
- **Store:** estado global (contexts, zustand se implementado)

### Exemplo
```typescript
describe('PricingEngine', () => {
  it('calculates fare correctly for standard category', async () => {
    const price = await pricingEngine.estimatePrice(category, 10, 15, 1, 'BRL');
    expect(price.totalFare).toBeGreaterThan(0);
    expect(price.driverEarnings).toBeLessThan(price.totalFare);
  });
});
```

### Config
- Jest configurado com TypeScript (ts-jest)
- React Testing Library para componentes

## Nível 2: Testes de Integração

### O que testar
- **API Routes:** `/api/config`, `/api/dispatch`, `/api/payment`
- **Supabase:** queries de driver_locations, rides, road_events (com Supabase local ou mock)
- **Stripe:** webhook handling, payment flow
- **Auth:** login, register, 2FA flow

### Ferramentas
- Supertest para API Routes
- Supabase local (supabase start) para testar queries reais
- Stripe CLI para testar webhooks localmente

## Nível 3: Testes E2E (Cypress / Playwright)

### Fluxos críticos
1. Passageiro solicita corrida → motorista aceita → corrida completa → pagamento
2. Empresa publica frete → transportador dá lance → aceito → coleta → entrega
3. Login → onboarding (6-step) → KYC → documentos aprovados
4. Admin cria promoção → motorista vê promoção → corrida com desconto
5. Chat → enviar mensagem → receber resposta → encerrar

## Type Checking
- `npx next build` passa sem erros (obrigatório antes de todo commit)
- TypeScript strict mode
- `tsc --noEmit` em CI

## Ferramentas de Teste
- Jest + React Testing Library (unitários)
- Playwright (E2E)
- ESLint + Prettier (linting)
- Supabase local (testes de DB)

## CI Pipeline
```yaml
tests:
  - npx next build
  - npx jest --coverage
  - npx playwright test
  - npx eslint . --ext .ts,.tsx
```

## Metas
- Cobertura unitária: >80% (critical services), >60% (UI components)
- Cobertura integração: >70% (API routes)
- E2E: 10 fluxos principais cobertos
- Build: 100% sem erros de type
