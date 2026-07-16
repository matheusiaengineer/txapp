# TXAPP Score Dispatch 3.0

> **Sistema de Distribuicao Inteligente de Corridas**
> Versao: 3.0
> Status: Especificacao Tecnica
> Ultima atualizacao: Julho 2026

---

## Sumario

1. [Visao Geral](#1-visao-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Fluxo de Dispatch](#3-fluxo-de-dispatch)
4. [Tabelas do Banco de Dados](#4-tabelas-do-banco-de-dados)
5. [Algoritmo de Score (10 Fatores)](#5-algoritmo-de-score-10-fatores)
6. [AI Integration](#6-ai-integration)
7. [Batch Dispatch](#7-batch-dispatch)
8. [Fila de Prioridade](#8-fila-de-prioridade)
9. [Cantonamento (Geofencing)](#9-cantonamento-geofencing)
10. [Anti-fraude no Dispatch](#10-anti-fraude-no-dispatch)
11. [Como a IA Influencia o Score](#11-como-a-ia-influencia-o-score)
12. [Regras de Fallback](#12-regras-de-fallback)
13. [Criterios de Desempate](#13-criterios-de-desempate)
14. [Eventos do Event Bus](#14-eventos-do-event-bus)
15. [Configuracao de Pesos por Cidade](#15-configuracao-de-pesos-por-cidade)
16. [Monitoramento e Observabilidade](#16-monitoramento-e-observabilidade)
17. [Tratamento de Erros](#17-tratamento-de-erros)
18. [Apendice: Pseudocodigo Completo](#18-apendice-pseudocodigo-completo)

---

## 1. Visao Geral

O **TXAPP Score Dispatch 3.0** e um algoritmo de distribuicao de corridas inteiramente
configuravel por banco de dados. Diferentemente de sistemas tradicionais que possuem
regras fixas no codigo-fonte, o Dispatch 3.0 **nao contem nenhum valor hardcoded** --
toda regra, peso, limite e configuracao pode ser alterada pelo administrador sem
necessidade de deploy ou alteracao de codigo.

### Principios Fundamentais

| Principio | Descricao |
|-----------|-----------|
| **Configuravel** | 100% das regras vem do banco de dados (`dispatcher_rules`) |
| **Geo-inteligente** | Respeita zonas urbanas, suburbanas e rurais com raios dinamicos |
| **Anti-fraude nativo** | Verificacoes em tempo real antes de qualquer oferta |
| **AI-aumentado** | Modelos de ML predizem cancelamento, recomendam motoristas e otimizam ETA |
| **Resiliente** | Fallbacks graduais garantem disponibilidade mesmo em cenarios degradados |
| **Observavel** | Eventos em tempo real em cada etapa do dispatch |

### Objetivos de Negocio

- **Reduzir o tempo de match** para menos de 8 segundos em areas urbanas
- **Aumentar a taxa de aceitacao** para acima de 85%
- **Reduzir a taxa de cancelamento** para abaixo de 5%
- **Garantir justica distributiva** -- motoristas com maior idle time recebem prioridade
- **Prevenir fraudes** -- bloquear corridas fantasmas, GPS spoofing e combinados

---

## 2. Arquitetura do Sistema

### Diagrama de Alto Nivel

```
Ride Request -> Anti-fraude -> Find Drivers -> Score -> Batch Offer -> Accept -> Trip Start
```

### Stack Tecnologica

| Componente | Tecnologia | Funcao |
|------------|------------|--------|
| **API Gateway** | Kong / Envoy | Roteamento, rate limiting, autenticacao |
| **Dispatcher Service** | Node.js 22+ (TypeScript) | Core do algoritmo de dispatch |
| **Cache** | Redis 7+ | Score cache, driver locations, sessions |
| **Database** | PostgreSQL 16+ | Dados persistentes, regras, historico |
| **Geo-index** | PostGIS + Redis Geo | Consultas geoespaciais |
| **Message Queue** | RabbitMQ / NATS | Event Bus assincrono |
| **AI/ML** | Python 3.12 (FastAPI) | Modelos de predicao |
| **Monitoramento** | Prometheus + Grafana | Metricas e alertas |

---

## 3. Fluxo de Dispatch

### Fluxo Detalhado Passo a Passo

```
1. Ride Request Received
   +-- Validacao basica (origem, destino, categoria, passageiro)
   +-- Verifica se passageiro esta ativo
   +-- Publica evento: dispatch.search.started

2. Anti-fraude Check
   +-- Verifica blacklist do passageiro
   +-- Verifica GPS spoofing
   +-- Verifica corridas fantasmas (mesma origem/destino repetido)
   +-- Verifica device_id duplicado
   +-- Se falhar -> publica: dispatch.fraud.blocked -> retorna erro

3. Find Nearby Drivers
   +-- Carrega zona (urbana/suburbana/rural) baseada na origem
   +-- Define raio inicial (3km/10km/30km)
   +-- Consulta driver_locations com indice GiST
   +-- Exclui motoristas: blocked, offline, em outra corrida
   +-- Se nenhum -> expande raio (incrementos de 2km)

4. Score Calculation (para cada driver encontrado)
   +-- Carrega dispatcher_rules da cidade
   +-- Calcula cada fator individualmente
   +-- Aplica pesos configuraveis
   +-- AI influence: risco de cancelamento, recomendacao
   +-- Publica evento: dispatch.driver.scored (para cada driver)

5. Sort Drivers by Score
   +-- Ordena por score descendente
   +-- Aplica criterios de desempate
   +-- Armazena lista ranqueada

6. Batch Offer (Top N)
   +-- Envia oferta para top 3 simultaneamente
   +-- Promise.race com timeout de 15s por driver
   +-- Publica evento: dispatch.offer.sent (para cada driver)

7. Wait for Acceptance
   +-- Driver aceita -> publica: dispatch.offer.accepted
   |   +-- Inicia Trip
   +-- Driver rejeita -> publica: dispatch.offer.rejected
   |   +-- Proximo driver na fila
   +-- Timeout -> publica: dispatch.offer.timeout
       +-- Expande para top 5, depois busca todos

8. No Drivers Available
   +-- Tenta expandir raio de busca
   +-- Recalcula scores com novos drivers
   +-- Se ainda vazio -> publica: dispatch.no.drivers

9. Trip Start
   +-- Atualiza status da ride para in_progress
   +-- Atualiza driver_locations (em corrida)
   +-- Atualiza ride_requests (accepted)
```

---

## 4. Tabelas do Banco de Dados

### 4.1 `rides`

Tabela principal de corridas.

```sql
CREATE TABLE rides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id    UUID NOT NULL,
    origin_lat      NUMERIC(10, 7) NOT NULL,
    origin_lng      NUMERIC(10, 7) NOT NULL,
    destination_lat NUMERIC(10, 7),
    destination_lng NUMERIC(10, 7),
    category_id     UUID NOT NULL REFERENCES ride_categories(id),
    status          VARCHAR(32) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending', 'scoring', 'offering',
                        'accepted', 'in_progress', 'completed',
                        'cancelled', 'fraud_blocked'
                    )),
    city_id         UUID NOT NULL REFERENCES cities(id),
    zone_type       VARCHAR(16) NOT NULL DEFAULT 'urban'
                    CHECK (zone_type IN ('urban', 'suburban', 'rural')),
    search_radius   NUMERIC(5, 2) DEFAULT 3.00,
    fraud_check     BOOLEAN DEFAULT FALSE,
    fraud_details   JSONB,
    ai_cancel_risk  NUMERIC(4, 3),
    ai_recommended  UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason_id UUID REFERENCES cancellation_reasons(id)
);

CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_city_zone ON rides(city_id, zone_type);
CREATE INDEX idx_rides_created ON rides(created_at DESC);
```

### 4.2 `ride_requests`

Registra todas as ofertas enviadas a motoristas para uma corrida.

```sql
CREATE TABLE ride_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id         UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES drivers(id),
    score           NUMERIC(5, 3) NOT NULL,
    score_factors   JSONB NOT NULL DEFAULT '{}',
    priority_rank   SMALLINT NOT NULL DEFAULT 0,
    status          VARCHAR(24) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending', 'offered', 'accepted',
                        'rejected', 'timeout', 'error'
                    )),
    batch_round     SMALLINT NOT NULL DEFAULT 1,
    offered_at      TIMESTAMPTZ,
    responded_at    TIMESTAMPTZ,
    timeout_at      TIMESTAMPTZ,
    response_time_ms INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_requests_ride ON ride_requests(ride_id);
CREATE INDEX idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_ride_status ON ride_requests(ride_id, status);
```

### 4.3 `driver_locations`

Tabela de localizacao em tempo real dos motoristas. Usa PostGIS para consultas geoespaciais eficientes.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE TABLE driver_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL UNIQUE REFERENCES drivers(id),
    geom            GEOGRAPHY(Point, 4326) NOT NULL,
    lat             NUMERIC(10, 7) NOT NULL,
    lng             NUMERIC(10, 7) NOT NULL,
    accuracy        NUMERIC(6, 2) DEFAULT 0,
    speed           NUMERIC(5, 2) DEFAULT 0,
    heading         SMALLINT DEFAULT 0,
    battery_level   NUMERIC(4, 1) DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    gps_quality     NUMERIC(3, 2) DEFAULT 1.00 CHECK (gps_quality >= 0 AND gps_quality <= 1),
    is_online       BOOLEAN NOT NULL DEFAULT FALSE,
    is_in_ride      BOOLEAN NOT NULL DEFAULT FALSE,
    last_ride_end   TIMESTAMPTZ,
    idle_since      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE INDEX idx_driver_locations_geom ON driver_locations USING GIST (geom);
CREATE INDEX idx_driver_locations_online ON driver_locations(is_online) WHERE is_online = TRUE;
CREATE INDEX idx_driver_locations_online_inride ON driver_locations(is_online, is_in_ride);
CREATE INDEX idx_driver_locations_updated ON driver_locations(updated_at DESC);

CREATE OR REPLACE FUNCTION update_driver_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_driver_locations_updated
    BEFORE UPDATE ON driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_locations_timestamp();
```

### 4.4 `dispatcher_rules`

Tabela de configuracao dinamica do algoritmo. Cada linha e um peso configuravel.

```sql
CREATE TABLE dispatcher_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id         UUID NOT NULL REFERENCES cities(id),
    weight_name     VARCHAR(32) NOT NULL,
    weight_value    NUMERIC(5, 2) NOT NULL CHECK (weight_value >= 0 AND weight_value <= 100),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    priority        SMALLINT NOT NULL DEFAULT 0,
    description     TEXT,
    min_threshold   NUMERIC(8, 3),
    max_threshold   NUMERIC(8, 3),
    fallback_value  NUMERIC(8, 3) DEFAULT 0,
    params          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES users(id),
    UNIQUE (city_id, weight_name),
    CONSTRAINT valid_weight_name CHECK (weight_name IN (
        'distance', 'eta', 'rating', 'acceptance_rate',
        'cancellation_rate', 'trip_history', 'vehicle_match',
        'battery_level', 'gps_quality', 'idle_time'
    ))
);

CREATE INDEX idx_dispatcher_rules_city ON dispatcher_rules(city_id, enabled);

CREATE VIEW vw_active_dispatcher_rules AS
SELECT
    city_id,
    jsonb_object_agg(weight_name, weight_value) AS weights,
    jsonb_object_agg(weight_name, params) AS params
FROM dispatcher_rules
WHERE enabled = TRUE
GROUP BY city_id;
```

### 4.5 `driver_scores`

Cache dos scores calculados para cada motorista.

```sql
CREATE TABLE driver_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL UNIQUE REFERENCES drivers(id),
    score           NUMERIC(5, 3) NOT NULL,
    factors         JSONB NOT NULL DEFAULT '{}',
    ride_id         UUID REFERENCES rides(id) ON DELETE SET NULL,
    city_id         UUID REFERENCES cities(id),
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 1)
);

CREATE INDEX idx_driver_scores_driver ON driver_scores(driver_id);
CREATE INDEX idx_driver_scores_score ON driver_scores(score DESC);
CREATE INDEX idx_driver_scores_expires ON driver_scores(expires_at);
```

### 4.6 `driver_ratings`

Estatisticas agregadas de avaliacao por motorista.

```sql
CREATE TABLE driver_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL UNIQUE REFERENCES drivers(id),
    avg_rating      NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (avg_rating >= 1 AND avg_rating <= 5),
    total_ratings   INTEGER NOT NULL DEFAULT 0 CHECK (total_ratings >= 0),
    last_100_avg    NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (last_100_avg >= 1 AND last_100_avg <= 5),
    last_100_count  SMALLINT NOT NULL DEFAULT 0 CHECK (last_100_count >= 0 AND last_100_count <= 100),
    rating_5_count  INTEGER NOT NULL DEFAULT 0,
    rating_4_count  INTEGER NOT NULL DEFAULT 0,
    rating_3_count  INTEGER NOT NULL DEFAULT 0,
    rating_2_count  INTEGER NOT NULL DEFAULT 0,
    rating_1_count  INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_ratings_driver ON driver_ratings(driver_id);
CREATE INDEX idx_driver_ratings_avg ON driver_ratings(avg_rating DESC);
```

### 4.7 `driver_categories`

Relacao entre motoristas e categorias de veiculo que eles atendem.

```sql
CREATE TABLE driver_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL REFERENCES drivers(id),
    category_id     UUID NOT NULL REFERENCES ride_categories(id),
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at  TIMESTAMPTZ,
    UNIQUE (driver_id, category_id)
);

CREATE INDEX idx_driver_categories_driver ON driver_categories(driver_id, is_active);
CREATE INDEX idx_driver_categories_category ON driver_categories(category_id, is_active);
```

### 4.8 `driver_blocks`

Motoristas bloqueados por passageiros especificos.

```sql
CREATE TABLE driver_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id    UUID NOT NULL REFERENCES passengers(id),
    driver_id       UUID NOT NULL REFERENCES drivers(id),
    reason          VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    is_permanent    BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (passenger_id, driver_id)
);

CREATE INDEX idx_driver_blocks_passenger ON driver_blocks(passenger_id);
CREATE INDEX idx_driver_blocks_driver ON driver_blocks(driver_id);
```

### 4.9 `cancellation_reasons`

Taxonomia de motivos de cancelamento.

```sql
CREATE TABLE cancellation_reasons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(32) NOT NULL UNIQUE,
    label           VARCHAR(128) NOT NULL,
    category        VARCHAR(32) NOT NULL CHECK (category IN (
                        'passenger', 'driver', 'system', 'fraud', 'safety'
                    )),
    is_driver_side  BOOLEAN NOT NULL DEFAULT FALSE,
    is_passenger_side BOOLEAN NOT NULL DEFAULT FALSE,
    weight_penalty  NUMERIC(3, 2) DEFAULT 0.50 CHECK (weight_penalty >= 0 AND weight_penalty <= 1),
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cancellation_reasons_category ON cancellation_reasons(category);
CREATE INDEX idx_cancellation_reasons_code ON cancellation_reasons(code);

INSERT INTO cancellation_reasons (code, label, category, is_driver_side, weight_penalty) VALUES
    ('driver_too_far',       'Motorista muito distante',     'driver',   TRUE,  0.30),
    ('driver_requested',     'Motorista solicitou',          'driver',   TRUE,  0.50),
    ('passenger_requested',  'Passageiro desistiu',          'passenger',FALSE, 0.10),
    ('passenger_no_show',    'Passageiro nao apareceu',      'passenger',FALSE, 0.10),
    ('vehicle_issue',        'Problema com o veiculo',       'driver',   TRUE,  0.60),
    ('traffic',              'Transito intenso',             'driver',   TRUE,  0.20),
    ('duplicate_ride',       'Corrida duplicada',            'system',   FALSE, 0.00),
    ('fraud_suspected',      'Suspeita de fraude',           'fraud',    FALSE, 0.00),
    ('safety_concern',       'Preocupacao de seguranca',     'safety',   TRUE,  0.80),
    ('payment_issue',        'Problema de pagamento',        'system',   FALSE, 0.00),
    ('location_wrong',       'Localizacao incorreta',        'passenger',FALSE, 0.15),
    ('driver_cancelled',     'Cancelamento pelo motorista',  'driver',   TRUE,  0.70);
```

### 4.10 Tabelas Auxiliares

```sql
-- Cidades atendidas
CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    state           VARCHAR(64),
    country         VARCHAR(64) NOT NULL,
    lat             NUMERIC(10, 7),
    lng             NUMERIC(10, 7),
    timezone        VARCHAR(64) DEFAULT 'America/Sao_Paulo',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorias de corrida
CREATE TABLE ride_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64) NOT NULL,
    code            VARCHAR(16) NOT NULL UNIQUE,
    description     TEXT,
    base_fare       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_per_km    NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_rating      NUMERIC(3, 2) DEFAULT 4.50,
    max_passengers  SMALLINT DEFAULT 4,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zonas de geofencing
CREATE TABLE geofence_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id         UUID NOT NULL REFERENCES cities(id),
    name            VARCHAR(128) NOT NULL,
    zone_type       VARCHAR(16) NOT NULL CHECK (zone_type IN ('urban', 'suburban', 'rural')),
    boundary        GEOGRAPHY(Polygon, 4326) NOT NULL,
    is_blacklisted  BOOLEAN NOT NULL DEFAULT FALSE,
    max_radius_km   NUMERIC(5, 2) NOT NULL,
    search_radius_km NUMERIC(5, 2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_zones_city ON geofence_zones(city_id);
CREATE INDEX idx_geofence_zones_geom ON geofence_zones USING GIST (boundary);
CREATE INDEX idx_geofence_zones_type ON geofence_zones(zone_type);

-- Blacklist
CREATE TABLE blacklist (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(16) NOT NULL CHECK (entity_type IN ('passenger', 'driver')),
    entity_id       UUID NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    blocked_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_blacklist_entity ON blacklist(entity_type, entity_id, is_active);
```

---

## 5. Algoritmo de Score (10 Fatores)

O score final de cada motorista e uma combinacao linear ponderada de 10 fatores.
Cada peso e carregado da tabela `dispatcher_rules` para a cidade especifica.

### Formula Geral

```
Score_Driver = Soma (Fator_i * Peso_i) / Soma Peso_i

Onde:
  - Fator_i pertence a [0, 1] e o valor normalizado do fator i
  - Peso_i pertence a [0, 100] e o peso configuravel do fator i
  - Score_Driver pertence a [0, 1] e o score final
```

### 5.1 Distance (20%) -- Distancia

**Objetivo:** Quanto menor a distancia do motorista ao passageiro, maior a pontuacao.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'distance', 20, TRUE, 1, '{"max_distance_km": 30, "ideal_distance_km": 1}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
distancia = haversine(origem_passageiro, localizacao_motorista)

Se distancia <= ideal_distance:
    fator_distance = 1.0
Senao:
    fator_distance = max(0, 1 - (distancia - ideal) / (maximo - ideal))

Onde:
  - ideal_distance_km = 1km (configuravel via params)
  - max_distance_km = 30km (configuravel via params)
```

### 5.2 ETA (15%) -- Tempo Estimado de Chegada

**Objetivo:** Menor tempo estimado (considerando transito real) = maior pontuacao.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'eta', 15, TRUE, 2, '{"max_eta_minutes": 30, "ideal_eta_minutes": 3, "use_traffic": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
eta = estimar_tempo_com_transito(origem_passageiro, localizacao_motorista)

Se eta <= ideal_eta:
    fator_eta = 1.0
Senao:
    fator_eta = max(0, 1 - (eta - ideal) / (maximo - ideal))
```

**AI Integration:** O ETA pode ser ajustado por modelo de ML que aprende padres de transito historicos.

### 5.3 Rating (15%) -- Avaliacao Media

**Objetivo:** Motoristas com melhores avaliacoes recebem pontuacao mais alta.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'rating', 15, TRUE, 3, '{"min_rating": 4.0, "max_rating": 5.0, "lookback_rides": 100}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
avg_rating = driver_ratings.last_100_avg
fator_rating = max(0, (avg_rating - min_rating) / (max_rating - min_rating))
```

### 5.4 Acceptance Rate (10%) -- Taxa de Aceitacao

**Objetivo:** Motoristas que aceitam mais corridas sao priorizados.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'acceptance_rate', 10, TRUE, 4, '{"lookback_rides": 50, "min_acceptance": 0.3}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
acceptance = aceitas / total_ofertas (ultimos 50)
fator_acceptance = max(0, (acceptance - min_acceptance) / (1 - min_acceptance))
```

### 5.5 Cancellation Rate (8%) -- Taxa de Cancelamento

**Objetivo:** Baixa taxa de cancelamento = maior score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'cancellation_rate', 8, TRUE, 5, '{"lookback_rides": 50, "max_cancel_rate": 0.15, "driver_side_multiplier": 2.0}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
cancel_rate_ponderada = (cancel_passageiro + cancel_motorista * 2.0) / total
fator_cancel = max(0, 1 - (cancel_rate_ponderada / max_cancel_rate))
```

### 5.6 Trip History (8%) -- Historico de Corridas

**Objetivo:** Motoristas experientes (mais corridas completadas) recebem score maior.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'trip_history', 8, TRUE, 6, '{"min_trips": 10, "max_trips": 5000, "log_scale": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_history = min(1, log(total_trips + 1) / log(max_trips + 1))
```

### 5.7 Vehicle Match (10%) -- Compatibilidade do Veiculo

**Objetivo:** Compatibilidade total do veiculo com a categoria da corrida.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vehicle_match', 10, TRUE, 7, '{"exact_match": 1.0, "upgrade_match": 0.8, "downgrade_match": 0.3}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
Se categoria exata:     fator_vehicle = 1.0
Se upgrade (superior):  fator_vehicle = 0.8
Se downgrade (inferior): fator_vehicle = 0.3
Senao:                  fator_vehicle = 0
```

### 5.8 Battery Level (5%) -- Nivel de Bateria

**Objetivo:** Apenas para veiculos eletricos. Bateria alta = maior score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'battery_level', 5, TRUE, 8, '{"min_battery": 20, "ideal_battery": 80, "electric_only": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
Se nao e eletrico: fator_battery = 1.0
Se battery <= 20%:  fator_battery = 0
Se battery >= 80%:  fator_battery = 1.0
Senao: fator_battery = (battery - 20) / 60
```

### 5.9 GPS Quality (4%) -- Precisao da Localizacao

**Objetivo:** Motoristas com localizacao mais precisa sao priorizados.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'gps_quality', 4, TRUE, 9, '{"min_accuracy_meters": 100, "ideal_accuracy_meters": 10}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_gps = max(0, 1 - (accuracy - ideal) / (min_accuracy - ideal))
```

### 5.10 Idle Time (5%) -- Tempo Ocioso

**Objetivo:** Priorizar motoristas que esperam ha mais tempo (justica distributiva).

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'idle_time', 5, TRUE, 10, '{"max_idle_minutes": 120, "boost_after_minutes": 30}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_idle = min(1, idle_minutes / max_idle)
```

### Exemplo de Consulta Agregada

```sql
WITH driver_raw_scores AS (
    SELECT
        d.id AS driver_id,
        CASE WHEN dl.distance_km <= 1 THEN 1.0
             ELSE GREATEST(0, 1 - (dl.distance_km - 1) / 29)
        END AS f_distance,
        CASE WHEN dl.eta_minutes <= 3 THEN 1.0
             ELSE GREATEST(0, 1 - (dl.eta_minutes - 3) / 27)
        END AS f_eta,
        GREATEST(0, (dr.last_100_avg - 4.0) / 1.0) AS f_rating,
        GREATEST(0, (da.acceptance_rate - 0.3) / 0.7) AS f_acceptance,
        GREATEST(0, 1 - (da.cancel_rate_ponderada / 0.15)) AS f_cancel,
        LEAST(1, LOG(GREATEST(1, dh.total_trips + 1)) / LOG(5001)) AS f_history,
        dc.vehicle_match_score AS f_vehicle,
        CASE WHEN dv.is_electric = FALSE THEN 1.0
             WHEN dl.battery_level <= 20 THEN 0
             WHEN dl.battery_level >= 80 THEN 1.0
             ELSE (dl.battery_level - 20) / 60.0
        END AS f_battery,
        GREATEST(0, 1 - (dl.accuracy - 10) / 90) AS f_gps,
        LEAST(1, EXTRACT(EPOCH FROM (NOW() - dl.idle_since)) / 3600 / 2) AS f_idle
    FROM drivers d
    JOIN driver_locations dl ON dl.driver_id = d.id
    LEFT JOIN driver_ratings dr ON dr.driver_id = d.id
    LEFT JOIN driver_acceptance da ON da.driver_id = d.id
    LEFT JOIN driver_trips dh ON dh.driver_id = d.id
    LEFT JOIN driver_category_match dc ON dc.driver_id = d.id
    LEFT JOIN driver_vehicles dv ON dv.driver_id = d.id
    WHERE dl.is_online = TRUE AND dl.is_in_ride = FALSE
)
SELECT
    driver_id,
    (
        f_distance * 20 + f_eta * 15 + f_rating * 15 +
        f_acceptance * 10 + f_cancel * 8 + f_history * 8 +
        f_vehicle * 10 + f_battery * 5 + f_gps * 4 + f_idle * 5
    ) / 100.0 AS final_score
FROM driver_raw_scores
ORDER BY final_score DESC;
```

---

## 6. AI Integration

### 6.1 Recomendacao de Motorista Favorito

A IA analisa o historico de corridas do passageiro para identificar motoristas favoritos.
Motoristas com mais de 3 corridas nos ultimos 30 dias e avaliacao 5 estrelas recebem boost.

```python
# AI Recommendation Engine
async def get_favorite_driver(passenger_id: str) -> dict:
    recent = await db.query("""
        SELECT driver_id, COUNT(*) as trips, AVG(rating) as avg_rating
        FROM rides r JOIN ride_ratings rr ON rr.ride_id = r.id
        WHERE r.passenger_id = :pid
          AND r.created_at >= NOW() - INTERVAL '30 days'
          AND r.status = 'completed'
        GROUP BY driver_id
        HAVING COUNT(*) >= 3 AND AVG(rating) = 5.0
    """, {"pid": passenger_id})

    if not recent:
        return {"recommended": None, "boost": 0}

    favorite = max(recent, key=lambda r: r["trips"])
    return {
        "recommended": favorite["driver_id"],
        "boost": 0.95,
        "reason": "Motorista favorito do passageiro"
    }
```

### 6.2 Predicao de Risco de Cancelamento

A IA calcula a probabilidade de cancelamento com base em 14 features historicas e contextuais.
Se a probabilidade > 30%, o score e penalizado proporcionalmente.

```python
async def predict_cancellation_risk(driver_id: str, context: dict) -> float:
    features = {
        "cancel_rate_7d": await get_cancel_rate(driver_id, 7),
        "cancel_rate_30d": await get_cancel_rate(driver_id, 30),
        "acceptance_rate": await get_acceptance_rate(driver_id),
        "total_trips": await get_total_trips(driver_id),
        "avg_rating": await get_avg_rating(driver_id),
        "hour": context["hour"],
        "day_of_week": context["day_of_week"],
        "is_peak_hour": context["is_peak_hour"],
        "is_raining": context["is_raining"],
        "distance_km": context["distance_km"],
        "zone_type": context["zone_type"],
        "consecutive_rejections": await get_consecutive_rejections(driver_id),
        "hours_since_last_ride": await get_hours_since_last_ride(driver_id),
        "is_near_shift_end": await is_near_shift_end(driver_id),
    }
    return await ml_model.predict("cancel_risk_v3", features)
```

**Aplicacao no Score:**

```
Se cancel_risk > 0.30:
    score = score * (1 - cancel_risk)
```

### 6.3 Ajuste de ETA com Transito em Tempo Real

```python
async def calculate_eta_with_traffic(origin: tuple, dest: tuple) -> dict:
    base = await maps_provider.get_eta(origin, dest);
    features = {
        "current_speed": await get_current_speed(origin, dest),
        "free_flow_speed": await get_free_flow_speed(origin, dest),
        "traffic_density": await get_traffic_density(origin),
        "is_holiday": await is_holiday(),
        "has_accident": await has_accident_nearby(origin, dest),
    }
    adjustment = await ml_model.predict("eta_adjustment_v2", features);
    return base["duration"] * (1 + adjustment);
```

### 6.4 Deteccao de Padroes Suspeitos

```python
async def detect_suspicious_patterns(passenger_id: str, driver_id: str) -> dict:
    history = await db.query("""
        SELECT COUNT(*) as rides,
               COUNT(DISTINCT DATE(created_at)) as days,
               COUNT(*) FILTER (WHERE created_at::TIME BETWEEN '22:00' AND '05:00') as night_rides
        FROM rides
        WHERE passenger_id = :pid AND driver_id = :did
          AND created_at >= NOW() - INTERVAL '30 days'
    """, {"pid": passenger_id, "did": driver_id})

    suspicious = False; reasons = [];
    if history["rides"] >= 10:
        suspicious = True; reasons.append("Excesso de match com mesmo motorista");
    if history["night_rides"] >= 5:
        suspicious = True; reasons.append("Padrao noturno suspeito");
    return {"suspicious": suspicious, "reasons": reasons, "penalty": 0.50 if suspicious else 0}
```

---

## 7. Batch Dispatch

### 7.1 Estrategia de Disparo

```
Round 1: Top 3 drivers simultaneamente (timeout 15s cada)
Round 2: Top 5 drivers simultaneamente (timeout 12s cada)
Round 3: Todos os motoristas disponiveis (timeout 10s cada)
Round 4: Expandir raio de busca +2km, recalcular scores
```

### 7.2 Pseudocodigo do Batch Dispatch

```typescript
interface BatchConfig {
  initialBatchSize: number;      // 3
  expandedBatchSize: number;     // 5
  maxBatchSize: number | null;   // null = all
  initialTimeoutMs: number;      // 15000
  expandedTimeoutMs: number;     // 12000
  finalTimeoutMs: number;        // 10000
  maxRounds: number;             // 3
}

async function batchDispatch(ride, rankedDrivers, config): Promise<DispatchResult> {
  let round = 1;
  let remaining = [...rankedDrivers];

  while (round <= config.maxRounds && remaining.length > 0) {
    const batchSize = round === 1 ? config.initialBatchSize
        : round === 2 ? config.expandedBatchSize
        : (config.maxBatchSize ?? remaining.length);

    const batch = remaining.splice(0, batchSize);
    const timeoutMs = round === 1 ? config.initialTimeoutMs
        : round === 2 ? config.expandedTimeoutMs
        : config.finalTimeoutMs;

    const result = await sendBatchOffers(ride, batch, timeoutMs);
    if (result.status === 'accepted') return result;
    round++;
  }

  return { status: 'no_drivers', rideId: ride.id, roundsAttempted: round - 1 };
}

async function sendBatchOffers(ride, drivers, timeoutMs): Promise<DispatchResult> {
  const promises = drivers.map(d => sendOfferToDriver(ride, d, timeoutMs));
  const result = await Promise.race(promises);
  for (const d of drivers) {
    if (d.driverId !== result.driverId) await cancelOffer(ride.id, d.driverId);
  }
  return result;
}
```

### 7.3 Exemplo de Timeline

```
T+0s   -> Enviar ofertas para Driver A, B, C (top 3)
T+5s   -> Driver B aceita -> Cancelar A e C -> Iniciar Trip
T+15s  -> Todos timeout -> Enviar para Driver D, E, F, G, H (top 5)
T+22s  -> Driver G aceita -> Iniciar Trip
T+37s  -> Nenhum aceitou -> Expandir raio +2km -> Recalcular
```

---

## 8. Fila de Prioridade

### 8.1 Motoristas com Idle Time Alto

A fila de prioridade garante que motoristas ociosos ha mais tempo recebam ofertas primeiro.

```
score_final = score_calculado * (1 + idle_bonus)
idle_bonus = min(0.20, idle_minutes / 600)
```

### 8.2 Passageiros VIP (Top 10% Rating)

Passageiros com rating alto recebem acesso aos motoristas com melhor score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vip_rules', 0, TRUE, 0, '{"passenger_top_pct": 10, "driver_top_pct": 25, "vip_min_rides": 50, "vip_min_rating": 4.80}'
FROM cities WHERE name = 'Sao Paulo';
```

### 8.3 Motoristas VIP (Top 5% Score)

Motoristas no top 5% dos scores recebem boost adicional de 15%.

```
vip_boost = 0.15
score = min(1.0, score * (1 + vip_boost))
```

---

## 9. Cantonamento (Geofencing)

### 9.1 Definicao de Zonas

| Tipo de Zona | Raio Inicial | Expansao | Caracteristicas |
|-------------|-------------|----------|-----------------|
| **Urbana** | 3 km | +2 km | Alta densidade de motoristas |
| **Suburbana** | 10 km | +2 km | Densidade media |
| **Rural** | 30 km | +5 km | Baixa densidade |

### 9.2 Determinacao da Zona

```typescript
async function detectZone(lat, lng, cityId): Promise<ZoneConfig> {
  const zone = await db.queryOne(@"
    SELECT zone_type, search_radius_km, max_radius_km
    FROM geofence_zones
    WHERE city_id = :cityId AND is_active = TRUE
      AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
    LIMIT 1
  @, { cityId, lat, lng });

  if (zone) {
    return { zoneType: zone.zone_type, initialRadiusKm: zone.search_radius_km,
             expansionStepKm: zone.zone_type === 'rural' ? 5 : 2, maxRadiusKm: zone.max_radius_km };
  }

  const density = await getDriverDensity(lat, lng, cityId);
  if (density > 50) return { zoneType: 'urban', initialRadiusKm: 3, expansionStepKm: 2, maxRadiusKm: 10 };
  if (density > 10) return { zoneType: 'suburban', initialRadiusKm: 10, expansionStepKm: 2, maxRadiusKm: 20 };
  return { zoneType: 'rural', initialRadiusKm: 30, expansionStepKm: 5, maxRadiusKm: 60 };
}
```

### 9.3 Consulta Geoespacial

```sql
SELECT dl.driver_id, dl.lat, dl.lng, dl.battery_level, dl.gps_quality,
       EXTRACT(EPOCH FROM (NOW() - dl.idle_since)) / 60 AS idle_minutes,
       ST_Distance(dl.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000 AS distance_km
FROM driver_locations dl
WHERE dl.is_online = TRUE AND dl.is_in_ride = FALSE
  AND ST_DWithin(dl.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius_meters)
  AND dl.driver_id NOT IN (SELECT driver_id FROM driver_blocks WHERE passenger_id = :pid)
ORDER BY distance_km ASC;
```

### 9.4 Expansao Automatica de Raio

```typescript
async function expandSearchRadius(ride, currentRadiusKm, zoneConfig) {
  let radius = currentRadiusKm;
  for (let attempt = 1; attempt <= 5; attempt++) {
    radius += zoneConfig.expansionStepKm;
    if (radius > zoneConfig.maxRadiusKm) radius = zoneConfig.maxRadiusKm;
    const drivers = await findDriversInRadius(ride.originLat, ride.originLng, radius * 1000);
    if (drivers.length > 0) return drivers;
  }
  return null;
}
```

---

## 10. Anti-fraude no Dispatch

### 10.1 Pipeline de Verificacao

```
1. Passenger Blacklist Check
2. Driver Blacklist Check
3. GPS Spoofing Detection
4. Ghost Rides Detection
5. Device Session Validation
6. Suspicious Pattern Detection (AI)
7. Geolocation Anomaly Check
8. Rate Limit Check
```

### 10.2 Verificacao de Blacklist

```typescript
async function checkBlacklist(passengerId, driverIds): Promise<FraudResult> {
  const passengerBlocked = await db.exists(@'
    SELECT 1 FROM blacklist WHERE entity_type = 'passenger'
      AND entity_id = :pid AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  @, { pid: passengerId });

  if (passengerBlocked) return { blocked: true, reason: 'Passageiro na blacklist', severity: 'high' };
  return { blocked: false };
}
```

### 10.3 Deteccao de GPS Spoofing

```typescript
async function detectGpsSpoofing(driverId, currentLoc, prevLoc): Promise<SpoofingResult> {
  if (!prevLoc) return { spoofing: false };

  const timeDiff = (currentLoc.timestamp - prevLoc.timestamp) / 1000;
  const distance = haversineDistance(prevLoc, currentLoc);
  const calcSpeed = (distance / 1000) / (timeDiff / 3600);
  const repSpeed = currentLoc.speed ?? 0;

  const anomalies = [];
  if (Math.abs(calcSpeed - repSpeed) > 40) anomalies.push('Velocidade incompativel');
  if (calcSpeed > 200) anomalies.push('Velocidade impossivel');
  if (distance > 1000 && timeDiff < 10) anomalies.push('Deslocamento muito rapido');

  return { spoofing: anomalies.length > 0, confidence: Math.min(1, anomalies.length * 0.3), anomalies };
}
```

### 10.4 Deteccao de Corridas Fantasmas

```typescript
async function detectGhostRides(passengerId, origin): Promise<GhostRideResult> {
  const recent = await db.queryOne(@'
    SELECT COUNT(*) as count FROM rides
    WHERE passenger_id = :pid
      AND created_at >= NOW() - INTERVAL '30 minutes'
      AND ABS(origin_lat - :lat) < 0.001
      AND ABS(origin_lng - :lng) < 0.001
  @, { pid: passengerId, lat: origin.lat, lng: origin.lng });

  if (recent.count >= 5) return { ghostRide: true, action: 'block' };
  if (recent.count >= 3) return { ghostRide: true, action: 'flag' };
  return { ghostRide: false };
}
```

### 10.5 Pipeline Anti-fraude Completo

```typescript
async function antiFraudPipeline(rideRequest, drivers): Promise<AntiFraudResult> {
  const checks = await Promise.all([
    checkPassengerBlacklist(rideRequest.passengerId),
    checkDriverBlacklist(drivers.map(d => d.driverId)),
    detectGpsSpoofingBatch(drivers.slice(0, 5)),
    detectGhostRides(rideRequest.passengerId, rideRequest.origin),
    validateDeviceSession(rideRequest.passengerId, rideRequest.deviceId),
    checkRateLimit(rideRequest.passengerId),
  ]);

  const failed = checks.filter(c => !c.passed || c.blocked);
  if (failed.length > 0) {
    await eventBus.publish('dispatch.fraud.blocked', {
      rideId: rideRequest.rideId, checks: failed
    });
    return { allowed: false, blockedChecks: failed };
  }
  return { allowed: true, blockedChecks: [] };
}
```

---

## 11. Como a IA Influencia o Score

### 11.1 Pipeline de Influencia da IA

```
1. Score Base (10 fatores com pesos do dispatcher_rules)
2. AI: Predicao de Risco de Cancelamento
   Se risco > 30% -> score *= (1 - risco)
3. AI: Recomendacao de Motorista Favorito
   Se favorito na lista -> score += 0.95 (limitado a 1.0)
4. AI: Ajuste de ETA com Transito
5. AI: Deteccao de Padroes Suspeitos
   Se suspeito -> penalidade de ate 0.50
6. Score Final -> Ranking
```

### 11.2 Modelos de ML Utilizados

| Modelo | Framework | Output | Frequencia |
|--------|-----------|--------|------------|
| cancel_risk_v3 | XGBoost | Probabilidade [0,1] | Diaria |
| eta_adjustment_v2 | LightGBM | Fator de ajuste | Semanal |
| favorite_driver_v1 | Regras + SQL | Driver ID | Tempo real |
| suspicious_pattern_v2 | Random Forest | Score de suspeicao [0,1] | Semanal |

### 11.3 Arquitetura de Inferencia

```
Dispatcher Service -> AI Service (Python) -> ML Models (ONNX)
                        |
                   Feature Store (Redis)
                        |
                   Model Registry (S3)
```

---

## 12. Regras de Fallback

### 12.1 Matriz de Fallbacks

| Condicao | Acao | Mensagem |
|----------|------|----------|
| dispatcher_rules nao existe para a cidade | Usar pesos padrao | Log warning |
| driver_locations vazio | Retornar erro | "Nenhum motorista disponivel" |
| Categoria nao existe | Retornar erro | "Categoria invalida" |
| Falha no modelo de IA | Ignorar AI influence | Log erro |
| Falha no Redis | Buscar direto do PostgreSQL | Log warning |
| Timeout no mapa/ETA | Usar ETA aproximado | Log warning |

### 12.2 Pesos Padrao (Fallback)

```typescript
const FALLBACK_WEIGHTS: Record<string, number> = {
  distance: 20, eta: 15, rating: 15, acceptance_rate: 10,
  cancellation_rate: 8, trip_history: 8, vehicle_match: 10,
  battery_level: 5, gps_quality: 4, idle_time: 5,
};

async function loadDispatcherRules(cityId: string): Promise<Record<string, number>> {
  try {
    const rules = await db.query(@'
      SELECT weight_name, weight_value FROM dispatcher_rules
      WHERE city_id = :cityId AND enabled = TRUE
    @, { cityId });
    if (rules.length === 0) return { ...FALLBACK_WEIGHTS };
    const weights = { ...FALLBACK_WEIGHTS };
    for (const rule of rules) weights[rule.weight_name] = rule.weight_value;
    return weights;
  } catch {
    return { ...FALLBACK_WEIGHTS };
  }
}
```

### 12.3 Fallback de Motoristas

```typescript
async function findDriversWithFallback(ride): Promise<DriverLocation[]> {
  let radius = zoneConfig.initialRadiusKm;
  let drivers = [];
  for (let attempt = 1; attempt <= 5; attempt++) {
    drivers = await findDriversInRadius(ride.originLat, ride.originLng, radius * 1000);
    if (drivers.length > 0) return drivers;
    radius += zoneConfig.expansionStepKm;
    if (radius > zoneConfig.maxRadiusKm) radius = zoneConfig.maxRadiusKm;
  }
  return drivers;
}
```

---

## 13. Criterios de Desempate

### 13.1 Hierarquia de Desempate

```
Nivel 1: Menor ETA
Nivel 2: Maior Rating (ultimas 100)
Nivel 3: Menor Taxa de Cancelamento
Nivel 4: Maior Idle Time
Nivel 5: Menor Distancia (ultimo recurso)
```

### 13.2 Implementacao

```typescript
function tiebreakerSort(drivers: RankedDriver[]): RankedDriver[] {
  return drivers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.eta !== b.eta) return a.eta - b.eta;
    if (a.rating !== b.rating) return b.rating - a.rating;
    if (a.cancelRate !== b.cancelRate) return a.cancelRate - b.cancelRate;
    if (a.idleMinutes !== b.idleMinutes) return b.idleMinutes - a.idleMinutes;
    return a.distanceKm - b.distanceKm;
  });
}
```

---

## 14. Eventos do Event Bus

### 14.1 Catalogo de Eventos

| Evento | Descricao | Payload |
|--------|-----------|---------|
| dispatch.search.started | Inicio da busca | ride_id, passenger_id, origin, category_id, city_id |
| dispatch.driver.scored | Motorista pontuado | ride_id, driver_id, score, factors, weights |
| dispatch.offer.sent | Oferta enviada | ride_id, driver_id, offer_id, score, rank, timeout_ms |
| dispatch.offer.accepted | Motorista aceitou | ride_id, driver_id, offer_id, response_time_ms |
| dispatch.offer.timeout | Motorista nao respondeu | ride_id, driver_id, offer_id, timeout_ms |
| dispatch.offer.rejected | Motorista rejeitou | ride_id, driver_id, offer_id, reason |
| dispatch.no.drivers | Nenhum motorista disponivel | ride_id, city_id, zone_type, radius_km |
| dispatch.fraud.blocked | Corrida bloqueada por fraude | ride_id, passenger_id, checks, severity |
| dispatch.radius.expanded | Raio expandido | ride_id, attempt, radius_km, drivers_found |

### 14.2 Schema dos Eventos (CloudEvents)

```json
{
  "specversion": "1.0",
  "type": "com.txapp.dispatch.search.started",
  "source": "/dispatcher/v3",
  "id": "evt_001",
  "time": "2026-07-13T14:30:00Z",
  "data": {
    "ride_id": "r_001",
    "passenger_id": "p_123",
    "origin": { "lat": -23.5505, "lng": -46.6333 },
    "category_id": "cat_001",
    "city_id": "city_sp"
  }
}
```

### 14.3 Dead Letter Queue

```sql
CREATE TABLE event_dlq (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(128) NOT NULL,
    event_payload   JSONB NOT NULL,
    error_message   TEXT,
    attempt_count   SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 15. Configuracao de Pesos por Cidade

### 15.1 Exemplo de Configuracao

```sql
-- Sao Paulo (densidade alta)
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'distance', 20, TRUE, 1, '{"max_distance_km": 20, "ideal_distance_km": 1}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'eta', 15, TRUE, 2, '{"max_eta_minutes": 20, "ideal_eta_minutes": 3, "use_traffic": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'rating', 15, TRUE, 3, '{"min_rating": 4.0, "max_rating": 5.0}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'acceptance_rate', 10, TRUE, 4, '{"lookback_rides": 50, "min_acceptance": 0.3}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'cancellation_rate', 8, TRUE, 5, '{"lookback_rides": 50, "max_cancel_rate": 0.15}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'trip_history', 8, TRUE, 6, '{"max_trips": 5000, "log_scale": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vehicle_match', 10, TRUE, 7, '{"exact_match": 1.0, "upgrade_match": 0.8}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'battery_level', 5, TRUE, 8, '{"min_battery": 20, "ideal_battery": 80, "electric_only": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'gps_quality', 4, TRUE, 9, '{"min_accuracy_meters": 100, "ideal_accuracy_meters": 10}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'idle_time', 5, TRUE, 10, '{"max_idle_minutes": 120, "boost_after_minutes": 30}'
FROM cities WHERE name = 'Sao Paulo';
```

### 15.2 Painel de Administracao

- **CRUD completo** de dispatcher_rules por cidade
- **Simulador de score** -- testar combinacoes com dados reais
- **Historico de alteracoes** -- auditoria de mudancas
- **Validacao** -- soma dos pesos nao deve ultrapassar 100%
- **Comparacao A/B** -- testar configuracoes em producao

```sql
CREATE TABLE dispatcher_rules_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID NOT NULL REFERENCES dispatcher_rules(id),
    old_values      JSONB,
    new_values      JSONB,
    changed_by      UUID REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason   TEXT
);
```

---

## 16. Monitoramento e Observabilidade

### 16.1 Metricas-Chave (KPIs)

| Metrica | Descricao | Alerta |
|---------|-----------|--------|
| dispatch.match_time_ms | Tempo total de match | > 15s (P1) |
| dispatch.score_calc_time_ms | Tempo de calculo de score | > 500ms (P2) |
| dispatch.acceptance_rate | Taxa de aceitacao geral | < 70% (P1) |
| dispatch.cancellation_rate | Taxa de cancelamento geral | > 10% (P1) |
| dispatch.no_drivers_rate | % de corridas sem motoristas | > 5% (P1) |
| dispatch.fraud_blocked_rate | % de corridas bloqueadas | > 2% (P2) |
| dispatch.ai_latency_ms | Latencia do servico de IA | > 200ms (P3) |
| dispatch.drivers_per_ride | Media de motoristas avaliados | < 3 (P2) |

### 16.2 Prometheus Metrics

```typescript
const metrics = {
  dispatchMatchTime: new Histogram({
    name: 'dispatch_match_time_ms',
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000, 15000, 30000],
    labelNames: ['city_id', 'zone_type'],
  }),
  dispatchEventsTotal: new Counter({
    name: 'dispatch_events_total',
    labelNames: ['event_type', 'city_id'],
  }),
  dispatchAvailableDrivers: new Gauge({
    name: 'dispatch_available_drivers',
    labelNames: ['city_id', 'zone_type'],
  }),
};
```

---

## 17. Tratamento de Erros

### 17.1 Matriz de Erros e Acoes

| Erro | Causa | Acao | Recuperacao |
|------|-------|------|-------------|
| DB_CONNECTION_ERROR | Banco indisponivel | Tentar reconexao (3x) | Usar cache Redis |
| REDIS_CONNECTION_ERROR | Redis indisponivel | Logar erro | Buscar do PostgreSQL |
| MAPS_PROVIDER_ERROR | API de mapas fora | Usar ETA aproximado | Tentar novamente |
| AI_SERVICE_TIMEOUT | IA nao respondeu | Ignorar ajustes de IA | Score base |
| INVALID_PAYLOAD | Dados incorretos | Retornar 400 | N/A |
| RATE_LIMIT_EXCEEDED | Muitas requisicoes | Retornar 429 | Retry com backoff |

### 17.2 Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call(fn, fallback) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
        this.state = 'half-open';
      } else { return fallback(); }
    }
    try {
      const result = await fn();
      this.state = 'closed';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.threshold) this.state = 'open';
      return fallback();
    }
  }
}
```

### 17.3 Retry Policy

```typescript
async function withRetry(fn, { maxRetries = 3, baseDelayMs = 100 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt) + Math.random() * 100);
    }
  }
}
```

---

## 18. Apendice: Pseudocodigo Completo

### 18.1 Orquestrador Principal

```typescript
class DispatchOrquestrator {
  async dispatch(rideRequest: RideRequest): Promise<DispatchResponse> {
    const startTime = Date.now();

    this.validateRequest(rideRequest);

    const zoneConfig = await this.geoService.detectZone(
      rideRequest.origin, rideRequest.cityId
    );

    await this.updateRideStatus(rideRequest.rideId, 'scoring');
    await this.eventBus.publish('dispatch.search.started', {
      ride_id: rideRequest.rideId,
      passenger_id: rideRequest.passengerId,
      origin: rideRequest.origin,
      category_id: rideRequest.categoryId,
      city_id: rideRequest.cityId,
    });

    const fraudResult = await this.antiFraud.check(rideRequest);
    if (!fraudResult.allowed) {
      await this.updateRideStatus(rideRequest.rideId, 'fraud_blocked');
      return { status: 'fraud_blocked', error: 'Corrida bloqueada por seguranca' };
    }

    const drivers = await this.geoService.findDriversNearby(
      rideRequest.origin, zoneConfig, rideRequest.categoryId
    );

    if (drivers.length === 0) {
      await this.eventBus.publish('dispatch.no.drivers', {
        ride_id: rideRequest.rideId, zone_type: zoneConfig.zoneType
      });
      return { status: 'no_drivers', error: 'Nenhum motorista disponivel' };
    }

    const weights = await this.loadWeights(rideRequest.cityId);
    const scoredDrivers = [];

    for (const driver of drivers) {
      const score = await this.scoreEngine.calculate(driver, rideRequest, weights);
      scoredDrivers.push(score);
      await this.eventBus.publish('dispatch.driver.scored', {
        ride_id: rideRequest.rideId, driver_id: driver.driverId,
        score: score.finalScore, factors: score.factors, weights_used: weights,
      });
    }

    const aiInfluence = await this.aiService.influenceScores(scoredDrivers, rideRequest);
    const adjustedDrivers = this.applyAiInfluence(scoredDrivers, aiInfluence);
    const rankedDrivers = this.rankDrivers(adjustedDrivers, rideRequest);

    const result = await this.batchDispatcher.dispatch(rideRequest, rankedDrivers, zoneConfig);

    if (result.status === 'accepted') {
      await this.startTrip(result);
      return {
        status: 'accepted',
        rideId: rideRequest.rideId,
        driverId: result.driverId,
        eta: result.eta,
        matchTimeMs: Date.now() - startTime,
      };
    }

    return { status: 'no_drivers', error: 'Nenhum motorista disponivel' };
  }

  private applyAiInfluence(drivers, aiInfluence) {
    return drivers.map(driver => {
      let score = driver.finalScore;
      const cancelRisk = aiInfluence.cancelRisks[driver.driverId] ?? 0;
      if (cancelRisk > 0.30) score *= (1 - cancelRisk);
      if (aiInfluence.favoriteDriver === driver.driverId) score = Math.min(1.0, score + 0.95);
      const penalty = aiInfluence.suspiciousPenalties[driver.driverId] ?? 0;
      if (penalty > 0) score *= (1 - penalty);
      return { ...driver, finalScore: score };
    });
  }
}
```

### 18.2 Score Engine

```typescript
class ScoreEngine {
  async calculate(driver, ride, weights) {
    const factors = {};

    factors.distance = this.calcDistance(driver, ride);
    factors.eta = this.calcETA(driver, ride);
    factors.rating = await this.calcRating(driver.driverId);
    factors.acceptance_rate = await this.calcAcceptanceRate(driver.driverId);
    factors.cancellation_rate = await this.calcCancellationRate(driver.driverId);
    factors.trip_history = await this.calcTripHistory(driver.driverId);
    factors.vehicle_match = await this.calcVehicleMatch(driver.driverId, ride.categoryId);
    factors.battery_level = this.calcBatteryLevel(driver);
    factors.gps_quality = this.calcGpsQuality(driver);
    factors.idle_time = this.calcIdleTime(driver);

    let finalScore = 0, totalWeight = 0;
    for (const [name, value] of Object.entries(factors)) {
      const weight = weights[name] ?? 0;
      finalScore += value * weight;
      totalWeight += weight;
    }
    finalScore = totalWeight > 0 ? finalScore / totalWeight : 0;

    return {
      driverId: driver.driverId,
      finalScore: Math.round(finalScore * 1000) / 1000,
      factors, eta: driver.etaMinutesApprox,
      rating: factors.rating,
      idleMinutes: driver.idleMinutes,
    };
  }

  private calcDistance(driver, ride) {
    const dist = haversineDistance(ride.origin, { lat: driver.lat, lng: driver.lng });
    if (dist <= 1) return 1.0;
    return Math.max(0, 1 - (dist - 1) / 29);
  }
}
```

### 18.3 Anti-Fraud Service

```typescript
class AntiFraudService {
  async check(rideRequest) {
    const checks = await Promise.all([
      this.checkPassengerBlacklist(rideRequest.passengerId),
      this.checkDeviceSession(rideRequest.passengerId, rideRequest.deviceId),
      this.checkGhostRides(rideRequest),
      this.checkRateLimit(rideRequest.passengerId),
    ]);
    const failed = checks.filter(c => !c.passed);
    if (failed.length > 0) {
      return { allowed: false, blockedChecks: failed };
    }
    return { allowed: true, blockedChecks: [] };
  }
}
```

---

*Fim do documento. Versao 3.0.*


### 4.10 Tabelas Auxiliares

```sql
-- Cidades atendidas
CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    state           VARCHAR(64),
    country         VARCHAR(64) NOT NULL,
    lat             NUMERIC(10, 7),
    lng             NUMERIC(10, 7),
    timezone        VARCHAR(64) DEFAULT 'America/Sao_Paulo',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorias de corrida
CREATE TABLE ride_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64) NOT NULL,
    code            VARCHAR(16) NOT NULL UNIQUE,
    description     TEXT,
    base_fare       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_per_km    NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_rating      NUMERIC(3, 2) DEFAULT 4.50,
    max_passengers  SMALLINT DEFAULT 4,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zonas de geofencing
CREATE TABLE geofence_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id         UUID NOT NULL REFERENCES cities(id),
    name            VARCHAR(128) NOT NULL,
    zone_type       VARCHAR(16) NOT NULL CHECK (zone_type IN ('urban', 'suburban', 'rural')),
    boundary        GEOGRAPHY(Polygon, 4326) NOT NULL,
    is_blacklisted  BOOLEAN NOT NULL DEFAULT FALSE,
    max_radius_km   NUMERIC(5, 2) NOT NULL,
    search_radius_km NUMERIC(5, 2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_zones_city ON geofence_zones(city_id);
CREATE INDEX idx_geofence_zones_geom ON geofence_zones USING GIST (boundary);
CREATE INDEX idx_geofence_zones_type ON geofence_zones(zone_type);

-- Blacklist
CREATE TABLE blacklist (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(16) NOT NULL CHECK (entity_type IN ('passenger', 'driver')),
    entity_id       UUID NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    blocked_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_blacklist_entity ON blacklist(entity_type, entity_id, is_active);
```

---

## 5. Algoritmo de Score (10 Fatores)

O score final de cada motorista e uma combinacao linear ponderada de 10 fatores.
Cada peso e carregado da tabela `dispatcher_rules` para a cidade especifica.

### Formula Geral

```
Score_Driver = Soma (Fator_i * Peso_i) / Soma Peso_i

Onde:
  - Fator_i pertence a [0, 1] e o valor normalizado do fator i
  - Peso_i pertence a [0, 100] e o peso configuravel do fator i
  - Score_Driver pertence a [0, 1] e o score final
```

### 5.1 Distance (20%) -- Distancia

**Objetivo:** Quanto menor a distancia do motorista ao passageiro, maior a pontuacao.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'distance', 20, TRUE, 1, '{"max_distance_km": 30, "ideal_distance_km": 1}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
distancia = haversine(origem_passageiro, localizacao_motorista)

Se distancia <= ideal_distance:
    fator_distance = 1.0
Senao:
    fator_distance = max(0, 1 - (distancia - ideal) / (maximo - ideal))

Onde:
  - ideal_distance_km = 1km (configuravel via params)
  - max_distance_km = 30km (configuravel via params)
```

### 5.2 ETA (15%) -- Tempo Estimado de Chegada

**Objetivo:** Menor tempo estimado (considerando transito real) = maior pontuacao.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'eta', 15, TRUE, 2, '{"max_eta_minutes": 30, "ideal_eta_minutes": 3, "use_traffic": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
eta = estimar_tempo_com_transito(origem_passageiro, localizacao_motorista)

Se eta <= ideal_eta:
    fator_eta = 1.0
Senao:
    fator_eta = max(0, 1 - (eta - ideal) / (maximo - ideal))
```

**AI Integration:** O ETA pode ser ajustado por modelo de ML que aprende padres de transito historicos.

### 5.3 Rating (15%) -- Avaliacao Media

**Objetivo:** Motoristas com melhores avaliacoes recebem pontuacao mais alta.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'rating', 15, TRUE, 3, '{"min_rating": 4.0, "max_rating": 5.0, "lookback_rides": 100}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
avg_rating = driver_ratings.last_100_avg
fator_rating = max(0, (avg_rating - min_rating) / (max_rating - min_rating))
```

### 5.4 Acceptance Rate (10%) -- Taxa de Aceitacao

**Objetivo:** Motoristas que aceitam mais corridas sao priorizados.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'acceptance_rate', 10, TRUE, 4, '{"lookback_rides": 50, "min_acceptance": 0.3}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
acceptance = aceitas / total_ofertas (ultimos 50)
fator_acceptance = max(0, (acceptance - min_acceptance) / (1 - min_acceptance))
```

### 5.5 Cancellation Rate (8%) -- Taxa de Cancelamento

**Objetivo:** Baixa taxa de cancelamento = maior score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'cancellation_rate', 8, TRUE, 5, '{"lookback_rides": 50, "max_cancel_rate": 0.15, "driver_side_multiplier": 2.0}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
cancel_rate_ponderada = (cancel_passageiro + cancel_motorista * 2.0) / total
fator_cancel = max(0, 1 - (cancel_rate_ponderada / max_cancel_rate))
```

### 5.6 Trip History (8%) -- Historico de Corridas

**Objetivo:** Motoristas experientes (mais corridas completadas) recebem score maior.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'trip_history', 8, TRUE, 6, '{"min_trips": 10, "max_trips": 5000, "log_scale": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_history = min(1, log(total_trips + 1) / log(max_trips + 1))
```

### 5.7 Vehicle Match (10%) -- Compatibilidade do Veiculo

**Objetivo:** Compatibilidade total do veiculo com a categoria da corrida.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vehicle_match', 10, TRUE, 7, '{"exact_match": 1.0, "upgrade_match": 0.8, "downgrade_match": 0.3}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
Se categoria exata:     fator_vehicle = 1.0
Se upgrade (superior):  fator_vehicle = 0.8
Se downgrade (inferior): fator_vehicle = 0.3
Senao:                  fator_vehicle = 0
```

### 5.8 Battery Level (5%) -- Nivel de Bateria

**Objetivo:** Apenas para veiculos eletricos. Bateria alta = maior score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'battery_level', 5, TRUE, 8, '{"min_battery": 20, "ideal_battery": 80, "electric_only": true}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
Se nao e eletrico: fator_battery = 1.0
Se battery <= 20%:  fator_battery = 0
Se battery >= 80%:  fator_battery = 1.0
Senao: fator_battery = (battery - 20) / 60
```

### 5.9 GPS Quality (4%) -- Precisao da Localizacao

**Objetivo:** Motoristas com localizacao mais precisa sao priorizados.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'gps_quality', 4, TRUE, 9, '{"min_accuracy_meters": 100, "ideal_accuracy_meters": 10}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_gps = max(0, 1 - (accuracy - ideal) / (min_accuracy - ideal))
```

### 5.10 Idle Time (5%) -- Tempo Ocioso

**Objetivo:** Priorizar motoristas que esperam ha mais tempo (justica distributiva).

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'idle_time', 5, TRUE, 10, '{"max_idle_minutes": 120, "boost_after_minutes": 30}'
FROM cities WHERE name = 'Sao Paulo';
```

**Calculo:**

```
fator_idle = min(1, idle_minutes / max_idle)
```

### Exemplo de Consulta Agregada

```sql
WITH driver_raw_scores AS (
    SELECT
        d.id AS driver_id,
        CASE WHEN dl.distance_km <= 1 THEN 1.0
             ELSE GREATEST(0, 1 - (dl.distance_km - 1) / 29)
        END AS f_distance,
        CASE WHEN dl.eta_minutes <= 3 THEN 1.0
             ELSE GREATEST(0, 1 - (dl.eta_minutes - 3) / 27)
        END AS f_eta,
        GREATEST(0, (dr.last_100_avg - 4.0) / 1.0) AS f_rating,
        GREATEST(0, (da.acceptance_rate - 0.3) / 0.7) AS f_acceptance,
        GREATEST(0, 1 - (da.cancel_rate_ponderada / 0.15)) AS f_cancel,
        LEAST(1, LOG(GREATEST(1, dh.total_trips + 1)) / LOG(5001)) AS f_history,
        dc.vehicle_match_score AS f_vehicle,
        CASE WHEN dv.is_electric = FALSE THEN 1.0
             WHEN dl.battery_level <= 20 THEN 0
             WHEN dl.battery_level >= 80 THEN 1.0
             ELSE (dl.battery_level - 20) / 60.0
        END AS f_battery,
        GREATEST(0, 1 - (dl.accuracy - 10) / 90) AS f_gps,
        LEAST(1, EXTRACT(EPOCH FROM (NOW() - dl.idle_since)) / 3600 / 2) AS f_idle
    FROM drivers d
    JOIN driver_locations dl ON dl.driver_id = d.id
    LEFT JOIN driver_ratings dr ON dr.driver_id = d.id
    LEFT JOIN driver_acceptance da ON da.driver_id = d.id
    LEFT JOIN driver_trips dh ON dh.driver_id = d.id
    LEFT JOIN driver_category_match dc ON dc.driver_id = d.id
    LEFT JOIN driver_vehicles dv ON dv.driver_id = d.id
    WHERE dl.is_online = TRUE AND dl.is_in_ride = FALSE
)
SELECT
    driver_id,
    (
        f_distance * 20 + f_eta * 15 + f_rating * 15 +
        f_acceptance * 10 + f_cancel * 8 + f_history * 8 +
        f_vehicle * 10 + f_battery * 5 + f_gps * 4 + f_idle * 5
    ) / 100.0 AS final_score
FROM driver_raw_scores
ORDER BY final_score DESC;
```

---

## 6. AI Integration

### 6.1 Recomendacao de Motorista Favorito

A IA analisa o historico de corridas do passageiro para identificar motoristas favoritos.
Motoristas com mais de 3 corridas nos ultimos 30 dias e avaliacao 5 estrelas recebem boost.

```python
# AI Recommendation Engine
async def get_favorite_driver(passenger_id: str) -> dict:
    recent = await db.query("""
        SELECT driver_id, COUNT(*) as trips, AVG(rating) as avg_rating
        FROM rides r JOIN ride_ratings rr ON rr.ride_id = r.id
        WHERE r.passenger_id = :pid
          AND r.created_at >= NOW() - INTERVAL '30 days'
          AND r.status = 'completed'
        GROUP BY driver_id
        HAVING COUNT(*) >= 3 AND AVG(rating) = 5.0
    """, {"pid": passenger_id})

    if not recent:
        return {"recommended": None, "boost": 0}

    favorite = max(recent, key=lambda r: r["trips"])
    return {
        "recommended": favorite["driver_id"],
        "boost": 0.95,
        "reason": "Motorista favorito do passageiro"
    }
```

### 6.2 Predicao de Risco de Cancelamento

A IA calcula a probabilidade de cancelamento com base em 14 features historicas e contextuais.
Se a probabilidade > 30%, o score e penalizado proporcionalmente.

```python
async def predict_cancellation_risk(driver_id: str, context: dict) -> float:
    features = {
        "cancel_rate_7d": await get_cancel_rate(driver_id, 7),
        "cancel_rate_30d": await get_cancel_rate(driver_id, 30),
        "acceptance_rate": await get_acceptance_rate(driver_id),
        "total_trips": await get_total_trips(driver_id),
        "avg_rating": await get_avg_rating(driver_id),
        "hour": context["hour"],
        "day_of_week": context["day_of_week"],
        "is_peak_hour": context["is_peak_hour"],
        "is_raining": context["is_raining"],
        "distance_km": context["distance_km"],
        "zone_type": context["zone_type"],
        "consecutive_rejections": await get_consecutive_rejections(driver_id),
        "hours_since_last_ride": await get_hours_since_last_ride(driver_id),
        "is_near_shift_end": await is_near_shift_end(driver_id),
    }
    return await ml_model.predict("cancel_risk_v3", features)
```

**Aplicacao no Score:**

```
Se cancel_risk > 0.30:
    score = score * (1 - cancel_risk)
```

### 6.3 Ajuste de ETA com Transito em Tempo Real

```python
async def calculate_eta_with_traffic(origin: tuple, dest: tuple) -> dict:
    base = await maps_provider.get_eta(origin, dest);
    features = {
        "current_speed": await get_current_speed(origin, dest),
        "free_flow_speed": await get_free_flow_speed(origin, dest),
        "traffic_density": await get_traffic_density(origin),
        "is_holiday": await is_holiday(),
        "has_accident": await has_accident_nearby(origin, dest),
    }
    adjustment = await ml_model.predict("eta_adjustment_v2", features);
    return base["duration"] * (1 + adjustment);
```

### 6.4 Deteccao de Padroes Suspeitos

```python
async def detect_suspicious_patterns(passenger_id: str, driver_id: str) -> dict:
    history = await db.query("""
        SELECT COUNT(*) as rides,
               COUNT(DISTINCT DATE(created_at)) as days,
               COUNT(*) FILTER (WHERE created_at::TIME BETWEEN '22:00' AND '05:00') as night_rides
        FROM rides
        WHERE passenger_id = :pid AND driver_id = :did
          AND created_at >= NOW() - INTERVAL '30 days'
    """, {"pid": passenger_id, "did": driver_id})

    suspicious = False; reasons = [];
    if history["rides"] >= 10:
        suspicious = True; reasons.append("Excesso de match com mesmo motorista");
    if history["night_rides"] >= 5:
        suspicious = True; reasons.append("Padrao noturno suspeito");
    return {"suspicious": suspicious, "reasons": reasons, "penalty": 0.50 if suspicious else 0}
```

---

## 7. Batch Dispatch

### 7.1 Estrategia de Disparo

```
Round 1: Top 3 drivers simultaneamente (timeout 15s cada)
Round 2: Top 5 drivers simultaneamente (timeout 12s cada)
Round 3: Todos os motoristas disponiveis (timeout 10s cada)
Round 4: Expandir raio de busca +2km, recalcular scores
```

### 7.2 Pseudocodigo do Batch Dispatch

```typescript
interface BatchConfig {
  initialBatchSize: number;      // 3
  expandedBatchSize: number;     // 5
  maxBatchSize: number | null;   // null = all
  initialTimeoutMs: number;      // 15000
  expandedTimeoutMs: number;     // 12000
  finalTimeoutMs: number;        // 10000
  maxRounds: number;             // 3
}

async function batchDispatch(ride, rankedDrivers, config): Promise<DispatchResult> {
  let round = 1;
  let remaining = [...rankedDrivers];

  while (round <= config.maxRounds && remaining.length > 0) {
    const batchSize = round === 1 ? config.initialBatchSize
        : round === 2 ? config.expandedBatchSize
        : (config.maxBatchSize ?? remaining.length);

    const batch = remaining.splice(0, batchSize);
    const timeoutMs = round === 1 ? config.initialTimeoutMs
        : round === 2 ? config.expandedTimeoutMs
        : config.finalTimeoutMs;

    const result = await sendBatchOffers(ride, batch, timeoutMs);
    if (result.status === 'accepted') return result;
    round++;
  }

  return { status: 'no_drivers', rideId: ride.id, roundsAttempted: round - 1 };
}

async function sendBatchOffers(ride, drivers, timeoutMs): Promise<DispatchResult> {
  const promises = drivers.map(d => sendOfferToDriver(ride, d, timeoutMs));
  const result = await Promise.race(promises);
  for (const d of drivers) {
    if (d.driverId !== result.driverId) await cancelOffer(ride.id, d.driverId);
  }
  return result;
}
```

### 7.3 Exemplo de Timeline

```
T+0s   -> Enviar ofertas para Driver A, B, C (top 3)
T+5s   -> Driver B aceita -> Cancelar A e C -> Iniciar Trip
T+15s  -> Todos timeout -> Enviar para Driver D, E, F, G, H (top 5)
T+22s  -> Driver G aceita -> Iniciar Trip
T+37s  -> Nenhum aceitou -> Expandir raio +2km -> Recalcular
```

---

## 8. Fila de Prioridade

### 8.1 Motoristas com Idle Time Alto

A fila de prioridade garante que motoristas ociosos ha mais tempo recebam ofertas primeiro.

```
score_final = score_calculado * (1 + idle_bonus)
idle_bonus = min(0.20, idle_minutes / 600)
```

### 8.2 Passageiros VIP (Top 10% Rating)

Passageiros com rating alto recebem acesso aos motoristas com melhor score.

```sql
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vip_rules', 0, TRUE, 0, '{"passenger_top_pct": 10, "driver_top_pct": 25, "vip_min_rides": 50, "vip_min_rating": 4.80}'
FROM cities WHERE name = 'Sao Paulo';
```

### 8.3 Motoristas VIP (Top 5% Score)

Motoristas no top 5% dos scores recebem boost adicional de 15%.

```
vip_boost = 0.15
score = min(1.0, score * (1 + vip_boost))
```

---

## 9. Cantonamento (Geofencing)

### 9.1 Definicao de Zonas

| Tipo de Zona | Raio Inicial | Expansao | Caracteristicas |
|-------------|-------------|----------|-----------------|
| **Urbana** | 3 km | +2 km | Alta densidade de motoristas |
| **Suburbana** | 10 km | +2 km | Densidade media |
| **Rural** | 30 km | +5 km | Baixa densidade |

### 9.2 Determinacao da Zona

```typescript
async function detectZone(lat, lng, cityId): Promise<ZoneConfig> {
  const zone = await db.queryOne(@"
    SELECT zone_type, search_radius_km, max_radius_km
    FROM geofence_zones
    WHERE city_id = :cityId AND is_active = TRUE
      AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
    LIMIT 1
  @, { cityId, lat, lng });

  if (zone) {
    return { zoneType: zone.zone_type, initialRadiusKm: zone.search_radius_km,
             expansionStepKm: zone.zone_type === 'rural' ? 5 : 2, maxRadiusKm: zone.max_radius_km };
  }

  const density = await getDriverDensity(lat, lng, cityId);
  if (density > 50) return { zoneType: 'urban', initialRadiusKm: 3, expansionStepKm: 2, maxRadiusKm: 10 };
  if (density > 10) return { zoneType: 'suburban', initialRadiusKm: 10, expansionStepKm: 2, maxRadiusKm: 20 };
  return { zoneType: 'rural', initialRadiusKm: 30, expansionStepKm: 5, maxRadiusKm: 60 };
}
```

### 9.3 Consulta Geoespacial

```sql
SELECT dl.driver_id, dl.lat, dl.lng, dl.battery_level, dl.gps_quality,
       EXTRACT(EPOCH FROM (NOW() - dl.idle_since)) / 60 AS idle_minutes,
       ST_Distance(dl.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000 AS distance_km
FROM driver_locations dl
WHERE dl.is_online = TRUE AND dl.is_in_ride = FALSE
  AND ST_DWithin(dl.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius_meters)
  AND dl.driver_id NOT IN (SELECT driver_id FROM driver_blocks WHERE passenger_id = :pid)
ORDER BY distance_km ASC;
```

### 9.4 Expansao Automatica de Raio

```typescript
async function expandSearchRadius(ride, currentRadiusKm, zoneConfig) {
  let radius = currentRadiusKm;
  for (let attempt = 1; attempt <= 5; attempt++) {
    radius += zoneConfig.expansionStepKm;
    if (radius > zoneConfig.maxRadiusKm) radius = zoneConfig.maxRadiusKm;
    const drivers = await findDriversInRadius(ride.originLat, ride.originLng, radius * 1000);
    if (drivers.length > 0) return drivers;
  }
  return null;
}
```

---

## 10. Anti-fraude no Dispatch

### 10.1 Pipeline de Verificacao

```
1. Passenger Blacklist Check
2. Driver Blacklist Check
3. GPS Spoofing Detection
4. Ghost Rides Detection
5. Device Session Validation
6. Suspicious Pattern Detection (AI)
7. Geolocation Anomaly Check
8. Rate Limit Check
```

### 10.2 Verificacao de Blacklist

```typescript
async function checkBlacklist(passengerId, driverIds): Promise<FraudResult> {
  const passengerBlocked = await db.exists(@'
    SELECT 1 FROM blacklist WHERE entity_type = 'passenger'
      AND entity_id = :pid AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  @, { pid: passengerId });

  if (passengerBlocked) return { blocked: true, reason: 'Passageiro na blacklist', severity: 'high' };
  return { blocked: false };
}
```

### 10.3 Deteccao de GPS Spoofing

```typescript
async function detectGpsSpoofing(driverId, currentLoc, prevLoc): Promise<SpoofingResult> {
  if (!prevLoc) return { spoofing: false };

  const timeDiff = (currentLoc.timestamp - prevLoc.timestamp) / 1000;
  const distance = haversineDistance(prevLoc, currentLoc);
  const calcSpeed = (distance / 1000) / (timeDiff / 3600);
  const repSpeed = currentLoc.speed ?? 0;

  const anomalies = [];
  if (Math.abs(calcSpeed - repSpeed) > 40) anomalies.push('Velocidade incompativel');
  if (calcSpeed > 200) anomalies.push('Velocidade impossivel');
  if (distance > 1000 && timeDiff < 10) anomalies.push('Deslocamento muito rapido');

  return { spoofing: anomalies.length > 0, confidence: Math.min(1, anomalies.length * 0.3), anomalies };
}
```

### 10.4 Deteccao de Corridas Fantasmas

```typescript
async function detectGhostRides(passengerId, origin): Promise<GhostRideResult> {
  const recent = await db.queryOne(@'
    SELECT COUNT(*) as count FROM rides
    WHERE passenger_id = :pid
      AND created_at >= NOW() - INTERVAL '30 minutes'
      AND ABS(origin_lat - :lat) < 0.001
      AND ABS(origin_lng - :lng) < 0.001
  @, { pid: passengerId, lat: origin.lat, lng: origin.lng });

  if (recent.count >= 5) return { ghostRide: true, action: 'block' };
  if (recent.count >= 3) return { ghostRide: true, action: 'flag' };
  return { ghostRide: false };
}
```

### 10.5 Pipeline Anti-fraude Completo

```typescript
async function antiFraudPipeline(rideRequest, drivers): Promise<AntiFraudResult> {
  const checks = await Promise.all([
    checkPassengerBlacklist(rideRequest.passengerId),
    checkDriverBlacklist(drivers.map(d => d.driverId)),
    detectGpsSpoofingBatch(drivers.slice(0, 5)),
    detectGhostRides(rideRequest.passengerId, rideRequest.origin),
    validateDeviceSession(rideRequest.passengerId, rideRequest.deviceId),
    checkRateLimit(rideRequest.passengerId),
  ]);

  const failed = checks.filter(c => !c.passed || c.blocked);
  if (failed.length > 0) {
    await eventBus.publish('dispatch.fraud.blocked', {
      rideId: rideRequest.rideId, checks: failed
    });
    return { allowed: false, blockedChecks: failed };
  }
  return { allowed: true, blockedChecks: [] };
}
```

---

## 11. Como a IA Influencia o Score

### 11.1 Pipeline de Influencia da IA

```
1. Score Base (10 fatores com pesos do dispatcher_rules)
2. AI: Predicao de Risco de Cancelamento
   Se risco > 30% -> score *= (1 - risco)
3. AI: Recomendacao de Motorista Favorito
   Se favorito na lista -> score += 0.95 (limitado a 1.0)
4. AI: Ajuste de ETA com Transito
5. AI: Deteccao de Padroes Suspeitos
   Se suspeito -> penalidade de ate 0.50
6. Score Final -> Ranking
```

### 11.2 Modelos de ML Utilizados

| Modelo | Framework | Output | Frequencia |
|--------|-----------|--------|------------|
| cancel_risk_v3 | XGBoost | Probabilidade [0,1] | Diaria |
| eta_adjustment_v2 | LightGBM | Fator de ajuste | Semanal |
| favorite_driver_v1 | Regras + SQL | Driver ID | Tempo real |
| suspicious_pattern_v2 | Random Forest | Score de suspeicao [0,1] | Semanal |

### 11.3 Arquitetura de Inferencia

```
Dispatcher Service -> AI Service (Python) -> ML Models (ONNX)
                        |
                   Feature Store (Redis)
                        |
                   Model Registry (S3)
```

---

## 12. Regras de Fallback

### 12.1 Matriz de Fallbacks

| Condicao | Acao | Mensagem |
|----------|------|----------|
| dispatcher_rules nao existe para a cidade | Usar pesos padrao | Log warning |
| driver_locations vazio | Retornar erro | "Nenhum motorista disponivel" |
| Categoria nao existe | Retornar erro | "Categoria invalida" |
| Falha no modelo de IA | Ignorar AI influence | Log erro |
| Falha no Redis | Buscar direto do PostgreSQL | Log warning |
| Timeout no mapa/ETA | Usar ETA aproximado | Log warning |

### 12.2 Pesos Padrao (Fallback)

```typescript
const FALLBACK_WEIGHTS: Record<string, number> = {
  distance: 20, eta: 15, rating: 15, acceptance_rate: 10,
  cancellation_rate: 8, trip_history: 8, vehicle_match: 10,
  battery_level: 5, gps_quality: 4, idle_time: 5,
};

async function loadDispatcherRules(cityId: string): Promise<Record<string, number>> {
  try {
    const rules = await db.query(@'
      SELECT weight_name, weight_value FROM dispatcher_rules
      WHERE city_id = :cityId AND enabled = TRUE
    @, { cityId });
    if (rules.length === 0) return { ...FALLBACK_WEIGHTS };
    const weights = { ...FALLBACK_WEIGHTS };
    for (const rule of rules) weights[rule.weight_name] = rule.weight_value;
    return weights;
  } catch {
    return { ...FALLBACK_WEIGHTS };
  }
}
```

### 12.3 Fallback de Motoristas

```typescript
async function findDriversWithFallback(ride): Promise<DriverLocation[]> {
  let radius = zoneConfig.initialRadiusKm;
  let drivers = [];
  for (let attempt = 1; attempt <= 5; attempt++) {
    drivers = await findDriversInRadius(ride.originLat, ride.originLng, radius * 1000);
    if (drivers.length > 0) return drivers;
    radius += zoneConfig.expansionStepKm;
    if (radius > zoneConfig.maxRadiusKm) radius = zoneConfig.maxRadiusKm;
  }
  return drivers;
}
```

---

## 13. Criterios de Desempate

### 13.1 Hierarquia de Desempate

```
Nivel 1: Menor ETA
Nivel 2: Maior Rating (ultimas 100)
Nivel 3: Menor Taxa de Cancelamento
Nivel 4: Maior Idle Time
Nivel 5: Menor Distancia (ultimo recurso)
```

### 13.2 Implementacao

```typescript
function tiebreakerSort(drivers: RankedDriver[]): RankedDriver[] {
  return drivers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.eta !== b.eta) return a.eta - b.eta;
    if (a.rating !== b.rating) return b.rating - a.rating;
    if (a.cancelRate !== b.cancelRate) return a.cancelRate - b.cancelRate;
    if (a.idleMinutes !== b.idleMinutes) return b.idleMinutes - a.idleMinutes;
    return a.distanceKm - b.distanceKm;
  });
}
```

---

## 14. Eventos do Event Bus

### 14.1 Catalogo de Eventos

| Evento | Descricao | Payload |
|--------|-----------|---------|
| dispatch.search.started | Inicio da busca | ride_id, passenger_id, origin, category_id, city_id |
| dispatch.driver.scored | Motorista pontuado | ride_id, driver_id, score, factors, weights |
| dispatch.offer.sent | Oferta enviada | ride_id, driver_id, offer_id, score, rank, timeout_ms |
| dispatch.offer.accepted | Motorista aceitou | ride_id, driver_id, offer_id, response_time_ms |
| dispatch.offer.timeout | Motorista nao respondeu | ride_id, driver_id, offer_id, timeout_ms |
| dispatch.offer.rejected | Motorista rejeitou | ride_id, driver_id, offer_id, reason |
| dispatch.no.drivers | Nenhum motorista disponivel | ride_id, city_id, zone_type, radius_km |
| dispatch.fraud.blocked | Corrida bloqueada por fraude | ride_id, passenger_id, checks, severity |
| dispatch.radius.expanded | Raio expandido | ride_id, attempt, radius_km, drivers_found |

### 14.2 Schema dos Eventos (CloudEvents)

```json
{
  "specversion": "1.0",
  "type": "com.txapp.dispatch.search.started",
  "source": "/dispatcher/v3",
  "id": "evt_001",
  "time": "2026-07-13T14:30:00Z",
  "data": {
    "ride_id": "r_001",
    "passenger_id": "p_123",
    "origin": { "lat": -23.5505, "lng": -46.6333 },
    "category_id": "cat_001",
    "city_id": "city_sp"
  }
}
```

### 14.3 Dead Letter Queue

```sql
CREATE TABLE event_dlq (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(128) NOT NULL,
    event_payload   JSONB NOT NULL,
    error_message   TEXT,
    attempt_count   SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 15. Configuracao de Pesos por Cidade

### 15.1 Exemplo de Configuracao

```sql
-- Sao Paulo (densidade alta)
INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'distance', 20, TRUE, 1, '{"max_distance_km": 20, "ideal_distance_km": 1}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'eta', 15, TRUE, 2, '{"max_eta_minutes": 20, "ideal_eta_minutes": 3, "use_traffic": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'rating', 15, TRUE, 3, '{"min_rating": 4.0, "max_rating": 5.0}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'acceptance_rate', 10, TRUE, 4, '{"lookback_rides": 50, "min_acceptance": 0.3}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'cancellation_rate', 8, TRUE, 5, '{"lookback_rides": 50, "max_cancel_rate": 0.15}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'trip_history', 8, TRUE, 6, '{"max_trips": 5000, "log_scale": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'vehicle_match', 10, TRUE, 7, '{"exact_match": 1.0, "upgrade_match": 0.8}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'battery_level', 5, TRUE, 8, '{"min_battery": 20, "ideal_battery": 80, "electric_only": true}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'gps_quality', 4, TRUE, 9, '{"min_accuracy_meters": 100, "ideal_accuracy_meters": 10}'
FROM cities WHERE name = 'Sao Paulo';

INSERT INTO dispatcher_rules (city_id, weight_name, weight_value, enabled, priority, params)
SELECT id, 'idle_time', 5, TRUE, 10, '{"max_idle_minutes": 120, "boost_after_minutes": 30}'
FROM cities WHERE name = 'Sao Paulo';
```

### 15.2 Painel de Administracao

- **CRUD completo** de dispatcher_rules por cidade
- **Simulador de score** -- testar combinacoes com dados reais
- **Historico de alteracoes** -- auditoria de mudancas
- **Validacao** -- soma dos pesos nao deve ultrapassar 100%
- **Comparacao A/B** -- testar configuracoes em producao

```sql
CREATE TABLE dispatcher_rules_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID NOT NULL REFERENCES dispatcher_rules(id),
    old_values      JSONB,
    new_values      JSONB,
    changed_by      UUID REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason   TEXT
);
```

---

## 16. Monitoramento e Observabilidade

### 16.1 Metricas-Chave (KPIs)

| Metrica | Descricao | Alerta |
|---------|-----------|--------|
| dispatch.match_time_ms | Tempo total de match | > 15s (P1) |
| dispatch.score_calc_time_ms | Tempo de calculo de score | > 500ms (P2) |
| dispatch.acceptance_rate | Taxa de aceitacao geral | < 70% (P1) |
| dispatch.cancellation_rate | Taxa de cancelamento geral | > 10% (P1) |
| dispatch.no_drivers_rate | % de corridas sem motoristas | > 5% (P1) |
| dispatch.fraud_blocked_rate | % de corridas bloqueadas | > 2% (P2) |
| dispatch.ai_latency_ms | Latencia do servico de IA | > 200ms (P3) |
| dispatch.drivers_per_ride | Media de motoristas avaliados | < 3 (P2) |

### 16.2 Prometheus Metrics

```typescript
const metrics = {
  dispatchMatchTime: new Histogram({
    name: 'dispatch_match_time_ms',
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000, 15000, 30000],
    labelNames: ['city_id', 'zone_type'],
  }),
  dispatchEventsTotal: new Counter({
    name: 'dispatch_events_total',
    labelNames: ['event_type', 'city_id'],
  }),
  dispatchAvailableDrivers: new Gauge({
    name: 'dispatch_available_drivers',
    labelNames: ['city_id', 'zone_type'],
  }),
};
```

---

## 17. Tratamento de Erros

### 17.1 Matriz de Erros e Acoes

| Erro | Causa | Acao | Recuperacao |
|------|-------|------|-------------|
| DB_CONNECTION_ERROR | Banco indisponivel | Tentar reconexao (3x) | Usar cache Redis |
| REDIS_CONNECTION_ERROR | Redis indisponivel | Logar erro | Buscar do PostgreSQL |
| MAPS_PROVIDER_ERROR | API de mapas fora | Usar ETA aproximado | Tentar novamente |
| AI_SERVICE_TIMEOUT | IA nao respondeu | Ignorar ajustes de IA | Score base |
| INVALID_PAYLOAD | Dados incorretos | Retornar 400 | N/A |
| RATE_LIMIT_EXCEEDED | Muitas requisicoes | Retornar 429 | Retry com backoff |

### 17.2 Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call(fn, fallback) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
        this.state = 'half-open';
      } else { return fallback(); }
    }
    try {
      const result = await fn();
      this.state = 'closed';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.threshold) this.state = 'open';
      return fallback();
    }
  }
}
```

### 17.3 Retry Policy

```typescript
async function withRetry(fn, { maxRetries = 3, baseDelayMs = 100 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt) + Math.random() * 100);
    }
  }
}
```

---

## 18. Apendice: Pseudocodigo Completo

### 18.1 Orquestrador Principal

```typescript
class DispatchOrquestrator {
  async dispatch(rideRequest: RideRequest): Promise<DispatchResponse> {
    const startTime = Date.now();

    this.validateRequest(rideRequest);

    const zoneConfig = await this.geoService.detectZone(
      rideRequest.origin, rideRequest.cityId
    );

    await this.updateRideStatus(rideRequest.rideId, 'scoring');
    await this.eventBus.publish('dispatch.search.started', {
      ride_id: rideRequest.rideId,
      passenger_id: rideRequest.passengerId,
      origin: rideRequest.origin,
      category_id: rideRequest.categoryId,
      city_id: rideRequest.cityId,
    });

    const fraudResult = await this.antiFraud.check(rideRequest);
    if (!fraudResult.allowed) {
      await this.updateRideStatus(rideRequest.rideId, 'fraud_blocked');
      return { status: 'fraud_blocked', error: 'Corrida bloqueada por seguranca' };
    }

    const drivers = await this.geoService.findDriversNearby(
      rideRequest.origin, zoneConfig, rideRequest.categoryId
    );

    if (drivers.length === 0) {
      await this.eventBus.publish('dispatch.no.drivers', {
        ride_id: rideRequest.rideId, zone_type: zoneConfig.zoneType
      });
      return { status: 'no_drivers', error: 'Nenhum motorista disponivel' };
    }

    const weights = await this.loadWeights(rideRequest.cityId);
    const scoredDrivers = [];

    for (const driver of drivers) {
      const score = await this.scoreEngine.calculate(driver, rideRequest, weights);
      scoredDrivers.push(score);
      await this.eventBus.publish('dispatch.driver.scored', {
        ride_id: rideRequest.rideId, driver_id: driver.driverId,
        score: score.finalScore, factors: score.factors, weights_used: weights,
      });
    }

    const aiInfluence = await this.aiService.influenceScores(scoredDrivers, rideRequest);
    const adjustedDrivers = this.applyAiInfluence(scoredDrivers, aiInfluence);
    const rankedDrivers = this.rankDrivers(adjustedDrivers, rideRequest);

    const result = await this.batchDispatcher.dispatch(rideRequest, rankedDrivers, zoneConfig);

    if (result.status === 'accepted') {
      await this.startTrip(result);
      return {
        status: 'accepted',
        rideId: rideRequest.rideId,
        driverId: result.driverId,
        eta: result.eta,
        matchTimeMs: Date.now() - startTime,
      };
    }

    return { status: 'no_drivers', error: 'Nenhum motorista disponivel' };
  }

  private applyAiInfluence(drivers, aiInfluence) {
    return drivers.map(driver => {
      let score = driver.finalScore;
      const cancelRisk = aiInfluence.cancelRisks[driver.driverId] ?? 0;
      if (cancelRisk > 0.30) score *= (1 - cancelRisk);
      if (aiInfluence.favoriteDriver === driver.driverId) score = Math.min(1.0, score + 0.95);
      const penalty = aiInfluence.suspiciousPenalties[driver.driverId] ?? 0;
      if (penalty > 0) score *= (1 - penalty);
      return { ...driver, finalScore: score };
    });
  }
}
```

### 18.2 Score Engine

```typescript
class ScoreEngine {
  async calculate(driver, ride, weights) {
    const factors = {};

    factors.distance = this.calcDistance(driver, ride);
    factors.eta = this.calcETA(driver, ride);
    factors.rating = await this.calcRating(driver.driverId);
    factors.acceptance_rate = await this.calcAcceptanceRate(driver.driverId);
    factors.cancellation_rate = await this.calcCancellationRate(driver.driverId);
    factors.trip_history = await this.calcTripHistory(driver.driverId);
    factors.vehicle_match = await this.calcVehicleMatch(driver.driverId, ride.categoryId);
    factors.battery_level = this.calcBatteryLevel(driver);
    factors.gps_quality = this.calcGpsQuality(driver);
    factors.idle_time = this.calcIdleTime(driver);

    let finalScore = 0, totalWeight = 0;
    for (const [name, value] of Object.entries(factors)) {
      const weight = weights[name] ?? 0;
      finalScore += value * weight;
      totalWeight += weight;
    }
    finalScore = totalWeight > 0 ? finalScore / totalWeight : 0;

    return {
      driverId: driver.driverId,
      finalScore: Math.round(finalScore * 1000) / 1000,
      factors, eta: driver.etaMinutesApprox,
      rating: factors.rating,
      idleMinutes: driver.idleMinutes,
    };
  }

  private calcDistance(driver, ride) {
    const dist = haversineDistance(ride.origin, { lat: driver.lat, lng: driver.lng });
    if (dist <= 1) return 1.0;
    return Math.max(0, 1 - (dist - 1) / 29);
  }
}
```

### 18.3 Anti-Fraud Service

```typescript
class AntiFraudService {
  async check(rideRequest) {
    const checks = await Promise.all([
      this.checkPassengerBlacklist(rideRequest.passengerId),
      this.checkDeviceSession(rideRequest.passengerId, rideRequest.deviceId),
      this.checkGhostRides(rideRequest),
      this.checkRateLimit(rideRequest.passengerId),
    ]);
    const failed = checks.filter(c => !c.passed);
    if (failed.length > 0) {
      return { allowed: false, blockedChecks: failed };
    }
    return { allowed: true, blockedChecks: [] };
  }
}
```

---

*Fim do documento. Versao 3.0.*

