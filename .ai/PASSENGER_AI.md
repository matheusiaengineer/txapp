# TXAPP Passenger AI

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Modelo de Dados](#modelo-de-dados)
   - [Tabela `passenger_preferences`](#tabela-passenger_preferences)
   - [Tabela `passenger_ride_history`](#tabela-passenger_ride_history)
   - [Tabela `passenger_events`](#tabela-passenger_events)
   - [Índices e Performance](#índices-e-performance)
5. [Funcionalidades](#funcionalidades)
   - [1. Favorite Route Detection](#1-favorite-route-detection)
   - [2. Frequent Time Detection](#2-frequent-time-detection)
   - [3. Contextual Greeting](#3-contextual-greeting)
   - [4. Favorite Driver Detection](#4-favorite-driver-detection)
   - [5. Payment Preference Learning](#5-payment-preference-learning)
   - [6. Destination Prediction](#6-destination-prediction)
   - [7. AI Scoring para Dispatch](#7-ai-scoring-para-dispatch)
   - [8. Category Preference](#8-category-preference)
   - [9. Language & Currency Preference](#9-language--currency-preference)
   - [10. Anomaly Detection](#10-anomaly-detection)
6. [Algoritmo de Aprendizado (Heurístico)](#algoritmo-de-aprendizado-heurístico)
   - [Score de Rota Favorita](#score-de-rota-favorita)
   - [Score de Horário Frequente](#score-de-horário-frequente)
   - [Predição de Destino](#predição-de-destino)
   - [Score de Motorista Favorito](#score-de-motorista-favorito)
   - [Score de Forma de Pagamento](#score-de-forma-de-pagamento)
   - [Algoritmo de Greeting Contextual](#algoritmo-de-greeting-contextual)
7. [Componentes React](#componentes-react)
   - [PassengerGreeting](#passengergreeting)
   - [FavoriteRouteCard](#favoriteroutecard)
   - [DestinationSuggestions](#destinationsuggestions)
   - [FrequentTimesWidget](#frequenttimeswidget)
   - [FavoriteDriverBadge](#favoritedriverbadge)
   - [PaymentSuggestion](#paymentsuggestion)
   - [PassengerDashboard](#passengerdashboard)
8. [Integração com Home](#integração-com-home)
9. [Eventos e Analytics](#eventos-e-analytics)
10. [Limpeza de Dados (Data Retention)](#limpeza-de-dados-data-retention)
11. [APIs e Endpoints](#apis-e-endpoints)
    - [POST /ai/refresh-preferences](#post-airefresh-preferences)
    - [GET /ai/greeting](#get-aigreeting)
    - [GET /ai/destination-suggestions](#get-aidestination-suggestions)
    - [GET /ai/frequent-drivers](#get-aifrequent-drivers)
    - [POST /ai/ride-completed](#post-airide-completed)
    - [POST /ai/feedback](#post-aifeedback)
12. [ML Futuro](#ml-futuro)
    - [Modelo de Predição de Destino com ML](#modelo-de-predição-de-destino-com-ml)
    - [Modelo de Churn Prediction](#modelo-de-churn-prediction)
    - [Modelo de ETA Ajustado](#modelo-de-eta-ajustado)
    - [Modelo de Precificação Dinâmica Personalizada](#modelo-de-precificação-dinâmica-personalizada)
13. [Testes](#testes)
    - [Testes Unitários (Algoritmos)](#testes-unitários-algoritmos)
    - [Testes de Integração (API)](#testes-de-integração-api)
    - [Testes de Componentes (React)](#testes-de-componentes-react)
    - [Testes de Performance](#testes-de-performance)
14. [Monitoramento e Observabilidade](#monitoramento-e-observabilidade)
15. [Segurança e Privacidade](#segurança-e-privacidade)
16. [Roadmap](#roadmap)

---

## Visão Geral

O **Passenger AI** é o módulo de inteligência artificial do TXAPP responsável por aprender padrões de uso dos passageiros e oferecer uma experiência personalizada e preditiva. A IA analisa o histórico de corridas, horários, locais, motoristas favoritos, formas de pagamento e preferências do passageiro para:

- Sugerir destinos prováveis ao abrir o aplicativo
- Saudar o passageiro com contexto ("Bom dia, deseja ir para o trabalho?")
- Pré-carregar motoristas próximos quando a probabilidade de solicitação for alta
- Sugerir a forma de pagamento preferida automaticamente
- Priorizar motoristas favoritos no dispatch
- Oferecer recomendações contextuais baseadas em dia da semana e horário

O sistema segue uma abordagem **híbrida**: utiliza algoritmos heurísticos para entrega imediata de valor, com arquitetura preparada para evoluir para modelos de Machine Learning supervisionados no futuro.

### Objetivos de Negócio

| Métrica | Alvo | Prazo |
|---------|------|-------|
| Precisão de predição de destino (top 3) | >70% | 3 meses |
| Taxa de aceitação de greeting | >40% | 2 meses |
| Redução de tempo para solicitar ride | -30% | 3 meses |
| Aumento de satisfação (NPS) | +15% | 6 meses |
| Redução de churn de passageiros frequentes | -20% | 6 meses |
| % de usuários usando pagamento sugerido | >60% | 4 meses |

### Princípios de Design

1. **Privacidade primeiro**: Dados de preferências são do passageiro, não compartilhados sem consentimento
2. **Não intrusivo**: Sugestões são opcionais, nunca bloqueantes
3. **Aprendizado contínuo**: O modelo evolui a cada corrida concluída
4. **Transparente**: O passageiro pode ver e editar suas preferências a qualquer momento
5. **Performance**: Sugestões devem ser carregadas em menos de 200ms

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                    Passenger App                         │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Dashboard  │  │   Ride       │  │  Preferences   │   │
│  │ (Home)     │  │   Screen     │  │  Screen        │   │
│  └─────┬──────┘  └──────┬───────┘  └───────┬────────┘   │
│        │                │                  │            │
│  ┌─────▼────────────────▼──────────────────▼────────┐   │
│  │              AI Client SDK                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐    │   │
│  │  │Greeting  │ │Predictor │ │PreferenceCache  │    │   │
│  │  └──────────┘ └──────────┘ └────────────────┘    │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   API Gateway (Express)                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ /ai/*      │  │ /rides/*   │  │ /passengers/*    │   │
│  └─────┬──────┘  └─────┬──────┘  └───────┬──────────┘   │
└────────┼────────────────┼────────────────┼───────────────┘
         │                │                │
         ▼                ▼                ▼
┌──────────────────────────────────────────────────────────┐
│            Microservices Layer                           │
│  ┌────────────────┐  ┌──────────────────────────────┐   │
│  │ Event Collector│  │   Passenger AI Engine         │   │
│  │                │  │  ┌────────────────────────┐  │   │
│  │ Recebe eventos │  │  │ Route Analyzer         │  │   │
│  │ de corridas,   │  │  ├────────────────────────┤  │   │
│  │ pagamentos,    │  │  │ Time Pattern Analyzer  │  │   │
│  │ interações     │  │  ├────────────────────────┤  │   │
│  └───────────────┘  │  │ Driver Preference Engine│  │   │
│                     │  ├────────────────────────┤  │   │
│                     │  │ Payment Pattern Engine  │  │   │
│                     │  ├────────────────────────┤  │   │
│                     │  │ Contextual Greeter     │  │   │
│                     │  ├────────────────────────┤  │   │
│                     │  │ Destination Predictor  │  │   │
│                     │  └────────────────────────┘  │   │
│                     └──────────────────────────────┘   │
│  ┌────────────────┐  ┌──────────────────────────────┐   │
│  │ Dispatch       │  │   Notification Service       │   │
│  │ (AI Scoring)   │  │   (favorite driver online)   │   │
│  └────────────────┘  └──────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │   Supabase (SQL)    │  │      Redis Cache         │  │
│  │                     │  │                          │  │
│  │ passenger_preferences│  │ greeting_cache:{id}     │  │
│  │ passenger_ride_history│ │ suggestions_cache:{id}  │  │
│  │ passenger_events    │  │ driver_online_cache     │  │
│  └─────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. Passageiro conclui uma corrida → Evento `ride.completed` publicado
2. Event Collector recebe e enriquece o evento com dados contextuais (dia da semana, hora, clima)
3. Passenger AI Engine processa o evento:
   - Route Analyzer atualiza `favorite_routes`
   - Time Pattern Analyzer atualiza `frequent_times`
   - Driver Preference Engine atualiza `favorite_drivers`
   - Payment Pattern Engine atualiza `preferred_payment`
4. `passenger_preferences` é atualizada no Supabase
5. Redis cache é invalidado para aquele passageiro
6. Na próxima abertura do app, o AI Client SDK busca as preferências atualizadas

### Considerações de Escalabilidade

| Componente | Estratégia |
|------------|-----------|
| AI Engine | Stateless, escala horizontalmente |
| Redis Cache | Cluster com replicação |
| Supabase | Read replicas para consultas de IA |
| Event Collector | Fila assíncrona (RabbitMQ / Redis Streams) |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão | Propósito |
|--------|-----------|--------|-----------|
| Frontend | React + TypeScript | 18.x | Componentes de UI do Passenger AI |
| Mobile | React Native | 0.73+ | App do passageiro |
| Backend | Node.js + Express | 20.x | API Gateway + AI Engine |
| ORM | Prisma | 5.x | Acesso ao banco de dados |
| Database | PostgreSQL (Supabase) | 15.x | Dados estruturados de preferências |
| Cache | Redis | 7.x | Cache de greetings e sugestões |
| ML (futuro) | Python + scikit-learn | 3.11+ | Modelos preditivos |
| ML (futuro) | ONNX Runtime | 1.16+ | Inferência cross-platform |
| Analytics | PostHog / Mixpanel | — | Eventos de IA |
| Filas | Redis Streams | — | Processamento assíncrono |

---

## Modelo de Dados

### Tabela `passenger_preferences`

Armazena todas as preferências aprendidas e explícitas do passageiro. Cada passageiro tem **exatamente uma** linha nesta tabela, criada na primeira corrida ou no cadastro.

```sql
-- Create the extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for greeting status
CREATE TYPE greeting_status AS ENUM ('morning', 'afternoon', 'evening', 'none');

-- Main passenger preferences table
CREATE TABLE passenger_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL UNIQUE REFERENCES passengers(id) ON DELETE CASCADE,

    -- Favorite Routes
    favorite_routes JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Frequent Times
    frequent_times JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Favorite Drivers
    favorite_drivers UUID[] NOT NULL DEFAULT '{}',

    -- Favorite Categories (e.g., ['comfort', 'economy', 'xl'])
    favorite_categories TEXT[] NOT NULL DEFAULT '{}',

    -- Payment Preferences
    preferred_payment TEXT,
    payment_history JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Language & Region
    preferred_language TEXT NOT NULL DEFAULT 'pt-BR',
    preferred_currency TEXT NOT NULL DEFAULT 'BRL',

    -- Home & Work Addresses
    home_address JSONB,
    work_address JSONB,

    -- Last greeting shown timestamp
    last_greeting_time TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- AI Model Version (for future ML migration tracking)
    ai_model_version INTEGER NOT NULL DEFAULT 1,

    -- Greeting status for current session
    current_greeting_status greeting_status NOT NULL DEFAULT 'none',

    -- Total rides count (denormalized for performance)
    total_rides INTEGER NOT NULL DEFAULT 0,

    -- Average rating given by this passenger
    average_rating_given DECIMAL(3,2) DEFAULT 0.00,

    -- Last ride timestamp
    last_ride_at TIMESTAMPTZ,

    -- Feature flags
    ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    greeting_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    prediction_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for fast lookup by passenger_id
CREATE INDEX idx_passenger_preferences_passenger_id
    ON passenger_preferences(passenger_id);

-- Index for last_ride_at to support data retention queries
CREATE INDEX idx_passenger_preferences_last_ride
    ON passenger_preferences(last_ride_at)
    WHERE last_ride_at IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preferences_timestamp
    BEFORE UPDATE ON passenger_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_preferences_timestamp();
```

#### Detalhamento dos Campos JSONB

##### `favorite_routes`

Array de objetos representando rotas favoritas detectadas:

```json
[
  {
    "origin": {
      "address": "Av. Paulista, 1000, São Paulo - SP",
      "lat": -23.5616,
      "lng": -46.6560
    },
    "destination": {
      "address": "Rua Funchal, 500, São Paulo - SP",
      "lat": -23.5939,
      "lng": -46.6850
    },
    "label": "Trabalho",
    "count": 47,
    "times": [
      {"day_of_week": 1, "hour": 8},
      {"day_of_week": 1, "hour": 18},
      {"day_of_week": 2, "hour": 8},
      {"day_of_week": 2, "hour": 18}
    ],
    "typical_hour_start": 7,
    "typical_hour_end": 9,
    "typical_days": [1, 2, 3, 4, 5],
    "average_fare": 25.50,
    "total_distance_km": 8.3,
    "average_duration_min": 25,
    "last_used_at": "2026-07-10T08:15:00Z",
    "category_preferred": "comfort",
    "score": 0.85
  }
]
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `origin` | `object` | Endereço de origem com coordenadas geográficas |
| `destination` | `object` | Endereço de destino com coordenadas geográficas |
| `label` | `string` | Rótulo inferido ("Trabalho", "Casa", "Academia", etc.) |
| `count` | `integer` | Número de vezes que a rota foi percorrida |
| `times` | `array` | Histórico de dias da semana e horas das viagens |
| `typical_hour_start` | `integer` | Hora inicial típica (0-23) |
| `typical_hour_end` | `integer` | Hora final típica (0-23) |
| `typical_days` | `array` | Dias da semana típicos (0=domingo, 6=sábado) |
| `average_fare` | `number` | Tarifa média da rota |
| `total_distance_km` | `number` | Distância total em km |
| `average_duration_min` | `number` | Duração média em minutos |
| `last_used_at` | `string (ISO 8601)` | Última vez que a rota foi usada |
| `category_preferred` | `string` | Categoria preferida para esta rota (`null` se misto) |
| `score` | `number` | Score calculado pelo algoritmo (0-1) |

##### `frequent_times`

Array de objetos com probabilidades de solicitação por horário:

```json
[
  {
    "day_of_week": 1,
    "hour": 8,
    "probability": 0.85,
    "total_rides": 34,
    "typical_duration_min": 25,
    "common_destinations": [
      {"lat": -23.5939, "lng": -46.6850, "address": "Rua Funchal, 500", "count": 28}
    ]
  },
  {
    "day_of_week": 1,
    "hour": 18,
    "probability": 0.72,
    "total_rides": 22,
    "typical_duration_min": 35,
    "common_destinations": [
      {"lat": -23.5616, "lng": -46.6560, "address": "Av. Paulista, 1000", "count": 18}
    ]
  }
]
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `day_of_week` | `integer` | Dia da semana (0-6) |
| `hour` | `integer` | Hora do dia (0-23) |
| `probability` | `number` | Probabilidade de solicitar ride (0-1) |
| `total_rides` | `integer` | Total de viagens neste horário |
| `typical_duration_min` | `number` | Duração média das viagens neste horário |
| `common_destinations` | `array` | Destinos mais comuns neste horário (top 3) |

##### `payment_history`

Array de objetos com histórico de métodos de pagamento:

```json
[
  {
    "method": "credit_card",
    "count": 85,
    "last_used": "2026-07-10T18:30:00Z",
    "typical_hours": [8, 9, 10],
    "typical_days": [1, 2, 3, 4, 5],
    "score": 0.78
  },
  {
    "method": "pix",
    "count": 42,
    "last_used": "2026-07-12T20:15:00Z",
    "typical_hours": [18, 19, 20, 21, 22],
    "typical_days": [5, 6],
    "score": 0.45
  }
]
```

##### `home_address`

```json
{
  "address": "Rua Augusta, 500, São Paulo - SP, 01304-001",
  "lat": -23.5545,
  "lng": -46.6580,
  "neighborhood": "Consolação",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01304-001",
  "confidence": "high",
  "detected_at": "2026-06-01T10:00:00Z"
}
```

##### `work_address`

```json
{
  "address": "Av. Faria Lima, 3000, São Paulo - SP, 04538-132",
  "lat": -23.5939,
  "lng": -46.6850,
  "neighborhood": "Itaim Bibi",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "04538-132",
  "confidence": "high",
  "detected_at": "2026-05-15T08:30:00Z"
}
```

### Tabela `passenger_ride_history`

Histórico completo de todas as corridas realizadas pelo passageiro. Usada como fonte primária para os algoritmos de aprendizado.

```sql
CREATE TABLE passenger_ride_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,

    -- Route Information
    origin_lat DECIMAL(10,7) NOT NULL,
    origin_lng DECIMAL(10,7) NOT NULL,
    origin_address TEXT NOT NULL,
    destination_lat DECIMAL(10,7) NOT NULL,
    destination_lng DECIMAL(10,7) NOT NULL,
    destination_address TEXT NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL,
    duration_min INTEGER NOT NULL,

    -- Ride Details
    category_id UUID NOT NULL REFERENCES ride_categories(id),
    category_name TEXT NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    driver_name TEXT NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_method_detail TEXT,
    promo_code TEXT,
    tip_amount DECIMAL(8,2) DEFAULT 0.00,

    -- Rating & Feedback
    passenger_rating INTEGER CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    passenger_comment TEXT,
    driver_comment TEXT,

    -- Temporal Context
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    season TEXT,

    -- Weather Context (enriquecido pelo Event Collector)
    weather_condition TEXT,
    weather_temperature DECIMAL(4,1),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ride status at completion
    ride_status TEXT NOT NULL DEFAULT 'completed'
);

-- Indexes for common query patterns
CREATE INDEX idx_ride_history_passenger_id
    ON passenger_ride_history(passenger_id);

CREATE INDEX idx_ride_history_passenger_created
    ON passenger_ride_history(passenger_id, created_at DESC);

CREATE INDEX idx_ride_history_passenger_origin_dest
    ON passenger_ride_history(passenger_id, origin_lat, origin_lng, destination_lat, destination_lng);

CREATE INDEX idx_ride_history_passenger_driver
    ON passenger_ride_history(passenger_id, driver_id);

CREATE INDEX idx_ride_history_passenger_day_hour
    ON passenger_ride_history(passenger_id, day_of_week, hour);

CREATE INDEX idx_ride_history_passenger_payment
    ON passenger_ride_history(passenger_id, payment_method);

-- Composite index for the route detection query
CREATE INDEX idx_ride_history_route_detection
    ON passenger_ride_history(passenger_id, origin_lat, origin_lng, destination_lat, destination_lng, created_at DESC);

-- Partition by month for performance (requires pg_partman or manual partitioning)
-- CREATE TABLE passenger_ride_history_2026_07 PARTITION OF passenger_ride_history
--     FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

### Tabela `passenger_events`

Registro de todos os eventos relacionados ao Passenger AI para auditoria e analytics.

```sql
CREATE TYPE passenger_event_type AS ENUM (
    'ride.completed',
    'favorite_route.detected',
    'frequent_time.updated',
    'destination.predicted',
    'greeting.shown',
    'greeting.accepted',
    'greeting.dismissed',
    'preference.updated',
    'favorite_driver.detected',
    'favorite_driver.online',
    'payment.suggested',
    'payment.accepted',
    'ai_disabled',
    'ai_enabled',
    'model_version_changed',
    'data_retention_cleanup'
);

CREATE TABLE passenger_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    event_type passenger_event_type NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id TEXT,
    app_version TEXT
);

CREATE INDEX idx_passenger_events_passenger_type
    ON passenger_events(passenger_id, event_type, server_timestamp DESC);

CREATE INDEX idx_passenger_events_type_time
    ON passenger_events(event_type, server_timestamp DESC);

-- Auto-archive events older than 90 days (can be queried via partitioned table)
```

### Índices e Performance

| Consulta Comum | Índice Utilizado | Performance Esperada |
|---------------|-----------------|---------------------|
| Buscar preferências por passenger_id | `idx_passenger_preferences_passenger_id` | <5ms |
| Histórico recente de corridas | `idx_ride_history_passenger_created` | <10ms |
| Detectar rotas repetidas | `idx_ride_history_route_detection` | <50ms |
| Agrupar por dia/hora | `idx_ride_history_passenger_day_hour` | <20ms |
| Ver motoristas frequentes | `idx_ride_history_passenger_driver` | <10ms |
| Inserir evento de auditoria | `idx_passenger_events_passenger_type` | <5ms |

---

## Funcionalidades

### 1. Favorite Route Detection

#### Objetivo
Identificar automaticamente rotas que o passageiro percorre com frequência, agrupando por horário, dia da semana, e inferindo rótulos semânticos como "Casa", "Trabalho", "Academia", etc.

#### Algoritmo de Detecção

```
função detectFavoriteRoutes(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 90 dias)

    rotas_agrupadas = agrupar_por(histórico, (origin_lat, origin_lng, destination_lat, destination_lng))

    rotas_favoritas = []

    para cada (chave, viagens) em rotas_agrupadas:
        se count(viagens) >= 3:
            primeiro_destino = viagens[0].destination_address
            horários_manhã = filter(viagens, hora >= 6 AND hora <= 12)
            horários_tarde = filter(viagens, hora >= 12 AND hora <= 18)
            horários_noite = filter(viagens, hora >= 18 OR hora <= 6)

            dias_uteis = filter(viagens, day_of_week IN [1,2,3,4,5])
            fim_semana = filter(viagens, day_of_week IN [0,6])

            label = inferirRótulo(viagens, casa, trabalho)

            rota = {
                origin: {
                    address: viagens[0].origin_address,
                    lat: viagens[0].origin_lat,
                    lng: viagens[0].origin_lng
                },
                destination: {
                    address: primeiro_destino,
                    lat: viagens[0].destination_lat,
                    lng: viagens[0].destination_lng
                },
                label: label,
                count: count(viagens),
                times: extrair_times(viagens),
                typical_hour_start: calcular_hora_típica_inicio(viagens),
                typical_hour_end: calcular_hora_típica_fim(viagens),
                typical_days: dias_mais_comuns(viagens),
                average_fare: avg(viagens, fare),
                total_distance_km: avg(viagens, distance_km),
                average_duration_min: avg(viagens, duration_min),
                last_used_at: max(viagens, created_at),
                category_preferred: moda(viagens, category_name),
                score: calcularScoreRota(count(viagens), recência(viagens))
            }

            rotas_favoritas.push(rota)

    rotas_favoritas = sort(rotas_favoritas, score DESC)
    rotas_favoritas = limit(rotas_favoritas, 10)

    retornar rotas_favoritas
```

#### Inferência de Rótulos

| Padrão | Rótulo Inferido | Confiança |
|--------|----------------|-----------|
| Rota matinal (6h-10h) de casa para outro local em dias úteis | "Trabalho" | Alta se frequente |
| Rota vespertina (17h-19h) do trabalho para casa | "Casa" | Alta |
| Rota repetida em finais de semana | "Lazer" / "Shopping" | Média |
| Rota para endereço conhecido como "casa" | "Casa" | Alta |
| Rota para academia (6h-8h, 18h-20h) | "Academia" | Média (heurística) |
| Rota sem padrão claro | nome do destino | Baixa |

#### Quando Executar

- Após cada corrida concluída (processamento assíncrono)
- Sob demanda quando o passageiro abre o app (se last_processed > 1 hora)
- Batch diário para todos os passageiros ativos

#### Limites

| Parâmetro | Valor |
|-----------|-------|
| Mínimo de viagens para considerar rota favorita | 3 |
| Máximo de rotas favoritas armazenadas | 10 |
| Janela de análise | 90 dias |
| Distância máxima para considerar mesma rota (Haversine) | 200m |
| Score mínimo para exibir na home | 0.3 |

#### Exemplo de Uso

```sql
-- Query para detectar rotas repetidas
SELECT
    ROUND(origin_lat::numeric, 4) || ',' || ROUND(origin_lng::numeric, 4) as origin_key,
    ROUND(destination_lat::numeric, 4) || ',' || ROUND(destination_lng::numeric, 4) as dest_key,
    COUNT(*) as route_count,
    ARRAY_AGG(DISTINCT day_of_week ORDER BY day_of_week) as days,
    MIN(hour) as min_hour,
    MAX(hour) as max_hour,
    MODE() WITHIN GROUP (ORDER BY category_name) as preferred_category,
    AVG(fare) as avg_fare,
    MAX(created_at) as last_used
FROM passenger_ride_history
WHERE passenger_id = $1
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY origin_key, dest_key
HAVING COUNT(*) >= 3
ORDER BY route_count DESC;
```

---

### 2. Frequent Time Detection

#### Objetivo
Identificar padrões temporais de uso do aplicativo, permitindo pré-carregar recursos (mapa, motoristas próximos) e melhorar a predição de destino.

#### Algoritmo

```
função detectFrequentTimes(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 90 dias)
    total_viagens = count(histórico)

    se total_viagens == 0:
        retornar []

    times = []

    para dia = 0 até 6:
        para hora = 0 até 23:
            viagens_no_horario = filter(histórico,
                day_of_week == dia AND hour >= hora AND hour <= hora + 1)

            se count(viagens_no_horario) > 0:
                destinos_comuns = agrupar_por(viagens_no_horario, destination)
                top_destinos = sort(destinos_comuns, count DESC)[:3]

                times.push({
                    day_of_week: dia,
                    hour: hora,
                    probability: count(viagens_no_horario) / total_viagens,
                    total_rides: count(viagens_no_horario),
                    typical_duration_min: avg(viagens_no_horario, duration_min),
                    common_destinations: top_destinos.map(d => ({
                        lat: d.lat,
                        lng: d.lng,
                        address: d.address,
                        count: d.count
                    }))
                })

    times = filter(times, probability >= 0.05) // ignora probabilidades muito baixas
    times = sort(times, probability DESC)
    times = limit(times, 48) // máximo de slots

    retornar times
```

#### Métricas de Probabilidade

| Probabilidade | Classificação | Ação do Sistema |
|--------------|--------------|-----------------|
| >70% | Muito Alta | Pré-carregar mapa e motoristas |
| 50-70% | Alta | Pré-carregar motoristas próximos |
| 25-50% | Média | Atualizar cache de sugestões |
| 10-25% | Baixa | Manter cache existente |
| <10% | Muito Baixa | Nenhuma ação |

#### Exemplo de Matriz de Horários para um Passageiro Típico

```
         Seg  Ter  Qua  Qui  Sex  Sab  Dom
06:00    0.1  0.1  0.1  0.1  0.0  0.0  0.0
07:00    0.4  0.4  0.5  0.4  0.3  0.0  0.0
08:00    0.8  0.8  0.9  0.8  0.7  0.1  0.0
09:00    0.3  0.3  0.2  0.3  0.2  0.2  0.1
12:00    0.2  0.2  0.3  0.2  0.1  0.3  0.2
17:00    0.1  0.2  0.1  0.2  0.1  0.4  0.2
18:00    0.7  0.6  0.7  0.8  0.5  0.6  0.3
19:00    0.3  0.3  0.4  0.4  0.6  0.5  0.3
22:00    0.0  0.0  0.0  0.1  0.4  0.3  0.0
```

---

### 3. Contextual Greeting

#### Objetivo
Saudar o passageiro de forma personalizada e contextual ao abrir o aplicativo, aumentando engajamento e reduzindo o tempo para solicitar uma corrida.

#### Algoritmo de Saudação

```
função gerarGreeting(passengerId):
    prefs = buscar passenger_preferences(passengerId)
    hora_atual = hora_local_do_passageiro
    dia_semana = dia_da_semana_atual
    localizacao_atual = GPS do passageiro

    // Evita repetir saudação se já foi mostrada há menos de 5 min
    se prefs.last_greeting_time > NOW() - 5 minutos:
        retornar null

    // 1. Saudação baseada no período do dia
    saudacao = ""
    se hora_atual >= 5 AND hora_atual < 12:
        saudacao = "Bom dia"
    senão se hora_atual >= 12 AND hora_atual < 18:
        saudacao = "Boa tarde"
    senão:
        saudacao = "Boa noite"

    sugestao = null
    nivel_confianca = 0

    // 2. Contexto: Dia útil e horário de trabalho
    rotas_trabalho = filter(prefs.favorite_routes, label == "Trabalho")
    trabalho_rota = rotas_trabalho[0] se not empty

    se dia_semana IN [1,2,3,4,5] AND trabalho_rota != null:
        se hora_atual >= trabalho_rota.typical_hour_start
           AND hora_atual <= trabalho_rota.typical_hour_end:
            sugestao = {
                message: "${saudacao}! Deseja ir para o trabalho?",
                destination: trabalho_rota.destination,
                confidence: 0.85,
                type: "work"
            }
            nivel_confianca = 0.85

    // 3. Contexto: Horário de almoço
    senão se hora_atual >= 11 AND hora_atual <= 14:
        local_atual_nome = reverse_geocode(localizacao_atual)
        sugestao = {
            message: "${saudacao}! Vai almoçar? Recomendo restaurantes perto de ${local_atual_nome}.",
            confidence: 0.5,
            type: "lunch"
        }
        nivel_confianca = 0.5

    // 4. Contexto: Sexta/Sábado à noite
    senão se (dia_semana == 5 AND hora_atual >= 18)
          OR (dia_semana == 6 AND hora_atual >= 18):
        sugestao = {
            message: "${saudacao}! Vai sair hoje?",
            confidence: 0.6,
            type: "night_out"
        }
        nivel_confianca = 0.6

    // 5. Contexto: Fora da cidade (viagem)
    senão se localizacao_atual está longe de home_address (>50km):
        sugestao = {
            message: "${saudacao}! Viagem? Precisa de um carro maior?",
            confidence: 0.7,
            type: "travel"
        }
        nivel_confianca = 0.7

    // 6. Contexto: Motorista favorito online
    motoristas_online = buscar motoristas_favoritos online(prefs.favorite_drivers)
    se not empty(motoristas_online):
        motorista = motoristas_online[0]
        distancia = calcular_distancia(motorista.location, localizacao_atual)
        sugestao = {
            message: "${saudacao}! ${motorista.name} está a ${distancia} minutos de você!",
            confidence: 0.75,
            type: "favorite_driver",
            driver_id: motorista.id
        }
        nivel_confianca = 0.75

    // 7. Fallback: Sugestão genérica
    senão:
        sugestao = {
            message: "${saudacao}! Para onde hoje?",
            confidence: 0.3,
            type: "generic"
        }
        nivel_confianca = 0.3

    // Atualizar last_greeting_time
    UPDATE passenger_preferences SET
        last_greeting_time = NOW(),
        current_greeting_status = map_periodo(hora_atual)
    WHERE passenger_id = passengerId

    // Disparar evento
    publish_event("passenger.greeting.shown", {
        passenger_id: passengerId,
        message: sugestao.message,
        type: sugestao.type,
        confidence: nivel_confianca
    })

    retornar sugestao
```

#### Matriz de Contextos

| Contexto | Condição | Mensagem | Confiança | Prioridade |
|----------|----------|----------|-----------|------------|
| Trabalho matinal | Dia útil, 6h-10h, rota trabalho existe | "Deseja ir para o trabalho?" | 0.85 | 1 |
| Trabalho vespertino | Dia útil, 17h-19h, rota casa existe | "Deseja ir para casa?" | 0.85 | 1 |
| Almoço | 11h-14h | "Vai almoçar?" | 0.50 | 3 |
| Happy hour | Sex 17h-20h | "Vai sair hoje?" | 0.60 | 4 |
| Final de semana | Sáb/Dom 18h-23h | "Vai sair hoje?" | 0.60 | 4 |
| Viagem | Fora da cidade | "Precisa de um carro maior?" | 0.70 | 2 |
| Motorista favorito | Motorista favorito online | "[Nome] está a X min!" | 0.75 | 2 |
| Feriado | Dia é feriado nacional | "Dia de folga! Para onde?" | 0.40 | 5 |
| Clima ruim | Chuva/neve detectada | "Clima feio! Precisa de carro?" | 0.50 | 5 |
| Genérico | Nenhum contexto especial | "Para onde hoje?" | 0.30 | 6 |

#### Rate Limiting de Greeting

| Regra | Valor |
|-------|-------|
| Mínimo entre greetings | 5 minutos |
| Máximo de greetings por dia | 10 |
| Resetar contagem | Meia-noite (horário local) |
| Greeting noturno (22h-5h) | Apenas mensagem genérica |

---

### 4. Favorite Driver Detection

#### Objetivo
Identificar motoristas que o passageiro prefere, baseado em frequência de viagens e avaliações, e integrar essa preferência no dispatch.

#### Algoritmo

```
função detectFavoriteDrivers(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 60 dias)

    motoristas_agrupados = agrupar_por(histórico, driver_id)

    favoritos = []

    para cada (driverId, viagens) em motoristas_agrupados:
        count = count(viagens)
        rating_medio = avg(viagens, driver_rating)

        // Critério 1: Andou 3+ vezes com rating 5
        // Critério 2: Andou 5+ vezes independente do rating
        // Critério 3: Deu gorjeta em 80%+ das corridas com este motorista
        gorjeta_count = count(filter(viagens, tip_amount > 0))
        taxa_gorjeta = gorjeta_count / count

        é_favorito = false

        se count >= 3 AND rating_medio == 5:
            é_favorito = true
        senão se count >= 5:
            é_favorito = true
        senão se rating_medio >= 4.5 AND taxa_gorjeta >= 0.5:
            é_favorito = true

        se é_favorito:
            score = calcularScoreMotorista(count, rating_medio, taxa_gorjeta)

            favoritos.push({
                driver_id: driverId,
                driver_name: viagens[0].driver_name,
                total_rides: count,
                average_rating: rating_medio,
                tip_rate: taxa_gorjeta,
                last_ride: max(viagens, created_at),
                score: score,
                preferred_categories: moda(viagens, category_name)
            })

    favoritos = sort(favoritos, score DESC)
    favoritos = limit(favoritos, 10)

    // Atualizar passenger_preferences.favorite_drivers
    UPDATE passenger_preferences SET
        favorite_drivers = ARRAY[favoritos.map(d => d.driver_id)]
    WHERE passenger_id = passengerId

    // Disparar evento para cada novo motorista favorito
    para cada favorito em favoritos:
        se favorito.driver_id NOT IN prefs.favorite_drivers_antigos:
            publish_event("passenger.favorite_driver.detected", {
                passenger_id: passengerId,
                driver_id: favorito.driver_id,
                score: favorito.score
            })

    retornar favoritos
```

#### Score de Motorista Favorito

```
score = (normalizar(count, min=3, max=20) * 0.4)
      + ((rating_medio / 5) * 0.35)
      + (taxa_gorjeta * 0.25)
```

| Fator | Peso | Justificativa |
|-------|------|---------------|
| Frequência | 0.4 | Quanto mais andou, mais confortável |
| Rating | 0.35 | Qualidade percebida |
| Gorjeta | 0.25 | Indicador forte de satisfação |

#### Integração com Dispatch

Quando um passageiro com motoristas favoritos solicita uma corrida:

```
função dispatchComPreferencia(passengerId, origem, destino, categoria):
    prefs = buscar passenger_preferences(passengerId)
    motoristas_disponiveis = buscar motoristas_proximos(origem, categoria)

    // Boost de score para motoristas favoritos
    para cada motorista em motoristas_disponiveis:
        se motorista.id IN prefs.favorite_drivers:
            motorista.score = motorista.score * 1.5
            motorista.boost_reason = "favorite_driver"

    // Ordenar por score ajustado
    motoristas_disponiveis = sort(motoristas_disponiveis, score DESC)

    // Selecionar o melhor motorista
    return motoristas_disponiveis[0]
```

#### Notificação de Motorista Favorito Online

```sql
-- Trigger function para notificar quando motorista favorito fica online
CREATE OR REPLACE FUNCTION notify_favorite_driver_online()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar todos os passageiros que têm este motorista como favorito
    INSERT INTO passenger_notifications (passenger_id, type, data, created_at)
    SELECT
        pp.passenger_id,
        'favorite_driver_online',
        jsonb_build_object(
            'driver_id', NEW.driver_id,
            'driver_name', (SELECT name FROM drivers WHERE id = NEW.driver_id),
            'distance_km', 0 -- será calculado pelo cliente
        ),
        NOW()
    FROM passenger_preferences pp
    WHERE NEW.driver_id = ANY(pp.favorite_drivers)
      AND pp.ai_enabled = TRUE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 5. Payment Preference Learning

#### Objetivo
Aprender o método de pagamento preferido do passageiro em diferentes contextos (horário, dia da semana, tipo de rota) e sugerir automaticamente.

#### Algoritmo

```
função detectPaymentPreference(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 90 dias)

    metodos = agrupar_por(histórico, payment_method)

    payments = []

    para cada (metodo, viagens) em metodos:
        horas_tipicas = [
            min(viagens, hour),
            MODE(viagens, hour) - 1,
            MODE(viagens, hour),
            MODE(viagens, hour) + 1,
            max(viagens, hour)
        ]
        dias_tipicos = ARRAY_AGG(DISTINCT viagens.day_of_week)

        score = (count(viagens) / total_viagens) * 0.6
              + (recência(viagens, dias) * 0.2)
              + (1 - taxa_falha(metodo)) * 0.2

        payments.push({
            method: metodo,
            count: count(viagens),
            last_used: max(viagens, created_at),
            typical_hours: horas_tipicas,
            typical_days: dias_tipicos,
            score: score
        })

    payments = sort(payments, score DESC)
    payments = limit(payments, 3)

    // Atualizar preferência principal baseada no contexto atual
    hora_atual = hora_local
    dia_semana = dia_da_semana

    metodo_sugerido = null
    max_score_contextual = 0

    para cada payment em payments:
        se hora_atual IN payment.typical_hours
           AND dia_semana IN payment.typical_days:
            se payment.score > max_score_contextual:
                metodo_sugerido = payment.method
                max_score_contextual = payment.score

    se metodo_sugerido == null:
        metodo_sugerido = payments[0].method // fallback para o mais usado

    UPDATE passenger_preferences SET
        preferred_payment = metodo_sugerido,
        payment_history = payments
    WHERE passenger_id = passengerId

    retornar metodo_sugerido
```

#### Exemplo de Padrões

| Passageiro | Manhã (6h-12h) | Tarde (12h-18h) | Noite (18h-23h) | Fim de Semana |
|-----------|---------------|----------------|----------------|---------------|
| Usuário A | Cartão Crédito | Cartão Crédito | PIX | PIX |
| Usuário B | PIX | PIX | Cartão Débito | Cartão Débito |
| Usuário C | Vale Transporte | Vale Transporte | PIX | Cartão Crédito |
| Usuário D | Apple Pay | Apple Pay | Apple Pay | Apple Pay |

#### Taxa de Falha por Método

A taxa de falha é calculada como proporção de tentativas de pagamento que falharam (saldo insuficiente, cartão recusado, etc.) e influencia negativamente o score do método.

---

### 6. Destination Prediction

#### Objetivo
Prever até 3 destinos mais prováveis que o passageiro deseja ir no momento em que abre o aplicativo, baseado em hora atual, dia da semana, localização atual e histórico.

#### Algoritmo

```
função predictDestinations(passengerId, localizacao_atual):
    prefs = buscar passenger_preferences(passengerId)
    hora_atual = hora_local
    dia_semana = dia_da_semana_atual
    rotas = prefs.favorite_routes

    destinos_scoreados = []

    para cada rota em rotas:
        // Fator 1: Match de hora (0-1)
        se hora_atual >= rota.typical_hour_start
           AND hora_atual <= rota.typical_hour_end:
            match_hora = 1.0
        senão se hora_atual >= rota.typical_hour_start - 2
                AND hora_atual <= rota.typical_hour_end + 2:
            match_hora = 0.5
        senão:
            match_hora = 0.0

        // Fator 2: Match de dia (0-1)
        se rota.typical_days contém dia_semana:
            match_dia = 1.0
        senão:
            // Penalidade parcial se for dia útil e rota for de fds, ou vice-versa
            se (dia_semana IN [1,2,3,4,5] AND algum dia útil em rota.typical_days)
               OR (dia_semana IN [0,6] AND algum fds em rota.typical_days):
                match_dia = 0.3
            senão:
                match_dia = 0.0

        // Fator 3: Match de localização (0-1)
        distancia_origem = haversine(localizacao_atual, rota.origin.lat, rota.origin.lng)
        se distancia_origem <= 0.2: // 200m
            match_local = 1.0
        senão se distancia_origem <= 1.0: // 1km
            match_local = 0.7
        senão se distancia_origem <= 5.0: // 5km
            match_local = 0.3
        senão:
            match_local = 0.0

        // Score final ponderado
        score = (match_hora * 0.35)
              + (match_dia * 0.25)
              + (match_local * 0.25)
              + (rota.score * 0.15)

        destinos_scoreados.push({
            origin: rota.origin,
            destination: rota.destination,
            label: rota.label,
            score: score,
            estimated_fare: rota.average_fare,
            estimated_duration: rota.average_duration_min,
            match_fatores: {
                hora: match_hora,
                dia: match_dia,
                local: match_local,
                frequencia: rota.score
            }
        })

    // Ordenar por score
    destinos_scoreados = sort(destinos_scoreados, score DESC)

    // Top 3 com score mínimo
    destinos_preditos = filter(destinos_scoreados, score >= 0.2)[:3]

    // Se não houver destinos com score suficiente, sugerir rotas mais frequentes
    se empty(destinos_preditos):
        destinos_preditos = sort(rotas, score DESC)[:3]
        para cada destinos_preditos:
            destinos_preditos.confidence = "low"

    // Disparar evento
    publish_event("passenger.destination.predicted", {
        passenger_id: passengerId,
        predictions: destinos_preditos.map(d => ({
            destination: d.destination,
            score: d.score
        })),
        hora: hora_atual,
        dia_semana: dia_semana
    })

    retornar destinos_preditos
```

#### Exemplos de Predição

| Cenário | Hora | Dia | Localização | Top 3 Predições | Score |
|---------|------|-----|-------------|-----------------|-------|
| Indo trabalhar | 08:15 | Seg | Casa | Trabalho (0.92) | 0.92 |
| Voltando do trabalho | 18:30 | Ter | Trabalho | Casa (0.88), Academia (0.45) | 0.88 |
| Almoço | 12:00 | Qua | Trabalho | Casa (0.35), Restaurante X (0.30) | 0.35 |
| Sexta à noite | 19:00 | Sex | Casa | Bar Y (0.55), Casa Amigo (0.40) | 0.55 |
| Final de semana | 10:00 | Sáb | Casa | Shopping (0.50), Parque (0.35) | 0.50 |
| Feriado | 09:00 | Qui | Casa | Aeroporto (0.60), Casa Mãe (0.40) | 0.60 |

#### Precisão Alvo

| Métrica | Alvo Atual | Alvo Futuro (ML) |
|---------|-----------|-------------------|
| Top 1 acerto | >40% | >55% |
| Top 3 acerto | >70% | >85% |
| Tempo de predição | <100ms | <50ms |
| Falso positivo | <15% | <10% |

---

### 7. AI Scoring para Dispatch

#### Objetivo
Priorizar passageiros no dispatch baseado em seu comportamento histórico, garantindo que passageiros frequentes e de alto valor recebam o melhor serviço.

#### Algoritmo de Score do Passageiro

```
função calcularPassengerScore(passengerId):
    prefs = buscar passenger_preferences(passengerId)
    histórico = buscar passenger_ride_history(passengerId, últimos 90 dias)

    // Fator 1: Frequência de uso
    viagens_30dias = count(filter(histórico, created_at >= NOW() - 30 dias))
    score_frequencia = normalizar(viagens_30dias, min=1, max=30)

    // Fator 2: Rating médio dado aos motoristas
    rating_dado = avg(histórico, driver_rating)
    score_rating = (rating_dado / 5) * 0.8 + 0.2
    // Bônus: passageiros que dão rating consistentemente

    // Fator 3: Taxa de gorjeta
    viagens_com_gorjeta = count(filter(histórico, tip_amount > 0))
    taxa_gorjeta = viagens_com_gorjeta / max(count(histórico), 1)
    score_gorjeta = taxa_gorjeta

    // Fator 4: Cancelamento
    viagens_canceladas = count(filter(histórico, ride_status == 'cancelled_by_passenger'))
    taxa_cancelamento = viagens_canceladas / max(count(histórico), 1)
    score_cancelamento = 1 - min(taxa_cancelamento, 0.5) * 2

    // Fator 5: Recência (última corrida)
    ultima_corrida = max(histórico, created_at)
    dias_desde_ultima = days_between(ultima_corrida, NOW())
    score_recencia = 1 / (1 + dias_desde_ultima * 0.1)

    // Score final
    score = (score_frequencia * 0.30)
          + (score_rating * 0.25)
          + (score_gorjeta * 0.20)
          + (score_cancelamento * 0.15)
          + (score_recencia * 0.10)

    retornar min(max(score, 0), 1) // normalizar entre 0 e 1
```

#### Níveis de Passageiro

| Score | Nível | Benefícios no Dispatch |
|-------|-------|----------------------|
| >0.80 | Premium | Motoristas top-rated, dispatch prioritário, sem taxa de cancelamento |
| 0.60-0.80 | Frequente | Motoristas com rating >4.5, dispatch prioritário |
| 0.40-0.60 | Regular | Dispatch normal |
| 0.20-0.40 | Ocasional | Dispatch normal, sem benefícios |
| <0.20 | Novo | Dispatch normal, ofertas de boas-vindas |

#### Integração com Dispatch

```sql
-- Função no banco para calcular score e incluir no dispatch
CREATE OR REPLACE FUNCTION get_passenger_dispatch_score(p_passenger_id UUID)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    v_score DECIMAL(5,4);
    v_rides_30d INTEGER;
    v_avg_rating DECIMAL(3,2);
    v_tip_rate DECIMAL(5,4);
    v_cancel_rate DECIMAL(5,4);
    v_days_since_last INTEGER;
BEGIN
    -- 30-day ride count
    SELECT COUNT(*) INTO v_rides_30d
    FROM passenger_ride_history
    WHERE passenger_id = p_passenger_id
      AND created_at >= NOW() - INTERVAL '30 days';

    -- Average rating given
    SELECT COALESCE(AVG(driver_rating), 0) INTO v_avg_rating
    FROM passenger_ride_history
    WHERE passenger_id = p_passenger_id
      AND driver_rating IS NOT NULL;

    -- Tip rate
    SELECT CASE WHEN COUNT(*) > 0
           THEN COUNT(*) FILTER (WHERE tip_amount > 0)::DECIMAL / COUNT(*)::DECIMAL
           ELSE 0 END INTO v_tip_rate
    FROM passenger_ride_history
    WHERE passenger_id = p_passenger_id;

    -- Cancel rate
    SELECT CASE WHEN COUNT(*) > 0
           THEN COUNT(*) FILTER (WHERE ride_status = 'cancelled_by_passenger')::DECIMAL / COUNT(*)::DECIMAL
           ELSE 0 END INTO v_cancel_rate
    FROM passenger_ride_history
    WHERE passenger_id = p_passenger_id;

    -- Days since last ride
    SELECT COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(created_at)),
        999
    ) INTO v_days_since_last
    FROM passenger_ride_history
    WHERE passenger_id = p_passenger_id;

    -- Calculate score
    v_score := (
        LEAST(v_rides_30d::DECIMAL / 30.0, 1.0) * 0.30 +
        (v_avg_rating / 5.0) * 0.25 +
        v_tip_rate * 0.20 +
        (1.0 - LEAST(v_cancel_rate * 2.0, 1.0)) * 0.15 +
        (1.0 / (1.0 + v_days_since_last * 0.1)) * 0.10
    );

    RETURN LEAST(GREATEST(v_score, 0), 1);
END;
$$ LANGUAGE plpgsql;
```

---

### 8. Category Preference

#### Objetivo
Aprender qual categoria de veículo o passageiro prefere em diferentes contextos (rota, horário, clima).

#### Algoritmo

```
função detectCategoryPreference(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 90 dias)
    categorias = agrupar_por(histórico, category_name)

    preferencias = []

    para cada (cat, viagens) em categorias:
        score = contar_preferencias_por_contexto(viagens)
        preferencias.push({ category: cat, count: count(viagens), score: score })

    preferencias = sort(preferencias, score DESC)

    // Salvar top 3 categorias
    UPDATE passenger_preferences SET
        favorite_categories = ARRAY[preferencias[:3].map(p => p.category)]
    WHERE passenger_id = passengerId

    // Para cada rota favorita, detectar categoria preferida
    para cada rota em prefs.favorite_routes:
        viagens_rota = filter(histórico, mesma_rota(rota))
        categoria_rota = moda(viagens_rota, category_name)
        atualizar_categoria_rota(rota, categoria_rota)

    retornar preferencias
```

#### Contextos por Categoria

| Categoria | Perfil Típico | Horário Típico | Distância Média |
|-----------|--------------|----------------|-----------------|
| Economy | Uso geral | Todos | 5-15 km |
| Comfort | Profissionais, reuniões | 7h-10h, 17h-20h | 10-30 km |
| XL | Família, grupo, aeroporto | Fins de semana | 20-50 km |
| Premium | Executivos | Horário comercial | 15-40 km |
| Pet | Donos de animais | Fins de semana | 5-20 km |
| Moto | Entrega rápida | Horário de pico | 2-10 km |

---

### 9. Language & Currency Preference

#### Objetivo
Detectar e armazenar as preferências de idioma e moeda do passageiro, permitindo que a interface e os preços sejam exibidos no formato correto.

#### Detecção

```
função detectLanguageCurrency(passengerId):
    // 1. Usar idioma do dispositivo como padrão
    // 2. Sobrescrever com preferência explícita (configurações)
    // 3. Detectar baseado em localização frequente

    dispositivo_idioma = get_device_locale()
    dispositivo_moeda = get_device_currency()

    prefs = buscar passenger_preferences(passengerId)

    se prefs.preferred_language == null:
        UPDATE passenger_preferences SET
            preferred_language = dispositivo_idioma
        WHERE passenger_id = passengerId

    se prefs.preferred_currency == null:
        UPDATE passenger_preferences SET
            preferred_currency = mapa_moeda_para_idioma(dispositivo_idioma)
        WHERE passenger_id = passengerId
```

#### Moedas Suportadas

| Código | Moeda | País/Região |
|--------|-------|-------------|
| BRL | Real | Brasil |
| USD | Dólar | EUA |
| EUR | Euro | Europa |
| ARS | Peso | Argentina |
| CLP | Peso | Chile |
| COP | Peso | Colômbia |
| PEN | Sol | Peru |
| MXN | Peso | México |
| PYG | Guarani | Paraguai |
| UYU | Peso | Uruguai |

---

### 10. Anomaly Detection

#### Objetivo
Detectar comportamentos anômalos no padrão de uso do passageiro que podem indicar fraude, conta comprometida ou necessidade de suporte.

#### Algoritmo

```
função detectAnomalias(passengerId):
    histórico = buscar passenger_ride_history(passengerId, últimos 30 dias)
    prefs = buscar passenger_preferences(passengerId)

    anomalias = []

    // Anomalia 1: Mudança abrupta de localização
    locais_recentes = map(histórico, origin_address)
    locais_unicos = distinct(locais_recentes)
    se count(locais_unicos) > 10 AND count(histórico) <= 15:
        anomalias.push({
            type: "location_instability",
            severity: "medium",
            message: "Muitas origens diferentes em poucas corridas"
        })

    // Anomalia 2: Mudança de padrão de pagamento
    pagamentos = agrupar_por(histórico, payment_method)
    se count(pagamentos) > 3 AND count(histórico) <= 10:
        anomalias.push({
            type: "payment_instability",
            severity: "low",
            message: "Muitos métodos de pagamento diferentes"
        })

    // Anomalia 3: Corridas em horários atípicos
    corridas_noturnas = filter(histórico, hour >= 0 AND hour <= 4)
    se count(corridas_noturnas) > count(histórico) * 0.5
       AND prefs.total_rides > 20:
        anomalias.push({
            type: "unusual_hours",
            severity: "medium",
            message: "Padrão de horário noturno incomum"
        })

    // Anomalia 4: Cancelamento em massa
    cancelamentos_recentes = filter(histórico,
        ride_status == 'cancelled_by_passenger'
        AND created_at >= NOW() - 1 hora)
    se count(cancelamentos_recentes) >= 3:
        anomalias.push({
            type: "mass_cancellation",
            severity: "high",
            message: "Múltiplos cancelamentos em curto período"
        })

    // Anomalia 5: Distância muito acima do normal
    distancias = map(histórico, distance_km)
    media_distancia = avg(distancias)
    desvio = stddev(distancias)
    distancia_atual = última_corrida.distance_km
    se distancia_atual > media_distancia + 3 * desvio:
        anomalias.push({
            type: "unusual_distance",
            severity: "low",
            message: "Distância muito acima do normal"
        })

    // Registrar anomalias
    para cada anomalia em anomalias:
        INSERT INTO passenger_anomalies (passenger_id, type, severity, data)
        VALUES (passengerId, anomalia.type, anomalia.severity, jsonb(anomalia))

    retornar anomalias
```

---

## Algoritmo de Aprendizado (Heurístico)

### Score de Rota Favorita

```
seja:
  n = total de viagens na rota
  N = total de viagens do passageiro
  d = dias desde a última viagem na rota
  w_recencia = 0.3
  w_frequencia = 0.7

se N == 0:
    score = 0

senão:
    frequencia_relativa = n / max(N, 1)
    score_frequencia = min(frequencia_relativa * 5, 1.0)

    // Recência: quanto mais recente, maior o score
    score_recencia = 1 / (1 + d * 0.05)

    // Bônus por consistência de horário
    variedade_horario = desvio_padrão(horários_das_viagens_na_rota)
    consistencia = 1 - min(variedade_horario / 6, 1) // 6h de desvio = 0
    bonus_consistencia = consistencia * 0.1

    score = (score_frequencia * w_frequencia)
          + (score_recencia * w_recencia)
          + bonus_consistencia

    score = min(max(score, 0), 1)
```

### Score de Horário Frequente

```
seja:
  h = hora (0-23)
  d = dia da semana (0-6)
  n_hd = número de viagens neste (hora, dia)
  N = total de viagens do passageiro

probabilidade_cruda = n_hd / max(N, 1)

// Suavização de Laplace para evitar overfitting em dados esparsos
probabilidade_suavizada = (n_hd + 1) / (N + 24 * 7)

// Bônus por consistência (mesmo horário, mesmo destino)
viagens_mesmo_destino = count(viagens em (h,d) com mesmo destino)
consistencia_destino = viagens_mesmo_destino / max(n_hd, 1)

score = probabilidade_suavizada * 0.7 + consistencia_destino * 0.3
```

### Predição de Destino

```
seja:
  rota = {origin, destination, typical_hour_start, typical_hour_end, typical_days, score}
  hora_atual, dia_semana, localizacao_atual

função predictDestino(rota, hora_atual, dia_semana, localizacao_atual):

    // Match de hora (peso 0.35)
    se hora_atual entre [typical_hour_start, typical_hour_end]:
        match_hora = 1.0
    senão se hora_atual entre [typical_hour_start - 2, typical_hour_end + 2]:
        match_hora = 0.5
    senão:
        match_hora = 0.0

    // Match de dia (peso 0.25)
    se dia_semana in typical_days:
        match_dia = 1.0
    senão:
        match_dia = 0.0

    // Match de localização (peso 0.25)
    dist = haversine(localizacao_atual, origin)
    match_local = max(0, 1 - dist / 5) // 0-5km

    // Frequência histórica (peso 0.15)
    match_frequencia = rota.score

    score = match_hora * 0.35
          + match_dia * 0.25
          + match_local * 0.25
          + match_frequencia * 0.15

    retornar score

// Implementação Haversine (para match de localização)
função haversine(lat1, lng1, lat2, lng2):
    R = 6371 // km
    dLat = toRad(lat2 - lat1)
    dLng = toRad(lng2 - lng1)
    a = sin(dLat/2)^2
      + cos(toRad(lat1)) * cos(toRad(lat2)) * sin(dLng/2)^2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    retornar R * c
```

### Score de Motorista Favorito

```
seja:
  n = número de corridas com o motorista
  r = rating médio dado ao motorista pelo passageiro (1-5)
  t = taxa de gorjeta (0-1)
  d = dias desde a última corrida com o motorista

normalizar_n = min(n / 20, 1) // cap em 20 corridas
normalizar_r = r / 5
normalizar_t = t
normalizar_d = max(0, 1 - d / 60) // 60 dias = decay total

score = normalizar_n * 0.40
      + normalizar_r * 0.35
      + normalizar_t * 0.25

// Penalidade por recência
score = score * normalizar_d
```

### Score de Forma de Pagamento

```
seja:
  m = método de pagamento
  n_m = total de usos do método m
  N = total de pagamentos
  d = dias desde último uso do método
  f = taxa de falha do método (0-1)
  h_m = horas típicas de uso do método
  h_atual = hora atual

frequencia = n_m / max(N, 1)
recencia = 1 / (1 + d * 0.05)
confiabilidade = 1 - f

// Match contextual (o método é usado neste horário?)
contextual = 1 se h_atual in h_m else 0.5

score = frequencia * 0.35
      + recencia * 0.15
      + confiabilidade * 0.25
      + contextual * 0.25
```

### Algoritmo de Greeting Contextual

```
função decidirGreeting(passengerId, hora_atual, dia_semana, localizacao_atual):
    prefs = buscar passenger_preferences(passengerId)

    // Regras de negócio em ordem de prioridade
    regras = [
        {
            condicao: motorista_favorito_online(prefs.favorite_drivers),
            mensagem: gerarMensagemMotoristaOnline(),
            tipo: "favorite_driver",
            confianca: 0.75
        },
        {
            condicao: em_viagem(localizacao_atual, prefs.home_address),
            mensagem: "${saudacao}! Viagem? Precisa de carro maior?",
            tipo: "travel",
            confianca: 0.70
        },
        {
            condicao: horario_trabalho(dia_semana, hora_atual, prefs.work_address),
            mensagem: "${saudacao}! Deseja ir para o trabalho?",
            destino: prefs.work_address,
            tipo: "work",
            confianca: 0.85
        },
        {
            condicao: horario_volta_casa(dia_semana, hora_atual, prefs.work_address, prefs.home_address),
            mensagem: "${saudacao}! Vai para casa?",
            destino: prefs.home_address,
            tipo: "home",
            confianca: 0.85
        },
        {
            condicao: horario_almoco(hora_atual),
            mensagem: "${saudacao}! Vai almoçar?",
            tipo: "lunch",
            confianca: 0.50
        },
        {
            condicao: final_de_semana_noite(dia_semana, hora_atual),
            mensagem: "${saudacao}! Vai sair hoje?",
            tipo: "night_out",
            confianca: 0.60
        },
        {
            condicao: feriado(dia_semana),
            mensagem: "${saudacao}! Dia de folga! Para onde?",
            tipo: "holiday",
            confianca: 0.40
        },
        {
            condicao: clima_ruim(localizacao_atual),
            mensagem: "${saudacao}! Clima feio, quer uma carona?",
            tipo: "bad_weather",
            confianca: 0.50
        },
        {
            condicao: true, // fallback
            mensagem: "${saudacao}! Para onde hoje?",
            tipo: "generic",
            confianca: 0.30
        }
    ]

    para cada regra em regras:
        se regra.condicao:
            regra.mensagem = interpolate(regra.mensagem, {
                saudacao: getSaudacaoPorPeriodo(hora_atual),
                nome_motorista: motorista_online?.name,
                distancia: motorista_online?.distance_min
            })
            retornar regra

    retornar regras.last // fallback genérico
```

---

## Componentes React

### PassengerGreeting

Componente principal que exibe a saudação contextual e sugestões de destino.

```tsx
// src/components/ai/PassengerGreeting.tsx

interface GreetingData {
  message: string;
  type: 'work' | 'home' | 'lunch' | 'night_out' | 'travel'
        | 'favorite_driver' | 'bad_weather' | 'holiday' | 'generic';
  confidence: number;
  destination?: {
    lat: number;
    lng: number;
    address: string;
  };
  driver?: {
    id: string;
    name: string;
    distance_min: number;
  };
}

interface PassengerGreetingProps {
  passengerId: string;
  onSelectDestination: (location: { lat: number; lng: number; address: string }) => void;
  onDismiss?: () => void;
  onAccept?: (greetingType: string) => void;
}

type GreetingState = 'loading' | 'ready' | 'empty' | 'error';

const statusMessages: Record<string, string> = {
  loading: 'Carregando...',
  empty: 'Olá! Para onde hoje?',
  error: 'Não foi possível carregar sugestões. Tente novamente.',
};

const greetingIcons: Record<string, string> = {
  work: 'Briefcase',
  home: 'Home',
  lunch: 'Coffee',
  night_out: 'Music',
  travel: 'Plane',
  favorite_driver: 'Heart',
  bad_weather: 'Cloud',
  holiday: 'Sun',
  generic: 'Wave',
};
```

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `passengerId` | `string` | UUID do passageiro |
| `onSelectDestination` | `function` | Callback ao selecionar um destino |
| `onDismiss` | `function` | Callback ao dispensar o greeting |
| `onAccept` | `function` | Callback ao aceitar a sugestão |

#### Estados

| Estado | Condição | Renderização |
|--------|----------|-------------|
| `loading` | Buscando dados do servidor | Skeleton loader com animação |
| `ready` | Dados carregados com sucesso | Card de saudação + sugestões |
| `empty` | Primeira vez do passageiro | "Olá! Para onde hoje?" + input |
| `error` | Falha na requisição | Mensagem de erro + botão retry |

#### Animações

```css
/* Animações sequenciais usando CSS keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.greeting-card {
  animation: fadeInUp 0.4s ease-out;
}

.suggestion-item:nth-child(1) { animation-delay: 0.1s; }
.suggestion-item:nth-child(2) { animation-delay: 0.2s; }
.suggestion-item:nth-child(3) { animation-delay: 0.3s; }
```

#### Exemplo de Uso

```tsx
<PassengerGreeting
  passengerId="550e8400-e29b-41d4-a716-446655440000"
  onSelectDestination={(dest) => {
    analytics.track('greeting_destination_selected', { destination: dest });
    navigation.navigate('RideScreen', { destination: dest });
  }}
  onDismiss={() => analytics.track('greeting_dismissed')}
  onAccept={(type) => analytics.track('greeting_accepted', { type })}
/>
```

### FavoriteRouteCard

Card individual para exibir uma rota favorita.

```tsx
// src/components/ai/FavoriteRouteCard.tsx

interface FavoriteRoute {
  origin: GeoAddress;
  destination: GeoAddress;
  label: string;
  count: number;
  typical_hour_start: number;
  typical_hour_end: number;
  average_fare: number;
  average_duration_min: number;
  score: number;
}

interface FavoriteRouteCardProps {
  route: FavoriteRoute;
  onSelect: (route: FavoriteRoute) => void;
  onEdit?: (route: FavoriteRoute) => void;
  onRemove?: (route: FavoriteRoute) => void;
  isExpanded?: boolean;
}
```

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `route` | `FavoriteRoute` | Dados da rota favorita |
| `onSelect` | `function` | Callback ao selecionar a rota |
| `onEdit` | `function` | Callback ao editar o rótulo |
| `onRemove` | `function` | Callback ao remover a rota |
| `isExpanded` | `boolean` | Estado expandido do card |

#### Layout do Card

```
┌─────────────────────────────────────────────────┐
│  🔄 Rota Favorita                   ⋮ (menu)    │
│                                                  │
│  📍 Av. Paulista, 1000                           │
│     ↓  ⏱ 25 min  •  R$ 25,50                    │
│  📍 Rua Funchal, 500                             │
│                                                  │
│  🏷️  Trabalho                        ⭐ 0.85    │
│  🕐  Típico: 07:00 - 09:00                      │
│  📊  47 viagens                                  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │        🚗 Solicitar corrida                  ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### DestinationSuggestions

Lista de destinos sugeridos baseados em IA.

```tsx
// src/components/ai/DestinationSuggestions.tsx

interface SuggestedDestination {
  destination: GeoAddress;
  label: string;
  score: number;
  estimated_fare: number;
  estimated_duration: number;
  match_factors: {
    hora: number;
    dia: number;
    local: number;
    frequencia: number;
  };
}

interface DestinationSuggestionsProps {
  suggestions: SuggestedDestination[];
  isLoading: boolean;
  onSelect: (destination: SuggestedDestination) => void;
  maxSuggestions?: number;
  showConfidence?: boolean;
}
```

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `suggestions` | `SuggestedDestination[]` | `[]` | Lista de destinos sugeridos |
| `isLoading` | `boolean` | `false` | Estado de carregamento |
| `onSelect` | `function` | — | Callback ao selecionar destino |
| `maxSuggestions` | `number` | `3` | Máximo de sugestões a exibir |
| `showConfidence` | `boolean` | `true` | Exibir badge de confiança |

#### Layout de Sugestão

```
┌──────────────────────────────────────────────┐
│  ✨ Sugestões Inteligentes                    │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 🏢 Trabalho              92% match     │  │
│  │ Rua Funchal, 500                       │  │
│  │ R$ 25,50  •  25 min                    │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 🏠 Casa                 45% match      │  │
│  │ Rua Augusta, 500                       │  │
│  │ R$ 32,00  •  35 min                    │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ 🏪 Shopping Ibirapuera   30% match     │  │
│  │ Av. Ibirapuera, 3100                   │  │
│  │ R$ 18,00  •  15 min                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### FrequentTimesWidget

Widget que exibe os horários mais frequentes do passageiro.

```tsx
// src/components/ai/FrequentTimesWidget.tsx

interface FrequentTime {
  day_of_week: number;
  hour: number;
  probability: number;
  total_rides: number;
}

interface FrequentTimesWidgetProps {
  times: FrequentTime[];
  isLoading: boolean;
  onTimeSelect?: (time: FrequentTime) => void;
  compact?: boolean;
}
```

### FavoriteDriverBadge

Badge que indica se um motorista favorito está online.

```tsx
// src/components/ai/FavoriteDriverBadge.tsx

interface FavoriteDriverBadgeProps {
  driverName: string;
  distanceMinutes: number;
  driverAvatar?: string;
  driverRating?: number;
  onRequestRide?: () => void;
}
```

### PaymentSuggestion

Componente que sugere a forma de pagamento preferida.

```tsx
// src/components/ai/PaymentSuggestion.tsx

interface PaymentMethodInfo {
  method: string;
  lastDigits?: string;
  brand?: string;
  isDefault: boolean;
}

interface PaymentSuggestionProps {
  suggestedMethod: PaymentMethodInfo;
  alternativeMethods?: PaymentMethodInfo[];
  onAccept: (method: string) => void;
  onChange: (method: string) => void;
}
```

### PassengerDashboard

Componente principal que integra todos os componentes de IA na tela inicial.

```tsx
// src/components/ai/PassengerDashboard.tsx

interface PassengerDashboardProps {
  passengerId: string;
}

interface DashboardState {
  preferences: PassengerPreferences | null;
  greeting: GreetingData | null;
  destinations: SuggestedDestination[];
  frequentTimes: FrequentTime[];
  favoriteDrivers: FavoriteDriver[];
  suggestedPayment: PaymentMethodInfo;
  isLoading: boolean;
  error: string | null;
}

const DashboardLoadingState: React.FC = () => (
  <View>
    <Skeleton variant="card" width="100%" height={80} />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="card" width="100%" height={120} />
  </View>
);

const DashboardErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <View>
    <Text>Não foi possível carregar sugestões</Text>
    <Button title="Tentar novamente" onPress={onRetry} />
  </View>
);
```

#### Fluxo de Dados do Dashboard

1. Componente monta → dispara `loadDashboardData`
2. `loadDashboardData` chama API em paralelo:
   - `GET /ai/greeting?passengerId={id}`
   - `GET /ai/destination-suggestions?passengerId={id}&lat={lat}&lng={lng}`
   - `GET /passenger/preferences/{id}`
3. Enquanto carrega: exibe skeleton loading
4. Se erro: exibe estado de erro com retry
5. Se sucesso:
   - Exibe `PassengerGreeting` no topo
   - Exibe `DestinationSuggestions` abaixo
   - Se probabilidade > 50%: pré-carrega mapa e motoristas
   - Exibe `PaymentSuggestion` no checkout
   - Se motorista favorito online: exibe `FavoriteDriverBadge`

---

## Integração com Home

### Fluxo de Abertura do App

```
1. App Aberto
   │
   ├─ Carregar passenger_preferences (cache ou API)
   │
   ├─ AI Engine local:
   │   ├─ Calcular greeting contextual
   │   ├─ Predizer destinos
   │   ├─ Verificar motoristas favoritos online
   │   └─ Decidir método de pagamento
   │
   ├─ Atualizar UI:
   │   ├─ PassengerGreeting (topo)
   │   ├─ DestinationSuggestions (meio)
   │   └─ PaymentSuggestion (bottom sheet)
   │
   └─ Background:
       ├─ Pré-carregar mapa se probabilidade > 50%
       ├─ Cache de motoristas próximos
       └─ Analytics de abertura
```

### Pré-carregamento Condicional

```tsx
// Lógica de pré-carregamento no hook useAIPreload
function useAIPreload(passengerId: string, currentLocation: GeoLocation) {
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    async function checkPreload() {
      const prefs = await getPassengerPreferences(passengerId);
      const hour = new Date().getHours();
      const day = new Date().getDay();

      // Verificar se a probabilidade atual > 50%
      const currentSlot = prefs.frequent_times.find(
        (t) => t.day_of_week === day && t.hour === hour
      );

      if (currentSlot && currentSlot.probability > 0.5) {
        setShouldPreload(true);
        // Disparar pré-carregamento de mapa e motoristas
        preloadNearbyDrivers(currentLocation);
      }
    }

    checkPreload();
  }, [passengerId, currentLocation]);

  return { shouldPreload };
}
```

### Cache Estratégico

| Dado | Cache Duration | Estratégia de Invalidação |
|------|---------------|--------------------------|
| Greeting | 5 min | TTL expira |
| Sugestões de destino | 2 min | TTL expira |
| Preferências do passageiro | 5 min | Invalidação via webhook |
| Motoristas favoritos online | 30s | Polling |
| Preferência de pagamento | 10 min | TTL expira |
| Histórico recente | 1 min | TTL expira |

---

## Eventos e Analytics

### Tabela de Eventos

| Evento | Gatilho | Payload | Consumidor |
|--------|---------|---------|------------|
| `passenger.favorite_route.detected` | Nova rota favorita ≥3 viagens | `{passenger_id, route, score}` | Analytics, Notification |
| `passenger.frequent_time.updated` | Recalculo de horários | `{passenger_id, times[]}` | Analytics |
| `passenger.destination.predicted` | Predição calculada | `{passenger_id, predictions[], confidence}` | Analytics, Dashboard |
| `passenger.greeting.shown` | Greeting exibido | `{passenger_id, type, confidence}` | Analytics, A/B testing |
| `passenger.greeting.accepted` | Passageiro aceitou sugestão | `{passenger_id, type, destination}` | Analytics, Feedback Loop |
| `passenger.greeting.dismissed` | Passageiro dispensou | `{passenger_id, type}` | Analytics |
| `passenger.preference.updated` | Preferência alterada | `{passenger_id, field, old_value, new_value}` | Audit log |
| `passenger.favorite_driver.detected` | Novo motorista favorito | `{passenger_id, driver_id, score}` | Analytics |
| `passenger.favorite_driver.online` | Motorista favorito ficou online | `{passenger_id, driver_id, distance}` | Notification Service |
| `passenger.payment.suggested` | Pagamento sugerido | `{passenger_id, method}` | Analytics |
| `passenger.payment.accepted` | Pagamento aceito | `{passenger_id, method}` | Analytics, Feedback |
| `passenger.model_version.changed` | Versão do modelo alterada | `{passenger_id, old_version, new_version}` | ML infra |

### Eventos de Analytics no Cliente

```typescript
// src/lib/analytics/aiEvents.ts

interface AIAnalytics {
  trackGreetingShown: (data: {
    passengerId: string;
    greetingType: string;
    confidence: number;
    ackVersion: string;
  }) => void;

  trackGreetingResponse: (data: {
    passengerId: string;
    greetingType: string;
    accepted: boolean;
    responseTimeMs: number;
  }) => void;

  trackDestinationSelected: (data: {
    passengerId: string;
    destination: GeoAddress;
    suggestionScore: number;
    positionInList: number;
    isAiSuggestion: boolean;
  }) => void;

  trackPaymentSuggestion: (data: {
    passengerId: string;
    suggestedMethod: string;
    accepted: boolean;
  }) => void;

  trackPreloadTriggered: (data: {
    passengerId: string;
    probability: number;
    slot: { day: number; hour: number };
  }) => void;
}
```

### Métricas de Sucesso (KPIs)

| Métrica | Definição | Fórmula | Target |
|---------|-----------|---------|--------|
| Greeting Acceptance Rate | % de greetings aceitos | `accepted / shown * 100` | >40% |
| Destination Prediction Accuracy (Top 3) | % de predições corretas no top 3 | `correct_top3 / total_predictions * 100` | >70% |
| Time to Request | Tempo entre abrir app e solicitar ride | `ride_requested_at - app_opened_at` | <15s (redução de 30%) |
| Payment Suggestion Acceptance | % de pagamentos sugeridos aceitos | `accepted / suggested * 100` | >60% |
| Passenger Satisfaction (NPS) | NPS dos passageiros | pesquisa | >60 |
| Feature Adoption Rate | % de usuários usando AI features | `users_interacted / total_users * 100` | >50% |

---

## Limpeza de Dados (Data Retention)

### Políticas de Retenção

| Dado | Período de Retenção | Ação | Frequência |
|------|--------------------|------|-----------|
| Rotas favoritas sem uso | 90 dias | Arquivar (soft delete) | Diário |
| Motoristas favoritos sem interação | 60 dias | Remover da lista | Diário |
| Histórico de pagamentos | 180 dias | Manter apenas top 3 métodos | Semanal |
| Eventos de auditoria | 90 dias | Arquivar para cold storage | Diário |
| Ride history (completo) | 365 dias | Arquivar para data lake | Mensal |
| Greeting cache | 24 horas | TTL do Redis | Automático |
| Sessão de analytics | 30 dias | Agregar e deletar | Diário |

### Implementação

```sql
-- Stored procedure para limpeza de dados
CREATE OR REPLACE FUNCTION cleanup_passenger_data()
RETURNS INTEGER AS $$
DECLARE
    v_cleaned INTEGER := 0;
BEGIN
    -- 1. Arquivar rotas favoritas sem uso há 90+ dias
    UPDATE passenger_preferences
    SET favorite_routes = (
        SELECT jsonb_agg(route)
        FROM jsonb_array_elements(favorite_routes) AS route
        WHERE (route->>'last_used_at')::TIMESTAMPTZ >= NOW() - INTERVAL '90 days'
           OR (route->>'last_used_at') IS NULL
    )
    WHERE favorite_routes != '[]'::jsonb;

    GET DIAGNOSTICS v_cleaned = ROW_COUNT;

    -- 2. Remover motoristas favoritos sem interação há 60+ dias
    UPDATE passenger_preferences
    SET favorite_drivers = ARRAY(
        SELECT unnest(favorite_drivers)
        WHERE unnest IN (
            SELECT driver_id
            FROM passenger_ride_history
            WHERE passenger_id = passenger_preferences.passenger_id
              AND created_at >= NOW() - INTERVAL '60 days'
        )
    );

    -- 3. Manter apenas top 3 métodos de pagamento
    UPDATE passenger_preferences
    SET payment_history = (
        SELECT jsonb_agg(payment ORDER BY (payment->>'score')::DECIMAL DESC)
        FROM (
            SELECT payment
            FROM jsonb_array_elements(payment_history) AS payment
            ORDER BY (payment->>'score')::DECIMAL DESC
            LIMIT 3
        ) sub
    )
    WHERE payment_history != '[]'::jsonb;

    -- 4. Arquitetar eventos antigos
    INSERT INTO passenger_events_archive
    SELECT * FROM passenger_events
    WHERE server_timestamp < NOW() - INTERVAL '90 days';

    DELETE FROM passenger_events
    WHERE server_timestamp < NOW() - INTERVAL '90 days';

    RETURN v_cleaned;
END;
$$ LANGUAGE plpgsql;

-- Schedule: every day at 03:00 AM
-- SELECT cron.schedule('cleanup-passenger-data', '0 3 * * *', 'SELECT cleanup_passenger_data();');
```

### Anonimização

Para usuários que solicitam exclusão de dados (LGPD/GDPR):

```sql
CREATE OR REPLACE FUNCTION anonymize_passenger_data(p_passenger_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonimizar preferências
    UPDATE passenger_preferences
    SET
        favorite_routes = '[]'::jsonb,
        frequent_times = '[]'::jsonb,
        favorite_drivers = '{}',
        favorite_categories = '{}',
        preferred_payment = NULL,
        payment_history = '[]'::jsonb,
        home_address = NULL,
        work_address = NULL,
        ai_enabled = FALSE,
        greeting_enabled = FALSE,
        prediction_enabled = FALSE,
        updated_at = NOW()
    WHERE passenger_id = p_passenger_id;

    -- Anonimizar histórico de corridas (manter dados agregados)
    UPDATE passenger_ride_history
    SET
        origin_address = 'REDACTED',
        destination_address = 'REDACTED',
        passenger_comment = NULL,
        driver_comment = NULL
    WHERE passenger_id = p_passenger_id;

    -- Remover eventos
    DELETE FROM passenger_events
    WHERE passenger_id = p_passenger_id;

    -- Remover anomalias
    DELETE FROM passenger_anomalies
    WHERE passenger_id = p_passenger_id;
END;
$$ LANGUAGE plpgsql;
```

---

## APIs e Endpoints

### POST /ai/refresh-preferences

Força o recálculo de todas as preferências do passageiro.

```
POST /api/v1/ai/refresh-preferences
Content-Type: application/json

Request:
{
  "passenger_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response 200:
{
  "success": true,
  "data": {
    "favorite_routes_count": 3,
    "frequent_times_count": 15,
    "favorite_drivers_count": 2,
    "preferred_payment": "credit_card",
    "processing_time_ms": 180
  }
}

Response 400:
{
  "error": "invalid_passenger_id",
  "message": "O ID do passageiro é inválido ou não existe."
}

Response 429:
{
  "error": "rate_limited",
  "message": "Refresh só pode ser chamado a cada 5 minutos.",
  "retry_after_seconds": 240
}
```

### GET /ai/greeting

Retorna a saudação contextual para o passageiro.

```
GET /api/v1/ai/greeting?passenger_id={uuid}&lat={lat}&lng={lng}

Response 200:
{
  "message": "Bom dia! Deseja ir para o trabalho?",
  "type": "work",
  "confidence": 0.85,
  "destination": {
    "address": "Rua Funchal, 500, São Paulo - SP",
    "lat": -23.5939,
    "lng": -46.6850
  },
  "cached": true,
  "cache_age_seconds": 120,
  "context": {
    "hour": 8,
    "day_of_week": 2,
    "period": "morning",
    "location_match": true,
    "favorite_driver_online": false
  }
}

Response 200 (empty - first time):
{
  "message": "Olá! Para onde hoje?",
  "type": "generic",
  "confidence": 0.3,
  "destination": null,
  "cached": false,
  "context": {
    "total_rides": 0,
    "is_new_passenger": true
  }
}

Response 200 (greeting suppressed):
{
  "message": null,
  "type": "suppressed",
  "confidence": 0,
  "reason": "recent_greeting_shown",
  "retry_after_seconds": 180
}
```

### GET /ai/destination-suggestions

Retorna destinos preditos para o passageiro.

```
GET /api/v1/ai/destination-suggestions
  ?passenger_id={uuid}
  &lat={lat}
  &lng={lng}
  &limit=3

Response 200:
{
  "suggestions": [
    {
      "destination": {
        "address": "Rua Funchal, 500, São Paulo - SP",
        "lat": -23.5939,
        "lng": -46.6850
      },
      "label": "Trabalho",
      "score": 0.92,
      "estimated_fare": 25.50,
      "estimated_duration_min": 25,
      "match_factors": {
        "hora": 1.0,
        "dia": 1.0,
        "local": 1.0,
        "frequencia": 0.85
      }
    },
    {
      "destination": {
        "address": "Av. Paulista, 1000, São Paulo - SP",
        "lat": -23.5616,
        "lng": -46.6560
      },
      "label": "Casa",
      "score": 0.45,
      "estimated_fare": 18.00,
      "estimated_duration_min": 20,
      "match_factors": {
        "hora": 0.0,
        "dia": 1.0,
        "local": 0.3,
        "frequencia": 0.75
      }
    }
  ],
  "total_suggestions": 2,
  "processing_time_ms": 45,
  "model_version": 1
}

Response 200 (no suggestions):
{
  "suggestions": [],
  "total_suggestions": 0,
  "message": "Ainda não há dados suficientes para sugestões.",
  "required_rides": 3,
  "current_rides": 1
}
```

### GET /ai/frequent-drivers

Retorna motoristas favoritos do passageiro que estão online.

```
GET /api/v1/ai/frequent-drivers?passenger_id={uuid}

Response 200:
{
  "online": [
    {
      "driver_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Carlos Silva",
      "rating": 4.9,
      "distance_km": 1.2,
      "estimated_arrival_min": 3,
      "car_model": "Toyota Corolla 2024",
      "car_color": "Prata",
      "license_plate": "ABC-1234",
      "category": "comfort",
      "total_rides_with_passenger": 12
    }
  ],
  "offline": [
    {
      "driver_id": "660e8400-e29b-41d4-a716-446655440002",
      "name": "Maria Santos",
      "rating": 5.0,
      "total_rides_with_passenger": 8,
      "last_seen_online": "2026-07-12T18:30:00Z"
    }
  ],
  "total_favorites": 3,
  "online_count": 1
}
```

### POST /ai/ride-completed

Endpoint chamado após cada corrida concluída para alimentar o modelo.

```
POST /api/v1/ai/ride-completed
Content-Type: application/json

Request:
{
  "passenger_id": "550e8400-e29b-41d4-a716-446655440000",
  "ride_id": "770e8400-e29b-41d4-a716-446655440003",
  "origin": {
    "lat": -23.5616,
    "lng": -46.6560,
    "address": "Av. Paulista, 1000"
  },
  "destination": {
    "lat": -23.5939,
    "lng": -46.6850,
    "address": "Rua Funchal, 500"
  },
  "driver_id": "660e8400-e29b-41d4-a716-446655440001",
  "category": "comfort",
  "fare": 25.50,
  "payment_method": "credit_card",
  "driver_rating": 5,
  "tip_amount": 5.00,
  "distance_km": 8.3,
  "duration_min": 25
}

Response 202:
{
  "accepted": true,
  "processing": "async",
  "estimated_completion_ms": 150
}
```

### POST /ai/feedback

Endpoint para feedback explícito do passageiro sobre sugestões da IA.

```
POST /api/v1/ai/feedback
Content-Type: application/json

Request:
{
  "passenger_id": "550e8400-e29b-41d4-a716-446655440000",
  "feedback_type": "greeting" | "destination" | "payment",
  "suggestion_id": "suggest_001",
  "relevant": true | false,
  "correct_destination": {
    "lat": -23.5000,
    "lng": -46.6000,
    "address": "Destino Correto"
  },
  "reason": "wrong_destination" | "not_relevant" | "perfect" | "other",
  "comment": "Na verdade eu ia para outro lugar"
}

Response 200:
{
  "success": true,
  "feedback_recorded": true,
  "model_adjusted": true,
  "new_confidence_weight": 0.95
}
```

---

## ML Futuro

### Modelo de Predição de Destino com ML

Quando o volume de dados atingir 10.000+ viagens por passageiro (ou 1M+ no total), migrar para modelo supervisionado.

#### Arquitetura do Modelo

```
Features:
├─ Categóricas:
│   ├─ day_of_week (one-hot: 7)
│   ├─ hour (one-hot: 24)
│   ├─ is_weekend (binária: 1)
│   ├─ is_holiday (binária: 1)
│   ├─ season (one-hot: 4)
│   └─ weather_condition (embedding: 8)
│
├─ Numéricas:
│   ├─ distance_from_home (km)
│   ├─ distance_from_work (km)
│   ├─ distance_from_last_destination (km)
│   ├─ minutes_since_last_ride
│   ├─ total_rides_today
│   └─ passenger_score
│
├─ Históricas (rolling window 30 dias):
│   ├─ top1_destination_probability
│   ├─ top3_destination_probability
│   ├─ route_frequency_rank
│   └─ hour_frequency_rank
│
└─ Interações:
    ├─ hour × day_of_week
    ├─ hour × is_weekend
    ├─ distance_from_home × hour
    └─ passenger_score × hour

Modelo: Gradient Boosting (XGBoost / LightGBM)
Output: Top 3 destinos com probabilidades (ranking multiclasse)
```

#### Métricas de Performance do Modelo

| Métrica | Heurístico Atual | ML Target | ML Stretch |
|---------|-----------------|-----------|------------|
| Precision@1 | 40% | 55% | 65% |
| Precision@3 | 70% | 85% | 92% |
| Recall@3 | 65% | 80% | 88% |
| NDCG@3 | 0.72 | 0.85 | 0.92 |
| MAP@3 | 0.55 | 0.70 | 0.80 |
| Inference time | <50ms | <20ms | <10ms |

#### Feature Store

```sql
-- Materialized view para features de ML
CREATE MATERIALIZED VIEW mv_passenger_ml_features AS
SELECT
    prh.passenger_id,
    prh.created_at,
    prh.day_of_week,
    prh.hour,
    prh.is_weekend,
    prh.is_holiday,
    prh.season,
    prh.weather_condition,
    prh.distance_km,
    prh.duration_min,
    prh.fare,
    prh.payment_method,
    prh.category_name,

    -- Distância de referências
    COALESCE(
        haversine(prh.origin_lat, prh.origin_lng,
                  (pp.home_address->>'lat')::DECIMAL,
                  (pp.home_address->>'lng')::DECIMAL),
        999
    ) AS distance_from_home,

    COALESCE(
        haversine(prh.origin_lat, prh.origin_lng,
                  (pp.work_address->>'lat')::DECIMAL,
                  (pp.work_address->>'lng')::DECIMAL),
        999
    ) AS distance_from_work,

    -- Rolling features (30 dias)
    COUNT(*) OVER (
        PARTITION BY prh.passenger_id
        ORDER BY prh.created_at
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) AS rides_last_30_days,

    -- Target: destination cluster ID
    prh.destination_address

FROM passenger_ride_history prh
JOIN passenger_preferences pp ON pp.passenger_id = prh.passenger_id
WHERE prh.created_at >= NOW() - INTERVAL '365 days';

CREATE INDEX idx_ml_features_passenger_date
    ON mv_passenger_ml_features(passenger_id, created_at DESC);
```

### Modelo de Churn Prediction

Identificar passageiros em risco de churn para acionar estratégias de retenção.

#### Features de Churn

| Feature | Descrição | Peso Esperado |
|---------|-----------|---------------|
| Dias desde última corrida | Quanto mais tempo, maior risco | 0.25 |
| Tendência de frequência (30d vs 90d) | Queda de uso | 0.20 |
| Rating médio dado | Ratings baixos podem indicar insatisfação | 0.15 |
| Cancelamento rate | Altas taxas de cancelamento | 0.15 |
| Reclamações no suporte | Correlação forte com churn | 0.10 |
| Preço médio da corrida | Aumento de preço pode causar churn | 0.10 |
| Uso de promoções | Queda no uso de promoções | 0.05 |

#### Ações Baseadas em Risco

| Risco de Churn | Probabilidade | Ação |
|---------------|--------------|------|
| Baixo | <20% | Monitorar |
| Médio | 20-50% | Enviar push "Sentimos sua falta" |
| Alto | 50-80% | Oferecer desconto personalizado |
| Crítico | >80% | Equipe de retenção entra em contato |

### Modelo de ETA Ajustado

Ajustar o ETA (Estimated Time of Arrival) baseado no comportamento histórico do motorista em relação ao passageiro.

```
ETA_ajustado = ETA_base * (1 + fator_motorista + fator_passageiro)

Onde:
  fator_motorista = média de atraso do motorista em corridas anteriores
  fator_passageiro = tempo extra que o passageiro leva para embarcar
```

### Modelo de Precificação Dinâmica Personalizada

Ajustar preços baseado na elasticidade do passageiro (quanto ele está disposto a pagar em diferentes contextos).

```
seja:
  P_base = preço base da corrida
  E = elasticidade estimada do passageiro
  S = score do passageiro (frequência + rating)
  C = categoria do veículo

P_ajustado = P_base * (1 + (1 - E) * 0.1) * (1 - S * 0.05)

Passageiros menos sensíveis a preço (E baixo): preço mais próximo do base
Passageiros frequentes (S alto): desconto de até 5%
```

---

## Testes

### Testes Unitários (Algoritmos)

```typescript
// __tests__/ai/route-detection.test.ts

describe('FavoriteRouteDetection', () => {
  it('should detect route with 3+ rides', () => {
    const rides = generateMockRides({
      sameRoute: true,
      count: 3,
      days: [1, 2, 3],
      hours: [8, 8, 8]
    });
    const result = detectFavoriteRoutes(rides);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    expect(result[0].score).toBeGreaterThan(0);
  });

  it('should NOT detect route with < 3 rides', () => {
    const rides = generateMockRides({
      sameRoute: true,
      count: 2,
    });
    const result = detectFavoriteRoutes(rides);
    expect(result).toHaveLength(0);
  });

  it('should infer "work" label for morning weekday routes', () => {
    const rides = generateMockRides({
      sameRoute: true,
      count: 5,
      days: [1, 2, 3, 4, 5],
      hours: [8, 8, 8, 8, 8]
    });
    const result = detectFavoriteRoutes(rides);
    expect(result[0].label).toBe('Trabalho');
  });

  it('should calculate score correctly', () => {
    const rides = generateMockRides({
      sameRoute: true,
      count: 10,
      days: [1, 2, 3, 4, 5],
      hours: [8, 8, 8, 8, 8],
      totalRides: 50
    });
    const result = detectFavoriteRoutes(rides);
    expect(result[0].score).toBeGreaterThan(0.7);
  });

  it('should handle empty ride history', () => {
    const result = detectFavoriteRoutes([]);
    expect(result).toEqual([]);
  });

  it('should limit to 10 favorite routes', () => {
    const rides = generateMockRides({
      differentRoutes: 15,
      countPerRoute: 3,
    });
    const result = detectFavoriteRoutes(rides);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
```

### Testes de Integração (API)

```typescript
// __tests__/integration/ai-api.test.ts

describe('POST /api/v1/ai/refresh-preferences', () => {
  it('should return 200 for valid passenger', async () => {
    const response = await request(app)
      .post('/api/v1/ai/refresh-preferences')
      .send({ passenger_id: mockPassengerId });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.favorite_routes_count).toBeDefined();
  });

  it('should return 400 for invalid passenger id', async () => {
    const response = await request(app)
      .post('/api/v1/ai/refresh-preferences')
      .send({ passenger_id: 'invalid-uuid' });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/v1/ai/greeting', () => {
  it('should return greeting for passenger with history', async () => {
    const response = await request(app)
      .get(`/api/v1/ai/greeting?passenger_id=${mockPassengerId}&lat=-23.5616&lng=-46.6560`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBeTruthy();
    expect(response.body.type).toBeDefined();
  });

  it('should return generic greeting for new passenger', async () => {
    const response = await request(app)
      .get(`/api/v1/ai/greeting?passenger_id=${newPassengerId}&lat=-23.5500&lng=-46.6333`);
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('generic');
  });
});
```

### Testes de Componentes (React)

```typescript
// __tests__/components/PassengerGreeting.test.tsx

describe('PassengerGreeting', () => {
  it('should render loading skeleton initially', () => {
    const { getByTestId } = render(
      <PassengerGreeting passengerId="test-id" onSelectDestination={jest.fn()} />
    );
    expect(getByTestId('greeting-skeleton')).toBeTruthy();
  });

  it('should render greeting message when loaded', async () => {
    const mockGreeting = {
      message: 'Bom dia! Deseja ir para o trabalho?',
      type: 'work',
      confidence: 0.85,
      destination: { address: 'Rua Funchal, 500', lat: -23.5939, lng: -46.6850 }
    };

    jest.spyOn(api, 'getGreeting').mockResolvedValue(mockGreeting);

    const { findByText } = render(
      <PassengerGreeting passengerId="test-id" onSelectDestination={jest.fn()} />
    );

    expect(await findByText('Bom dia! Deseja ir para o trabalho?')).toBeTruthy();
  });

  it('should render empty state for first-time passenger', async () => {
    jest.spyOn(api, 'getGreeting').mockResolvedValue(null);

    const { findByText } = render(
      <PassengerGreeting passengerId="new-user" onSelectDestination={jest.fn()} />
    );

    expect(await findByText('Olá! Para onde hoje?')).toBeTruthy();
  });

  it('should call onSelectDestination when suggestion is tapped', async () => {
    const onSelect = jest.fn();
    const { findByText } = render(
      <PassengerGreeting passengerId="test-id" onSelectDestination={onSelect} />
    );

    fireEvent.press(await findByText('Rua Funchal, 500'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

### Testes de Performance

```typescript
// __tests__/performance/ai-algorithms.perf.ts

describe('AI Algorithm Performance', () => {
  it('should detect routes in < 50ms for 1000 rides', () => {
    const rides = generateMockRides({ count: 1000, randomRoutes: true });
    const start = performance.now();
    const result = detectFavoriteRoutes(rides);
    const end = performance.now();
    expect(end - start).toBeLessThan(50);
  });

  it('should predict destinations in < 20ms', () => {
    const prefs = generateMockPreferences({ routes: 5, times: 24 });
    const start = performance.now();
    const result = predictDestinations(prefs, mockLocation);
    const end = performance.now();
    expect(end - start).toBeLessThan(20);
  });

  it('should handle 100 concurrent greeting requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      request(app).get(`/api/v1/ai/greeting?passenger_id=${mockPassengerId}&lat=-23.5616&lng=-46.6560`)
    );
    const start = performance.now();
    const responses = await Promise.all(requests);
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / 100;

    expect(avgTime).toBeLessThan(200); // average < 200ms
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
});
```

---

## Monitoramento e Observabilidade

### Métricas Técnicas

| Métrica | Tipo | Alerta | Descrição |
|---------|------|--------|-----------|
| `ai.greeting.latency_ms` | Histograma | >500ms (p99) | Latência de geração de greeting |
| `ai.prediction.latency_ms` | Histograma | >200ms (p99) | Latência de predição de destino |
| `ai.preferences.refresh.count` | Contador | — | Total de refresh de preferências |
| `ai.preferences.refresh.duration_ms` | Histograma | >1s (p95) | Duração do refresh |
| `ai.greeting.acceptance.rate` | Gauge | <20% | Taxa de aceitação de greetings |
| `ai.prediction.accuracy.top3` | Gauge | <50% | Precisão de predição top 3 |
| `ai.cache.hit_rate` | Gauge | <70% | Taxa de acerto do cache |
| `ai.event.queue.size` | Gauge | >1000 | Tamanho da fila de eventos |

### Logs Estruturados

```typescript
// Exemplo de log estruturado
logger.info('Destination predicted', {
  event: 'passenger.destination.predicted',
  passengerId: '550e8400-...',
  predictions: ['Trabalho (0.92)', 'Casa (0.45)'],
  context: { hour: 8, day: 2, locationMatch: true },
  latencyMs: 45,
  modelVersion: 1
});
```

### Dashboards (Grafana)

| Painel | Métricas | Filtros |
|--------|----------|---------|
| AI Performance | Latências (p50, p95, p99), throughput | Por endpoint, por versão |
| AI Accuracy | Taxa de aceitação, precisão de predição | Por período do dia, por passageiro |
| AI Adoption | % de usuários com AI ativo, features usadas | Por cohort, por versão do app |
| Data Health | Volume de eventos, cache hit rate, erros | Por passageiro |

### Alertas

| Alerta | Condição | Severidade | Ação |
|--------|----------|-----------|------|
| Greeting Latency Spike | p99 > 1s por 5 min | Critical | Paginar AI Engine |
| Prediction Accuracy Drop | Média móvel 1h < 40% | Warning | Revisar modelo |
| High Error Rate | Erros > 5% das requests | Critical | Rollback de release |
| Cache Hit Rate Low | Hit rate < 50% | Warning | Revisar estratégia de cache |
| Event Queue Backlog | > 10k eventos não processados | Critical | Escalar workers |

---

## Segurança e Privacidade

### Requisitos de Segurança

1. **Autenticação**: Todos os endpoints de IA requerem `x-passenger-token` válido
2. **Autorização**: Passageiro só pode acessar seus próprios dados (row-level security no Supabase)
3. **Criptografia em trânsito**: TLS 1.3 obrigatório
4. **Criptografia em repouso**: Dados de preferências criptografados no banco
5. **Auditoria**: Todos os acessos a dados de IA são logados em `passenger_events`

### Row-Level Security (Supabase)

```sql
-- Política RLS para passenger_preferences
ALTER TABLE passenger_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY passenger_preferences_owner ON passenger_preferences
    FOR ALL
    USING (passenger_id = auth.uid())
    WITH CHECK (passenger_id = auth.uid());

-- Política RLS para passenger_ride_history
ALTER TABLE passenger_ride_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY ride_history_owner ON passenger_ride_history
    FOR SELECT
    USING (passenger_id = auth.uid());
```

### LGPD / GDPR Compliance

| Requisito | Implementação |
|-----------|--------------|
| Direito de acesso | GET /passenger/preferences/{id} com autenticação |
| Direito de retificação | PATCH /passenger/preferences/{id} |
| Direito de exclusão | DELETE /passenger/data/{id} (anonymize_passenger_data) |
| Portabilidade de dados | GET /passenger/export/{id} (JSON completo) |
| Consentimento | `ai_enabled`, `greeting_enabled`, `prediction_enabled` flags |
| Data retention | Políticas de cleanup automáticas |
| Opt-out de AI | Desativar flags de feature (sem perder acesso ao app) |

### Opt-out Flow

```typescript
// Settings screen
const AISettings: React.FC = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [greetingEnabled, setGreetingEnabled] = useState(true);
  const [predictionEnabled, setPredictionEnabled] = useState(true);

  const handleToggleAI = async (enabled: boolean) => {
    await api.updatePreferences({ ai_enabled: enabled });
    // Se desabilitar AI, desabilitar sub-features
    if (!enabled) {
      setGreetingEnabled(false);
      setPredictionEnabled(false);
    }
    setAiEnabled(enabled);
  };

  return (
    <View>
      <Text h3>Prefeŕencias de IA</Text>
      <ListItem
        title="Recomendações Inteligentes"
        subtitle="Sugestões de destino e saudação personalizada"
        switch={{ value: aiEnabled, onValueChange: handleToggleAI }}
      />
      <ListItem
        title="Saudação Personalizada"
        subtitle=""
        Bom dia! Deseja ir para o trabalho?""
        switch={{ value: greetingEnabled && aiEnabled, onValueChange: setGreetingEnabled }}
        disabled={!aiEnabled}
      />
      <ListItem
        title="Predição de Destino"
        subtitle="Sugerir destinos prováveis na tela inicial"
        switch={{ value: predictionEnabled && aiEnabled, onValueChange: setPredictionEnabled }}
        disabled={!aiEnabled}
      />
      <Text note>
        Você pode desabilitar as funcionalidades de IA a qualquer momento.
        Isso não afeta sua capacidade de solicitar corridas.
      </Text>
    </View>
  );
};
```

---

## Roadmap

### Fase 1 — Fundação (Sprint 1-4)

| Milestone | Entregas | Esforço |
|-----------|----------|---------|
| Schema SQL | Tabelas, índices, RLS, triggers | 3 dias |
| Algoritmos Heurísticos | Route detection, Time detection, Payment preference | 5 dias |
| APIs Core | POST /ride-completed, GET /greeting, GET /destination-suggestions | 4 dias |
| Componentes Base | PassengerGreeting, FavoriteRouteCard, DestinationSuggestions | 5 dias |
| Testes Unitários | Cobertura mínima de 80% dos algoritmos | 3 dias |
| **Total** | **MVP funcional** | **20 dias** |

### Fase 2 — Contexto & Preferências (Sprint 5-8)

| Milestone | Entregas | Esforço |
|-----------|----------|---------|
| Contextual Greeting Avançado | Motorista favorito online, clima, feriados | 4 dias |
| Favorite Driver Detection | Algoritmo + integração com dispatch | 5 dias |
| PassengerDashboard | Integração de todos os componentes na Home | 4 dias |
| Payment Flow | PaymentSuggestion + aceitação automática | 3 dias |
| Cache Estratégico | Redis + invalidação | 3 dias |
| **Total** | **IA contextual completa** | **19 dias** |

### Fase 3 — Analytics & Refinamento (Sprint 9-12)

| Milestone | Entregas | Esforço |
|-----------|----------|---------|
| Eventos e Analytics | Todos os eventos, dashboard de métricas | 5 dias |
| Anomaly Detection | Algoritmo + alertas | 4 dias |
| Feedback Loop | Endpoint de feedback + ajuste de pesos | 4 dias |
| A/B Testing Framework | Testar greeting vs sem greeting, predição vs sem | 5 dias |
| Performance Optimization | Query tuning, cache tuning, load test | 4 dias |
| **Total** | **Refinamento e otimização** | **22 dias** |

### Fase 4 — ML & Escala (Sprint 13-20)

| Milestone | Entregas | Esforço |
|-----------|----------|---------|
| Feature Store | Materialized views, feature engineering pipeline | 8 dias |
| ML Model Training | XGBoost para predição de destino | 10 dias |
| ML Inference Service | ONNX Runtime + deploy | 6 dias |
| Churn Prediction Model | Treinamento + ações de retenção | 8 dias |
| ETA Adjustment Model | Ajuste personalizado de ETA | 6 dias |
| **Total** | **IA com Machine Learning** | **38 dias** |

### Visão Geral do Roadmap

```
Sprint   1-4    5-8     9-12     13-16     17-20
       ┌─────┬──────┬───────┬────────┬────────┐
Fase   │  1  │  2   │   3   │   4a   │   4b   │
       ├─────┼──────┼───────┼────────┼────────┤
MVP    │ ████│████  │       │        │        │
Context│     │██████│███    │        │        │
Analyt.│     │      │██████ │        │        │
ML     │     │      │       │████████│████████│
       └─────┴──────┴───────┴────────┴────────┘
       Semanas 1-20
```

---

## Appendix A: Glossário

| Termo | Definição |
|-------|-----------|
| **Passenger AI** | Módulo de inteligência artificial para personalização da experiência do passageiro |
| **AI Engine** | Serviço backend que executa algoritmos de aprendizado e predição |
| **Event Collector** | Serviço que recebe e processa eventos do passageiro (corridas, pagamentos, etc.) |
| **Greeting Contextual** | Saudação personalizada baseada em hora, local e histórico do passageiro |
| **Destination Prediction** | Predição de destinos prováveis baseada em padrões históricos |
| **Favorite Route** | Rota percorrida 3+ vezes pelo passageiro |
| **Frequent Time** | Slot de horário com alta probabilidade de solicitação de corrida |
| **Favorite Driver** | Motorista com quem o passageiro andou 3+ vezes ou deu rating 5 |
| **Passenger Score** | Score de qualidade do passageiro para dispatch |
| **Heuristic Algorithm** | Algoritmo baseado em regras e pesos fixos (não-ML) |
| **ML Model** | Modelo de Machine Learning treinado com dados históricos |
| **RLS** | Row-Level Security — política de segurança do Supabase |
| **NDCG** | Normalized Discounted Cumulative Gain — métrica de ranking |
| **MAP** | Mean Average Precision — métrica de precisão média |

## Appendix B: Haversine Implementation

```typescript
// src/lib/geo/haversine.ts

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function isNearby(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  maxDistanceKm: number = 0.2
): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= maxDistanceKm;
}
```

## Appendix C: Utility Functions

```typescript
// src/lib/ai/utils.ts

export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function recencyScore(daysSinceLastUse: number): number {
  return 1 / (1 + daysSinceLastUse * 0.05);
}

export function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const freq = new Map<T, number>();
  let maxFreq = 0;
  let modeValue: T | undefined;
  for (const item of arr) {
    const count = (freq.get(item) || 0) + 1;
    freq.set(item, count);
    if (count > maxFreq) {
      maxFreq = count;
      modeValue = item;
    }
  }
  return modeValue;
}

export function getPeriodOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getGreetingByPeriod(hour: number): string {
  const period = getPeriodOfDay(hour);
  const greetings: Record<string, string> = {
    morning: 'Bom dia',
    afternoon: 'Boa tarde',
    evening: 'Boa noite',
    night: 'Boa noite',
  };
  return greetings[period];
}

export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function isBusinessHours(hour: number, dayOfWeek: number): boolean {
  if (isWeekend(dayOfWeek)) return false;
  return hour >= 8 && hour <= 18;
}

export function isRushHour(hour: number, dayOfWeek: number): boolean {
  if (isWeekend(dayOfWeek)) return false;
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
}
```

---

*Document version: 1.0.0*
*Last updated: 2026-07-13*
*Author: TXAPP AI Team*
