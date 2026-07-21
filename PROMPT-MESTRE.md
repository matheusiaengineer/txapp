# 🚀 PROMPT MESTRE — TXAP: O GRAN FINALE

> **Missão:** Refatorar o TXAP de ~3M linhas para ~50k-100k linhas, mantendo TODAS as APIs funcionando, foco total em mobile (celulares antigos), e pronto para operar em 3 cidades com 1.000 motoboys.

---

## 📦 O QUE NÃO PODE SER TOCADO (SAGRADO)

| Recurso | Motivo |
|---------|--------|
| `.env` / `.env.local` | Chaves reais de produção |
| `supabase/` (migrations + functions) | Banco de dados e Edge Functions prontos |
| API Routes (`/api/*`) | 55 endpoints funcionando (auth, dispatch, payments, freight, chat, etc.) |
| Stripe integration | Já processa PIX, cartão, split 80/20 |
| Google Maps / Places API | Rotas, lugares populares, geolocalização |
| Supabase Auth + Storage | Login, upload de documentos, selfie |
| WebAuthn (biometria) | Login facial/digital |
| Upstash Redis | Rate limiting |
| i18n translations | 5 idiomas completos |

---

## 🧠 ARQUITETURA LÓGICA (O FLUXO)

### 🔹 Tela 1: Login + i18n por GPS
- Ao abrir o app, pede permissão de localização
- Detecta país pela latitude/longitude e define o idioma automaticamente
  - Brasil → Português (BR)
  - Inglaterra → Inglês (EN)
  - EUA → Português (BR)
- Login via Gmail (OAuth) ou Email + Senha
- Após login, redireciona pro dashboard baseado no tipo de conta

### 🔹 Tela 2: Onboarding / KYC
- **Passageiro:** Selfie (verificação facial)
- **Motorista / Motoboy / Caminhoneiro / Fiorino / Van:**
  - Upload da CNH (foto)
  - Selfie (verificação facial)
  - Define o **preço por KM** (campo: "Qual o valor do seu quilômetro?")
  - Define tipo de veículo
- **Empresa:** Dados da empresa + documentos

### 🔹 Tela 3: Dashboard (Mapa Full-Screen)
- Mapa ocupa 100% da tela (`100dvh`)
- Mostra localização atual do usuário (GPS)
- **Google Places API:** Botões flutuantes com lugares populares ao redor (shoppings, aeroportos, hospitais, mercados)
- **Barra de busca:** Digitar endereço específico (autocomplete)
- **Categorias:** Passageiro escolhe entre **Carro** (táxi/uber) ou **Moto** (mototáxi)
- Markers verdes = motoristas online disponíveis

### 🔹 Tela 4: Matching + Corrida
- Passageiro seleciona destino → vê preço estimado (KM × preço do motorista + taxa base)
- Confirma a corrida → notificação enviada aos motoristas próximos
- Motorista aceita → vai até o local → inicia corrida
- Passageiro acompanha o trajeto em tempo real no mapa

### 🔹 Tela 5: Pagamento (White-Label)
- **NUNCA** mostra "Stripe" na interface — tudo é **TXAP**
- Opção A: **Carteira TXAP** (saldo pré-pago)
  - Débito automático da carteira do passageiro
  - Split: 80% motorista / 20% TXAP
- Opção B: **QR Code** (PIX / Cartão)
  - Stripe gera o QR Code na tela do passageiro
  - Passageiro escaneia com qualquer banco
  - Split automático via Stripe Connect

### 🔹 Tela 6: Avaliação
- Passageiro avalia motorista (1-5 estrelas)
- Motorista avalia passageiro

---

## 🗂️ ESTRUTURA DE DADOS (BANCO SUPABASE)

