# TXAPP Road Intelligence

> **Versão:** 1.0.0
> **Status:** Draft
> **Última Atualização:** 2026-07-13
> **Responsável:** Equipe de Plataforma

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Tabela `road_events`](#3-tabela-road_events)
4. [Tipos de Evento (21 tipos)](#4-tipos-de-evento-21-tipos)
5. [Fluxo de Reporte](#5-fluxo-de-reporte)
6. [Geofence Engine](#6-geofence-engine)
7. [Mapa de Calor](#7-mapa-de-calor)
8. [Verificação Colaborativa](#8-verificação-colaborativa)
9. [Expiração Automática](#9-expiração-automática)
10. [Integração com Dispatch](#10-integração-com-dispatch)
11. [Analytics](#11-analytics)
12. [Tabela `driver_road_reputation`](#12-tabela-driver_road_reputation)
13. [Notificações](#13-notificações)
14. [Segurança e Rate Limiting](#14-segurança-e-rate-limiting)
15. [API Endpoints](#15-api-endpoints)
16. [Componentes Mobile](#16-componentes-mobile)
17. [Tratamento de Erros](#17-tratamento-de-erros)
18. [Glossário](#18-glossário)

---

## 1. Visão Geral

O **Road Intelligence** é o motor colaborativo de eventos de trânsito em tempo real do TXAPP. Inspirado pelo Waze, permite que motoristas reportem e recebam alertas sobre condições das vias de forma instantânea. O sistema funciona como uma camada de overlay sobre qualquer provedor de mapas (Google Maps, Mapbox, OpenStreetMap), tornando-se independente de geolocalização.

### 1.1 Objetivos Principais

- Reduzir o tempo de reação a eventos de trânsito em 60%
- Criar a maior base colaborativa de dados viários do Brasil
- Integrar eventos de trânsito ao sistema de Dispatch para rotas inteligentes
- Gamificar a contribuição dos motoristas através de reputação e leaderboards

### 1.2 Princípios de Design

- **Real-time first:** Toda operação deve ser processada e propagada em menos de 500ms
- **Offline resilience:** Reports podem ser enfileirados localmente e sincronizados quando houver conectividade
- **Privacy by design:** Localização precisa nunca é armazenada sem consentimento explícito
- **Progressive enhancement:** Funcionalidades básicas funcionam sem cadastro; funcionalidades avançadas requerem login
- **Cost-aware:** Uso eficiente de banda, compressão de imagens e geofences efêmeros

### 1.3 Público-Alvo

| Perfil | Descrição | Funcionalidades-Chave |
|--------|-----------|----------------------|
| Motorista Casual | Usa o app esporadicamente | Visualizar eventos, receber alertas |
| Motorista Contribuidor | Reporta eventos ativamente | Reportar, upvote/downvote, reputação |
| Motorista Power User | Usa Road Intelligence + Dispatch | Rotas inteligentes, analytics |
| Admin / Dispatcher | Gerencia o sistema | Verificar eventos, estender expiração, analytics |

### 1.4 Dependências Externas

| Sistema | Finalidade | Criticidade |
|---------|-----------|-------------|
| Supabase Realtime | Propagação de eventos em tempo real | Alta |
| Supabase Database | Persistência de eventos, usuários, reputação | Alta |
| Mapbox / Google Maps | Renderização do mapa e geocodificação reversa | Média |
| OneSignal / Firebase Cloud Messaging | Push notifications | Alta |
| Cloudinary / S3 | Armazenamento de fotos dos eventos | Média |
| Redis | Cache de geofences ativos e sessões | Alta |

### 1.5 Métricas de Sucesso (OKRs)

| Métrica | Objetivo | Prazo |
|---------|----------|-------|
| Eventos reportados por dia | > 10.000 | 6 meses |
| Tempo médio de verificação | < 5 minutos | 3 meses |
| Taxa de acerto dos reports | > 90% | 3 meses |
| Motoristas ativos no Road Intelligence | > 50.000 | 6 meses |
| Redução de ETA em rotas com desvio | > 15% | 12 meses |

---

## 2. Arquitetura do Sistema

### 2.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DRIVER APP (Mobile)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Map View │  │ Report   │  │ Notification │  │ Heatmap Layer  │ │
│  │ (overlay)│  │ Form     │  │ Center       │  │ (cluster+filter│ │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  └───────┬────────┘ │
│       │             │               │                   │          │
│       └─────────────┼───────────────┼───────────────────┘          │
│                     │               │                               │
└─────────────────────┼───────────────┼───────────────────────────────┘
                      │               │
               ┌──────▼───────────────▼──────┐
               │       API GATEWAY (Kong)     │
               │    /api/v1/road-intelligence │
               └──────┬───────────────┬───────┘
                      │               │
         ┌────────────▼──┐      ┌─────▼────────────┐
         │  Road Events  │      │  Authentication  │
         │  Service      │      │  & Rate Limiting │
         └──────┬────────┘      └──────────────────┘
                │
        ┌───────┴───────────────────────────────┐
        │         SUPABASE REALTIME              │
        │  (WebSocket / PostgreSQL LISTEN/NOTIFY)│
        └───────┬───────────────────────────────┘
                │
        ┌───────┴───────────────────────────────┐
        │         ROAD INTELLIGENCE API          │
        │   (Node.js + Fastify + TypeScript)     │
        ├───────────────────────────────────────┤
        │  • Event Validation Engine            │
        │  • Geofence Engine                    │
        │  • Reputation Calculator              │
        │  • Expiration Scheduler               │
        │  • Heatmap Aggregator                 │
        │  • Push Notification Dispatcher       │
        └───────┬───────────────────────────────┘
                │
        ┌───────┴───────────────────────────────┐
        │         DATABASE / CACHE               │
        ├───────────────────────────────────────┤
        │  • PostgreSQL (Supabase)              │
        │  • Redis (geofences, sessions, cache) │
        │  • S3 / Cloudinary (event photos)     │
        └───────────────────────────────────────┘
```

### 2.2 Fluxo de Dados em Tempo Real

```
Driver A
  │
  ├── Reporta evento via REST POST /events
  │     │
  │     ▼
  ├── API valida payload
  │     │
  │     ├── Inválido → retorna 422 com erros de validação
  │     │
  │     └── Válido → insere na tabela road_events (status: pending)
  │                   │
  │                   ▼
  ├── Supabase Realtime emite evento PostgreSQL LISTEN
  │     │
  │     ▼
  ├── Road Intelligence API recebe evento via LISTEN/NOTIFY
  │     │
  │     ├── Geofence Engine calcula área de impacto
  │     │     │
  │     │     ├── Cria geofence no Redis (TTL = expires_at)
  │     │     │
  │     │     └── Verifica motoristas dentro do geofence
  │     │           │
  │     │           ▼
  │     ├── Push Dispatcher envia notificações
  │     │     │
  │     │     ├── Motoristas com app em foreground → in-app notification
  │     │     └── Motoristas com app em background → push nativo
  │     │
  │     └── Evento propagado via WebSocket para apps conectados
  │
  ├── Driver B (próximo) recebe notificação push
  │     │
  │     ├── Abre app → mapa centraliza no evento
  │     └── Dá upvote → API atualiza contagem
  │
  └── 5 upvotes → Webhook de verificação automática
        │
        ├── Evento muda para "verified"
        ├── Driver A ganha +1 verified_report no score
        └── Push: "Seu report foi verificado pela comunidade!"
```

### 2.3 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Mobile | React Native + Expo | Cross-platform, hot updates, comunidade grande |
| Backend | Node.js + Fastify + TypeScript | Alta performance, tipagem forte, ecossistema |
| Database | PostgreSQL (Supabase) | Realtime nativo, geospatial (PostGIS), JSONB |
| Cache | Redis | Geofences efêmeros, rate limiting, filas |
| Real-time | Supabase Realtime + WebSockets | Escalável, baixa latência, PostgreSQL integrado |
| Push | Firebase Cloud Messaging + OneSignal | Cross-platform, segmentação por geofence |
| Storage | Cloudinary | Upload otimizado, CDN, transformações de imagem |
| Map | Mapbox SDK | Customização de overlay, clustering nativo |
| Auth | Supabase Auth + JWT | Integração direta com banco, RBAC |

### 2.4 Padrões de Comunicação

| Padrão | Quando Usar | Tecnologia |
|--------|-------------|-----------|
| REST | CRUD de eventos, fotos, reputação | HTTP/2 |
| WebSocket | Propagação em tempo real para apps ativos | WebSocket |
| Server-Sent Events | Feed de eventos para dispatchers | SSE |
| PostgreSQL LISTEN/NOTIFY | Gatilhos internos entre serviços | SQL |
| Redis Pub/Sub | Comunicação entre instâncias do backend | Redis |

### 2.5 Deploy e Escalabilidade

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Load        │────▶│  API Instance │────▶│  PostgreSQL   │
│  Balancer    │     │  (auto-scale) │     │  (Primary)    │
│  (AWS ALB)   │     └───────────────┘     └───────┬───────┘
└───────────────┘                                   │
                                                    ▼
                                            ┌───────────────┐
                                            │  Read Replica │
                                            │  (analytics)  │
                                            └───────────────┘
```

- Mínimo de 2 instâncias da API em zonas de disponibilidade diferentes
- Auto-scaling baseado em CPU > 70% ou conexões WebSocket > 5000
- Read replicas para consultas de analytics e heatmap
- Redis cluster com replicação para geofences

---

## 3. Tabela `road_events`

### 3.1 Schema SQL Completo

```sql
-- ============================================================
-- ENUM: event_type
-- ============================================================
CREATE TYPE road_event_type AS ENUM (
    'radar',
    'lombada',
    'acidente',
    'blitz',
    'buraco',
    'obra',
    'animal',
    'enchente',
    'neblina',
    'chuva',
    'engarrafamento',
    'pedagio',
    'posto',
    'borracharia',
    'oficina',
    'hospital',
    'delegacia',
    'ponto_seguro',
    'carregador',
    'sinal_fechado',
    'desvio'
);

-- ============================================================
-- ENUM: event_severity
-- ============================================================
CREATE TYPE event_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- ============================================================
-- ENUM: event_status
-- ============================================================
CREATE TYPE event_status AS ENUM (
    'pending',
    'verified',
    'expired',
    'removed'
);

-- ============================================================
-- ENUM: payment_method (para pedágio e posto)
-- ============================================================
CREATE TYPE payment_method AS ENUM (
    'cash',
    'credit_card',
    'debit_card',
    'pix',
    'tag',
    'fuel_card'
);

-- ============================================================
-- TABLE: road_events
-- ============================================================
CREATE TABLE IF NOT EXISTS road_events (
    -- Identificadores
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      road_event_type NOT NULL,

    -- Localização (coordenadas geográficas)
    lat             DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lng             DOUBLE PRECISION NOT NULL CHECK (lng >= -180 AND lng <= 180),

    -- Geometria PostGIS (gerada automaticamente via trigger)
    geom            GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                        ST_SetSRID(ST_MakePoint(lng, lat), 4326)
                    ) STORED,

    -- Metadados do evento
    description     TEXT CHECK (char_length(description) <= 500),
    severity        event_severity NOT NULL DEFAULT 'medium',
    status          event_status NOT NULL DEFAULT 'pending',

    -- Responsáveis
    reported_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verified_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Temporais
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Mídia
    photos          JSONB DEFAULT '[]'::jsonb
                    CHECK (jsonb_typeof(photos) = 'array'),

    -- Engajamento
    upvotes         INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
    downvotes       INTEGER NOT NULL DEFAULT 0 CHECK (downvotes >= 0),

    -- Referência geográfica (cidade)
    city_id         UUID REFERENCES cities(id) ON DELETE SET NULL,

    -- Metadados adicionais (tipo-específico)
    metadata        JSONB DEFAULT '{}'::jsonb,

    -- Índices espaciais e de performance
    CONSTRAINT valid_lat_lng CHECK (lat != 0 AND lng != 0)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice espacial para consultas por proximidade
CREATE INDEX IF NOT EXISTS idx_road_events_geom
    ON road_events USING GIST (geom);

-- Índice para consultas de eventos ativos (não expirados/removidos)
CREATE INDEX IF NOT EXISTS idx_road_events_active
    ON road_events (status, expires_at)
    WHERE status IN ('pending', 'verified');

-- Índice para buscar por tipo de evento
CREATE INDEX IF NOT EXISTS idx_road_events_type
    ON road_events (event_type)
    WHERE status IN ('pending', 'verified');

-- Índice para reports por motorista
CREATE INDEX IF NOT EXISTS idx_road_events_reported_by
    ON road_events (reported_by);

-- Índice para busca temporal
CREATE INDEX IF NOT EXISTS idx_road_events_created_at
    ON road_events (created_at DESC);

-- Índice para busca por severidade
CREATE INDEX IF NOT EXISTS idx_road_events_severity
    ON road_events (severity)
    WHERE status IN ('pending', 'verified');

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_road_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: atualizar updated_at
-- ============================================================
CREATE TRIGGER trg_road_events_updated_at
    BEFORE UPDATE ON road_events
    FOR EACH ROW
    EXECUTE FUNCTION update_road_events_updated_at();

-- ============================================================
-- FUNÇÃO: auto-expirar eventos
-- ============================================================
CREATE OR REPLACE FUNCTION expire_road_events()
RETURNS VOID AS $$
BEGIN
    UPDATE road_events
    SET status = 'expired',
        updated_at = NOW()
    WHERE status IN ('pending', 'verified')
      AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNÇÃO: notificar novo evento via LISTEN/NOTIFY
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_road_event()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'road_event_created',
        json_build_object(
            'id', NEW.id,
            'event_type', NEW.event_type,
            'lat', NEW.lat,
            'lng', NEW.lng,
            'severity', NEW.severity,
            'status', NEW.status,
            'reported_by', NEW.reported_by,
            'created_at', NEW.created_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: notificar criação de evento
-- ============================================================
CREATE TRIGGER trg_road_event_notify
    AFTER INSERT ON road_events
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_road_event();

-- ============================================================
-- TABLE: event_upvotes (rastreamento de votos)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_upvotes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES road_events(id) ON DELETE CASCADE,
    driver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote        SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_event_upvotes_event
    ON event_upvotes (event_id);

-- ============================================================
-- TABLE: event_views (histórico de visualizações)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES road_events(id) ON DELETE CASCADE,
    driver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_event_views_driver
    ON event_views (driver_id, viewed_at DESC);

-- ============================================================
-- TABLE: event_confirmations (verificação colaborativa)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_confirmations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES road_events(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confirmation    BOOLEAN NOT NULL, -- true = confirma, false = contesta
    photo_url       TEXT,
    comment         TEXT CHECK (char_length(comment) <= 300),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_event_confirmations_event
    ON event_confirmations (event_id);
```

### 3.2 Campos do JSON `metadata`

O campo `metadata` armazena dados específicos por tipo de evento:

```sql
-- pedagio
{
  "price": 12.50,
  "payment_methods": ["cash", "pix", "tag"],
  "direction": "northbound",
  "lane": "automatic"
}

-- posto
{
  "gasoline_price": 5.49,
  "ethanol_price": 3.89,
  "diesel_price": 4.99,
  "brand": "Petrobras",
  "has_shop": true,
  "has_restroom": true
}

-- carregador
{
  "connector_types": ["type2", "ccs2", "chademo"],
  "available": 2,
  "total": 4,
  "power_kw": 150,
  "price_per_kwh": 1.29,
  "network": "Ionity"
}

-- radar
{
  "speed_limit": 80,
  "direction": "both",
  "is_fixed": true,
  "last_calibrated": "2026-06-01"
}

-- acidente
{
  "vehicles_involved": 2,
  "has_injuries": false,
  "lane_blocked": "right_lane",
  "traffic_impact": "moderate"
}
```

### 3.3 Políticas de Row Level Security (RLS)

```sql
-- ============================================================
-- RLS: road_events
-- ============================================================
ALTER TABLE road_events ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler eventos ativos
CREATE POLICY "select_active_events" ON road_events
    FOR SELECT
    USING (status IN ('pending', 'verified'));

-- Motoristas podem inserir eventos (qualquer um autenticado)
CREATE POLICY "insert_events" ON road_events
    FOR INSERT
    WITH CHECK (auth.uid() = reported_by);

-- Motoristas podem atualizar seus próprios eventos
CREATE POLICY "update_own_events" ON road_events
    FOR UPDATE
    USING (auth.uid() = reported_by)
    WITH CHECK (auth.uid() = reported_by);

-- Admins podem gerenciar todos os eventos
CREATE POLICY "admin_all_events" ON road_events
    FOR ALL
    USING (is_admin(auth.uid()));

-- ============================================================
-- RLS: event_upvotes
-- ============================================================
ALTER TABLE event_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_upvotes" ON event_upvotes
    FOR SELECT
    USING (true);

CREATE POLICY "insert_own_votes" ON event_upvotes
    FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "update_own_votes" ON event_upvotes
    FOR UPDATE
    USING (auth.uid() = driver_id)
    WITH CHECK (auth.uid() = driver_id);
```

---

## 4. Tipos de Evento (21 tipos)

### 4.1 Tabela de Configuração por Tipo

| # | Tipo | Ícone (lucide-react) | Cor no Mapa | Severidade Default | Expiração Padrão | Requer Verificação |
|---|------|---------------------|-------------|-------------------|-----------------|-------------------|
| 1 | `radar` | `Radar` | `#6366f1` (Indigo) | medium | 2 horas | Não |
| 2 | `lombada` | `TriangleAlert` | `#f59e0b` (Amber) | low | 30 dias | Não |
| 3 | `acidente` | `CarCrash` | `#ef4444` (Red) | high | 1 hora | Sim |
| 4 | `blitz` | `Shield` | `#8b5cf6` (Violet) | medium | 2 horas | Sim |
| 5 | `buraco` | `CircleOff` | `#f97316` (Orange) | medium | 7 dias | Sim |
| 6 | `obra` | `Construction` | `#eab308` (Yellow) | low | 7 dias | Sim |
| 7 | `animal` | `Dog` | `#84cc16` (Lime) | medium | 2 horas | Sim |
| 8 | `enchente` | `Droplets` | `#06b6d4` (Cyan) | critical | 3 horas | Sim |
| 9 | `neblina` | `CloudFog` | `#94a3b8` (Slate) | medium | 1 hora | Sim |
| 10 | `chuva` | `CloudRain` | `#3b82f6` (Blue) | low | 1 hora | Sim |
| 11 | `engarrafamento` | `TrafficCone` | `#ef4444` (Red) | high | 30 minutos | Sim |
| 12 | `pedagio` | `Banknote` | `#a855f7` (Purple) | low | 24 horas | Sim |
| 13 | `posto` | `Fuel` | `#22c55e` (Green) | low | 24 horas | Sim |
| 14 | `borracharia` | `Wrench` | `#14b8a6` (Teal) | low | 7 dias | Não |
| 15 | `oficina` | `Tool` | `#14b8a6` (Teal) | low | 7 dias | Não |
| 16 | `hospital` | `Hospital` | `#ec4899` (Pink) | low | 30 dias | Não |
| 17 | `delegacia` | `Building2` | `#f43f5e` (Rose) | low | 30 dias | Não |
| 18 | `ponto_seguro` | `ShieldCheck` | `#10b981` (Emerald) | low | 30 dias | Não |
| 19 | `carregador` | `PlugZap` | `#06b6d4` (Cyan) | low | 1 hora | Sim |
| 20 | `sinal_fechado` | `TrafficLight` | `#f97316` (Orange) | medium | 2 horas | Não |
| 21 | `desvio` | `ArrowRightCircle` | `#0ea5e9` (Sky) | medium | 4 horas | Sim |

### 4.2 Configuração por Tipo (Código)

```typescript
// src/config/event-types.ts

import {
  Radar,
  TriangleAlert,
  CarCrash,
  Shield,
  CircleOff,
  Construction,
  Dog,
  Droplets,
  CloudFog,
  CloudRain,
  TrafficCone,
  Banknote,
  Fuel,
  Wrench,
  Tool,
  Hospital,
  Building2,
  ShieldCheck,
  PlugZap,
  TrafficLight,
  ArrowRightCircle,
} from 'lucide-react-native';

export type RoadEventType =
  | 'radar'
  | 'lombada'
  | 'acidente'
  | 'blitz'
  | 'buraco'
  | 'obra'
  | 'animal'
  | 'enchente'
  | 'neblina'
  | 'chuva'
  | 'engarrafamento'
  | 'pedagio'
  | 'posto'
  | 'borracharia'
  | 'oficina'
  | 'hospital'
  | 'delegacia'
  | 'ponto_seguro'
  | 'carregador'
  | 'sinal_fechado'
  | 'desvio';

export interface EventTypeConfig {
  type: RoadEventType;
  icon: React.ComponentType<any>;
  color: string;
  defaultSeverity: 'low' | 'medium' | 'high' | 'critical';
  defaultExpirationMs: number;
  requiresVerification: boolean;
  geofenceRadiusMeters: number;
  label: string;
  description: string;
  category: 'hazard' | 'traffic' | 'service' | 'safety' | 'weather';
}

export const EVENT_TYPES: Record<RoadEventType, EventTypeConfig> = {
  radar: {
    type: 'radar',
    icon: Radar,
    color: '#6366f1',
    defaultSeverity: 'medium',
    defaultExpirationMs: 2 * 60 * 60 * 1000, // 2h
    requiresVerification: false,
    geofenceRadiusMeters: 100,
    label: 'Radar',
    description: 'Radar de velocidade fixo ou móvel',
    category: 'hazard',
  },
  lombada: {
    type: 'lombada',
    icon: TriangleAlert,
    color: '#f59e0b',
    defaultSeverity: 'low',
    defaultExpirationMs: 30 * 24 * 60 * 60 * 1000, // 30d
    requiresVerification: false,
    geofenceRadiusMeters: 50,
    label: 'Lombada',
    description: 'Lombada / quebra-molas',
    category: 'hazard',
  },
  acidente: {
    type: 'acidente',
    icon: CarCrash,
    color: '#ef4444',
    defaultSeverity: 'high',
    defaultExpirationMs: 1 * 60 * 60 * 1000, // 1h
    requiresVerification: true,
    geofenceRadiusMeters: 300,
    label: 'Acidente',
    description: 'Acidente de trânsito com veículos envolvidos',
    category: 'hazard',
  },
  blitz: {
    type: 'blitz',
    icon: Shield,
    color: '#8b5cf6',
    defaultSeverity: 'medium',
    defaultExpirationMs: 2 * 60 * 60 * 1000, // 2h
    requiresVerification: true,
    geofenceRadiusMeters: 200,
    label: 'Blitz',
    description: 'Blitz policial / operação de trânsito',
    category: 'safety',
  },
  buraco: {
    type: 'buraco',
    icon: CircleOff,
    color: '#f97316',
    defaultSeverity: 'medium',
    defaultExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7d
    requiresVerification: true,
    geofenceRadiusMeters: 50,
    label: 'Buraco',
    description: 'Buraco na pista / via danificada',
    category: 'hazard',
  },
  obra: {
    type: 'obra',
    icon: Construction,
    color: '#eab308',
    defaultSeverity: 'low',
    defaultExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7d
    requiresVerification: true,
    geofenceRadiusMeters: 150,
    label: 'Obra',
    description: 'Obra / construção na via',
    category: 'hazard',
  },
  animal: {
    type: 'animal',
    icon: Dog,
    color: '#84cc16',
    defaultSeverity: 'medium',
    defaultExpirationMs: 2 * 60 * 60 * 1000, // 2h
    requiresVerification: true,
    geofenceRadiusMeters: 100,
    label: 'Animal',
    description: 'Animal na pista (solto ou atropelado)',
    category: 'hazard',
  },
  enchente: {
    type: 'enchente',
    icon: Droplets,
    color: '#06b6d4',
    defaultSeverity: 'critical',
    defaultExpirationMs: 3 * 60 * 60 * 1000, // 3h
    requiresVerification: true,
    geofenceRadiusMeters: 500,
    label: 'Enchente',
    description: 'Alagamento / enchente / via alagada',
    category: 'weather',
  },
  neblina: {
    type: 'neblina',
    icon: CloudFog,
    color: '#94a3b8',
    defaultSeverity: 'medium',
    defaultExpirationMs: 1 * 60 * 60 * 1000, // 1h
    requiresVerification: true,
    geofenceRadiusMeters: 300,
    label: 'Neblina',
    description: 'Neblina / nevoeiro com baixa visibilidade',
    category: 'weather',
  },
  chuva: {
    type: 'chuva',
    icon: CloudRain,
    color: '#3b82f6',
    defaultSeverity: 'low',
    defaultExpirationMs: 1 * 60 * 60 * 1000, // 1h
    requiresVerification: true,
    geofenceRadiusMeters: 200,
    label: 'Chuva Intensa',
    description: 'Chuva intensa com alagamento iminente',
    category: 'weather',
  },
  engarrafamento: {
    type: 'engarrafamento',
    icon: TrafficCone,
    color: '#ef4444',
    defaultSeverity: 'high',
    defaultExpirationMs: 30 * 60 * 1000, // 30min
    requiresVerification: true,
    geofenceRadiusMeters: 500,
    label: 'Engarrafamento',
    description: 'Congestionamento intenso no trecho',
    category: 'traffic',
  },
  pedagio: {
    type: 'pedagio',
    icon: Banknote,
    color: '#a855f7',
    defaultSeverity: 'low',
    defaultExpirationMs: 24 * 60 * 60 * 1000, // 24h
    requiresVerification: true,
    geofenceRadiusMeters: 100,
    label: 'Pedágio',
    description: 'Pedágio com preço e forma de pagamento',
    category: 'service',
  },
  posto: {
    type: 'posto',
    icon: Fuel,
    color: '#22c55e',
    defaultSeverity: 'low',
    defaultExpirationMs: 24 * 60 * 60 * 1000, // 24h
    requiresVerification: true,
    geofenceRadiusMeters: 100,
    label: 'Posto',
    description: 'Posto de combustível com preços e bandeira',
    category: 'service',
  },
  borracharia: {
    type: 'borracharia',
    icon: Wrench,
    color: '#14b8a6',
    defaultSeverity: 'low',
    defaultExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7d
    requiresVerification: false,
    geofenceRadiusMeters: 100,
    label: 'Borracharia',
    description: 'Borracharia / mecânica rápida',
    category: 'service',
  },
  oficina: {
    type: 'oficina',
    icon: Tool,
    color: '#14b8a6',
    defaultSeverity: 'low',
    defaultExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7d
    requiresVerification: false,
    geofenceRadiusMeters: 100,
    label: 'Oficina',
    description: 'Oficina mecânica',
    category: 'service',
  },
  hospital: {
    type: 'hospital',
    icon: Hospital,
    color: '#ec4899',
    defaultSeverity: 'low',
    defaultExpirationMs: 30 * 24 * 60 * 60 * 1000, // 30d
    requiresVerification: false,
    geofenceRadiusMeters: 200,
    label: 'Hospital',
    description: 'Hospital / pronto-socorro',
    category: 'safety',
  },
  delegacia: {
    type: 'delegacia',
    icon: Building2,
    color: '#f43f5e',
    defaultSeverity: 'low',
    defaultExpirationMs: 30 * 24 * 60 * 60 * 1000, // 30d
    requiresVerification: false,
    geofenceRadiusMeters: 150,
    label: 'Delegacia',
    description: 'Delegacia / posto policial',
    category: 'safety',
  },
  ponto_seguro: {
    type: 'ponto_seguro',
    icon: ShieldCheck,
    color: '#10b981',
    defaultSeverity: 'low',
    defaultExpirationMs: 30 * 24 * 60 * 60 * 1000, // 30d
    requiresVerification: false,
    geofenceRadiusMeters: 100,
    label: 'Ponto Seguro',
    description: 'Área segura com boa iluminação e movimento',
    category: 'safety',
  },
  carregador: {
    type: 'carregador',
    icon: PlugZap,
    color: '#06b6d4',
    defaultSeverity: 'low',
    defaultExpirationMs: 1 * 60 * 60 * 1000, // 1h
    requiresVerification: true,
    geofenceRadiusMeters: 50,
    label: 'Carregador Elétrico',
    description: 'Carregador para veículo elétrico',
    category: 'service',
  },
  sinal_fechado: {
    type: 'sinal_fechado',
    icon: TrafficLight,
    color: '#f97316',
    defaultSeverity: 'medium',
    defaultExpirationMs: 2 * 60 * 60 * 1000, // 2h
    requiresVerification: false,
    geofenceRadiusMeters: 50,
    label: 'Semáforo Quebrado',
    description: 'Semáforo com defeito / sinal fechado',
    category: 'hazard',
  },
  desvio: {
    type: 'desvio',
    icon: ArrowRightCircle,
    color: '#0ea5e9',
    defaultSeverity: 'medium',
    defaultExpirationMs: 4 * 60 * 60 * 1000, // 4h
    requiresVerification: true,
    geofenceRadiusMeters: 200,
    label: 'Desvio',
    description: 'Desvio / rota alternativa',
    category: 'traffic',
  },
};
```

### 4.3 Categorias de Evento

| Categoria | Tipos | Descrição |
|-----------|-------|-----------|
| `hazard` | radar, lombada, acidente, buraco, obra, animal, sinal_fechado | Perigos na via |
| `traffic` | engarrafamento, desvio | Condições de tráfego |
| `service` | pedagio, posto, borracharia, oficina, carregador | Serviços ao motorista |
| `safety` | blitz, hospital, delegacia, ponto_seguro | Segurança |
| `weather` | enchente, neblina, chuva | Condições climáticas |

### 4.4 Comportamento por Categoria

- **hazard:** Alerta sonoro ao se aproximar (mesmo sem navegação ativa). Geofence de 50-300m.
- **traffic:** Recalcula ETA automaticamente se o motorista estiver navegando. Geofence de 200-500m.
- **service:** Exibido como ícone informativo no mapa. Sem alerta sonoro. Geofence de 50-100m.
- **safety:** Destaque no mapa com ícone maior. Sem alerta sonoro para não assustar. Geofence de 100-200m.
- **weather:** Alerta visual com previsão de duração. Alerta sonoro apenas para enchente. Geofence de 200-500m.

---

## 5. Fluxo de Reporte

### 5.1 Fluxo Completo (Passo a Passo)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE REPORTE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [1] Motorista avista evento na via                                 │
│      │                                                              │
│      ▼                                                              │
│  [2] Abre Road Intelligence via botão flutuante no mapa             │
│      │                                                              │
│      ▼                                                              │
│  [3] Seleciona tipo de evento (grid de 21 ícones)                  │
│      │                                                              │
│      ▼                                                              │
│  [4] Tira foto (opcional, até 3 fotos)                             │
│      │                                                              │
│      ▼                                                              │
│  [5] Confirma localização (GPS + mapa de preview)                  │
│      │                                                              │
│      ▼                                                              │
│  [6] Adiciona descrição (opcional, até 500 caracteres)             │
│      │                                                              │
│      ▼                                                              │
│  [7] Revisa e envia                                                │
│      │                                                              │
│      ├── ✅ Sucesso → Tela de confirmação com animação              │
│      │               → Evento criado com status "pending"           │
│      │               → Notificação para motoristas próximos         │
│      │                                                              │
│      └── ❌ Falha  → Tela de erro com opção de retry               │
│                        → Salva rascunho local (offline)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Componentes de UI (React Native)

```typescript
// src/screens/road-intelligence/ReportFlow.tsx

// Telas do fluxo de reporte:
// 1. FloatingActionButton  - Botão flutuante no mapa
// 2. EventTypeSelector     - Grid de 21 tipos de evento
// 3. PhotoCapture          - Câmera + galeria (até 3 fotos)
// 4. LocationConfirmation  - Mapa com pin ajustável
// 5. DescriptionInput      - Textarea (500 chars)
// 6. ReviewAndSubmit       - Resumo antes de enviar
// 7. SuccessScreen         - Animação de confirmação
// 8. ErrorScreen           - Tela de erro com retry
```

### 5.3 Validação do Payload

```typescript
// POST /api/v1/road-intelligence/events

interface CreateEventRequest {
  event_type: RoadEventType;
  lat: number;           // -90 a 90, 6 casas decimais
  lng: number;           // -180 a 180, 6 casas decimais
  description?: string;  // max 500 chars
  photos?: string[];     // array de URLs (max 3)
  metadata?: Record<string, unknown>;
}

interface CreateEventResponse {
  id: string;
  event_type: RoadEventType;
  status: 'pending';
  created_at: string;
  expires_at: string;
  distance_to_next?: number; // metros até o próximo evento similar
}
```

### 5.4 Regras de Validação

| Campo | Regra | Código |
|-------|-------|--------|
| `event_type` | Deve ser um valor válido do enum | `400` |
| `lat` / `lng` | Deve estar dentro do Brasil (-33.75 a 5.27, -73.99 a -34.79) | `422` |
| `lat` / `lng` | Deve ter no máximo 6 casas decimais | `422` |
| `lat` / `lng` | Não pode ser (0, 0) | `422` |
| `description` | Máximo 500 caracteres | `422` |
| `photos` | Máximo 3 URLs | `422` |
| `photos` | Cada URL deve ser HTTPS e de domínio permitido | `422` |
| Rate Limit | Máximo 5 eventos por minuto por motorista | `429` |
| Distância | Evento deve estar a pelo menos 10m de outro evento igual | `409` |
| Duplicata | Mesmo tipo e localização a < 50m = merge | `409` |

### 5.5 Tratamento de Offline

```
┌────────────────────┐
│   Sem internet?    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Salvar no     │
│  AsyncStorage   │
│  (fila offline) │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Monitorar         │
│ conectividade     │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────┐
│  Reconectou?                   │
│  → Processar fila FIFO        │
│  → Exibir toast de sucesso    │
│     para cada evento enviado  │
└────────────────────────────────┘
```

### 5.6 Criação de Evento (Backend)

```typescript
// src/services/event-service.ts

async function createEvent(
  payload: CreateEventRequest,
  driverId: string,
): Promise<CreateEventResponse> {
  // 1. Validar payload
  const validation = validateEventPayload(payload);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }

  // 2. Verificar rate limit
  const recentCount = await getRecentEventsCount(driverId);
  if (recentCount >= 5) {
    throw new RateLimitError('Máximo de 5 eventos por minuto');
  }

  // 3. Verificar duplicata próxima
  const duplicate = await findNearbyDuplicate(payload);
  if (duplicate) {
    // Em vez de criar novo, sugere upvote no existente
    return {
      id: duplicate.id,
      status: duplicate.status,
      message: 'Evento similar já reportado. Seu upvote foi registrado.',
    };
  }

  // 4. Determinar severidade e expiração com base no tipo
  const config = EVENT_TYPES[payload.event_type];
  const expiresAt = new Date(Date.now() + config.defaultExpirationMs);

  // 5. Inserir no banco
  const event = await db.insert(roadEvents).values({
    event_type: payload.event_type,
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description,
    severity: config.defaultSeverity,
    status: 'pending',
    reported_by: driverId,
    expires_at: expiresAt,
    photos: payload.photos ? JSON.parse(payload.photos) : [],
    metadata: payload.metadata ?? {},
  }).returning();

  // 6. Atualizar reputação
  await incrementTotalReports(driverId);

  // 7. Disparar geofence + notificações (assíncrono)
  await notifyNearbyDrivers(event[0]);

  return {
    id: event[0].id,
    event_type: event[0].event_type,
    status: 'pending',
    created_at: event[0].created_at.toISOString(),
    expires_at: event[0].expires_at.toISOString(),
  };
}
```

### 5.7 Tela de Sucesso Pós-Reporte

```
┌─────────────────────────────┐
│  ✅ Evento Reportado!        │
│                             │
│   🚧 Obra na Av. Paulista  │
│   📍 500m do seu reporte   │
│   ⏳ Expira em 7 dias       │
│   🏷️ Status: Pendente       │
│                             │
│   ⏱️ 5 upvotes = verificado │
│   Compartilhe com amigos    │
│                             │
│  [🔔 Ativar alertas p/ obra]│
│  [📤 Compartilhar]          │
│  [✓ Voltar ao mapa]         │
└─────────────────────────────┘
```

---

## 6. Geofence Engine

### 6.1 Conceito

Cada evento cria um geofence (círculo geográfico) ao redor de sua localização. Motoristas que entrarem nesse geofence recebem alertas contextuais. O raio do geofence varia conforme o tipo e severidade do evento.

### 6.2 Raios de Geofence por Tipo

| Tipo | Raio Padrão | Raio (Severidade Critical) | Justificativa |
|------|------------|---------------------------|---------------|
| radar | 100m | 200m | Radar tem alcance limitado |
| lombada | 50m | 100m | Lombada é pontual |
| acidente | 300m | 500m | Acidente causa fila |
| blitz | 200m | 300m | Blitz tem visibilidade |
| buraco | 50m | 100m | Buraco é pontual |
| obra | 150m | 300m | Obra pode ter desvio |
| animal | 100m | 200m | Animal pode se mover |
| enchente | 500m | 1000m | Alagamento é área ampla |
| neblina | 300m | 500m | Neblina cobre região |
| chuva | 200m | 400m | Chuva tem alcance |
| engarrafamento | 500m | 1000m | Fila extensa |
| pedagio | 100m | 200m | Pedágio é pontual |
| posto | 100m | 200m | Posto é pontual |
| borracharia | 100m | 200m | Serviço local |
| oficina | 100m | 200m | Serviço local |
| hospital | 200m | 300m | Hospital atende região |
| delegacia | 150m | 250m | DelegaCia atende região |
| ponto_seguro | 100m | 200m | Área segura |
| carregador | 50m | 100m | Carregador é pontual |
| sinal_fechado | 50m | 100m | Sinal é pontual |
| desvio | 200m | 400m | Desvio afeta rota |

### 6.3 Geofence Manager (Redis)

```typescript
// src/services/geofence-service.ts

import { Redis } from 'ioredis';

const GEOFENCE_PREFIX = 'geofence:';
const GEOFENCE_TTL_SUFFIX = ':ttl';

export class GeofenceService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Cria um geofence para um evento no Redis.
   * Usa GEOADD para armazenar o ponto e EXPIRE para TTL.
   */
  async createGeofence(
    eventId: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `${GEOFENCE_PREFIX}${eventId}`;

    await this.redis
      .multi()
      .geoadd(key, lng, lat, eventId)
      .expire(key, ttlSeconds)
      .set(`${key}${GEOFENCE_TTL_SUFFIX}`, radiusMeters, 'EX', ttlSeconds)
      .exec();
  }

  /**
   * Busca motoristas dentro do geofence de um evento.
   */
  async getDriversInGeofence(
    eventId: string,
  ): Promise<string[]> {
    const key = `${GEOFENCE_PREFIX}${eventId}`;
    const radius = await this.redis.get(`${key}${GEOFENCE_TTL_SUFFIX}`);

    if (!radius) {
      return [];
    }

    // Busca motoristas ativos num raio maior que o geofence
    // A lógica real usaria GEORADIUS em um conjunto de motoristas ativos
    return [];
  }

  /**
   * Verifica se um motorista está dentro de algum geofence.
   * Retorna lista de eventos que o motorista deve ser alertado.
   */
  async getEventsForDriver(
    driverLat: number,
    driverLng: number,
    maxRadiusMeters: number = 5000,
  ): Promise<string[]> {
    // GEORADIUS em todas as chaves de geofence
    // Implementação real usaria scan + GEORADIUS
    const keys = await this.redis.keys(`${GEOFENCE_PREFIX}*`);

    const eventIds: string[] = [];

    for (const key of keys) {
      if (key.endsWith(GEOFENCE_TTL_SUFFIX)) continue;

      const radius = await this.redis.get(`${key}${GEOFENCE_TTL_SUFFIX}`);
      if (!radius) continue;

      const members = await this.redis.georadius(
        key,
        driverLng,
        driverLat,
        parseInt(radius),
        'm',
      );

      if (members.length > 0) {
        const eventId = key.replace(GEOFENCE_PREFIX, '');
        eventIds.push(eventId);
      }
    }

    return eventIds;
  }

  /**
   * Remove o geofence quando o evento expira.
   */
  async removeGeofence(eventId: string): Promise<void> {
    const key = `${GEOFENCE_PREFIX}${eventId}`;
    await this.redis.del(key, `${key}${GEOFENCE_TTL_SUFFIX}`);
  }
}
```

### 6.4 Algoritmo de Geo-proximidade (SQL)

```sql
-- Buscar eventos ativos num raio de X metros
-- Usa o índice GIST para performance

SELECT
    re.id,
    re.event_type,
    re.lat,
    re.lng,
    re.severity,
    re.status,
    re.description,
    re.upvotes,
    re.created_at,
    re.expires_at,
    -- Distância em metros do ponto de referência
    ST_Distance(
        re.geom,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
        true
    ) AS distance_meters
FROM road_events re
WHERE re.status IN ('pending', 'verified')
  AND re.expires_at > NOW()
  AND ST_DWithin(
      re.geom,
      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
      :radius_meters,
      true
  )
ORDER BY distance_meters ASC;
```

### 6.5 Geofence Critical (Full-Screen Alert)

Eventos com severidade `critical` disparam um fluxo especial:

```
┌─────────────────────────────────────┐
│  ⚠️  ALERTA CRÍTICO                  │
│                                     │
│   🌊 ENCHENTE NA AV. PAULISTA       │
│                                     │
│   • Área alagada: 300m à frente     │
│   • Reportado por João S. há 2min   │
│   • 15 motoristas confirmaram       │
│                                     │
│   ┌─────────────────────────────┐  │
│   │     🔄 ROTA ALTERNATIVA      │  │
│   │     Desviar via Rua Augusta  │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌──────────┐   ┌──────────────┐  │
│   │  Ignorar  │   │ Navegar para │  │
│   │           │   │  desvio      │  │
│   └──────────┘   └──────────────┘  │
└─────────────────────────────────────┘
```

### 6.6 Suppressão de Alertas Repetidos

Para evitar que um motorista receba o mesmo alerta múltiplas vezes:

1. Ao exibir o alerta, registra em `event_views` (driver_id + event_id)
2. Antes de enviar notificação, verifica se o par já existe
3. Geofence check só dispara se não houver view nas últimas 24h
4. Eventos de mesma categoria num raio de 100m são agrupados

---

## 7. Mapa de Calor

### 7.1 Overlay no Mapa

Eventos ativos são exibidos como overlay sobre o mapa base. Cada evento é renderizado como um marcador personalizado com:

- Ícone do tipo de evento (lucide-react)
- Círculo colorido ao redor com opacidade proporcional à severidade
- Tamanho do marcador varia com zoom level
- Label opcional (descrição curta) em zoom alto

### 7.2 Cores por Severidade

| Severidade | Cor | Hex | Opacidade do Círculo | Tamanho do Marcador |
|-----------|-----|-----|---------------------|-------------------|
| `low` | Green | `#22c55e` | 20% | 24px |
| `medium` | Yellow | `#eab308` | 30% | 28px |
| `high` | Orange | `#f97316` | 40% | 32px |
| `critical` | Red | `#ef4444` | 50% (pulsante) | 36px |

### 7.3 Clustering

Para zoom out (distância > 5km de viewport), eventos próximos são agrupados:

```
─────────────── ZOOM OUT ───────────────

  🟡 (3)          🟠 (12)
  [3 eventos]     [12 eventos]

  🔴 (5)          🟢 (1)
  [5 eventos]     [1 evento]

─────────────── ZOOM IN ────────────────

  🚧  🐕  🚔    🛣️  ⛽
  obra animal   blitz  pedágio posto
```

#### 7.3.1 Algoritmo de Clustering

```typescript
// src/services/clustering-service.ts

interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  count: number;
  events: RoadEvent[];
  dominantSeverity: 'low' | 'medium' | 'high' | 'critical';
  dominantType: RoadEventType | null;
}

function clusterEvents(
  events: RoadEvent[],
  zoomLevel: number,
  clusterRadius: number = 50, // pixels
): Cluster[] {
  // 1. Calcular grid size baseado no zoom level
  // 2. Agrupar eventos por célula do grid
  // 3. Para células com > 1 evento, criar cluster
  // 4. Para células com 1 evento, manter individual
  // 5. Calcular severidade dominante (máxima severidade no cluster)
  // 6. Retornar lista de clusters + eventos individuais

  return [];
}
```

### 7.4 Filtros

O motorista pode filtrar eventos exibidos no mapa:

```
┌─────────────────────────────────┐
│  🔍  FILTRAR EVENTOS            │
├─────────────────────────────────┤
│  [✓] Perigos (radar, lombada…) │
│  [✓] Trânsito (engarrafamento…)│
│  [ ] Serviços (posto, pedágio…) │
│  [✓] Segurança (blitz, hospital)│
│  [ ] Clima (enchente, neblina…) │
│                                 │
│  ─── Severidade Mínima ─────    │
│  ○ Low   ● Medium  ○ High ○ Cr │
│                                 │
│  ─── Mostrar apenas ────────    │
│  [ ] Eventos verificados        │
│  [ ] Eventos perto da rota      │
│  [ ] Eventos recentes (<1h)     │
│                                 │
│  [Aplicar Filtros]              │
└─────────────────────────────────┘
```

### 7.5 Detalhes do Evento (Bottom Sheet)

Ao tocar em um marcador:

```
┌─────────────────────────────────────┐
│  ─── ─── ─── (drag handle)          │
├─────────────────────────────────────┤
│                                     │
│  🚧 Obra na Av. Paulista            │
│  Reportado há 15min                 │
│  📍 200m • ⏳ Expira em 7 dias      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [foto da obra]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  "Interdição da faixa da direita   │
│   para reparos na rede de água"    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  👍 12  |  👎 2             │   │
│  │  Reportado por: Carlos M.   │   │
│  │  Status: ✅ Verificado      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔔 Ativar alerta] [📤 Compartilhar]│
│  [🗺️ Navegar para cá]              │
└─────────────────────────────────────┘
```

---

## 8. Verificação Colaborativa

### 8.1 Sistema de Verificação

O sistema usa múltiplos mecanismos para garantir a veracidade dos eventos:

| Mecanismo | Descrição | Peso |
|-----------|-----------|------|
| Upvotes da comunidade | Motoristas próximos votam | 5 upvotes = verified |
| Confirmação visual | Motorista tira foto do evento | 3 confirmações = verified |
| Verificação administrativa | Admin/dispatcher valida manualmente | Imediato |
| Reputação do reportador | Score histórico do motorista | Influencia prioridade |
| Machine learning | Análise de padrões de report | Em desenvolvimento |

### 8.2 Regras de Verificação

```typescript
// src/services/verification-service.ts

const VERIFICATION_RULES = {
  // Verificação por upvotes
  UPVOTE_THRESHOLD: 5, // Número de upvotes para auto-verificar

  // Confirmação visual para alta severidade
  HIGH_SEVERITY_CONFIRMATIONS_REQUIRED: 3,

  // Score mínimo para reportador ser confiável
  MIN_REPORTER_SCORE: 10,

  // Eventos que requerem verificação obrigatória
  MANDATORY_VERIFICATION_TYPES: [
    'acidente',
    'blitz',
    'animal',
    'enchente',
    'neblina',
    'chuva',
    'engarrafamento',
    'obra',
    'buraco',
  ],
};

async function verifyEvent(eventId: string): Promise<void> {
  const event = await db.select().from(roadEvents).where(eq(roadEvents.id, eventId)).limit(1);

  if (!event || event.status !== 'pending') return;

  const voteCount = await db
    .select({ count: count() })
    .from(eventUpvotes)
    .where(
      and(
        eq(eventUpvotes.event_id, eventId),
        eq(eventUpvotes.vote, 1),
      ),
    )
    .then(r => r[0]?.count ?? 0);

  if (voteCount >= VERIFICATION_RULES.UPVOTE_THRESHOLD) {
    await db.update(roadEvents)
      .set({
        status: 'verified',
        verified_by: null, // verified by community
        updated_at: new Date(),
      })
      .where(eq(roadEvents.id, eventId));

    // Recompensar reportador
    await incrementVerifiedReports(event.reported_by);
  }
}
```

### 8.3 Reputação do Reportador

```typescript
// src/services/reputation-service.ts

export async function calculateReputation(driverId: string): Promise<void> {
  const stats = await db
    .select({
      total: count(),
      verified: sum(
        case_(when(eq(roadEvents.status, 'verified'), 1)).else(0),
      ),
      false_reports: sum(
        case_(when(eq(roadEvents.status, 'removed'), 1)).else(0),
      ),
    })
    .from(roadEvents)
    .where(eq(roadEvents.reported_by, driverId))
    .then(r => r[0]);

  if (!stats || stats.total === 0) return;

  const total = Number(stats.total);
  const verified = Number(stats.verified) ?? 0;
  const falseReports = Number(stats.false_reports) ?? 0;

  // Fórmula de score
  const accuracy = total > 0 ? verified / total : 0;
  const falsePenalty = falseReports * 5;
  const score = Math.max(0, Math.round((verified * 10 + accuracy * 50) - falsePenalty));

  await db
    .insert(driverRoadReputation)
    .values({
      driver_id: driverId,
      total_reports: total,
      verified_reports: verified,
      false_reports: falseReports,
      score,
      last_calculated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: driverRoadReputation.driver_id,
      set: {
        total_reports: total,
        verified_reports: verified,
        false_reports: falseReports,
        score,
        last_calculated_at: new Date(),
      },
    });
}

export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 1000) return 'platinum';
  if (score >= 500) return 'gold';
  if (score >= 200) return 'silver';
  if (score >= 50) return 'bronze';
  return 'newcomer';
}
```

### 8.4 Níveis de Reputação

| Nível | Score | Benefícios |
|-------|-------|------------|
| `newcomer` | 0-49 | Reportes vão para fila normal |
| `bronze` | 50-199 | Prioridade média na fila |
| `silver` | 200-499 | Prioridade alta, reports entram como pré-verificados |
| `gold` | 500-999 | Prioridade máxima, reports entram como verificados |
| `platinum` | 1000+ | Moderação confiável, pode verificar reports de outros |

### 8.5 Penalidades para Falsos Reports

```typescript
// Regras de penalidade

const FALSE_REPORT_PENALTIES = {
  // Penalidade base por falso report
  BASE_PENALTY: -10,

  // Penalidade adicional se o report for de alta severidade
  HIGH_SEVERITY_PENALTY: -25,

  // Suspensão temporária após N falsos reports
  SUSPENSION_THRESHOLD: 3,

  // Duração da suspensão (horas)
  SUSPENSION_HOURS: 24,

  // Banimento após N suspensões
  BAN_THRESHOLD: 5,
};

async function penalizeFalseReport(driverId: string, severity: string): Promise<void> {
  const penalty = severity === 'high' || severity === 'critical'
    ? FALSE_REPORT_PENALTIES.HIGH_SEVERITY_PENALTY
    : FALSE_REPORT_PENALTIES.BASE_PENALTY;

  await db
    .update(driverRoadReputation)
    .set({
      false_reports: sql`false_reports + 1`,
      score: sql`GREATEST(0, score + ${penalty})`,
      last_calculated_at: new Date(),
    })
    .where(eq(driverRoadReputation.driver_id, driverId));

  // Verificar se precisa suspender
  const stats = await db
    .select({ false_reports: driverRoadReputation.false_reports })
    .from(driverRoadReputation)
    .where(eq(driverRoadReputation.driver_id, driverId))
    .limit(1);

  if (stats[0]?.false_reports >= FALSE_REPORT_PENALTIES.SUSPENSION_THRESHOLD) {
    await suspendDriver(driverId);
  }
}
```

---

## 9. Expiração Automática

### 9.1 TTL por Tipo de Evento

| Tipo | Duração Padrão | Motivo | Pode Estender? |
|------|---------------|--------|---------------|
| radar | 2h | Radar pode ser móvel, muda rápido | Sim |
| blitz | 2h | Blitz é temporária | Sim |
| acidente | 1h | Acidente é resolvido ou removido | Sim |
| engarrafamento | 30min | Trânsito muda rápido | Sim |
| buraco | 7d | Buraco leva tempo para consertar | Sim |
| obra | 7d | Obra tem duração previsível | Sim |
| animal | 2h | Animal sai da pista | Sim |
| enchente | 3h | Enchente pode baixar | Sim |
| neblina | 1h | Nevoeiro dissipa | Sim |
| chuva | 1h | Chuva passa | Sim |
| pedagio | 24h | Preço pode mudar diariamente | Sim |
| posto | 24h | Preço do combustível muda | Sim |
| borracharia | 7d | Serviço permanente | Não |
| oficina | 7d | Serviço permanente | Não |
| hospital | 30d | Local permanente | Não |
| delegacia | 30d | Local permanente | Não |
| ponto_seguro | 30d | Local permanente | Não |
| carregador | 1h | Disponibilidade muda rápido | Sim |
| sinal_fechado | 2h | Semáforo pode ser consertado | Sim |
| desvio | 4h | Desvio pode ser temporário | Sim |
| lombada | 30d | Lombada é permanente | Não |

### 9.2 Cron Job de Expiração

```typescript
// src/jobs/expiration-job.ts

import { CronJob } from 'cron';

// Executa a cada 5 minutos
export const expirationJob = new CronJob('*/5 * * * *', async () => {
  const now = new Date();

  const expired = await db
    .update(roadEvents)
    .set({
      status: 'expired',
      updated_at: now,
    })
    .where(
      and(
        inArray(roadEvents.status, ['pending', 'verified']),
        lte(roadEvents.expires_at, now),
      ),
    )
    .returning({ id: roadEvents.id });

  // Remover geofences do Redis
  for (const event of expired) {
    await geofenceService.removeGeofence(event.id);
  }

  console.log(`[ExpirationJob] Expired ${expired.length} events`);
});
```

### 9.3 Admin: Extensão de Expiração

```sql
-- Admin pode estender a expiração de um evento
-- Apenas admins podem chamar esta função

CREATE OR REPLACE FUNCTION extend_event_expiration(
    p_event_id UUID,
    p_extension_hours INTEGER,
    p_admin_id UUID
)
RETURNS road_events AS $$
DECLARE
    v_event road_events;
    v_new_expiry TIMESTAMPTZ;
BEGIN
    -- Verificar se usuário é admin
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Usuário não autorizado';
    END IF;

    -- Buscar evento
    SELECT * INTO v_event
    FROM road_events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento não encontrado';
    END IF;

    -- Calcular nova expiração (máximo 30 dias a partir de agora)
    v_new_expiry := LEAST(
        v_event.expires_at + (p_extension_hours || ' hours')::INTERVAL,
        NOW() + INTERVAL '30 days'
    );

    -- Atualizar
    UPDATE road_events
    SET expires_at = v_new_expiry,
        updated_at = NOW()
    WHERE id = p_event_id
    RETURNING * INTO v_event;

    -- Atualizar geofence no Redis
    PERFORM update_geofence_ttl(p_event_id, v_event.expires_at);

    RETURN v_event;
END;
$$ LANGUAGE plpgsql;
```

### 9.4 Eventos Recorrentes

Alguns eventos podem ser marcados como recorrentes:

- **Radar fixo:** Não expira (ou expira em 1 ano)
- **Lombada:** Não expira (é permanente)
- **Hospital / Delegacia:** Não expiram
- **Posto / Borracharia:** Podem ser permanentes

Para isso, o campo `metadata` pode conter `is_permanent: true`, e o job de expiração ignora esses eventos.

```typescript
// No job de expiração:
const expired = await db
  .update(roadEvents)
  .set({ status: 'expired', updated_at: now })
  .where(
    and(
      inArray(roadEvents.status, ['pending', 'verified']),
      lte(roadEvents.expires_at, now),
      // Não expirar eventos permanentes
      sql`(metadata->>'is_permanent')::boolean IS DISTINCT FROM true`,
    ),
  )
  .returning({ id: roadEvents.id });
```

---

## 10. Integração com Dispatch

### 10.1 Visão Geral

O sistema de Dispatch (roteirização inteligente) consome eventos do Road Intelligence para:

1. **Desviar rotas** de áreas com acidentes, engarrafamentos ou enchentes
2. **Ajustar ETA** com base em eventos ativos na rota
3. **Alertar motoristas** antes de entrar em áreas de risco
4. **Otimizar entregas** evitando vias com obras ou buracos

### 10.2 Algoritmo de Score de Rota

```typescript
// src/services/dispatch-integration.ts

interface RouteSegment {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceKm: number;
  estimatedTimeMin: number;
  roadEvents: RoadEvent[];
}

interface RouteScore {
  segment: RouteSegment;
  baseEtaMinutes: number;
  adjustedEtaMinutes: number;
  riskScore: number;       // 0-100
  recommendation: 'ok' | 'caution' | 'avoid' | 'critical_avoid';
  reason: string;
}

function scoreSegment(segment: RouteSegment): RouteScore {
  let riskScore = 0;
  let etaAdjustment = 0;
  const reasons: string[] = [];

  for (const event of segment.roadEvents) {
    switch (event.event_type) {
      case 'acidente':
        riskScore += 30;
        etaAdjustment += 10; // +10 min por acidente
        reasons.push('Acidente na rota');
        break;

      case 'engarrafamento':
        riskScore += 20;
        etaAdjustment += 15;
        reasons.push('Congestionamento');
        break;

      case 'enchente':
        riskScore += 40;
        etaAdjustment += 20;
        reasons.push('Via alagada');
        break;

      case 'obra':
        riskScore += 10;
        etaAdjustment += 5;
        reasons.push('Obra na via');
        break;

      case 'blitz':
        riskScore += 5;
        etaAdjustment += 3;
        reasons.push('Blitz na rota');
        break;

      default:
        break;
    }
  }

  const eventDensity = segment.roadEvents.length / Math.max(segment.distanceKm, 0.1);
  riskScore += eventDensity * 5; // Densidade de eventos

  let recommendation: RouteScore['recommendation'];
  if (riskScore >= 60) {
    recommendation = 'critical_avoid';
  } else if (riskScore >= 30) {
    recommendation = 'avoid';
  } else if (riskScore >= 15) {
    recommendation = 'caution';
  } else {
    recommendation = 'ok';
  }

  return {
    segment,
    baseEtaMinutes: segment.estimatedTimeMin,
    adjustedEtaMinutes: segment.estimatedTimeMin + etaAdjustment,
    riskScore: Math.min(riskScore, 100),
    recommendation,
    reason: reasons.length > 0 ? reasons.join('; ') : 'Rota livre',
  };
}
```

### 10.3 Impacto no ETA

| Evento na Rota | Impacto no ETA |
|---------------|----------------|
| Acidente | +5 a +20 minutos |
| Engarrafamento | +10 a +30 minutos |
| Obra | +3 a +10 minutos |
| Enchente | +10 a +30 minutos |
| Blitz | +2 a +5 minutos |
| Desvio | +2 a +10 minutos |
| Sinal fechado | +1 a +3 minutos |
| Buraco | +1 minuto (redução de velocidade) |
| Animal | +1 minuto (atenção redobrada) |

### 10.4 Alertas Pré-Rota

Antes de iniciar a navegação, o Dispatch verifica a rota calculada:

```
┌─────────────────────────────────────────────┐
│  ⚠️  ALERTAS NA ROTA                         │
│                                              │
│  📍 Av. Paulista, 5km                        │
│  🚧 Obra na faixa da direita                │
│     +5min no ETA                             │
│                                              │
│  📍 Marginal Tietê, 12km                     │
│  🌊 Enchente no km 15                       │
│     ⚠️ ALERTA CRÍTICO - Rota bloqueada      │
│                                              │
│  📍 Av. Faria Lima, 8km                      │
│  🚔 Blitz policial                           │
│     +3min no ETA                             │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  🔄 Rota alternativa recomendada    │    │
│  │  Economia estimada: 15min           │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  [✓ Usar rota alternativa] [✗ Ignorar]      │
└─────────────────────────────────────────────┘
```

### 10.5 Alertas Durante Navegação

```
┌─────────────────────────────────┐
│  ⚠️ Evento a 500m               │
│                                 │
│  🚧 Obra na Av. Paulista       │
│  ↓ Reduza para 40km/h          │
│                                 │
│  ─── Barra de progresso ────   │
│  ████████░░░░░░░░░░░░          │
│  Você está aqui         Evento │
└─────────────────────────────────┘
```

---

## 11. Analytics

### 11.1 Dashboard de Analytics

Painel administrativo com métricas em tempo real:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 ROAD INTELLIGENCE ANALYTICS    Últimos 7 dias          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ 12,458   │ │ 8,234    │ │ 66%      │ │ 4.2 min      │  │
│  │ Eventos  │ │ Verifica-│ │ Taxa de  │ │ Tempo médio  │  │
│  │ totais   │ │ dos      │ │ acerto   │ │ verificação  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ─── Top 10 Vias com Mais Eventos ────                     │
│                                                             │
│  1. Av. Paulista (SP)           ━━━━━━━━━━ 245 eventos    │
│  2. Marginal Tietê (SP)         ━━━━━━━━━ 198 eventos     │
│  3. Av. Brasil (RJ)             ━━━━━━━━ 156 eventos      │
│  4. BR-116 (SP/RJ)              ━━━━━━━ 134 eventos       │
│  5. Av. 23 de Maio (SP)         ━━━━━━ 112 eventos        │
│  6. Av. Rebouças (SP)           ━━━━━ 98 eventos          │
│  7. Av. Atlântica (RJ)          ━━━━ 87 eventos           │
│  8. BR-101 (RJ/SP)              ━━━━ 82 eventos           │
│  9. Av. Eng. Billings (SP)      ━━━ 71 eventos            │
│ 10. Av. dos Bandeirantes (SP)   ━━ 65 eventos             │
│                                                             │
│  ─── Eventos por Tipo ────                                 │
│                                                             │
│  🚧 Obra        ████████████░░░  45%                      │
│  🚔 Blitz       █████████░░░░░░  30%                      │
│  🚗 Acidente    ██████░░░░░░░░░  20%                      │
│  🌊 Enchente    ███░░░░░░░░░░░░  10%                      │
│  🐕 Animal      ██░░░░░░░░░░░░░   8%                      │
│  Outros         █████░░░░░░░░░░  18%                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Consultas SQL de Analytics

```sql
-- ============================================================
-- Top 10 vias com mais eventos
-- ============================================================
-- Nota: "via" é inferida por proximidade geográfica
-- Idealmente, usar-se-ia uma tabela de vias com geometria

SELECT
    ROUND(lat::numeric, 3) || ',' || ROUND(lng::numeric, 3) AS location_cluster,
    COUNT(*) AS event_count,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified_count,
    AVG(upvotes)::INT AS avg_upvotes
FROM road_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY location_cluster
ORDER BY event_count DESC
LIMIT 10;

-- ============================================================
-- Mapa de calor por tipo de evento
-- ============================================================

SELECT
    event_type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired,
    ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::numeric, 2) AS avg_lifetime_seconds
FROM road_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY total DESC;

-- ============================================================
-- Leaderboard de motoristas
-- ============================================================

SELECT
    dr.driver_id,
    u.email AS driver_email,
    dr.total_reports,
    dr.verified_reports,
    dr.false_reports,
    dr.score,
    CASE
        WHEN dr.score >= 1000 THEN 'platinum'
        WHEN dr.score >= 500 THEN 'gold'
        WHEN dr.score >= 200 THEN 'silver'
        WHEN dr.score >= 50 THEN 'bronze'
        ELSE 'newcomer'
    END AS level
FROM driver_road_reputation dr
JOIN auth.users u ON u.id = dr.driver_id
ORDER BY dr.score DESC
LIMIT 50;

-- ============================================================
-- Tempo médio de verificação
-- ============================================================

SELECT
    AVG(EXTRACT(EPOCH FROM (verified_at - created_at)))::INTERVAL AS avg_verification_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (verified_at - created_at))
    )::INTERVAL AS median_verification_time
FROM (
    SELECT
        re.id,
        re.created_at,
        MIN(ev.created_at) AS verified_at
    FROM road_events re
    JOIN event_upvotes ev ON ev.event_id = re.id AND ev.vote = 1
    WHERE re.status = 'verified'
      AND re.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY re.id, re.created_at
    HAVING COUNT(*) >= 5
) sub;

-- ============================================================
-- Precisão dos reports (verificados / total)
-- ============================================================

SELECT
    ROUND(
        COUNT(*) FILTER (WHERE status = 'verified')::numeric /
        GREATEST(COUNT(*), 1) * 100,
        2
    ) AS accuracy_percentage,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired,
    COUNT(*) FILTER (WHERE status = 'removed') AS removed,
    COUNT(*) AS total
FROM road_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ============================================================
-- Eventos por hora do dia
-- ============================================================

SELECT
    EXTRACT(HOUR FROM created_at) AS hour_of_day,
    COUNT(*) AS event_count
FROM road_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour_of_day
ORDER BY hour_of_day;
```

### 11.3 Eventos de Dispatcher

Quando um dispatcher precisa visualizar eventos em uma região:

```
┌─────────────────────────────────────────────────────────────┐
│  🗺️  MAPA DO DISPATCHER    Região: São Paulo               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │    🚧          🚔         🚗                        │   │
│  │       🚧  🐕              🚗                         │   │
│  │            🚔      🌊                                │   │
│  │                🚗        🚧                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📋 Lista de Eventos na Região                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🚧 Obra     • Av. Paulista, 500   • Pendente   ⏰ │  │
│  │ 🚔 Blitz    • Av. Faria Lima, 200 • Verificado ✅ │  │
│  │ 🚗 Acidente • Marginal, 1.2km     • Critical   🔴 │  │
│  │ 🌊 Enchente • Av. 23 de Maio, 3km • Verificado ✅ │  │
│  │ 🐕 Animal   • Av. Rebouças, 800m  • Pendente   ⏰ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [Exportar CSV]  [Filtrar por tipo]  [Gerenciar eventos]   │
└─────────────────────────────────────────────────────────────┘
```

### 11.4 Exportação de Dados

```typescript
// API endpoint para exportação

// GET /api/v1/road-intelligence/analytics/export
// Query params:
//   start_date: ISO date
//   end_date: ISO date
//   format: 'csv' | 'json'
//   type?: event_type filter
//   city_id?: UUID filter

interface AnalyticsExport {
  events: RoadEvent[];
  summary: {
    total: number;
    byType: Record<RoadEventType, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    avgVerificationTimeMs: number;
    accuracyRate: number;
  };
  topRoads: Array<{
    lat: number;
    lng: number;
    eventCount: number;
  }>;
  leaderboard: Array<{
    driverId: string;
    score: number;
    level: string;
    verifiedReports: number;
  }>;
}
```

---

## 12. Tabela `driver_road_reputation`

### 12.1 Schema SQL

```sql
-- ============================================================
-- TABLE: driver_road_reputation
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_road_reputation (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Contadores de reports
    total_reports       INTEGER NOT NULL DEFAULT 0 CHECK (total_reports >= 0),
    verified_reports    INTEGER NOT NULL DEFAULT 0 CHECK (verified_reports >= 0),
    false_reports       INTEGER NOT NULL DEFAULT 0 CHECK (false_reports >= 0),

    -- Score calculado (0 a 10000)
    score               INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10000),

    -- Timestamps
    last_calculated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique por motorista
    UNIQUE (driver_id)
);

-- Índice para leaderboard
CREATE INDEX IF NOT EXISTS idx_driver_reputation_score
    ON driver_road_reputation (score DESC);

-- Índice para busca por motorista
CREATE INDEX IF NOT EXISTS idx_driver_reputation_driver
    ON driver_road_reputation (driver_id);

-- ============================================================
-- RLS: driver_road_reputation
-- ============================================================
ALTER TABLE driver_road_reputation ENABLE ROW LEVEL SECURITY;

-- Motorista pode ver sua própria reputação
CREATE POLICY "select_own_reputation" ON driver_road_reputation
    FOR SELECT
    USING (auth.uid() = driver_id);

-- Qualquer um pode ver o leaderboard (apenas score e nível)
CREATE POLICY "select_leaderboard" ON driver_road_reputation
    FOR SELECT
    USING (true);

-- Apenas o sistema (service role) pode inserir/atualizar
CREATE POLICY "system_manage_reputation" ON driver_road_reputation
    FOR ALL
    USING (is_service_role());
```

### 12.2 Função de Cálculo de Score

```sql
-- ============================================================
-- FUNCTION: calculate_driver_score
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_driver_score(driver_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
    v_verified INTEGER;
    v_false INTEGER;
    v_score INTEGER;
BEGIN
    -- Obter contadores da tabela road_events
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'verified')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'removed')::INTEGER
    INTO v_total, v_verified, v_false
    FROM road_events
    WHERE reported_by = driver_id;

    -- Se não tem reports, score = 0
    IF v_total = 0 THEN
        v_score := 0;
    ELSE
        -- Fórmula: (verified * 10) + (verified / total * 50) - (false * 5)
        v_score := GREATEST(0,
            (v_verified * 10) +
            ((v_verified::NUMERIC / v_total) * 50)::INTEGER -
            (v_false * 5)
        );
    END IF;

    -- Atualizar ou inserir na tabela de reputação
    INSERT INTO driver_road_reputation
        (driver_id, total_reports, verified_reports, false_reports, score, last_calculated_at)
    VALUES
        (driver_id, v_total, v_verified, v_false, v_score, NOW())
    ON CONFLICT (driver_id)
    DO UPDATE SET
        total_reports = v_total,
        verified_reports = v_verified,
        false_reports = v_false,
        score = v_score,
        last_calculated_at = NOW();

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;
```

### 12.3 Trigger: Atualizar Reputação ao Mudar Evento

```sql
-- ============================================================
-- TRIGGER: Atualizar reputação quando evento muda de status
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_update_reputation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM calculate_driver_score(NEW.reported_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_road_event_reputation
    AFTER UPDATE OF status ON road_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_reputation();
```

---

## 13. Notificações

### 13.1 Tipos de Notificação

| Tipo | Gatilho | Prioridade | Som | Destino |
|------|---------|-----------|-----|---------|
| `new_event_nearby` | Evento criado a < 500m do motorista | Alta | Curto (1s) | Push + In-app |
| `event_verified_nearby` | Evento verificado próximo | Média | Suave | Push + In-app |
| `critical_event_route` | Evento crítico na rota de navegação | Crítica | Contínuo até interagir | Full-screen |
| `event_expiring` | Evento do motorista vai expirar em 15min | Baixa | Silencioso | In-app |
| `report_verified` | Report do motorista foi verificado | Média | Suave | Push + In-app |
| `report_removed` | Report do motorista foi removido | Baixa | Silencioso | In-app |
| `reputation_level_up` | Motorista subiu de nível | Média | Comemorativo | Push + In-app |
| `geofence_enter` | Motorista entrou em geofence de evento | Alta | Curto | Push + In-app |

### 13.2 Payload de Push Notification

```typescript
// src/services/notification-service.ts

interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: string;
    event_id: string;
    event_type: RoadEventType;
    lat: number;
    lng: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    distance_meters: number;
    screen: string; // deep link
  };
  android: {
    channel_id: string;
    priority: 'low' | 'default' | 'high' | 'max';
    sound: string;
    vibration_pattern?: number[];
    full_screen_intent?: string;
  };
  ios: {
    sound: string;
    badge?: number;
    interruption_level: 'passive' | 'active' | 'time_sensitive' | 'critical';
  };
}

function buildNotification(
  event: RoadEvent,
  driver: { lat: number; lng: number },
  notificationType: string,
): PushNotificationPayload {
  const distance = calculateDistance(driver.lat, driver.lng, event.lat, event.lng);
  const distanceText = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  const titles: Record<string, string> = {
    new_event_nearby: `Novo evento a ${distanceText}`,
    event_verified_nearby: `Evento verificado a ${distanceText}`,
    critical_event_route: `⚠️ ALERTA CRÍTICO a ${distanceText}`,
    report_verified: '✅ Seu report foi verificado!',
    report_removed: 'Seu report foi removido',
    reputation_level_up: '🎉 Você subiu de nível!',
    geofence_enter: `🔔 ${event.event_type} a ${distanceText}`,
  };

  const eventTypeLabels: Record<RoadEventType, string> = {
    radar: 'Radar de velocidade',
    lombada: 'Lombada',
    acidente: 'Acidente',
    blitz: 'Blitz policial',
    buraco: 'Buraco na pista',
    obra: 'Obra na via',
    animal: 'Animal na pista',
    enchente: 'Alagamento',
    neblina: 'Neblina',
    chuva: 'Chuva intensa',
    engarrafamento: 'Congestionamento',
    pedagio: 'Pedágio',
    posto: 'Posto de combustível',
    borracharia: 'Borracharia',
    oficina: 'Oficina',
    hospital: 'Hospital',
    delegacia: 'Delegacia',
    ponto_seguro: 'Ponto seguro',
    carregador: 'Carregador elétrico',
    sinal_fechado: 'Semáforo quebrado',
    desvio: 'Desvio na via',
  };

  return {
    title: titles[notificationType] || 'Evento na via',
    body: `${eventTypeLabels[event.event_type]}${event.description ? ': ' + event.description : ''}`,
    data: {
      type: notificationType,
      event_id: event.id,
      event_type: event.event_type,
      lat: event.lat,
      lng: event.lng,
      severity: event.severity,
      distance_meters: Math.round(distance),
      screen: 'RoadIntelligence',
    },
    android: {
      channel_id: event.severity === 'critical' ? 'critical_alerts' : 'road_events',
      priority: event.severity === 'critical' ? 'max' : event.severity === 'high' ? 'high' : 'default',
      sound: event.severity === 'critical' ? 'alert_critical.wav' : 'alert_default.wav',
      vibration_pattern: event.severity === 'critical' ? [0, 500, 200, 500] : undefined,
      full_screen_intent: event.severity === 'critical' ? 'critical_alert_activity' : undefined,
    },
    ios: {
      sound: event.severity === 'critical' ? 'alert_critical.wav' : 'alert_default.wav',
      interruption_level: event.severity === 'critical' ? 'critical' : 'active',
    },
  };
}
```

### 13.3 Canal de Notificações (Android)

```xml
<!-- res/xml/channels.xml -->

<channel
    id="road_events"
    name="Eventos de Trânsito"
    description="Alertas sobre eventos na via próximos a você"
    importance="high" />

<channel
    id="critical_alerts"
    name="Alertas Críticos"
    description="Alertas críticos que exigem atenção imediata"
    importance="max"
    bypass_dnd="true"
    vibration="true"
    lights="true" />

<channel
    id="social"
    name="Social"
    description="Verificação de reports e mudanças de nível"
    importance="default" />

<channel
    id="silent"
    name="Silencioso"
    description="Notificações sem som (eventos expirando)"
    importance="low" />
```

### 13.4 Rate Limiting de Notificações

```typescript
// Para evitar spam de notificações:

const NOTIFICATION_RATE_LIMITS = {
  // Máximo de notificações por minuto por motorista
  PER_MINUTE: 5,

  // Máximo de notificações por hora por motorista
  PER_HOUR: 20,

  // Mínimo de tempo entre notificações do mesmo tipo (ms)
  COOLDOWN_SAME_TYPE: 5 * 60 * 1000, // 5 minutos

  // Mínimo de distância entre eventos para notificar (metros)
  MIN_DISTANCE_BETWEEN_EVENTS: 100,
};
```

### 13.5 Deep Linking

Cada notificação abre uma tela específica no app:

```
roadintelligence://event/{event_id}
roadintelligence://map?lat={lat}&lng={lng}&zoom=15
roadintelligence://report?type={event_type}
roadintelligence://profile/reputation
roadintelligence://leaderboard
```

---

## 14. Segurança e Rate Limiting

### 14.1 Rate Limiting por Endpoint

| Endpoint | Limite | Janela | Consequência |
|----------|--------|--------|-------------|
| `POST /events` | 5 requests | 1 minuto | HTTP 429 + backoff de 5min |
| `POST /events` | 50 requests | 1 hora | Suspensão de 1h |
| `POST /upvote` | 30 requests | 1 minuto | HTTP 429 |
| `GET /events/nearby` | 60 requests | 1 minuto | HTTP 429 |
| `POST /upload/photo` | 10 requests | 1 minuto | HTTP 429 |

### 14.2 Validações de Segurança

```typescript
// src/middleware/security.ts

const SECURITY_RULES = {
  // Tamanho máximo de foto (5MB)
  MAX_PHOTO_SIZE: 5 * 1024 * 1024,

  // Formatos de foto permitidos
  ALLOWED_PHOTO_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],

  // Dimensões máximas de foto
  MAX_PHOTO_DIMENSIONS: { width: 4096, height: 4096 },

  // Distância mínima entre eventos do mesmo tipo (metros)
  MIN_EVENT_DISTANCE: 10,

  // Máximo de fotos por evento
  MAX_PHOTOS_PER_EVENT: 3,

  // Tamanho máximo de descrição
  MAX_DESCRIPTION_LENGTH: 500,

  // Coordenadas do Brasil (bounding box)
  BRAZIL_BOUNDS: {
    minLat: -33.75,
    maxLat: 5.27,
    minLng: -73.99,
    maxLng: -34.79,
  },
};
```

### 14.3 Prevenção de Abuso

| Ameaça | Mitigação |
|--------|-----------|
| Report em massa de eventos falsos | Rate limit + suspensão após N falsos |
| Upvote/downvote em massa | Rate limit + verificação de conta |
| Spoofing de localização | Verificar GPS com torre de celular (opcional) |
| Bot accounts | Captcha no cadastro + verificação de email |
| Photo inapropriada | Moderação automática (NSFW detection) + report |
| Ataque de geofence | Limitar área máxima de geofence a 1km |

### 14.4 Logging e Auditoria

```sql
-- Tabela de auditoria para ações administrativas
CREATE TABLE IF NOT EXISTS road_event_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID REFERENCES road_events(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_status  event_status,
    new_status  event_status,
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event
    ON road_event_audit_log (event_id, created_at DESC);
```

---

## 15. API Endpoints

### 15.1 Lista Completa de Endpoints

```
Base URL: /api/v1/road-intelligence

┌──────────┬────────────────────────────────────┬──────────────────────────────┐
│ Method   │ Path                               │ Descrição                    │
├──────────┼────────────────────────────────────┼──────────────────────────────┤
│ GET      │ /events                            │ Listar eventos (com filtros) │
│ GET      │ /events/nearby                     │ Eventos próximos (GPS)       │
│ GET      │ /events/:id                        │ Detalhes de um evento        │
│ POST     │ /events                            │ Criar novo evento            │
│ PUT      │ /events/:id                        │ Atualizar evento (próprio)   │
│ DELETE   │ /events/:id                        │ Remover evento (próprio)     │
│          │                                    │                              │
│ POST     │ /events/:id/upvote                 │ Upvote em evento             │
│ POST     │ /events/:id/downvote               │ Downvote em evento           │
│ POST     │ /events/:id/confirm                │ Confirmação visual           │
│          │                                    │                              │
│ GET      │ /events/:id/photos                 │ Listar fotos de um evento    │
│ POST     │ /events/:id/photos                 │ Adicionar foto ao evento     │
│ DELETE   │ /events/:id/photos/:photoId        │ Remover foto do evento       │
│          │                                    │                              │
│ GET      │ /events/stats                      │ Estatísticas gerais          │
│ GET      │ /events/heatmap                    │ Dados para mapa de calor     │
│          │                                    │                              │
│ GET      │ /reputation/:driverId              │ Reputação de um motorista    │
│ GET      │ /reputation/leaderboard            │ Leaderboard global           │
│          │                                    │                              │
│ GET      │ /analytics/top-roads               │ Top vias com mais eventos    │
│ GET      │ /analytics/by-type                 │ Eventos por tipo             │
│ GET      │ /analytics/verification-time       │ Tempo médio de verificação   │
│ GET      │ /analytics/accuracy                │ Precisão dos reports         │
│ GET      │ /analytics/export                  │ Exportar dados (admin)       │
│          │                                    │                              │
│ POST     │ /admin/events/:id/verify           │ Verificar evento (admin)     │
│ POST     │ /admin/events/:id/extend           │ Estender expiração (admin)   │
│ POST     │ /admin/events/:id/remove           │ Remover evento (admin)       │
│ GET      │ /admin/events/pending              │ Eventos pendentes (admin)    │
│ GET      │ /admin/audit-log                   │ Log de auditoria (admin)     │
└──────────┴────────────────────────────────────┴──────────────────────────────┘
```

### 15.2 Parâmetros de Query (GET /events)

```
GET /events

Parâmetros:
  lat             number    (obrigatório)   Latitude do centro da busca
  lng             number    (obrigatório)   Longitude do centro da busca
  radius          number    (opcional)      Raio em metros (default: 5000, max: 50000)
  event_types     string    (opcional)      Filtrar por tipos (vírgula: "radar,blitz")
  severity_min    string    (opcional)      Severidade mínima (low/medium/high/critical)
  status          string    (opcional)      Status (pending/verified, default: ambos)
  verified_only   boolean   (opcional)      Apenas eventos verificados
  recent_only     boolean   (opcional)      Apenas eventos da última hora
  limit           number    (opcional)      Máximo de resultados (default: 50, max: 200)
  offset          number    (opcional)      Paginação (default: 0)
```

### 15.3 Resposta Padrão

```typescript
// Formato de resposta para listagens

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  meta?: {
    server_time: string;
    request_id: string;
  };
}

// Formato de erro

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    request_id: string;
  };
}

// Códigos de erro
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',       // 422
  NOT_FOUND: 'NOT_FOUND',                     // 404
  RATE_LIMITED: 'RATE_LIMITED',               // 429
  UNAUTHORIZED: 'UNAUTHORIZED',               // 401
  FORBIDDEN: 'FORBIDDEN',                     // 403
  DUPLICATE_EVENT: 'DUPLICATE_EVENT',         // 409
  EVENT_EXPIRED: 'EVENT_EXPIRED',             // 410
  SUSPENDED: 'ACCOUNT_SUSPENDED',             // 403
  INTERNAL_ERROR: 'INTERNAL_ERROR',           // 500
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE', // 503
} as const;
```

---

## 16. Componentes Mobile

### 16.1 Estrutura de Telas

```
src/
  screens/
    road-intelligence/
      RoadIntelligenceMap.tsx          # Tela principal com mapa + overlay
      ReportFlow.tsx                   # Fluxo de reporte (multi-step)
      EventDetailSheet.tsx             # Bottom sheet com detalhes do evento
      EventTypeSelector.tsx            # Grid de seleção de tipo
      PhotoCapture.tsx                 # Câmera + galeria
      LocationPicker.tsx               # Mapa para ajustar localização
      DescriptionInput.tsx             # Campo de descrição
      ReviewAndSubmit.tsx              # Revisão antes de enviar
      SuccessScreen.tsx                # Confirmação pós-reporte
      EventFilters.tsx                 # Tela de filtros
      NotificationCenter.tsx           # Central de notificações
      Leaderboard.tsx                  # Leaderboard de motoristas
      MyReputation.tsx                 # Minha reputação e stats
      AdminEventList.tsx               # Lista de eventos (admin)
      AdminAuditLog.tsx                # Log de auditoria (admin)
```

### 16.2 Mapa Principal

```typescript
// src/screens/road-intelligence/RoadIntelligenceMap.tsx

// Props principais
interface RoadIntelligenceMapProps {
  // Localização atual do motorista (atualizado via GPS)
  currentLocation: { lat: number; lng: number };

  // Raio de busca
  searchRadius: number; // metros

  // Filtros ativos
  filters: EventFilters;

  // Eventos carregados (via WebSocket ou REST)
  events: RoadEvent[];

  // Callbacks
  onEventPress: (event: RoadEvent) => void;
  onReportPress: () => void;
  onFilterChange: (filters: EventFilters) => void;
  onViewportChange: (viewport: Viewport) => void;
}

// Funcionalidades do mapa:
// 1. Renderizar eventos como marcadores personalizados
// 2. Clustering automático em zoom out
// 3. Cores por severidade
// 4. Botão flutuante de reporte (FAB)
// 5. Botão de centralizar na localização
// 6. Botão de filtros
// 7. Legenda de cores
// 8. Atualização em tempo real via WebSocket
// 9. Animações de entrada/saída de eventos
```

### 16.3 WebSocket em Tempo Real

```typescript
// src/services/websocket-service.ts

import { RealtimeClient } from '@supabase/realtime-js';

export class RoadIntelligenceRealtime {
  private client: RealtimeClient;
  private subscriptions: Map<string, Function> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = new RealtimeClient(supabaseUrl, {
      params: { apikey: supabaseKey },
    });
  }

  connect() {
    this.client.connect();
  }

  disconnect() {
    this.client.disconnect();
  }

  /**
   * Inscreve-se em novos eventos
   */
  subscribeToNewEvents(callback: (event: RoadEvent) => void) {
    const subscription = this.client
      .channel('road_events_new')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'road_events' },
        (payload) => {
          callback(payload.new as RoadEvent);
        },
      )
      .subscribe();

    this.subscriptions.set('new_events', callback);
  }

  /**
   * Inscreve-se em mudanças de eventos (updates/verificações)
   */
  subscribeToEventUpdates(callback: (event: Partial<RoadEvent>) => void) {
    const subscription = this.client
      .channel('road_events_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'road_events' },
        (payload) => {
          callback(payload.new as Partial<RoadEvent>);
        },
      )
      .subscribe();

    this.subscriptions.set('event_updates', callback);
  }

  /**
   * Inscreve-se em notificações personalizadas
   */
  subscribeToPersonalNotifications(driverId: string, callback: (notification: any) => void) {
    const subscription = this.client
      .channel(`notifications:${driverId}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(`notifications:${driverId}`, callback);
  }
}
```

### 16.4 Cache Local e Offline

```typescript
// src/services/cache-service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  EVENTS: '@road_intelligence/events',
  VIEWED_EVENTS: '@road_intelligence/viewed_events',
  PENDING_REPORTS: '@road_intelligence/pending_reports',
  FILTERS: '@road_intelligence/filters',
  LAST_SYNC: '@road_intelligence/last_sync',
};

export class RoadIntelligenceCache {
  /**
   * Salva eventos em cache local para exibição offline
   */
  async cacheEvents(events: RoadEvent[]): Promise<void> {
    const existing = await this.getCachedEvents();
    const merged = this.mergeEvents(existing, events);

    await AsyncStorage.setItem(CACHE_KEYS.EVENTS, JSON.stringify(merged));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Recupera eventos do cache
   */
  async getCachedEvents(): Promise<RoadEvent[]> {
    const data = await AsyncStorage.getItem(CACHE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Marca evento como visualizado (para não repetir notificação)
   */
  async markEventViewed(eventId: string, driverId: string): Promise<void> {
    const key = `${CACHE_KEYS.VIEWED_EVENTS}:${driverId}`;
    const viewed = await AsyncStorage.getItem(key);
    const list: string[] = viewed ? JSON.parse(viewed) : [];

    if (!list.includes(eventId)) {
      list.push(eventId);
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
  }

  /**
   * Verifica se evento já foi visualizado
   */
  async hasEventBeenViewed(eventId: string, driverId: string): Promise<boolean> {
    const key = `${CACHE_KEYS.VIEWED_EVENTS}:${driverId}`;
    const viewed = await AsyncStorage.getItem(key);
    return viewed ? JSON.parse(viewed).includes(eventId) : false;
  }

  /**
   * Salva report pendente para envio quando online
   */
  async savePendingReport(report: CreateEventRequest): Promise<void> {
    const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_REPORTS);
    const list: CreateEventRequest[] = pending ? JSON.parse(pending) : [];

    list.push(report);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_REPORTS, JSON.stringify(list));
  }

  /**
   * Recupera e limpa reports pendentes
   */
  async getAndClearPendingReports(): Promise<CreateEventRequest[]> {
    const data = await AsyncStorage.getItem(CACHE_KEYS.PENDING_REPORTS);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_REPORTS, JSON.stringify([]));
    return data ? JSON.parse(data) : [];
  }

  private mergeEvents(existing: RoadEvent[], incoming: RoadEvent[]): RoadEvent[] {
    const map = new Map<string, RoadEvent>();

    for (const event of [...existing, ...incoming]) {
      map.set(event.id, event);
    }

    return Array.from(map.values())
      .filter(e => e.status !== 'expired' && e.status !== 'removed');
  }
}
```

---

## 17. Tratamento de Erros

### 17.1 Códigos de Erro HTTP

| Código | Significado | Quando Acontece | Ação do Cliente |
|--------|-------------|----------------|-----------------|
| 400 | Bad Request | Payload mal formatado | Corrigir payload |
| 401 | Unauthorized | Token ausente ou inválido | Re-autenticar |
| 403 | Forbidden | Sem permissão | Mostrar mensagem |
| 404 | Not Found | Evento não existe | Atualizar lista |
| 409 | Conflict | Evento duplicado | Sugerir upvote |
| 410 | Gone | Evento expirado | Remover do mapa |
| 422 | Unprocessable | Validação falhou | Mostrar erros campo a campo |
| 429 | Too Many Requests | Rate limit excedido | Aguardar backoff |
| 500 | Internal Server Error | Erro inesperado | Tentar novamente |
| 503 | Service Unavailable | Sistema em manutenção | Mostrar mensagem |

### 17.2 Tratamento no Mobile

```typescript
// src/services/error-handler.ts

export class RoadIntelligenceErrorHandler {
  static handle(error: ApiError, context: string): UserFacingError {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return {
          title: 'Dados inválidos',
          message: 'Verifique os campos e tente novamente',
          fields: error.details,
          action: 'FIX_FORM',
        };

      case 'RATE_LIMITED':
        return {
          title: 'Muitas solicitações',
          message: `Aguarde ${error.retryAfter} segundos antes de reportar novamente`,
          action: 'WAIT',
          retryAfter: error.retryAfter,
        };

      case 'DUPLICATE_EVENT':
        return {
          title: 'Evento já reportado',
          message: 'Este evento já foi reportado por outro motorista. Que tal dar um upvote?',
          action: 'UPVOTE',
          existingEventId: error.eventId,
        };

      case 'EVENT_EXPIRED':
        return {
          title: 'Evento expirado',
          message: 'Este evento não está mais ativo',
          action: 'DISMISS',
        };

      case 'ACCOUNT_SUSPENDED':
        return {
          title: 'Conta suspensa',
          message: 'Sua conta foi temporariamente suspensa devido a reports falsos',
          action: 'CONTACT_SUPPORT',
          suspensionHours: error.suspensionHours,
        };

      case 'SERVICE_UNAVAILABLE':
        return {
          title: 'Sistema em manutenção',
          message: 'O Road Intelligence está temporariamente indisponível. Tente novamente mais tarde.',
          action: 'RETRY_LATER',
        };

      default:
        return {
          title: 'Erro inesperado',
          message: 'Algo deu errado. Tente novamente.',
          action: 'RETRY',
        };
    }
  }
}
```

### 17.3 Logs Estruturados

```typescript
// src/services/logger.ts

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  service: string;
  action: string;
  driver_id?: string;
  event_id?: string;
  duration_ms?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Eventos de log importantes:
// - event.created (info) - Novo evento criado
// - event.verified (info) - Evento verificado
// - event.expired (info) - Evento expirou
// - event.removed (warn) - Evento removido por admin
// - event.duplicate (warn) - Tentativa de criar duplicata
// - upvote.received (info) - Upvote registrado
// - rate_limit.exceeded (warn) - Rate limit excedido
// - false_report.detected (error) - Falso report identificado
// - reputation.calculated (info) - Score recalculado
// - push.sent (info) - Notificação enviada
// - push.failed (error) - Falha no envio de push
// - geofence.created (info) - Geofence criado
// - geofence.triggered (info) - Motorista entrou no geofence
```

---

## 18. Glossário

| Termo | Definição |
|-------|-----------|
| **Road Intelligence** | Motor colaborativo de eventos de trânsito em tempo real |
| **Evento** | Ocorrência reportada na via (acidente, radar, obra, etc.) |
| **Report** | Ação de criar um novo evento no sistema |
| **Upvote** | Voto positivo confirmando a existência do evento |
| **Downvote** | Voto negativo contestando a existência do evento |
| **Verificação** | Processo de confirmar a veracidade de um evento (5 upvotes = verified) |
| **Geofence** | Círculo geográfico ao redor de um evento para alertar motoristas próximos |
| **Severidade** | Nível de impacto do evento (low, medium, high, critical) |
| **Dispatch** | Sistema de roteirização inteligente que consome eventos do Road Intelligence |
| **ETA** | Estimated Time of Arrival (tempo estimado de chegada) |
| **Reputação** | Score do motorista baseado na qualidade de seus reports |
| **Leaderboard** | Ranking de motoristas com maior score de reputação |
| **Heatmap** | Mapa de calor exibindo concentração de eventos |
| **Clustering** | Agrupamento de eventos próximos em zoom out |
| **Overlay** | Camada de eventos sobre o mapa base |
| **RLS** | Row Level Security (políticas de segurança a nível de linha no PostgreSQL) |
| **TTL** | Time To Live (tempo de vida de um evento ou geofence) |
| **Critical Alert** | Alerta full-screen para eventos de severidade crítica |
| **Confirmação Visual** | Foto tirada por outro motorista confirmando o evento |
| **Dispatcher** | Administrador que gerencia eventos e rotas |
| **Falso Report** | Evento reportado que não corresponde à realidade |
| **Suspensão** | Bloqueio temporário da capacidade de reportar |
| **Bounding Box** | Retângulo geográfico delimitando uma área de busca |
| **PostGIS** | Extensão do PostgreSQL para dados geoespaciais |
| **GIST Index** | Índice espacial do PostgreSQL para consultas de proximidade |
| **LISTEN/NOTIFY** | Mecanismo do PostgreSQL para notificação assíncrona entre conexões |
| **WebSocket** | Protocolo de comunicação bidirecional em tempo real |
| **Push Notification** | Notificação enviada ao dispositivo mesmo com app em background |
| **Deep Link** | Link que abre uma tela específica dentro do app |
| **AsyncStorage** | Armazenamento local persistente no React Native |
| **FIFO** | First In, First Out (fila de processamento offline) |

---

## Apêndice A: Exemplo de Fluxo Completo

```
1. João está dirigindo na Av. Paulista
2. Ele vê um acidente envolvendo 2 carros na faixa da direita
3. João toca no botão flutuante "+" no canto inferior direito do mapa
4. O Road Intelligence abre o seletor de tipo de evento
5. João seleciona "Acidente" (ícone de carro batendo)
6. O app abre a câmera; João tira 2 fotos do acidente
7. O GPS confirma a localização (João ajusta o pin no mapa)
8. João adiciona: "Acidente na faixa da direita, sentido centro. Trânsito lento."
9. Revisa e confirma → evento criado com status "pending"
10. Supabase Realtime emite LISTEN/NOTIFY
11. Geofence Engine calcula raio de 300m ao redor do acidente
12. Maria, a 200m do acidente, recebe push notification: "Novo evento a 200m"
13. Maria abre o app, vê o evento, e dá upvote (1/5)
14. Pedro, a 150m, também recebe e dá upvote (2/5)
15. Ana, a 300m, tira uma foto confirmando (confirmação visual)
16. Mais 3 motoristas dão upvote (5/5)
17. Evento é automaticamente verificado → status muda para "verified"
18. João recebe notificação: "Seu report foi verificado!"
19. João ganha +1 verified_report no score de reputação
20. Dispatch detecta acidente na rota de Carlos
21. Carlos recebe alerta: "Acidente na rota. ETA ajustado +15min"
22. Carlos opta por rota alternativa sugerida pelo Dispatch
23. Após 1h, o acidente é removido e o evento expira automaticamente
24. João ganha reputação; seu score sobe de 45 para 55 → nível "bronze"
```

## Apêndice B: Milestones de Implementação

| Fase | Duração | Entregas |
|------|---------|----------|
| **Fase 1: Core** | 4 semanas | Schema SQL, API CRUD, criação de eventos, mapa básico |
| **Fase 2: Real-time** | 3 semanas | WebSocket, Supabase Realtime, notificações push |
| **Fase 3: Geofence** | 2 semanas | Geofence Engine, alertas por proximidade, cache Redis |
| **Fase 4: Verificação** | 2 semanas | Sistema de upvote/downvote, reputação, verificação automática |
| **Fase 5: Analytics** | 2 semanas | Dashboard, leaderboard, exportação de dados |
| **Fase 6: Dispatch** | 3 semanas | Integração com Dispatch, score de rota, ETA ajustado |
| **Fase 7: Admin** | 2 semanas | Painel admin, auditoria, moderação de eventos |
| **Fase 8: Polimento** | 3 semanas | Performance, testes, tratamento offline, acessibilidade |

---

*Documento mantido pela equipe de Plataforma TXAPP. Versão 1.0.0.*
