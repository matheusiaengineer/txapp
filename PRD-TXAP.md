# TXAP — Product Requirements Document (PRD)

> **Versão:** 1.0  
> **Data:** Julho 2026  
> **Status:** Produção (Vercel)  
> **Repositório:** github.com/matheusiaengineer/txapp

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Banco de Dados — 68 Tabelas](#3-banco-de-dados)
4. [Autenticação e Perfis](#4-autenticação-e-perfis)
5. [Tela Inicial e Landing Page](#5-tela-inicial-e-landing-page)
6. [Fluxo do Passageiro](#6-fluxo-do-passageiro)
7. [Fluxo do Motorista](#7-fluxo-do-motorista)
8. [Fluxo do Transportador (Fretes)](#8-fluxo-do-transportador-fretes)
9. [Fluxo da Empresa](#9-fluxo-da-empresa)
10. [Sistema de Corridas — Dispatch em Tempo Real](#10-sistema-de-corridas)
11. [Sistema Financeiro](#11-sistema-financeiro)
12. [Carteira Digital (Wallet)](#12-carteira-digital)
13. [Pagamentos — PIX, Cartão, Stripe](#13-pagamentos)
14. [Mapas e Roteamento](#14-mapas-e-roteamento)
15. [Rastreamento em Tempo Real](#15-rastreamento-em-tempo-real)
16. [Feed Social e Publicações](#16-feed-social-e-publicações)
17. [Chat e Mensagens](#17-chat-e-mensagens)
18. [Notificações](#18-notificações)
19. [Painel Administrativo](#19-painel-administrativo)
20. [Programa de Influenciadores](#20-programa-de-influenciadores)
21. [Genesis Protocol — Lançamento de Cidades](#21-genesis-protocol)
22. [Sistema de Segurança](#22-sistema-de-segurança)
23. [APIs — Referência Completa](#23-apis)
24. [Regras de Negócio](#24-regras-de-negócio)
25. [Permissões e Controle de Acesso](#25-permissões-e-controle-de-acesso)
26. [Componentes e Hooks](#26-componentes-e-hooks)
27. [Escalabilidade e Performance](#27-escalabilidade-e-performance)
28. [Expanções Futuras](#28-expansões-futuras)

---

## 1. Visão Geral do Produto

### 1.1 O que é o TXAP

TXAP é uma plataforma de mobilidade sob demanda (PWA) que conecta passageiros, motoristas, transportadores e empresas em um único ecossistema. Diferente de apps convencionais de corrida, o **motorista define o preço por km**, e o passageiro escolhe o melhor custo-benefício.

### 1.2 Proposta de Valor

| Diferencial | Descrição |
|---|---|
| **Motorista define o preço** | Cada motorista define seu valor/km — mercado competitivo |
| **Multi-modal** | Carro, Moto, Motoboy (entrega), Van, Caminhão, Fiorino |
| **Marketplace de empresas** | Lojas, farmácias, restaurantes vendem direto pelo app |
| **Frete aberto** | Transportadores dão lance em cargas |
| **Genesis Protocol** | Lançamento de cidades com garantias de ganho para motoristas |
| **Pagamento flexível** | Carteira TXAP, PIX QR Code, Cartão de crédito/débito |

### 1.3 Público-Alvo

| Persona | Perfil |
|---|---|
| **Passageiro** | Qualquer pessoa que precisa de deslocamento ou entrega |
| **Motorista/Motoboy** | PF que quer ganhar dinheiro com veículo próprio |
| **Transportador** | PF/PJ com caminhão/van que transporta cargas |
| **Empresa (Comércio)** | Lojas, farmácias, restaurantes que vendem pelo app |
| **Admin** | Equipe TXAP que gerencia a plataforma |

### 1.4 Mercados

Brasil (principal), Portugal, Inglaterra — suporte a moeda BRL, USD, EUR.

### 1.5 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router + Turbopack) + React 19 + Tailwind CSS 4 |
| Mobile | PWA (installable) |
| Backend | Next.js API Routes (server-side) |
| Banco | Supabase (PostgreSQL + PostGIS + RLS) |
| Auth | Supabase Auth (JWT + Refresh Token rotation) |
| Pagamentos | Stripe Connect + PIX |
| Mapas | Leaflet + OSRM (roteamento) + Nominatim (geocoding) |
| Tempo Real | Supabase Realtime (trips, heartbeats, mensagens) |
| Cache | Upstash Redis (rate limiting) |
| Hosting | Vercel (auto-deploy from GitHub) |
| CI/CD | GitHub Actions (typecheck → lint → build → smoke test) |

---

## 2. Arquitetura Técnica

### 2.1 Diagrama de Alto Nível

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser    │────▶│  Vercel (Next.js) │────▶│  Supabase   │
│   (PWA)      │◀────│  API Routes       │◀────│  PostgreSQL  │
└─────────────┘     │  Proxy (Auth)     │     │  + PostGIS   │
                    └────────┬─────────┘     │  + RLS       │
                             │               └──────┬──────┘
                    ┌────────▼─────────┐            │
                    │   Stripe API      │     ┌─────▼──────┐
                    │   (Connect/PIX)   │     │ Upstash     │
                    └──────────────────┘     │ Redis       │
                                             └────────────┘
```

### 2.2 Diretórios

```
src/
├── app/                    # App Router (pages + API)
│   ├── page.tsx           # Landing page
│   ├── auth/              # Login, registro, forgot-password
│   ├── dashboard/         # Painéis por role
│   │   ├── passenger/     # Passageiro
│   │   ├── driver/        # Motorista
│   │   ├── transporter/   # Transportador
│   │   ├── company/       # Empresa
│   │   ├── influencer/    # Influenciador
│   │   └── drone/         # Drone 360°
│   ├── admin/             # Painel admin
│   ├── payment/           # Pagamento + PIX
│   ├── ride/              # Solicitação de corrida
│   └── api/               # 57 arquivos de API
├── components/            # Componentes React
│   ├── maps/              # PassengerMap, DriverMap
│   ├── map/               # LeafletMap (avançado)
│   ├── ui/                # Button, Input, Toast, Skeleton, Icon
│   ├── verification/      # SelfieCapture, FileUpload
│   └── landing/           # Navbar
├── lib/
│   ├── hooks/             # 10 hooks customizados
│   ├── store/             # 4 Zustand stores
│   ├── payment/           # Stripe, constants, wallet
│   ├── supabase/          # Client + Server + Middleware
│   └── api-middleware.ts  # Rate limiting wrapper
├── proxy.ts               # Route protection (Next.js 16)
└── hooks/                 # useGeolocation
```

### 2.3 Fluxo de Request

```
Browser → proxy.ts (auth check) → Page Component → API Route → Supabase (RLS)
                                        ↑                    ↑
                                   hooks/stores          withRateLimit
```

### 2.4 Proxy (Middleware)

O `proxy.ts` é o ponto de entrada de autenticação. Ele:
1. Cria um cliente Supabase com cookies do request
2. Verifica `getUser()` em cada request
3. Redireciona usuários não autenticados de `/dashboard/*`, `/admin/*`, `/payment/*`, `/ride/*` para `/auth/login`
4. Redireciona usuários autenticados de `/auth/*` para seu dashboard conforme o role

---

## 3. Banco de Dados

### 3.1 Resumo das Tabelas (68+)

| Domínio | Tabelas |
|---|---|
| **Auth/Identidade** | profiles, driver_profiles, biometric_credentials, mfa_factors |
| **Mobilidade** | vehicles, vehicle_categories, cities, pricing_rules, trips, trip_offers, driver_heartbeats, drivers_online, tracking_history, driver_pricing, negotiations |
| **Frete** | freight_loads, freight_bids, loads, bids, freight_tracking |
| **Pagamentos** | wallets, wallet_transactions, withdrawals, payment_methods, coupons |
| **Social** | feed_posts, post_comments, post_likes, favorites, ratings |
| **Mensagens** | trip_messages, messages, notifications, push_tokens |
| **Empresas** | companies, employee_profiles, company_services, company_products, company_orders, company_clients, company_subscription_plans, company_subscriptions, company_delivery_partners, company_invoices, campaigns |
| **Diretório** | businesses, business_products, business_reviews, promotions, professional_directory, professionals |
| **Genesis** | city_launches, seed_missions, driver_guarantees, respiratory_snapshots |
| **Segurança** | audit_logs, app_errors, content_reports, verifications, banned_devices, signup_attempts_log |
| **Infra** | coverage_areas, app_config, global_config, saved_locations, documents, addresses |
| **Influencers** | influencers, influencer_referrals, influencer_goals |
| **Conteúdo Cidade** | city_events, city_jobs, road_events |
| **Suporte** | support_tickets |
| **Marketplace** | orders |

### 3.2 Enums Principais

| Enum | Valores |
|---|---|
| `user_role` | passenger, driver, company, transporter, admin, driver_moto, driver_car, freight, business, employee |
| `driver_status` | pending, approved, rejected |
| `trip_status` | REQUEST_CREATED → SEARCHING_DRIVER → DRIVER_NOTIFIED → DRIVER_ACCEPTED → GOING_TO_PICKUP → ARRIVED → PASSENGER_ON_BOARD → IN_PROGRESS → FINISHING → COMPLETED → PAYMENT_PENDING → PAYMENT_CONFIRMED → FINISHED (+ CANCELLED, NO_DRIVER_FOUND, TIMEOUT, EXPIRED, REJECTED) |
| `driver_live_status` | OFFLINE, ONLINE, AVAILABLE, RESERVED, GOING_TO_PICKUP, WAITING_PASSENGER, IN_TRIP, IN_DELIVERY, IN_FREIGHT, PAUSED, EMERGENCY |
| `freight_load_status` | open, in_progress, completed, cancelled |
| `order_status` | pending, confirmed, preparing, in_delivery, delivered, cancelled |
| `service_category` | delivery, supermarket, pharmacy, restaurant, water, gas, mechanic, electrician, plumber, cleaning, petshop, other |

### 3.3 Índices Espaciais (PostGIS)

- `idx_driver_heartbeats_location` — GIST ll_to_earth(lat,lng)
- `idx_drivers_online_location` — GIST ll_to_earth(lat,lng)
- `idx_companies_location` — GIST ll_to_earth(lat,lng)
- `idx_businesses_location` — GIST(location)
- `idx_coverage_areas_boundary` — GIST(boundary)
- `idx_profiles_location` — GIST(location)
- `idx_road_events_location` — GIST ll_to_earth(lat,lng)

### 3.4 RLS (Row Level Security)

75+ políticas RLS, incluindo:
- **Acesso próprio**: Cada tabela tem políticas `*_own` para o próprio user_id
- **Relacional**: trips accessible por passenger_id OU driver_id
- **Empresa-scoped**: company_products/company_orders acessíveis pelo company_id
- **Leitura pública**: cities, pricing_rules, vehicle_categories, businesses, professionals, coupons, influencers
- **Admin-only**: audit_logs, banned_devices, signup_attempts_log, global_config (write)

### 3.5 Triggers (10+)

| Trigger | Tabela | Função |
|---|---|---|
| `trg_update_wallet_balance` | wallet_transactions | Sincroniza saldo na tabela wallets |
| `trg_ensure_wallet` | profiles | Auto-cria wallet ao criar perfil |
| `trg_update_driver_rating` | ratings | Recalcula média do motorista |
| `trg_update_driver_guarantee` | wallet_transactions | Atualiza ganho na garantia Genesis |
| `trg_check_wallet_balance` | wallet_transactions | Impede saldo negativo |
| `trg_block_deposit_if_pending` | wallet_transactions | Bloqueia depósitos duplicados |
| `trg_update_updated_at` | Múltiplas | Atualiza campo updated_at |

### 3.6 Funções RPC

- `find_nearby_drivers(lat, lng, radius_km)` — Busca motoristas por proximidade
- `process_ride_payment(ride_id)` — Processa pagamento da carteira
- `calculate_respiratory_rate(city_id)` — Calcula taxa respiratória (oferta/demanda)
- `get_calculated_balance(profile_id)` — Balance calculado por transações

---

## 4. Autenticação e Perfis

### 4.1 Fluxo de Registro

1. Usuário escolhe perfil: **Passageiro**, **Motoboy**, **Motorista**, **Frete**, **Empresa**
2. Preenche: telefone, CPF, nome completo, email, senha
3. API verifica disponibilidade (phone/CPF únicos)
4. Cria usuário via Supabase Auth (`admin.createUser`)
5. Cria `profiles` (role), `driver_profiles` (se motorista), `vehicles` (se informado)
6. Auto-signin + redirect para dashboard

### 4.2 Fluxo de Login

1. Email + senha
2. Supabase Auth `signInWithPassword()`
3. Lê `profiles.role`
4. Redireciona:
   - passenger → `/dashboard/passenger`
   - driver/driver_moto/driver_car → `/dashboard/driver`
   - transporter/freight → `/dashboard/transporter`
   - company/business → `/dashboard/company`
   - employee → `/dashboard/employee`
   - admin → `/admin/dashboard`

### 4.3 OAuth

- Google OAuth via `/api/auth/callback`
- Troca code por session, lê role do perfil, redireciona

### 4.4 Recuperação de Senha

- `/auth/forgot-password` → `supabase.auth.resetPasswordForEmail()`
- Link redireciona para `/auth/login` com token

### 4.5 Restrições de Perfil

- **Nome**: Só pode ser alterado 1 vez a cada 30 dias (`can_change_name`, `name_last_changed_at`)
- **CPF**: Imutável após criação
- **Telefone**: Imutável após criação
- **Campos permitidos no update**: `full_name`, `email`, `language`, `country`, `accepted_terms`, `push_subscription`, `can_change_name`, `name_last_changed_at`

### 4.6 Dispositivo

- `device_fingerprint` vinculado ao perfil
- `banned_devices` — banimento por dispositivo
- `signup_attempts_log` — auditoria de tentativas

---

## 5. Tela Inicial e Landing Page

### 5.1 Landing Page (`/`)

**Objetivo**: Converter visitantes em usuários.

| Seção | Conteúdo |
|---|---|
| **Navbar** | Logo TXAP, "Entrar" link, "Criar conta" button |
| **Hero** | "Mobilidade inteligente para todos", badge "Brasil · Portugal · Inglaterra", CTA "Começar agora" |
| **Como funciona** | 5 passos: Solicitar → Motorista aceita → Acompanhar → Pagamento → Avaliar |
| **Categorias** | 6 cards: Carro 🚗, Moto 🏍️, Motoboy 📦, Caminhão 🚛, Van 🚐, Fiorino 🚚 |
| **Influenciadores** | Cards de parceiros com Instagram, nome, bio, badge "Fundador" |
| **CTA Final** | "Pronto para começar?" + "Criar conta grátis" |
| **Footer** | Termos de Uso, Privacidade, Ajuda |
| **Location Request** | Banner flutuante "Permitir localização" |

### 5.2 Home Autenticada (`/home`)

**Objetivo**: Dashboard rápido com mapa e ações rápidas.

| Elemento | Funcionalidade |
|---|---|
| Mapa Leaflet | Mostra motoristas nearby com ícones |
| 4 Quick Actions | 🚕 Taxi, 🛵 Motoboy, 📦 Frete, 🏙️ Cidade → navega para `/ride?type=` |
| Driver popup | Card com nome, rating, preço/km, botão "Chamar" + favorito ⭐ |
| Empresas em Destaque | Cards horizontais de empresas |
| Solicitação de localização | Com fallback e instruções |

### 5.3 Componente de Mapa

**DriverMap** — Leaflet com:
- Tiles CartoDB Dark
- Marcadores de motoristas (moto 🏍️ / carro 🚗)
- Marcador de destino
- Polyline de rota OSRM
- Badge de contagem de motoristas
- Controles de zoom

**LeafletMap (TxdLeafletMap)** — Mapa avançado com:
- Pickup/destination markers
- Directions OSRM polyline
- Toggles de camadas: Trânsito, Incidentes, Clima
- Botão recentralizar
- Endereços salvos no mapa

---

## 6. Fluxo do Passageiro

### 6.1 Dashboard do Passageiro (`/dashboard/passenger`)

| Elemento | Funcionalidade |
|---|---|
| Mapa fullscreen | Visualização do mapa com localização atual |
| Input "Local de partida" | Geocoding Nominatim com autocomplete |
| Input "Para onde vai?" | Geocoding Nominatim com sugestões |
| 5 Lugares populares | Shopping, Aeroporto, Hospital, Universidade, Supermercado |
| 6 Pills de categoria | Carro, Moto, Motoboy, Caminhão, Van, Fiorino |
| Toggle "Pulso da cidade" | Surcharge respiratório (oferta/demanda) |
| Botão "Solicitar {categoria}" | Navega para `/ride` com parâmetros |
| Links | 📋 Histórico, 💰 Carteira |

### 6.2 Solicitação de Corrida (`/ride`)

1. Passageiro seleciona origem e destino no mapa
2. Veja distância e duração estimada (Haversine + OSRM)
3. Calcula preço estimado (base_fare + price_per_unit × km + price_per_minute × min)
4. Opção de aceitar/rejeitar surcharge respiratório
5. Confirma solicitação
6. Trip criada com status `SEARCHING_DRIVER`
7. `trip_offers` inserido para motorista específico
8. Realtime notifica motorista
9. Espera aceitação (animação "Procurando motorista...")
10. Motorista aceita → status `DRIVER_ACCEPTED`
11. Tela mostra mapa ao vivo com localização do motorista

### 6.3 Pagamento (`/payment`)

| Método | Fluxo |
|---|---|
| **Carteira TXAP** | Verifica saldo → `process_ride_payment` RPC → status `PAYMENT_CONFIRMED` |
| **PIX** | `POST /api/payments/create-pix` → QR Code → copia e cola → polling `verify-pix` a cada 5s |
| **Cartão** | `POST /api/payments/process` → Stripe Checkout session → redirect → success URL |

### 6.4 Histórico (`/dashboard/passenger/history`)

- Lista das últimas 20 corridas
- Origem → Destino, valor, status, data

### 6.5 Carteira do Passageiro (`/dashboard/passenger/wallet`)

- Saldo atual
- 4 valores predefinidos: R$20, R$50, R$100, R$200
- Botão "Adicionar R${amount}" → cria PIX
- Últimas 10 transações

### 6.6 Favoritos (`/dashboard/passenger/favorites`)

- 4 abas: Todos, Motoristas, Lugares, Rotas
- Botão 🗑️ para remover

### 6.7 Explorar (`/dashboard/passenger/explore`)

- Mapa com empresas e profissionais nearby
- 11 filtros de serviço: Todos, Água, Gás, Mercado, Farmácia, Restaurante, Mecânico, Eletricista, Encanador, Faxina, Pet Shop
- Contador "{count} encontrado(s) por perto"
- Cards: nome, endereço, "Aberto"/"Fechado", badge "Destaque"

### 6.8 Detalhe da Empresa + Pedido (`/dashboard/passenger/explore/[id]`)

- Info da empresa (nome, endereço, horário)
- Lista de produtos com nome, descrição, preço, botão "+"
- Carrinho flutuante com +/- quantidade
- Modal de checkout: endereço de entrega, observações, "Confirmar pedido"
- `POST /api/orders` cria pedido
- Pós-pedido: "Continuar comprando" + link WhatsApp

### 6.9 Pedidos (`/dashboard/passenger/orders`)

- Lista de todos os pedidos com empresa, status, itens, totais
- Status: Pendente, Confirmado, Preparando, Saiu para entrega, Entregue, Cancelado

---

## 7. Fluxo do Motorista

### 7.1 Dashboard do Motorista (`/dashboard/driver`)

| Elemento | Funcionalidade |
|---|---|
| Toggle Online/Offline | `UPDATE driver_profiles SET current_live_status` |
| Status KYC | Links "Fazer cadastro" / "Refazer cadastro" |
| Preço por km | Exibe valor atual + link "Alterar preço" |
| Link "Ganhos" | Navega para earnings |
| Últimas 5 corridas | Lista resumida |
| **Popup de corrida** | Origem, destino, valor estimado, "Aceitar" / "Recusar" com countdown 15s |

**Tempo Real**: Escuta canal Supabase `trips` com filtro `status=eq.SEARCHING_DRIVER`. Ao receber, vibra o celular e mostra popup com countdown.

**Ao aceitar**:
1. `PATCH /api/dispatch/offer` com `action: "accept"`
2. Trip status → `DRIVER_ACCEPTED`
3. Trip offer status → `accepted`
4. Navega para `/dashboard/driver/active-trip`

### 7.2 Corrida Ativa (`/dashboard/driver/active-trip`)

**Progressão de status com botões:**

| Etapa | Botão | Status resultante |
|---|---|---|
| 1. Aceito | "Iniciar busca ao passageiro" | `GOING_TO_PICKUP` |
| 2. Indo buscar | "Cheguei ao local de embarque" | `ARRIVED` |
| 3. No local | "Passageiro a bordo" | `PASSENGER_ON_BOARD` |
| 4. A bordo | "Iniciar viagem" | `IN_PROGRESS` |
| 5. Em viagem | "Chegamos ao destino" | `FINISHING` → `COMPLETED` |
| 6. Pago | — | `PAYMENT_PENDING` → `PAYMENT_CONFIRMED` → `FINISHED` |

**Extras**:
- Botão "Gerar QR Code PIX" → `POST /api/trips/{id}/generate-payment-qr`
- Mapa com rota OSRM (pickup → destino)
- Audio notification no pagamento confirmado
- Overlay QR code fullscreen (tap para fechar)

### 7.3 KYC / Cadastro (`/dashboard/driver/kyc`)

**6 passos:**

1. **CNH** — Número da CNH + upload da foto
2. **Selfie** — Captura via webcam com guia de rosto + scanner animado
3. **Biometria** — Comparação facial client-side (`compareFaces`, `validateCNH`)
4. **Veículo** — Tipo (Moto/Carro/Van/Caminhão) + marca/modelo/placa/ano/cor
5. **Preço** — Slider R$1–R$30/km
6. **Confirmação** — "Cadastro Recebido!" com link ao dashboard

**Backend** (`POST /api/driver/verify`):
- Se similaridade ≥ 0.75 → auto-aprova (`status: approved`)
- Cria documents, vehicles, driver_pricing, atualiza driver_profiles

### 7.4 Preço por km (`/dashboard/driver/pricing`)

- Slider R$1–R$30, step R$0.50
- "Salvar preço" → UPSERT driver_pricing
- Validação: mínimo R$0.25/km

### 7.5 Ganhos (`/dashboard/driver/earnings`)

- Total recebido
- Histórico de transações tipo `ride_earning`, `freight_earning`

### 7.6 Carteira do Motorista (`/dashboard/driver/wallet`)

- Saldo disponível
- Últimas 10 transações

### 7.7 Histórico de Viagens (`/dashboard/driver/trips`)

- Últimas 20 corridas como motorista

### 7.8 Mapa do Motorista (`/dashboard/driver/map`)

- Mapa fullscreen com geolocalização em tempo real
- Link "Corrida ativa" se houver

---

## 8. Fluxo do Transportador (Fretes)

### 8.1 Dashboard (`/dashboard/transporter`)

| Métrica | Fonte |
|---|---|
| Fretes ativos | `freight_loads WHERE status = 'in_progress'` |
| Entregas hoje | `trips` (hoje, driver_id = user) |
| Ganhos hoje/semana | `wallet_transactions` |
| Avaliação média | `driver_profiles.rating` |
| Últimos fretes | Lista |

---

## 9. Fluxo da Empresa

### 9.1 Registro (`/dashboard/company/register`)

**3 passos:**

1. **Dados Básicos** — Nome, slug, CNPJ, descrição
2. **Endereço e Contato** — Endereço, cidade, estado, telefone, WhatsApp, email
3. **Categorias e Entrega** — 8 toggles (Mercado, Farmácia, Restaurante, Gás, Auto Peças, Pet Shop, Bebidas, Água) + toggle entrega + raio/taxa/pedido mínimo

`POST /api/companies/register` → cria/atualiza empresa + auto-vincula motoristas de entrega nearby.

### 9.2 Assinatura (`/dashboard/company/subscription`)

| Plano | Preço | Benefícios |
|---|---|---|
| **Grátis** | R$0/semana | Listagem básica |
| **Destaque** | R$3/semana | Prioridade no mapa, badge "Destaque" |
| **Premium** | R$5/semana | Top prioridade, mais visibilidade |

- Planos grátis → ativação direta
- Planos pagos → Stripe Checkout → webhook `checkout.session.completed`

### 9.3 Produtos

- CRUD via `company_products`
- Exibidos no `/dashboard/passenger/explore/[id]`
- Pedidos via `POST /api/orders`

---

## 10. Sistema de Corridas — Dispatch em Tempo Real

### 10.1 Fluxo Completo

```
Passageiro solicita
    ↓
POST /api/trips → INSERT trips (status: SEARCHING_DRIVER)
    ↓
INSERT trip_offers (driver_id, expires_at: +30s)
    ↓
Supabase Realtime → Canal trip_offers WHERE driver_id = X
    ↓
Motorista vê popup com countdown 15s
    ↓
Aceita → PATCH /api/dispatch/offer {action: "accept"}
    ↓
UPDATE trip_offers SET status = 'accepted'
UPDATE trips SET status = 'DRIVER_ACCEPTED'
    ↓
Motorista → active-trip →_progressão manual de status
    ↓
Passageiro → /payment → pagamento
    ↓
Webhook Stripe → confirma pagamento → wallet + driver_earnings
```

### 10.2 Transições de Status Permitidas

```
REQUEST_CREATED → SEARCHING_DRIVER
SEARCHING_DRIVER → DRIVER_NOTIFIED → DRIVER_ACCEPTED
DRIVER_ACCEPTED → GOING_TO_PICKUP
GOING_TO_PICKUP → ARRIVED
ARRIVED → PASSENGER_ON_BOARD
PASSENGER_ON_BOARD → IN_PROGRESS
IN_PROGRESS → FINISHING
FINISHING → COMPLETED
COMPLETED → PAYMENT_PENDING
PAYMENT_PENDING → PAYMENT_CONFIRMED
PAYMENT_CONFIRMED → FINISHED
```

**Cancelamento**: Qualquer status anterior a `IN_PROGRESS` pode ser cancelado.

### 10.3 Expiração de Ofertas

- `trip_offers.expires_at` = 30 segundos após criação
- Motorista tem 15s para aceitar/recusar no popup
- Se expirar, offer status → `expired`

---

## 11. Sistema Financeiro

### 11.1 Comissão da Plataforma

- **10%** por corrida (`PLATFORM_COMMISSION_PERCENT = 0.10`)
- Motorista recebe **90%** (`DRIVER_SHARE_PERCENT = 0.90`)

### 11.2 Distribuição (Stripe Connect)

```
Passageiro paga R$50
    ↓
Stripe cobra → application_fee_amount = R$5 (10%)
    ↓
Motorista recebe R$45 via transfer
    ↓
Webhook → wallet_transactions (ride_earning R$45)
    ↓
wallet_balance += R$45
```

### 11.3 Garantia Genesis

- Motoristas em cidades em lançamento recebem **garantia de ganho**
- `driver_guarantees`: valor garantido (ex: R$500), quanto já ganhou, quanto falta
- Se não atingir o mínimo → TXAP subsidia a diferença

### 11.4 Taxa Respiratória

- `respiratory_snapshots`: ofertas vs demanda em tempo real
- `breath_rate` = (drivers_disponíveis / requests_ativos)
- Se breath_rate < 1.0 → surcharge aplicado ao passageiro
- Passageiro pode aceitar ou rejeitar o surcharge

---

## 12. Carteira Digital (Wallet)

### 12.1 Estrutura

| Campo | Tipo | Descrição |
|---|---|---|
| `balance` | DECIMAL | Saldo disponível |
| `deposit_required` | DECIMAL | Depósito mínimo por tipo de veículo |
| `is_qualified` | BOOLEAN | Se atingiu mínimo para operar |

### 12.2 Depósitos

- R$20, R$50, R$100, R$200 (predefinidos)
- Cria PIX → payment_intent com `source: "pix_qr"`
- Webhook confirma → wallet balance atualizada

### 12.3 Tipos de Transação

| Tipo | Descrição |
|---|---|
| `deposit` | Depósito via PIX/cartão |
| `withdrawal` | Saque para PIX |
| `ride_payment` | Pagamento de corrida |
| `ride_earning` | Ganho do motorista |
| `freight_payment` | Pagamento de frete |
| `freight_earning` | Ganho do transportador |
| `platform_fee` | Taxa da plataforma |
| `bonus` | Bônus promocional |
| `cashback` | Cashback |
| `genesis_bonus` | Bônus Genesis |
| `respiratory_incentive` | Incentivo respiratório |
| `tip` | Gorjeta |
| `transfer` | Transferência entre usuários |

### 12.4 Segurança da Wallet

- **Trigger `check_wallet_balance`**: Impede INSERT se saldo ficaria negativo
- **Trigger `block_deposit_if_pending`**: Bloqueia depósitos duplicados
- **Trigger `update_wallet_balance`**: Sincroniza saldo automaticamente
- **`verify-balance` API**: Verifica paridade wallet ↔ transações

### 12.5 Saque (Withdrawal)

- Motorista solicita saque via PIX
- `pix_key` (CPF, email, telefone, aleatório)
- `pix_key_type`: cpf, cnpj, email, phone, random
- Status: pending → processing → completed/failed
- `net_amount = amount - fee` (coluna gerada)

---

## 13. Pagamentos

### 13.1 Métodos

| Método | Fluxo | Endpoint |
|---|---|---|
| **Carteira TXAP** | Saldo suficiente → `process_ride_payment` RPC | Client-side |
| **PIX** | `POST /api/payments/create-pix` → QR Code → polling verify | Server-side |
| **Cartão** | `POST /api/payments/process` → Stripe Checkout | Server-side |

### 13.2 Stripe Connect

- Cada motorista tem uma conta Stripe Connect Express
- Onboarding via `POST /api/stripe/connect` → `onboardingUrl`
- `stripe_connect_account_id` armazenado em `profiles`
- Pagamentos usam `transfer_data.destination` para split automático

### 13.3 Webhook Stripe

**Evento principal: `payment_intent.succeeded`**

```typescript
const pi = event.data.object  // ← corrigido de event.data
// Atualiza trips → PAYMENT_CONFIRMED
// Atualiza wallets → balance += amount
// Cria wallet_transactions → ride_earning (motorista)
// Broadcast realtime → payment_confirmed
```

**Outros eventos**: `payment_intent.payment_failed`, `charge.dispute.created`, `checkout.session.completed`, `transfer.created`, `payout.paid`

### 13.4 Valores Mínimos por Tipo

| Tipo | Depósito Mínimo |
|---|---|
| Moto | R$15 |
| Carro | R$25 |
| Frete | R$30 |

---

## 14. Mapas e Roteamento

### 14.1 Stack de Mapas

| Componente | Tecnologia |
|---|---|
| Mapa | Leaflet.js |
| Tiles | CartoDB Dark (default), OpenStreetMap |
| Roteamento | OSRM (Open Source Routing Machine) |
| Geocoding | Nominatim |
| Geospatial DB | PostGIS + earthdistance |

### 14.2 Roteamento OSRM

```
GET /api/routing?origin=lat,lng&destination=lat,lng
→ { polyline: "encoded polyline", distance: 12.5, duration: 1800, legs: [...] }
```

Polyline decodificada no frontend e renderizada como polyline no Leaflet.

### 14.3 Geocoding Nominatim

```
GET /api/geocoding?q=Rua+Paulista&limit=5
→ { suggestions: [{ display: "Rua Paulista, 1000...", lat: -23.55, lng: -46.63 }] }

GET /api/geocoding?lat=-23.55&lng=-46.63
→ { display: "Rua Paulista, Bela Vista...", lat: -23.55, lng: -46.63, address: {...} }
```

### 14.4 Motoristas Nearby

```
GET /api/drivers/nearby?lat=-23.55&lng=-46.63&radius=5
→ { drivers: [{ id, name, lat, lng, vehicleType, rating, pricePerKm }], count: 12 }
```

Busca via PostGIS RPC `find_nearby_drivers`, fallback para `drivers_online` table.

### 14.5 Cobertura

```
GET /api/location/coverage?lat=...&lng=...
→ { in_coverage: true/false, fallback?: {...}, areas_configured?: true }
```

Verifica se ponto está dentro de `coverage_areas` (POLYGON PostGIS).

---

## 15. Rastreamento em Tempo Real

### 15.1 Heartbeat do Motorista

```
POST /api/location/heartbeat
Body: { driverId, lat, lng, heading, speed, accuracy, batteryLevel, status }
```

Upsert em `driver_heartbeats` (PK: driver_id) — última posição conhecida.

### 15.2 Drivers Online

```
POST /api/drivers/location
Body: { lat, lng, vehicle_category }
```

Upsert em `drivers_online` — usado para exibir no mapa.

### 15.3 Supabase Realtime

| Canal | Evento | Filtro | Uso |
|---|---|---|---|
| `driver-offers-{driverId}` | INSERT trip_offers | `driver_id=eq.{driverId}` | Motorista recebe oferta |
| `active-trip-{driverId}` | * trips | `driver_id=eq.{driverId}` | Motorista vê mudanças na corrida |
| `trip:{tripId}` | broadcast | — | Pagamento confirmado |

### 15.4 Tracking History

- `tracking_history` — Registro de posição do motorista durante corrida
- Usado para replay da rota e auditoria

---

## 16. Feed Social e Publicações

### 16.1 Tabelas

- `feed_posts`: promo, event, update, photo, coupon, business
- `post_comments`: Comentários nos posts
- `post_likes`: Curtidas (único por user+post)
- `favorites`: Motoristas, lugares, rotas favoritos

### 16.2 Políticas

- Posts ativos são públicos (`is_active = true`)
- Autores gerenciam seus próprios posts
- Admin pode moderar tudo

---

## 17. Chat e Mensagens

### 17.1 Tabelas

- `trip_messages`: Mensagens durante a corrida (text, image, audio, system)
- `messages`: Mensagens mais detalhadas (com read_at para tracking de leitura)

### 17.2 Acesso

- Participantes da corrida (passenger OU driver) podem ler/enviar
- Sender ID registrado em cada mensagem

---

## 18. Notificações

### 18.1 Tipos

| Tipo | Uso |
|---|---|
| `system` | Notificações do sistema |
| `trip` | Status da corrida |
| `payment` | Confirmação de pagamento |
| `promotion` | Promoções |

### 18.2 Push

- `push_tokens`: Token FCM por device (ios, android, web)
- `notifications.subscribe` API: Registra push subscription
- Estrutura: `{ title, body, data: JSONB, read: boolean, action_url }`

### 18.3 Realtime

- Canal Supabase para notificações em tempo real
- Badge de não-lidas

---

## 19. Painel Administrativo

### 19.1 Dashboard (`/admin/dashboard`)

**5 abas:**

#### Aba 1: Dashboard (Stats)
- Cards: Receita Hoje, Corridas Hoje, Motoristas Online, Total Motoristas, Total Usuários, Verificações Pendentes
- Gráfico de barras: Receita da semana (7 dias)
- Lista: Últimas 10 corridas

#### Aba 2: Verificações
- 3 sub-abas: Pendentes, Aprovados, Rejeitados
- Por motorista: nome, email, CPF, cidade, documentos (CNH, selfie)
- Botões: "✓ Aprovar" / "✕ Rejeitar"
- Modal de rejeição com textarea de motivo
- URLs de documentos assinadas (Supabase Storage)

#### Aba 3: Influenciadores
- Botão "+ Adicionar Influenciador"
- Lista: instagram, nome, avatar, ordem, founder status
- CRUD via modal (instagram, display_name, avatar_url, display_order, is_founder)

#### Aba 4: Usuários
- 4 filtros: Todos, Passageiros, Motoristas, Empresas
- Lista com: nome, email, role, status, trips
- Busca por nome/email

#### Aba 5: Configurações
- Itens: Comissão, Preço Min/km, Garantia Genesis, Fundo Social
- Leitura do `global_config`

### 19.2 APIs Admin

| Endpoint | Método | Ação |
|---|---|---|
| `/api/admin/stats` | GET | Estatísticas gerais |
| `/api/admin/verification` | GET | Lista pendentes |
| `/api/admin/verification` | PATCH | Aprova/rejeita motorista |
| `/api/admin/users` | GET | Lista usuários |
| `/api/admin/influencers` | POST/PUT/DELETE | CRUD influenciadores |
| `/api/admin/cities` | GET/POST/PUT/DELETE | CRUD cidades |
| `/api/admin/pricing` | GET/POST/PUT/DELETE | CRUD pricing rules |
| `/api/admin/config` | GET/POST | Ler/escrever config global |
| `/api/admin/ban` | POST/DELETE | Banir/desbanir usuário |

---

## 20. Programa de Influenciadores

### 20.1 Estrutura

- `influencers`: Instagram handle, nome, avatar, bio, is_founder
- `influencer_referrals`: Código de referral, status (pending/completed/rewarded)
- `influencer_goals`: Metas com recompensas

### 20.2 Dashboard do Influenciador (`/dashboard/influencer`)

- Stats: Indicações totais, convertidas, meta atual (progress bar)
- Link de indicação com botão "Copiar"
- Gerado via `POST /api/influencers/generate-link`

### 20.3 Na Landing Page

- Seção "Parceiros Oficiais" com cards de influenciadores
- Links para Instagram
- Badge "Fundador" para os primeiros

---

## 21. Genesis Protocol

### 21.1 Conceito

Protocolo de lançamento de cidades que combina:
- **Seed Missions**: Missões para motoristas (onboarding, primeira corrida, referral)
- **Driver Guarantees**: Garantia mínima de ganho (ex: R$500/semana)
- **Respiratory Pricing**: Preço dinâmico baseado em oferta/demanda

### 21.2 Fluxo

1. Admin cria `city_launch` via `POST /api/cities/seed`
2. Motorista completa missões → recebe bônus na wallet
3. Se ganhos < garantia → TXAP subsidia
4. `respiratory_snapshots` controla preços dinâmicos

### 21.3 Status do Launch

`seeding` → `flash` → `live` → `completed`

---

## 22. Sistema de Segurança

### 22.1 Autenticação

- Supabase Auth (JWT + Refresh Token rotation)
- Cookies HttpOnly via `@supabase/ssr`
- Service role apenas para webhooks (verificação de assinatura Stripe)

### 22.2 RLS (Row Level Security)

- Habilitado em todas as 68+ tabelas
- Políticas granulares por role e relação

### 22.3 Rate Limiting

- Upstash Redis em rotas sensíveis: auth, payments, geocoding, heartbeat, nearby
- `withRateLimit(handler, key)` wrapper

### 22.4 Proteção de Rotas

- `proxy.ts` protege `/dashboard/*`, `/admin/*`, `/payment/*`, `/ride/*`
- Open redirect prevention no auth callback
- CSP headers via `vercel.json`

### 22.5 Auditoria

- `audit_logs`: Todas as ações financeiras
- `app_errors`: Erros da aplicação
- `signup_attempts_log`: Tentativas de cadastro
- `banned_devices`: Banimento por device fingerprint
- `content_reports`: Denúncias de conteúdo

### 22.6 Validação

- CPF imutável após criação
- Telefone imutável após criação
- Nome: 1 alteração a cada 30 dias
- Profile update: whitelist de campos permitidos
- Admin endpoints: verificação de role

### 22.7 Webhook Security

- Verificação de assinatura Stripe (`stripeService.verifyWebhook`)
- Service role key apenas server-side
- Nunca confiar em dados do client para operações financeiras

---

## 23. APIs — Referência Completa

### 23.1 Resumo

| Métrica | Valor |
|---|---|
| Route files | 57 |
| Endpoints totais | 79 |
| GET | 36 |
| POST | 32 |
| PATCH | 4 |
| PUT | 5 |
| DELETE | 8 |
| Rate-limited | 18 |
| Admin-only | 16 |
| Não autenticados | 14 |
| Autenticados | 49 |
| Service-role | 1 |

### 23.2 Detalhamento por Domínio

#### Auth (4 endpoints)

| Endpoint | Método | Auth | Rate Limit | Descrição |
|---|---|---|---|---|
| `/api/auth` | POST | 🔓 | ✅ auth | Signup/Signin/Signout |
| `/api/auth/register` | POST | 🔓 | ✅ auth | Registro com validação CPF |
| `/api/auth/check-availability` | GET | 🔓 | — | Verifica phone/CPF disponível |
| `/api/auth/callback` | GET | 🔓 | — | OAuth callback |

#### Profile (1 endpoint)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/profile/update` | PATCH | 🔑 | Atualiza perfil (whitelist de campos) |

#### Trips (3 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/trips` | POST | 🔑 | Cria corrida + trip_offer |
| `/api/trips/{id}/generate-payment-qr` | POST | 🔑 | Gera QR PIX (motorista) |
| `/api/trip/status` | PATCH | 🔑 | Atualiza status (state machine) |

#### Dispatch (1 endpoint)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/dispatch/offer` | PATCH | 🔑 | Aceita/recusa oferta |

#### Payments (8 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/payments` | POST | 🔑 | Cria PaymentIntent |
| `/api/payments` | GET | 🔓 | Lista planos de assinatura |
| `/api/payments/process` | POST | 🔑 | Processa pagamento com Stripe Connect |
| `/api/payments/create-pix` | POST | 🔑 | Cria PIX com split |
| `/api/payments/status` | GET | 🔑 | Status do PaymentIntent |
| `/api/payments/verify-pix` | POST | 🔑 | Verifica pagamento PIX |
| `/api/stripe/connect` | POST | 🔑 | Cria conta Connect Express |
| `/api/webhooks/stripe` | POST | ⚙️ | Webhook Stripe |

#### Wallet (3 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/wallet/balance` | GET | 🔑 | Saldo + qualificação |
| `/api/wallet/transactions` | GET | 🔑 | Transações paginadas |
| `/api/wallet/verify-balance` | GET | 🔑 | Verificação de paridade |

#### Drivers (9 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/drivers/nearby` | GET | 🔓 | Motoristas próximos (PostGIS) |
| `/api/drivers/location` | POST | 🔑 | Atualiza localização online |
| `/api/drivers/guarantees` | GET/POST | 🔑 | Garantias Genesis |
| `/api/driver/verify` | POST | 🔑 | Submete KYC |
| `/api/driver/pricing` | GET/POST | 🔑 | Pricing do motorista |
| `/api/driver/pricing/{id}` | PUT/DELETE | 🔑 | CRUD pricing |

#### Location (4 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/location/nearby` | GET | 🔓 | Nearby via heartbeats |
| `/api/location/heartbeat` | POST | 🔑 | Heartbeat de posição |
| `/api/location/coverage` | GET | 🔓 | Verifica cobertura |
| `/api/location/coverage/nearest` | GET | 🔓 | Cidade mais próxima |

#### Routing/Geocoding (2 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/routing` | GET | 🔓 | Rota OSRM |
| `/api/geocoding` | GET | 🔓 | Geocoding Nominatim |

#### Companies/Directory (7 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/companies/register` | GET/POST | 🔑 | Registro/edição empresa |
| `/api/companies/{id}` | GET | 🔓 | Detalhe empresa |
| `/api/companies/{id}/products` | GET | 🔓 | Produtos da empresa |
| `/api/companies/featured` | GET | 🔓 | Empresas em destaque |
| `/api/companies/subscribe` | POST | 🔑 | Assinar plano |
| `/api/directory` | GET | 🔓 | Busca empresas/profissionais |

#### Orders (2 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/orders` | POST | 🔑 | Criar pedido |
| `/api/orders` | GET | 🔑 | Listar pedidos |

#### Favorites (3 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/favorites` | GET/POST/DELETE | 🔑 | CRUD favoritos |

#### Influencers (3 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/influencers` | GET | 🔓 | Lista influenciadores |
| `/api/influencers/stats` | GET | 🔑 | Stats de referral |
| `/api/influencers/generate-link` | POST | 🔑 | Gerar link referral |

#### Notifications (1 endpoint)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/notifications/subscribe` | POST | 🔑 | Subscribe push |

#### Pricing Genesis (1 endpoint)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/pricing/respiratory` | GET/POST | 🔓/🔑 | Taxa respiratória |

#### Admin (16 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/admin/stats` | GET | 👑 | Estatísticas |
| `/api/admin/verification` | GET/PATCH | 👑 | Verificar motoristas |
| `/api/admin/users` | GET | 👑 | Listar usuários |
| `/api/admin/influencers` | POST/PUT/DELETE | 👑 | CRUD influenciadores |
| `/api/admin/cities` | GET/POST/PUT/DELETE | 👑 | CRUD cidades |
| `/api/admin/pricing` | GET/POST/PUT/DELETE | 👑 | CRUD pricing rules |
| `/api/admin/config` | GET/POST | 👑 | Config global |
| `/api/admin/ban` | POST/DELETE | 👑 | Banir/desbanir |

#### Misc (3 endpoints)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/api/seed` | POST | 👑 | Seed dados iniciais |
| `/api/cities/seed` | GET/POST | 👑/🔑 | City launches |
| `/api/cities/seed/missions` | GET/POST | 🔑 | Missões Genesis |
| `/api/drone/captures` | GET | 🔓 | Capturas drone |
| `/api/migrate` | GET | 🔓 | SQL migrations |

---

## 24. Regras de Negócio

### 24.1 Preço da Corrida

```
preço_estimado = base_fare + (price_per_unit × distância_km) + (price_per_minute × duração_min)
preço_com_surcharge = preço_estimado × respiratory_multiplier (se aplicável)
```

### 24.2 Comissão

- Plataforma: **10%** do valor total
- Motorista: **90%** do valor total
- Aplicado via `application_fee_amount` no Stripe Connect

### 24.3 Cancelamento

- Passageiro pode cancelar antes do motorista chegar
- Motorista pode recusar corrida (afeta acceptance_rate)
- `cancellation_rate` rastreado no `driver_profiles`

### 24.4 Avaliação

- Passageiro e motorista se avaliam (1-5 estrelas)
- `rating_type`: `passenger_to_driver` ou `driver_to_passenger`
- Média do motorista recalculada via trigger
- Se média < 3.0 → status automático `rejected`

### 24.5 Limites

- Nome: 1 alteração a cada 30 dias
- Preço/km mínimo: R$0.25
- Oferta de corrida: expira em 30 segundos
- Countdown de aceitação: 15 segundos

### 24.6 KYC Auto-Aprovação

- Se `similarityScore ≥ 0.75` → auto-aprova
- Caso contrário → pendente para revisão manual do admin

### 24.7 Saque Mínimo

- Configurável via `global_config` → `min_withdrawal`

---

## 25. Permissões e Controle de Acesso

### 25.1 Por Role

| Recurso | Passageiro | Motorista | Transportador | Empresa | Admin |
|---|---|---|---|---|---|
| Solicitar corrida | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aceitar corrida | ❌ | ✅ | ✅ | ❌ | ❌ |
| Definir preço/km | ❌ | ✅ | ✅ | ❌ | ❌ |
| KYC/Cadastro | ❌ | ✅ | ✅ | ❌ | ❌ |
| Registrar empresa | ❌ | ❌ | ❌ | ✅ | ❌ |
| Vender produtos | ❌ | ❌ | ❌ | ✅ | ❌ |
| Verificar motoristas | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ❌ | ✅ |
| Config global | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver stats gerais | ❌ | ❌ | ❌ | ❌ | ✅ |
| Usar wallet | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver histórico | ✅ | ✅ | ✅ | ✅ | ✅ |
| Avaliar | ✅ | ✅ | ✅ | ✅ | ✅ |

### 25.2 Políticas RLS por Domínio

| Domínio | Regra |
|---|---|
| Próprios dados | `uid() = id` em profiles, driver_profiles, vehicles |
| Corridas | `uid() = passenger_id OR uid() = driver_id` |
| Mensagens | Participantes da corrida |
| Wallet | `uid() = profile_id` |
| Empresa | `uid() = company_id` |
| Admin | `uid() IN (SELECT id FROM profiles WHERE role = 'admin')` |
| Público | cities, pricing_rules, vehicle_categories, businesses, professionals, coupons, influencers |

---

## 26. Componentes e Hooks

### 26.1 Componentes (15)

| Componente | Arquivo | Descrição |
|---|---|---|
| PassengerMap | `components/maps/PassengerMap.tsx` | Mapa Leaflet passageiro |
| DriverMap | `components/maps/DriverMap.tsx` | Mapa Leaflet motorista |
| LeafletMap | `components/map/LeafletMap.tsx` | Mapa avançado com camadas |
| Navbar | `components/landing/Navbar.tsx` | Navbar landing page |
| Button | `components/ui/button.tsx` | Botão multi-variante |
| Input | `components/ui/input.tsx` | Input com label/erro/password toggle |
| Toast | `components/ui/toast.tsx` | Notificação toast |
| Skeleton | `components/ui/skeleton.tsx` | Loading placeholders |
| Icon | `components/ui/Icon.tsx` | 40+ ícones SVG |
| ErrorBoundary | `components/ui/error-boundary.tsx` | Error boundary + HOC |
| AddressModal | `components/ui/address-modal.tsx` | Modal de endereço |
| ActionButton | `components/ui/action-button.tsx` | Botão com throttle/confirm |
| SelfieCapture | `components/verification/SelfieCapture.tsx` | Captura selfie KYC |
| FileUpload | `components/verification/FileUpload.tsx` | Upload de documentos |
| DroneCamera | `components/DroneCamera.tsx` | Câmera 360° drone |

### 26.2 Hooks (10)

| Hook | Retorno Principal |
|---|---|
| `use-user` | `{ user, loading }` |
| `use-active-trip` | `{ trip, loading, updateStatus, refetch }` |
| `use-trip-offers` | `{ offer, loading, acceptOffer, rejectOffer }` |
| `use-ride-logic` | `{ origin, destination, price, handleRequestRide, ... }` |
| `use-driver-data` | `{ profile, vehicle, trips, earnings, loading }` |
| `use-passenger-data` | `{ trips, addresses, stats, loading }` |
| `use-transporter-data` | `{ activeFreights, earnings, loading }` |
| `use-company-data` | `{ company, drivers, revenue, loading }` |
| `use-geolocation` | `{ latitude, longitude, loading, error, requestPermission }` |
| `use-media-query` | `useIsMobile`, `useIsTablet`, `useBreakpoint`, etc. |

### 26.3 Stores Zustand (4)

| Store | Estado Principal | Persistência |
|---|---|---|
| `user-store` | `{ id, email, name, role, isAuthenticated }` | localStorage (`txd-user`) |
| `wallet-store` | `{ realBalance, transactions, walletId }` | localStorage (`txd-wallet`) |
| `ride-store` | `{ currentRide: { status, origin, destination, driverId } }` | — |
| `ui-store` | `{ isSidebarOpen, activeModal, isOnline, connectionQuality }` | — |

---

## 27. Escalabilidade e Performance

### 27.1 Próximos Passos (Escalabilidade)

| Área | Plano |
|---|---|
| **Cache** | Upstash Redis para queries frequentes (nearby drivers, pricing) |
| **CDN** | Vercel Edge Network (assets estáticos) |
| **Realtime** | Supabase Realtime com filtros otimizados |
| **DB** | Índices PostGIS para queries espaciais O(log n) |
| **Rate Limiting** | Upstash Redis com sliding window |
| **Background Jobs** | Webhook processing, notification sending |

### 27.2 Performance Atual

- Build: ~8s (Turbopack)
- 54 rotas dinâmicas + 36 static pages
- Zero TypeScript errors
- Lighthouse PWA: instalável

### 27.3 Monitoramento

- `app_errors` table para tracking de erros
- `audit_logs` para ações críticas
- Stripe Dashboard para pagamentos
- Supabase Dashboard para DB

---

## 28. Expanções Futuras

### 28.1 Curto Prazo

| Feature | Descrição |
|---|---|
| **Chat em tempo real** | WebSocket para messaging durante corrida |
| **Avaliação bidirecional** | Passageiro e motorista se avaliam pós-corrida |
| **Cupons de desconto** | Sistema de cupons com validade e limite de uso |
| **Relatórios financeiros** | Dashboard financeiro completo para motoristas |
| **Múltiplos passageiros** | Split de corrida entre 2+ passageiros |

### 28.2 Médio Prazo

| Feature | Descrição |
|---|---|
| **App React Native** | Versão nativa para iOS/Android |
| **Entregas programadas** | Agendamento de corridas/entregas |
| **Rotas favoritas** | Salvar e reutilizar rotas frequentes |
| **Fila de espera** | Sistema de fila em horários de pico |
| **Integração Waze/Google Maps** | Navegação externa para motoristas |
| **Suporte a múltiplos idiomas** | i18n (PT, EN, ES) |
| **Pagamento em parcelas** | Parcelamento de fretes grandes |

### 28.3 Longo Prazo

| Feature | Descrição |
|---|---|
| **Ônibus/Micro-ônibus** | Transporte coletivo sob demanda |
| **Caminhões pesados** | Fretes interestaduais |
| **Moto-taxi** | País com regulamentação específica |
| **Drone delivery** | Entrega por drone (já existe protótipo 360°) |
| **Seguros** | Seguro de vida para motoristas/passageiros |
| **Marketplace de autopeças** | Venda de peças para motoristas |
| **Escola de motoristas** | Parceria com autoescolas |
| **Gasolina/Combustível** | Desconto em postos parceiros |
| **Estacionamento** | Parceria com estacionamentos |
| **Aluguel de veículos** | Rental de carros/motos |

---

## Apêndice A: Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
NEXT_PUBLIC_BASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Apêndice B: Comandos

```bash
# Desenvolvimento
npx next dev --port 3099

# Build
npx next build

# Deploy (automático via GitHub push)
git push origin main

# CI/CD Pipeline
# typecheck → lint → build → smoke test
```

## Apêndice C: Credenciais de Teste

```
Email: awqy@awqy.com
Senha: 123456789
```

---

*Documento gerado automaticamente em Julho 2026.*
*Fonte de verdade: `supabase/consolidated.sql` (2281 linhas, 68+ tabelas).*