```sql
-- USUÁRIOS
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  nome TEXT,
  telefone TEXT,
  tipo TEXT,          -- 'passageiro' | 'motorista' | 'empresa'
  idioma TEXT DEFAULT 'pt-BR',
  foto_url TEXT,
  verificado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- MOTORISTAS (com preço por KM definido por eles)
CREATE TABLE drivers (
  id UUID PRIMARY KEY REFERENCES users(id),
  cnh_numero TEXT,
  cnh_foto_url TEXT,
  selfie_url TEXT,
  tipo_veiculo TEXT,  -- 'carro' | 'moto' | 'van' | 'caminhao' | 'fiorino'
  placa TEXT,
  preco_por_km DECIMAL(10,2),  -- O MOTORISTA DEFINE!
  status TEXT DEFAULT 'offline', -- 'offline' | 'online' | 'ocupado'
  lat_atual DECIMAL(10,7),
  lng_atual DECIMAL(10,7),
  avaliacao DECIMAL(2,1) DEFAULT 5.0
);

-- CORRIDAS
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id UUID REFERENCES users(id),
  motorista_id UUID REFERENCES drivers(id),
  origem_lat DECIMAL(10,7),
  origem_lng DECIMAL(10,7),
  destino_lat DECIMAL(10,7),
  destino_lng DECIMAL(10,7),
  distancia_km DECIMAL(10,2),
  tipo_veiculo TEXT,
  preco_por_km DECIMAL(10,2),
  valor_total DECIMAL(10,2),
  status TEXT DEFAULT 'procurando', -- 'procurando' | 'aceita' | 'em_andamento' | 'finalizada' | 'cancelada'
  criada_em TIMESTAMP DEFAULT NOW(),
  aceita_em TIMESTAMP,
  finalizada_em TIMESTAMP
);

-- CARTEIRA (saldo)
CREATE TABLE wallet (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  saldo DECIMAL(10,2) DEFAULT 0.00,
  atualizada_em TIMESTAMP DEFAULT NOW()
);

-- TRANSAÇÕES
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID REFERENCES rides(id),
  passageiro_id UUID REFERENCES users(id),
  motorista_id UUID REFERENCES drivers(id),
  valor_total DECIMAL(10,2),
  taxa_txap DECIMAL(10,2),    -- 20%
  valor_motorista DECIMAL(10,2), -- 80%
  metodo TEXT,                -- 'carteira' | 'pix' | 'cartao'
  status TEXT DEFAULT 'pendente',
  criada_em TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 STACK TÉCNICA (PRESERVAR)

```
Frontend:     Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript 5
Backend:      Supabase (PostgreSQL + Auth + Storage + Edge Functions)
Pagamentos:   Stripe (PIX + Cartão + Split 80/20)
Mapas:        Google Maps API + Google Places API
Cache:        Upstash Redis (rate limiting)
Animações:    Framer Motion (leve, apenas micro-interações)
Testes:       Vitest (unit) + Playwright (E2E)
Deploy:       Vercel
Idiomas:      pt-BR, en-US, es-ES, fr-FR, de-DE
```

---

## 🎯 DESIGN & PERFORMANCE (CELULAR ANTIGO)

- **Mobile-first 100%**: Ocupe toda a tela, sem scroll horizontal
- **`100dvh`** em todas as telas principais (sem corte no notch ou bordas curvas)
- **`safe-area-inset`** para iPhone e Android modernos
- **Botões grandes** (mínimo 48px altura) — fáceis de tocar na rua
- **Remover** animações 3D pesadas (Three.js, R3F, lottie complexo)
- **Glassmorphism leve** (apenas 1-2 camadas, sem blur excessivo)
- **Tema escuro neon** (já configurado no `globals.css`)
- **Fonte**: Inter (já importada)
- **Carregamento inicial < 3s** em celular intermediário
- **Otimizações**:
  - Lazy loading de componentes abaixo da dobra
  - Imagens em WebP/AVIF
  - Code splitting por rota
  - Service Worker para cache de assets

---

## 📋 PLANO DE EXECUÇÃO (O RESET)

### Fase 0: Análise e Limpeza
1. Mapear todos os arquivos do projeto (já feito)
2. Identificar código morto:
   - Componentes de UI não utilizados em nenhuma rota
   - Páginas duplicadas ou obsoletas
   - Bibliotecas não utilizadas (verificar imports em todo o projeto)
   - Comentários excessivos, logs de debug, `console.log`
3. Remover arquivos de scaffolding antigos

### Fase 1: Preservar e Simplificar (25 arquivos essenciais)
- `/src/app/layout.tsx` — Simplificar, manter PWA + SEO
- `/src/app/globals.css` — Manter tema neon, remover classes não usadas
- `/src/app/page.tsx` — Landing page (reduzir para versão enxuta)
- `/src/middleware.ts` — Manter proteção de rotas
- `/src/lib/supabase/*` — Manter (browser, server, middleware)
- `/src/lib/auth/*` — Manter (auth-service, validators)
- `/src/lib/i18n/*` — Manter (ignição por GPS)
- `/src/lib/payment/*` — Manter (Stripe + wallet)
- `/src/lib/mobility/*` — Manter (engine, pricing, geolocation)
- `/src/lib/dispatch/*` — Manter (ScoreDispatch)
- `/src/lib/hooks/*` — Manter (use-geolocation, use-user, etc.)
- `/src/lib/store/*` — Manter (Zustand stores)
- `/src/components/ui/*` — Manter só os essenciais (button, input, toast, Icon, skeleton)
- `/src/components/map/*` — Manter (GoogleMap)
- `/src/components/landing/*` — Manter (Navbar, Hero, AuthModal)
- `/src/components/verification/*` — Manter (SelfieCapture, FileUpload)

### Fase 2: Rotas Essenciais (manter)
| Rota | Funcionalidade |
|------|----------------|
| `/` | Landing page |
| `/auth/login` | Login (email + Gmail) |
| `/auth/register` | Multi-step com selfie, CNH, preço/KM |
| `/auth/forgot-password` | Recuperar senha |
| `/dashboard/passenger` | Mapa + lugares populares + solicitar corrida |
| `/dashboard/driver` | Online/offline + aceitar corridas + ganhos |
| `/dashboard/company` | Gestão de fretes/entregas |
| `/ride/*` | Fluxo de corrida |
| `/payment/*` | Pagamento (carteira + QR code) |
| `/settings` | Configurações do perfil |
| `/chat` | Chat passageiro-motorista |
| `/admin` | Painel admin |
| `/api/*` | **TODAS** as 55 APIs (manter intactas) |

### Fase 3: Rotas a Remover (excesso)
- `/devops` — Remover (não necessário para o app)
- `/rastreio/[code]` — Simplificar ou remover
- `/lite` — Absorver no mobile-first
- `/social` — Remover (rede social não é core)
- `/community` — Remover (fórum não é MVP)
- `/emergency` — Simplificar (manter como modal)
- `/admin-secret` — Revisar necessidade
- Componentes 3D (`vehicle-3d.tsx`, `particles-background.tsx`, `effects-3d`) — Remover
- `lib/haptics.ts` — Remover (vibração não crítica)

### Fase 4: Refatorar Código
- Landing page: Reduzir seções, focar em mobile
- Dashboard: Mapa full-screen com bottom sheet
- Cadastro: Simplificar para o fluxo descrito (KYC + preço/KM)
- Pagamento: Unificar wallet + Stripe com interface TXAP
- i18n: Adicionar detecção por GPS (já existe estrutura)
- Design: Botões grandes, padding generoso, tipografia legível

### Fase 5: Testes
- Testar fluxo completo: Login → Escolher perfil → KYC → Dashboard → Pedir corrida → Pagar
- Testar em celular real (iPhone SE, Moto G, Galaxy A03)
- Testar i18n com GPS mockado
- Testar pagamento (Stripe em modo test)

---

## 📐 DIAGRAMA DE FLUXO (TEXTO)

```
CELULAR DO USUÁRIO
│
├── 1. ABRE O APP
│   └── Pede localização GPS → detecta país → define idioma
│
├── 2. TELA DE LOGIN
│   ├── Login com Gmail (1 clique)
│   └── Login com Email + Senha
│
├── 3. ONBOARDING (primeiro acesso)
│   ├── Passageiro: Selfie facial
│   ├── Motorista: Selfie + CNH + "Qual o valor do seu KM?"
│   └── Empresa: Documentos da empresa
│
├── 4. DASHBOARD (Mapa Full-Screen)
│   ├── Mapa com localização atual
│   ├── Botões: lugares populares ao redor
│   ├── Barra de busca de endereço
│   └── Categorias: Carro | Moto
│
├── 5. SOLICITAR CORRIDA
│   ├── Digita/Seleciona destino
│   ├── Vê preço (KM × preço do motorista + taxa base)
│   ├── Confirma → notifica motoristas próximos
│   └── Motorista aceita → inicia corrida
│
├── 6. CORRIDA EM ANDAMENTO
│   ├── Mapa com rota ao vivo
│   ├── ETA, tempo, distância
│   └── Botão de emergência (SOS)
│
├── 7. FINALIZAR + PAGAR
│   ├── Opção A: Carteira TXAP (saldo → débito automático)
│   ├── Opção B: QR Code PIX/Cartão (Stripe white-label)
│   └── Split automático: 80% motorista / 20% TXAP
│
└── 8. AVALIAÇÃO
    ├── Passageiro → Motorista (1-5★)
    └── Motorista → Passageiro (1-5★)
```

---

## 🔗 APIs EXTERNAS (MANTER FUNCIONANDO)

| API | Função | Arquivos |
|-----|--------|----------|
| Supabase | Auth, DB, Storage, Realtime | `src/lib/supabase/*` |
| Stripe | PIX, Cartão, Split, Webhooks | `src/lib/payment/*`, `src/app/api/webhooks/stripe/*` |
| Google Maps | Mapas, Rotas, Places, Geolocation | `src/lib/mobility/*`, `src/components/map/*` |
| Upstash Redis | Rate limiting | `src/lib/rate-limit.ts` |
| WebAuthn | Biometria (login facial/digital) | `src/lib/auth/webauthn.ts`, `src/app/api/webauthn/*` |

---

## ✅ CRITÉRIOS DE SUCESSO

1. App abre em **< 3 segundos** em celular intermediário (Moto G, Galaxy A03)
2. **100% mobile-first** — todos os layouts testados em viewport 320px-428px
3. **Login funcional** com Gmail e Email+Senha
4. **KYC completo**: Selfie + CNH + Preço/KM para motoristas
5. **Mapa com lugares populares** via Google Places API
6. **Matching** entre passageiro e motorista (notificação → aceitar)
7. **Pagamento funcional**: Carteira TXAP + QR Code Stripe
8. **Split 80/20** automático
9. **i18n por GPS** (pelo menos pt-BR e en-US)
10. **Nenhuma API quebrada** (todas as 55 rotas intactas)
11. **Código limpo**: ~50k-100k linhas (vs 3M atuais)

---

> 🎯 **Este prompt é o contrato. Siga ele à risca. Não invente. Não adicione. Apenas execute o reset com precisão cirúrgica.**
