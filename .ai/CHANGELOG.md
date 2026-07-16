# TXAPP Changelog

Todas as alterações relevantes do projeto.

## [1.0.0] — 2025-07-13

### Added
- 22 módulos funcionais (Login, i18n, Payment, Commission, Mobility, Freight, Chat, 3D/AR, Map, Notifications, Dashboards, B2B, Admin, Security, Performance, Microservices, AI/ML, Community, Emergency, Settings, Devops, Global Config)
- 850+ funcionalidades documentadas no ROADMAP-COMPLETO.md
- 4 países configurados (BR, US, PT, MX), 7 cidades
- 19 moedas (15 fiat + 4 crypto)
- 15 idiomas com suporte RTL
- 21 categorias de serviço (16 passageiro + 5 frete)
- Score Dispatch 3.0 (10 fatores, AI integrada, batch dispatch)
- Global Config Engine (tudo configurável por cidade via banco)
- Service Worker + detecção offline
- Splash Screen animado
- Tema escuro com glassmorphism e neon glow

### Infrastructure
- Estrutura `.ai/` criada com 21 arquivos de especificação
- MASTER_VISION.md — visão arquitetural
- EXECUTION_RULES.md — regras para desenvolvimento por IA
- NEXT_TASK.md — especificação detalhada da próxima fase (1883 linhas)
- DISPATCH.md — Score Dispatch 3.0 (2757 linhas)
- ROAD_INTELLIGENCE.md — motor de eventos em tempo real (3167 linhas)
- PASSENGER_AI.md — IA de aprendizado de passageiros (2762 linhas)
- DRIVER_AI.md — IA de motoristas (1536 linhas)
- FREIGHT.md — marketplace de fretes (2638 linhas)
- GOOGLE_MAPS.md — integração com Mobility Engine (1798 linhas)
- SUPABASE.md — schema completo do banco (1681 linhas)
- STRIPE.md — integração financeira
- PAYMENTS.md — sistema de pagamentos
- SECURITY.md — segurança e compliance
- MOBILE.md — estratégia mobile
- PERFORMANCE.md — metas e técnicas de performance (606 linhas)
- OFFLINE.md — estratégia offline-first (532 linhas)
- TESTS.md — estratégia de testes
- DEPLOY.md — CI/CD e infraestrutura
- CHANGELOG.md — este arquivo
- PROMPTS.md — prompts reutilizáveis

### Technical
- Next.js 16.2.10 + React 19.2.4
- TypeScript strict
- Tailwind CSS 4 + framer-motion 12.x + lucide-react 1.24
- Supabase Auth + SSR + Realtime
- Stripe Connect
- Build passa em `npx next build` (0 erros)

## [0.1.0] — 2025-06-01

### Added
- Projeto inicializado com Next.js
- Config de tema escuro
- Estrutura de pastas
