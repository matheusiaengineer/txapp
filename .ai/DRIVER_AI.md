# TXAPP Driver AI

## Visão Geral

A TXAPP Driver AI é um sistema inteligente embarcado no aplicativo do motorista que processa telemetria em tempo real, dados históricos de comportamento e variáveis externas (trânsito, clima, demanda) para fornecer recomendações contextuais. O objetivo central é maximizar os ganhos dos motoristas, reduzir riscos operacionais, otimizar rotas e detectar precocemente estados de sonolência ou fadiga que possam comprometer a segurança.

O sistema opera predominantemente no lado do cliente (on-device inference) com suporte de modelos treinados no backend, garantindo baixa latência e funcionamento offline parcial. Os eventos e métricas são sincronizados com o Supabase quando há conectividade.

## Público-Alvo

- Motoristas parceiros da TXAPP que rodam em média 6-10 horas por dia
- Frotistas que gerenciam múltiplos motoristas e veículos
- Central de segurança da TXAPP para monitoramento de eventos críticos

## Princípios de Design

1. Privacidade em primeiro lugar: dados de localização e comportamento são anonimizados antes de qualquer processamento agregado.
2. Transparência algorítmica: o motorista pode ver exatamente por que uma recomendação foi feita.
3. Acionabilidade: toda sugestão deve ter um botão ou ação clara ("Ir para zona", "Fazer pausa", "Agendar revisão").
4. Adaptabilidade: o modelo aprende e ajusta recomendações conforme o motorista aceita ou rejeita sugestões.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Driver App (Mobile)                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  Telemetry    │───▶│  Driver AI        │───▶│  UI Components   │   │
│  │  Collector    │    │  Engine (Local)   │    │  (React Native)  │   │
│  └──────────────┘    └────────┬─────────┘    └──────────────────┘   │
│                               │                                      │
│                        ┌──────▼──────┐                               │
│                        │  Local SQLite │                              │
│                        │  Cache        │                              │
│                        └──────┬──────┘                               │
└───────────────────────────────┼───────────────────────────────────────┘
                                │ sync (when online)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Supabase Backend                              │
│  ┌────────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  driver_behavior   │  │ driver_sleep_     │  │ driver_          │  │
│  │  table             │  │ events table      │  │ preferences      │  │
│  └────────────────────┘  └──────────────────┘  └──────────────────┘  │
│         ▼                        ▼                       ▼           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              AI Aggregator Service (Edge Functions)           │   │
│  │  - Batch scoring                                              │   │
│  │  - Model retraining                                           │   │
│  │  - Cross-driver analytics                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   External Integrations                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │  Traffic APIs   │  │  Weather APIs   │  │  Workshop Partners    │ │
│  │  (TomTom, Waze) │  │  (OpenWeather)  │  │  (auto services)      │ │
│  └────────────────┘  └────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Componentes do Sistema

#### 1. Telemetry Collector

Executa em segundo plano no aplicativo do motorista e coleta:

- Posição GPS (lat, lng, heading, speed) a cada 5 segundos
- Acelerômetro e giroscópio para detectar volantadas, freadas bruscas, acelerações
- Estado da tela do app (foreground/background)
- Conectividade de rede (Wi-Fi, 4G, offline)
- Nível da bateria do dispositivo
- Timestamps de início e fim de cada corrida
- Timestamps de início e fim de cada jornada (login/logout)

#### 2. Driver AI Engine (Local)

Motor de inferência que roda no dispositivo com modelos ONNX Runtime otimizados:

- Modelo de detecção de sonolência (rede LSTM treinada em padrões de direção)
- Modelo de previsão de demanda (LightGBM quantizado)
- Modelo de scoring de comportamento (regressão logística)
- Sistema de regras programáticas para triggers imediatos

A engine expõe uma API interna via bridge nativa que os componentes React consomem:

```
Native Module: DriverAIEngine
  Methods:
    - getSleepScore(): Promise<SleepScore>
    - getEarningsInsight(): Promise<EarningsInsight>
    - getRouteOptimization(origin, destination): Promise<RouteSuggestion[]>
    - getBehaviorScore(): Promise<number>
    - getMaintenanceTips(): Promise<MaintenanceTip[]>
    - getPersonalizedTips(): Promise<Tip[]>
  Events:
    - onSleepAlert(level: 'warning' | 'critical')
    - onEarningsOpportunity(zone: Zone, multiplier: number)
    - onMaintenanceDue(service: string, kmDue: number)
```

#### 3. UI Components (React Native)

São seis componentes principais que exibem as recomendações da engine. Todos seguem o design system da TXAPP com suporte a tema claro/escuro e acessibilidade.

#### 4. AI Aggregator Service (Supabase Edge Functions)

Serviço serverless que executa em Node.js/Deno com as seguintes responsabilidades:

- Agregação de dados de comportamento de todos os motoristas para gerar benchmarks
- Retreinamento periódico dos modelos de demanda e scoring
- Cálculo de rankings e percentis (top 10%, etc.)
- Geração de insights cross-driver ("Motoristas que ganham 20% mais...")
- Integração com APIs externas de trânsito e clima

## Tabelas do Banco de Dados

### driver_behavior

Tabela central que armazena o perfil comportamental consolidado de cada motorista.

```sql
CREATE TABLE driver_behavior (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_trips       INTEGER NOT NULL DEFAULT 0,
  total_earnings    DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  avg_rating        DECIMAL(3, 2) NOT NULL DEFAULT 5.00
                    CHECK (avg_rating >= 1.00 AND avg_rating <= 5.00),
  avg_acceptance_rate DECIMAL(5, 2) NOT NULL DEFAULT 100.00
                    CHECK (avg_acceptance_rate >= 0 AND avg_acceptance_rate <= 100),
  avg_cancellation_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00
                    CHECK (avg_cancellation_rate >= 0 AND avg_cancellation_rate <= 100),
  behavior_score    INTEGER NOT NULL DEFAULT 100
                    CHECK (behavior_score >= 0 AND behavior_score <= 100),
  preferred_hours   JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_zones   JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_distance_km DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_online_minutes INTEGER NOT NULL DEFAULT 0,
  total_driving_minutes INTEGER NOT NULL DEFAULT 0,
  weekly_earnings   JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_rank      INTEGER,
  city_id           INTEGER REFERENCES cities(id),
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_driver_behavior_score ON driver_behavior(behavior_score DESC);
CREATE INDEX idx_driver_behavior_city ON driver_behavior(city_id);
CREATE INDEX idx_driver_behavior_earnings ON driver_behavior(total_earnings DESC);
```

#### Campos JSONB

**preferred_hours**: Array de objetos representando horários de maior sucesso do motorista.

```json
[
  { "day_of_week": 1, "start_hour": 6, "end_hour": 9, "avg_earnings_per_hour": 42.50 },
  { "day_of_week": 1, "start_hour": 17, "end_hour": 20, "avg_earnings_per_hour": 51.20 },
  { "day_of_week": 5, "start_hour": 22, "end_hour": 2, "avg_earnings_per_hour": 65.00 }
]
```

**preferred_zones**: Array de zonas (bairros/regiões) onde o motorista tem melhor performance.

```json
[
  { "zone_id": "zone_centro", "zone_name": "Centro", "total_trips": 152, "avg_fare": 28.90 },
  { "zone_id": "zone_sul", "zone_name": "Zona Sul", "total_trips": 98, "avg_fare": 42.30 },
  { "zone_id": "zone_norte", "zone_name": "Zona Norte", "total_trips": 45, "avg_fare": 18.50 }
]
```

**weekly_earnings**: Histórico de ganhos por semana para geração de gráficos de tendência.

```json
[
  { "week_start": "2026-06-29", "total": 1250.00, "trips": 42, "online_hours": 38.5 },
  { "week_start": "2026-07-06", "total": 1380.00, "trips": 48, "online_hours": 40.2 },
  { "week_start": "2026-07-13", "total": 1100.00, "trips": 35, "online_hours": 32.0 }
]
```

### driver_sleep_events

Armazena todos os eventos de sonolência detectados pelo sistema.

```sql
CREATE TABLE driver_sleep_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence        DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken      TEXT NOT NULL DEFAULT 'none'
                    CHECK (action_taken IN ('none', 'alert', 'sos', 'call_center')),
  location          JSONB NOT NULL DEFAULT '{}'::jsonb,
  telemetry_snapshot JSONB,
  resolution        TEXT CHECK (resolution IN ('driver_paused', 'driver_continued', 'emergency_contacted')),
  resolved_at       TIMESTAMPTZ,
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sleep_events_driver ON driver_sleep_events(driver_id, detected_at DESC);
CREATE INDEX idx_sleep_events_unresolved ON driver_sleep_events(driver_id) WHERE resolved = FALSE;
```

#### Campos JSONB

**location**: Localização no momento da detecção.

```json
{
  "lat": -23.5505,
  "lat": -23.5505,
  "lng": -46.6333,
  "address": "Av. Paulista, 1000",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "speed_kmh": 45.0
}
```

**telemetry_snapshot**: Captura do estado da telemetria 30 segundos antes e depois do evento.

```json
{
  "before": [
    { "ts": "2026-07-13T03:15:00Z", "speed": 60, "heading": 180, "accel_x": 0.1, "accel_y": -0.3, "accel_z": 9.8 },
    { "ts": "2026-07-13T03:15:05Z", "speed": 58, "heading": 182, "accel_x": 0.4, "accel_y": -0.6, "accel_z": 9.8 }
  ],
  "after": [
    { "ts": "2026-07-13T03:15:30Z", "speed": 30, "heading": 170, "accel_x": 1.2, "accel_y": -1.5, "accel_z": 9.8 },
    { "ts": "2026-07-13T03:15:35Z", "speed": 25, "heading": 175, "accel_x": 0.8, "accel_y": -1.1, "accel_z": 9.8 }
  ],
  "driving_minutes_without_break": 285,
  "hour_of_day": 3,
  "day_of_week": 1,
  "trip_count_since_last_break": 8
}
```

### driver_preferences

Preferências explícitas do motorista que influenciam as recomendações.

```sql
CREATE TABLE driver_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_driving_hours     INTEGER NOT NULL DEFAULT 8 CHECK (max_driving_hours >= 1 AND max_driving_hours <= 16),
  max_trips_without_break INTEGER NOT NULL DEFAULT 6,
  preferred_shift       TEXT CHECK (preferred_shift IN ('morning', 'afternoon', 'night', 'dawn', 'flexible')),
  preferred_ride_types  TEXT[] DEFAULT ARRAY['standard', 'comfort', 'economy'],
  avoid_high_risk_zones BOOLEAN NOT NULL DEFAULT FALSE,
  auto_accept_threshold DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  notifications_enabled JSONB NOT NULL DEFAULT '{"sleep_alert": true, "earnings_tip": true, "maintenance": true, "promotion": true}'::jsonb,
  maintenance_reminder_km INTEGER NOT NULL DEFAULT 5000,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### road_events

Tabela auxiliar usada pelo sistema de roteirização (alimentada por APIs externas + relatos de motoristas).

```sql
CREATE TABLE road_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT NOT NULL CHECK (event_type IN ('accident', 'construction', 'flooding', 'protest', 'police_operation', 'road_closure')),
  location          JSONB NOT NULL,
  radius_meters     INTEGER NOT NULL DEFAULT 500,
  severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source            TEXT NOT NULL CHECK (source IN ('external_api', 'driver_report', 'admin')),
  reported_by       UUID REFERENCES auth.users(id),
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_road_events_active ON road_events(active) WHERE active = TRUE;
CREATE INDEX idx_road_events_location ON road_events USING GIST (location);
```

## Funcionalidades

### 1. Sleep/Drowsiness Detection

#### Visão Geral

Sistema de detecção de sonolência que opera em múltiplas camadas: sensores do dispositivo, padrões de direção e variáveis contextuais. O objetivo é prevenir acidentes causados por fadiga ao volante, que é uma das principais causas de sinistros em operações de transporte.

#### Modelo de Detecção

O modelo principal é uma LSTM (Long Short-Term Memory) que recebe uma sequência de 60 segundos de telemetria (12 janelas de 5 segundos) e classifica a probabilidade de sonolência:

```
Input: (12, 7) tensor → [speed, heading_delta, accel_x, accel_y, accel_z, steering_angle, time_since_break]
  ↓
LSTM(128) → Dropout(0.3) → LSTM(64) → Dropout(0.2)
  ↓
Dense(32, ReLU) → Dense(16, ReLU) → Dense(1, Sigmoid)
  ↓
Output: probabilidade [0, 1]
```

O modelo é convertido para ONNX e integrado ao app via ONNX Runtime Mobile. A inferência completa leva menos de 5ms em dispositivos Android de entrada.

#### Gatilhos e Ações

**Nível 1 — Alerta Leve** (probabilidade 30-50%)
- Condição: dirigindo > 2h sem pausa OU horário entre 0h-5h com mais de 1h de direção
- Ação: notificação silenciosa "Recomendamos uma pausa. Você está dirigindo há X horas."
- UI: banner não intrusivo na parte superior com ícone de café

**Nível 2 — Alerta Moderado** (probabilidade 50-70%)
- Condição: dirigindo > 4h sem pausa OU detecção de padrão de micro-volantadas (2+ correções bruscas em 30s)
- Ação: notificação com som + sugestão de pausa + atalho para navegação até posto de parada mais próximo
- UI: modal semi-transparente com botão "Fazer Pausa" e "Ignorar"
- Se ignorado 2 vezes consecutivas, escala para nível 3

**Nível 3 — Alerta Crítico** (probabilidade > 70%)
- Condição: padrão de volantadas severas (3+ correções bruscas em 15s) OU velocidade irregular (variações > 20km/h sem motivo) OU probabilidade do modelo > 70%
- Ação: alerta sonoro alto + vibração contínua + notificação para central de segurança da TXAPP
- UI: tela cheia vermelha com instruções "PARE O VEÍCULO IMEDIATAMENTE" + botão "Emergência — Ligar Central"
- Backend: evento registrado em driver_sleep_events com action_taken = 'sos' ou 'call_center'

#### Regras Programáticas (Fallback)

Caso o modelo ONNX não esteja disponível (falha de carregamento, dispositivo incompatível), as seguintes regras estáticas são aplicadas:

```
SE online_minutes >= 240 ENTAO alerta_nivel_2
SE online_minutes >= 120 E hora BETWEEN 0 AND 5 ENTAO alerta_nivel_1
SE volantadas_em_30s >= 3 ENTAO alerta_nivel_2
SE volantadas_em_15s >= 4 ENTAO alerta_nivel_3
SE variacao_velocidade_media_30s > 20 E hora BETWEEN 0 AND 5 ENTAO alerta_nivel_2
SEM respostas_ignoradas_consecutivas >= 2 ENTAO escalate(alerta_nivel)
```

#### Cooldown entre Alertas

Para evitar fadiga de notificações, cada nível de alerta tem um cooldown:

- Alerta leve: 30 minutos entre notificações do mesmo motorista
- Alerta moderado: 20 minutos
- Alerta crítico: 10 minutos
- Após pausa confirmada (app detecta veículo parado > 15 min): todos os cooldowns resetam

#### Integração com Central de Segurança

Quando um alerta crítico é emitido:
1. Um registro é criado em `driver_sleep_events` com action_taken = 'call_center'
2. Uma Edge Function envia evento via WebSocket para o dashboard da central
3. Um operador humano pode:
   - Tentar contato telefônico com o motorista
   - Enviar uma mensagem no app
   - Acionar emergência (contato de confiança, polícia)
   - Resolver o evento (marcar como resolvido)

#### Testes e Validação

O modelo de detecção de sonolência é validado contra um dataset rotulado de 10.000 horas de direção com:

- Acurácia alvo: > 85%
- Precisão (precision) na classe positiva: > 80%
- Recall: > 75%
- Falso-positivos por hora: < 0.5

### 2. Earnings Optimization

#### Visão Geral

Módulo de otimização de ganhos que analisa dados históricos do motorista e dados agregados da cidade para sugerir os melhores horários, zonas e estratégias para maximizar a receita líquida (considerando combustível e desgaste do veículo).

#### Sugestão de Horários

**Algoritmo de Horários Premium**

O sistema analisa o histórico de ganhos do motorista e da região para identificar janelas de alta rentabilidade.

```
Para cada dia da semana (0-6):
  Para cada hora (0-23):
    earnings_per_hour = calcular_ganho_por_hora(driver_id, day, hour, last_4_weeks)
    demand_multiplier = calcular_demanda_da_regiao(city_id, day, hour)
    surge_probability = calcular_probabilidade_surge(city_id, day, hour)
    score = earnings_per_hour * demand_multiplier * (1 + surge_probability)
    se score > media_do_motorista * 1.3:
      marcar como "horário premium"
```

Os horários premium são exibidos no componente DriverEarningsChart com destaque visual.

**Exemplo de Card:**

```
┌──────────────────────────────────────────────┐
│  ⭐ Horários Premium para  ║  X  │
│     Hoje (Segunda-feira)                      │
│                                              │
│  06h - 09h  │  R$ 42/h  │  Demanda alta      │
│  12h - 14h  │  R$ 35/h  │  Demanda média      │
│  17h - 20h  │  R$ 55/h  │  Demanda muito alta │
│  22h - 00h  │  R$ 38/h  │  Surge 1.3x         │
│                                              │
│  [Definir Lembrete para 06h] [Ativar Auto]   │
└──────────────────────────────────────────────┘
```

#### Sugestão de Zonas

**Algoritmo de Zonas Quentes**

```
1. Dividir a cidade em grid de 500m x 500m
2. Para cada célula do grid, calcular:
   - Número médio de solicitações de corrida por hora (últimos 7 dias)
   - Ticket médio (fare médio)
   - Número de motoristas disponíveis (oferta)
3. Score da zona = (demanda / oferta) * ticket_medio
4. Ranquear zonas por score, retornar top 5
```

As zonas são exibidas no componente DriverZoneHeatmap como um mapa térmico com overlay no mapa da cidade.

**Atualização:** O heatmap é recalculado a cada 30 minutos com base nos dados mais recentes de demanda.

#### Alertas de Promoções e Surge

O sistema monitora eventos de precificação dinâmica e dispara notificações push quando há oportunidades relevantes.

```
SE surge_multiplier >= 1.3 E distancia_do_motorista_ate_zona < 5km ENTAO
  notificar: "🌀 Zona Sul com surge de {multiplier}x! Em até 5min você chega lá."

SE promocao_ativa(zona) E motorista_esta_na_zona ENTAO
  notificar: "🎯 Você está em {zona} que está com bônus de R$ {bonus} por corrida!"

SE promocao_por_horario(horario_atual, 1h) ENTAO
  notificar: "⏰ Em 1h começa o horário de bônus! Programe-se."
```

#### Cálculo de Ganho por Hora

```typescript
interface EarningsPerHour {
  hour: number;           // 0-23
  dayOfWeek: number;      // 0-6
  avgEarningsPerHour: number;
  avgTripsPerHour: number;
  avgFarePerTrip: number;
  avgDistancePerTrip: number; // km
  estimatedFuelCost: number;  // R$
  netEarnings: number;        // avgEarningsPerHour - estimatedFuelCost
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  driverCount: number;        // motoristas ativos nessa hora/zona
}

function calculateNetEarningsPerHour(
  driverId: string,
  zoneId: string,
  hour: number,
  dayOfWeek: number
): EarningsPerHour {
  const historical = getDriverHistoricalData(driverId, zoneId, hour, dayOfWeek);
  const zoneDemand = getZoneDemandForecast(zoneId, hour, dayOfWeek);
  const fuelPrice = getCurrentFuelPrice(driverId); // por cidade

  const avgEarningsPerHour = historical.avgFarePerTrip * zoneDemand.avgTripsPerHour;
  const estimatedFuelCost = historical.avgDistancePerTrip * zoneDemand.avgTripsPerHour * fuelPrice.perKm;

  return {
    hour,
    dayOfWeek,
    avgEarningsPerHour,
    avgTripsPerHour: zoneDemand.avgTripsPerHour,
    avgFarePerTrip: historical.avgFarePerTrip,
    avgDistancePerTrip: historical.avgDistancePerTrip,
    estimatedFuelCost,
    netEarnings: avgEarningsPerHour - estimatedFuelCost,
    demandLevel: zoneDemand.demandLevel,
    driverCount: zoneDemand.activeDriverCount,
  };
}
```

#### Dashboard de Ganhos

O componente `DriverEarningsChart` exibe:

1. **Gráfico de barras** — Ganho por hora do dia (compara dia atual vs média da semana)
2. **Gráfico de linha** — Ganho acumulado no mês vs meta configurável
3. **Tabela** — breakdown por zona: zona | corridas | ganho bruto | gasolina | ganho líquido | tempo online
4. **Cartão de destaque** — "Melhor horário de hoje: 18h (Zona Sul, R$ 68/h)"

### 3. Route Suggestions

#### Visão Geral

Módulo de roteirização inteligente que vai além do simples A-para-B. Ele considera eventos de trânsito, segurança, otimização de retorno e probabilidade de encontrar a próxima corrida no destino.

#### Sugestão de Rota Alternativa

Quando o motorista aceita uma corrida, o sistema calcula 3 rotas:

1. **Rota Rápida** — menor tempo estimado (Waze/Google Maps)
2. **Rota Econômica** — menor distância (economiza combustível)
3. **Rota Recomendada** — melhor equilíbrio entre tempo, combustível e segurança

A **Rota Recomendada** leva em conta:
- Road events ativos no trajeto (desviar de acidentes, obras, alagamentos)
- Pedágios (evitar se não compensar o desvio)
- Segurança da região (evitar zonas de alto risco se for noite)
- Probabilidade de encontrar corrida no destino

```typescript
interface RouteSuggestion {
  id: string;
  type: 'fastest' | 'cheapest' | 'recommended';
  polyline: string;          // encoded polyline
  distanceMeters: number;
  durationSeconds: number;
  fuelCost: number;
  tollCost: number;
  hasRoadEvents: boolean;
  roadEvents: RoadEvent[];
  destinationDropoffScore: number; // 0-100 chance de conseguir corrida no destino
  waypoints: Waypoint[];     // paradas sugeridas
}

function calculateRoutes(origin: LatLng, destination: LatLng): RouteSuggestion[] {
  const routes = fetchRoutesFromProvider(origin, destination);
  const roadEvents = getActiveRoadEventsInBoundingBox(origin, destination);

  const enriched = routes.map(route => ({
    ...route,
    hasRoadEvents: roadEvents.some(e => intersects(route.polyline, e.location, e.radiusMeters)),
    roadEvents: roadEvents.filter(e => intersects(route.polyline, e.location, e.radiusMeters)),
    destinationDropoffScore: predictDropoffDemand(destination),
    fuelCost: calculateFuelCost(route.distanceMeters),
    waypoints: suggestWaypoints(route, origin, destination),
  }));

  // Se rota mais rápida tem road events, sugerir alternativa
  const fastest = enriched.find(r => r.type === 'fastest');
  if (fastest && fastest.hasRoadEvents) {
    const alternative = enriched.find(r => r.type !== 'fastest' && !r.hasRoadEvents);
    if (alternative) {
      alternative.type = 'recommended';
    }
  }

  return enriched;
}
```

#### Sugestão de Pontos de Parada

Durante viagens longas (> 30 km), o sistema sugere pontos de parada estratégicos:

- Postos de combustível com melhor preço na rota
- Borracharias e oficinas credenciadas
- Pontos de alimentação parceiros com desconto para motoristas TXAPP
- Áreas de descanso seguras (para pausas noturnas)

```typescript
function suggestWaypoints(
  route: Route,
  origin: LatLng,
  destination: LatLng
): Waypoint[] {
  // 1. Se distância > 30km, sugerir ponto de parada no meio do caminho
  if (route.distanceMeters > 30000) {
    const midpoint = interpolatePolyline(route.polyline, 0.5);
    const gasStations = findNearbyPlaces(midpoint, 'gas_station', 2000);
    const mechanicShops = findNearbyPlaces(midpoint, 'mechanic', 2000);
    // Retorna o posto mais bem avaliado
    return [{ location: gasStations[0]?.location, name: gasStations[0]?.name, type: 'fuel' }];
  }

  // 2. Se o motorista está há mais de 3h sem pausa, sugerir parada
  if (getCurrentDrivingMinutes() > 180) {
    const restStop = findSafestRestArea(route.polyline);
    return [{ location: restStop.location, name: restStop.name, type: 'rest' }];
  }

  return [];
}
```

#### Otimização de Rota de Retorno

Após finalizar uma corrida, o motorista muitas vezes precisa voltar para uma região com mais demanda. O sistema sugere:

1. **Ficar na região** — se a previsão de demanda no local atual for alta
2. **Ir para zona quente próxima** — se houver uma zona com alta demanda a até 10 minutos de distância
3. **Rota de retorno para zona habitual** — se o motorista costuma trabalhar em outra região

```typescript
function suggestPostTripAction(dropoffLocation: LatLng): PostTripAction {
  const currentDemand = getDemandAtLocation(dropoffLocation);
  const nearbyHotZones = findHotZonesNearby(dropoffLocation, 10); // 10 min radius

  // Caso 1: Demanda alta onde está
  if (currentDemand > 0.8) {
    return { action: 'stay', reason: 'Alta demanda na região', zoneName: null };
  }

  // Caso 2: Zona quente por perto
  if (nearbyHotZones.length > 0) {
    const best = nearbyHotZones[0];
    return {
      action: 'navigate_to_zone',
      reason: `Zona ${best.name} com demanda ${best.demandLevel}`,
      zoneName: best.name,
      zoneLocation: best.location,
      estimatedTimeMinutes: best.estimatedTimeMinutes,
    };
  }

  // Caso 3: Voltar para zona habitual
  const preferredZone = getPreferredZone(driverId);
  if (preferredZone) {
    return {
      action: 'return_to_preferred',
      reason: `Voltar para ${preferredZone.name} — sua zona de maior ganho`,
      zoneName: preferredZone.name,
      zoneLocation: preferredZone.location,
      estimatedTimeMinutes: estimateTravelTime(dropoffLocation, preferredZone.location),
    };
  }

  return { action: 'no_suggestion', reason: 'Continua disponível na região', zoneName: null };
}
```

#### Sugestão de Áreas para Próxima Corrida

O sistema mantém um modelo de previsão de demanda que estima, para cada ponto da cidade, a probabilidade de uma nova solicitação de corrida nos próximos 5 minutos.

```typescript
interface DropoffDemandScore {
  location: LatLng;
  score: number;                    // 0-100
  estimatedWaitMinutes: number;     // tempo estimado até próxima corrida
  avgNextFare: number;              // valor estimado da próxima corrida
  directionToHotZone: string;       // "Siga para norte (Centro)"
}

function predictDropoffDemand(location: LatLng): DropoffDemandScore {
  const features = extractFeatures(location, new Date());
  const score = demandModel.predict(features); // modelo ONNX
  return {
    location,
    score: Math.round(score * 100),
    estimatedWaitMinutes: estimateWaitTime(score),
    avgNextFare: estimateNextFare(location),
    directionToHotZone: getDirectionToHotZone(location),
  };
}
```

O resultado é exibido como um pequeno card após o término de cada corrida:

```
┌──────────────────────────────────────┐
│  🚗  Corrida finalizada              │
│  Passageiro deixou em: Jardins        │
│                                      │
│  Demanda na região: ════⬤═════ 85%   │
│  Próxima corrida estimada: 3 min     │
│  Ticket médio: R$ 28,00              │
│                                      │
│  [Ficar na região]                   │
│  [Ir para Centro — 5 min]  ⭐surge   │
└──────────────────────────────────────┘
```

### 4. Behavior Scoring

#### Visão Geral

Sistema de pontuação comportamental que avalia a qualidade e eficiência do motorista em múltiplas dimensões. O score (0-100) é usado como um dos fatores no algoritmo de dispatch: motoristas com score mais alto recebem prioridade em corridas premium (maior valor, menor distância de busca).

O score reflete não apenas a qualidade do serviço (rating), mas também a eficiência operacional e o engajamento com a plataforma.

#### Dimensões e Pesos

| Dimensão | Peso | Descrição | Fórmula |
|----------|------|-----------|---------|
| Taxa de Aceitação | 30% | Percentual de corridas aceitas nas últimas 100 solicitações | (aceitas / solicitadas) * 100 |
| Rating Médio | 20% | Média das avaliações dos passageiros nas últimas 50 corridas | média das notas (1-5) normalizada para 0-100 |
| Tempo Online Produtivo | 20% | Proporção do tempo online em que está com corrida ativa | (minutos_em_corrida / minutos_online) * 100 |
| Taxa de Cancelamento | 15% | Percentual de corridas canceladas pelo motorista (inverso) | 100 - (canceladas / aceitas) * 100 |
| Eficiência de Rota | 15% | Relação entre distância percorrida e ganho | normalizar(ganho_por_km) * 100 |

#### Algoritmo de Cálculo

```typescript
interface BehaviorScoreInput {
  acceptanceRate: number;       // 0-100
  avgRating: number;            // 1-5
  productiveTimeRatio: number;  // 0-100
  cancellationRate: number;     // 0-100
  earningsPerKm: number;        // R$/km
}

function calculateBehaviorScore(input: BehaviorScoreInput): number {
  // Normalizar rating de 1-5 para 0-100
  const normalizedRating = ((input.avgRating - 1) / 4) * 100;

  // Normalizar earningsPerKm contra benchmark da cidade
  const benchmarkEarningsPerKm = getCityBenchmark('earningsPerKm');
  const normalizedEarnings = Math.min(100, (input.earningsPerKm / benchmarkEarningsPerKm) * 100);

  // Inverter taxa de cancelamento (menos cancelamento = mais pontos)
  const invertedCancellation = 100 - input.cancellationRate;

  // Aplicar pesos
  const score =
    (input.acceptanceRate * 0.30) +
    (normalizedRating * 0.20) +
    (input.productiveTimeRatio * 0.20) +
    (invertedCancellation * 0.15) +
    (normalizedEarnings * 0.15);

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

#### Bônus e Penalidades

Além do cálculo base, existem modifiers que podem ajustar o score:

**Bônus:**
- +5 pontos: completou 100+ corridas no mês sem cancelamento
- +3 pontos: manteve rating > 4.8 nas últimas 50 corridas
- +2 pontos: dirigiu em horários de baixa demanda (ajudando a plataforma)

**Penalidades:**
- -10 pontos: 3+ cancelamentos consecutivos
- -5 pontos: rating < 4.0 nas últimas 10 corridas
- -15 pontos: evento de segurança reportado (freada brusca + reclamação)
- -20 pontos: sleep event com severity 'critical' sem pausa subsequente

#### Atualização do Score

O score é recalculado:
1. **Tempo real (local)** — no dispositivo do motorista, a cada nova corrida finalizada, para feedback imediato
2. **Batch (backend)** — a cada 6 horas no servidor, para consistência entre dispositivos e uso no dispatch
3. **Forçado** — quando o motorista solicita no app ("Atualizar meu score")

#### Uso no Dispatch

O algoritmo de dispatch da TXAPP considera o behavior score na alocação de corridas:

```
Para cada corrida disponível (pool):
  Filtrar motoristas elegíveis (distância, tipo de veículo, etc.)
  Ordenar por:
    1. Behavior score (peso 0.5)
    2. Proximidade (peso 0.3)
    3. Tempo de espera do passageiro (peso 0.2)
  Selecionar top 3 e enviar oferta

Corridas premium (fare > 1.5x mediano):
  Exigir behavior score >= 70
  Ordenar por behavior score decrescente
```

#### Visualização do Score

O score é exibido no perfil do motorista como um gauge circular com faixas de cor:

```
             ╭─────────╮
             │    ┌┐    │
             │  ┌─┘└─┐  │
             │ └─┐  ┌─┘ │
             │   └──┘   │
             │    82    │
             │  Excelente│
             ╰─────────╯

┌─────────────────────────────────────────────┐
│  Detalhamento do Score                       │
│                                             │
│  ════⬤═══════  95  Taxa de Aceitação       │
│  ════⬤═══════  90  Rating (4.5/5)          │
│  ════⬤═══════  75  Tempo Produtivo         │
│  ════⬤═══════  85  Cancelamento (5%)       │
│  ════⬤═══════  65  Eficiência (R$/km)      │
│                                             │
│  🏆 Você está no top 15% dos motoristas!    │
│  📈 Subiu 3 pontos este mês                 │
└─────────────────────────────────────────────┘
```

#### Faixas de Score

| Faixa | Classificação | Benefícios |
|-------|--------------|------------|
| 90-100 | ⭐ Elite | Prioridade máxima em corridas premium, suporte prioritário |
| 75-89 | Excelente | Prioridade em corridas premium |
| 50-74 | Bom | Sem benefícios especiais |
| 25-49 | Regular | Menor prioridade, dicas de melhoria |
| 0-24 | Baixo | Revisão manual, possível suspensão temporária |

#### Notificações de Queda

O sistema notifica o motorista quando detecta queda significativa no score:

```
"⚠️ Seu score caiu de 82 para 74 este mês.
 Principais fatores:
 - Taxa de cancelamento subiu de 3% para 12%
 - Rating caiu de 4.7 para 4.2
 
 Aceitar mais corridas e manter a cordialidade pode ajudar a recuperar seus pontos."
```

### 5. Predictive Maintenance

#### Visão Geral

Sistema de manutenção preditiva que estima desgaste de componentes do veículo com base no uso registrado no app (quilometragem, condições de direção, tempo de operação). O objetivo é evitar quebras durante o expediente e reduzir custos com manutenção corretiva.

#### Base de Cálculo

O sistema parte dos seguintes inputs:

- Quilometragem total registrada no app (somente corridas)
- Quilometragem estimada de deslocamento (app-to-passenger + return trips) — +30% sobre a km de corrida
- Horas de motor ligado (tempo online)
- Padrão de direção (acelerações bruscas, freadas fortes, volantadas)
- Tipo de via predominante (urbano/rodovia, inferido por velocidade média)
- Veículo cadastrado no perfil (marca, modelo, ano)

#### Estimativas de Desgaste

**1. Troca de Óleo**

```
Próxima troca em: {km_desde_ultima_troca + km_estimada_ate_proxima}
Regra:
  SE veículo usa óleo sintético:
    alerta em 8.000 km desde última troca
  SENÃO:
    alerta em 5.000 km desde última troca
  Bônus: SE detecção de direção severa (acelerações bruscas frequentes):
    reduzir em 20% o intervalo
```

**2. Revisão Periódica**

```
Próxima revisão em: {km_desde_ultima_revisao + km_estimada_ate_proxima}
Regra:
  Revisão a cada 10.000 km ou 12 meses (o que vier primeiro)
  Alerta preventivo: 30 dias antes do prazo ou 1.000 km antes
```

**3. Pneus**

```
Vida útil estimada dos pneus: 40.000 km (padrão)
SE padrão de direção contém muitas curvas bruscas (volantadas frequentes):
  reduzir vida útil em 15%
SE velocidade média > 60 km/h (rodovia):
  reduzir vida útil em 10%
SE detectado padrão de freios bruscos frequentes:
  reduzir vida útil em 10%

Alerta: quando km_atual - km_pneus_trocados >= vida_util_estimada * 0.8
```

**4. Freios**

```
Pastilhas de freio: 30.000 km (padrão)
Discos de freio: 60.000 km (padrão)
SE detecção de freadas bruscas em > 10% das corridas:
  reduzir vida útil das pastilhas em 25%
  reduzir vida útil dos discos em 15%
SE viagens longas frequentes (> 20 km) com paradas curtas:
  reduzir vida útil das pastilhas em 15%

Alerta de pastilhas: 20.000 km ou 80% da vida útil
Alerta de discos: 50.000 km ou 80% da vida útil
```

**5. Suspensão**

```
Vida útil estimada: 50.000 km
SE padrão de direção inclui muitas curvas bruscas:
  reduzir vida útil em 20%
SE vias predominantes são não pavimentadas (inferido por aceleração vertical):
  reduzir vida útil em 30%

Alerta: 40.000 km ou 80% da vida útil
```

#### Componente de Notificação

```typescript
interface MaintenanceTip {
  service: string;
  dueKm: number;
  currentKm: number;
  urgency: 'low' | 'medium' | 'high';
  estimatedCost: number;
  description: string;
  partnerWorkshops: Workshop[];
}

function getMaintenanceTips(driverId: string): MaintenanceTip[] {
  const vehicle = getDriverVehicle(driverId);
  const stats = getDriverUsageStats(driverId);
  const lastServices = getLastServices(driverId);

  const tips: MaintenanceTip[] = [];

  // Troca de óleo
  const oilInterval = vehicle.usesSyntheticOil ? 8000 : 5000;
  const kmSinceOilChange = stats.totalKm - lastServices.oilChange.km;
  if (kmSinceOilChange >= oilInterval * 0.8) {
    tips.push({
      service: 'Troca de óleo',
      dueKm: lastServices.oilChange.km + oilInterval,
      currentKm: stats.totalKm,
      urgency: kmSinceOilChange >= oilInterval ? 'high' : 'medium',
      estimatedCost: estimateOilChangeCost(vehicle),
      description: `Seu veículo já rodou ${kmSinceOilChange} km desde a última troca de óleo (intervalo recomendado: ${oilInterval} km).`,
      partnerWorkshops: findPartnerWorkshops('oil_change', driverId),
    });
  }

  // Demais serviços...

  return tips;
}
```

#### Integração com Parceiros

O sistema mantém uma lista de oficinas parceiras que oferecem desconto para motoristas TXAPP:

```sql
CREATE TABLE partner_workshops (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  location          JSONB NOT NULL,
  services_offered  TEXT[] NOT NULL,
  discount_percentage INTEGER NOT NULL DEFAULT 10,
  avg_rating        DECIMAL(3, 2),
  phone             TEXT,
  working_hours     JSONB,
  active            BOOLEAN NOT NULL DEFAULT TRUE
);
```

Quando uma manutenção é sugerida, o motorista pode:
1. Ver a lista de oficinas parceiras próximas
2. Ver preços estimados e descontos
3. Agendar serviço diretamente pelo app (abre link ou agenda via API)
4. Marcar serviço como realizado (para resetar os contadores)

#### Dashboard de Manutenção

```
┌────────────────────────────────────────────────┐
│  🔧  Manutenção Preventiva                     │
│                                                │
│  🟡 Troca de óleo    │  7.200 km │  Em breve  │
│  🟢 Revisão          │  9.500 km │  OK         │
│  🔴 Pneus            │ 34.000 km │  Atenção!   │
│  🟢 Freios           │ 18.000 km │  OK         │
│  🟢 Suspensão        │ 32.000 km │  OK         │
│                                                │
│  Oficinas parceiras próximas:                  │
│  • AutoMec Centro — R$ 180 (troca de óleo)    │
│  • Pneus Rápido — R$ 350 (alinhamento)        │
│                                                │
│  [Agendar Serviço]  [Histórico de Manutenções] │
└────────────────────────────────────────────────┘
```

### 6. Personalized Tips

#### Visão Geral

Módulo de dicas personalizadas geradas com base em análise comparativa: como o motorista se comporta versus os motoristas de melhor performance na mesma cidade/região. As dicas são contextualizadas no momento certo e têm alto grau de acionabilidade.

#### Fontes de Dados

- Dados agregados de todos os motoristas da cidade (anonimizados)
- Histórico e comportamento do motorista atual
- Dados de demanda e oferta da região
- Benchmarks por faixa de score

#### Geração de Dicas

Cada dica é gerada por um template engine que combina regras de negócio com dados dinâmicos.

```typescript
interface Tip {
  id: string;
  category: 'earnings' | 'behavior' | 'schedule' | 'safety' | 'maintenance';
  title: string;
  message: string;
  actionLabel?: string;
  actionPayload?: Record<string, unknown>;
  priority: number;       // 1-5, usada para ordenar cards
  expiresAt?: Date;       // dica expira após este horário
  dismissed: boolean;
}

function generateTips(driverId: string): Tip[] {
  const tips: Tip[] = [];
  const driverData = getDriverBehavior(driverId);
  const cityBenchmarks = getCityBenchmarks(driverData.cityId);

  // 1. Earnings Tip: melhor horário
  const bestHour = findBestHour(driverData.cityId);
  const driverEarningsAtBestHour = getDriverEarningsAtHour(driverId, bestHour.hour, bestHour.day);
  if (driverEarningsAtBestHour < bestHour.avgEarnings * 0.7) {
    tips.push({
      id: 'earnings_best_hour',
      category: 'earnings',
      title: '⏰ Melhor horário',
      message: `Motoristas que ganham 20% mais na sua região trabalham das ${formatHour(bestHour.hour)}. Tente ajustar seu horário!`,
      priority: 4,
      expiresAt: addDays(new Date(), 3),
      dismissed: false,
    });
  }

  // 2. Behavior Tip: queda na taxa de aceitação
  if (driverData.acceptanceRateTrend === 'declining') {
    tips.push({
      id: 'behavior_acceptance',
      category: 'behavior',
      title: '📊 Taxa de aceitação',
      message: `Sua taxa de aceitação caiu ${Math.abs(driverData.acceptanceRateDelta)}% este mês. Aceitar mais corridas pode aumentar seus ganhos em até ${estimateEarningsGain(driverId)}%.`,
      priority: 3,
      dismissed: false,
    });
  }

  // 3. Congratulatory Tip: top performer
  const percentile = calculatePercentile(driverData.behaviorScore, driverData.cityId);
  if (percentile <= 10) {
    tips.push({
      id: 'congrats_top10',
      category: 'behavior',
      title: '🏆 Top 10%',
      message: 'Você está no top 10% dos motoristas! Continue assim. Seu comportamento exemplar é reconhecido no dispatch.',
      priority: 1,
      dismissed: false,
    });
  }

  // 4. Zone Tip: demanda atual
  const hotZone = getHottestZone(driverData.cityId, new Date());
  if (hotZone && driverData.currentZone !== hotZone.id) {
    const distance = calculateDistance(driverData.currentLocation, hotZone.location);
    if (distance < 10000) { // até 10km
      tips.push({
        id: 'zone_demand_now',
        category: 'earnings',
        title: '📍 Demanda agora',
        message: `Tente ficar perto de ${hotZone.name} — maior demanda do momento com ticket médio de R$ ${hotZone.avgFare}.`,
        actionLabel: 'Ver no mapa',
        actionPayload: { zoneId: hotZone.id, zoom: 14 },
        priority: 5,
        expiresAt: addHours(new Date(), 2),
        dismissed: false,
      });
    }
  }

  // 5. Safety Tip: tempo sem pausa
  const drivingMinutes = getCurrentDrivingMinutes(driverId);
  if (drivingMinutes > 180) {
    tips.push({
      id: 'safety_break',
      category: 'safety',
      title: '☕ Hora da pausa',
      message: `Você está há ${Math.floor(drivingMinutes / 60)}h${drivingMinutes % 60}min dirigindo. Uma pausa de 15min melhora sua concentração em até 40%.`,
      actionLabel: 'Encontrar parada',
      actionPayload: { type: 'rest_stop' },
      priority: 5,
      dismissed: false,
    });
  }

  return tips.sort((a, b) => b.priority - a.priority);
}
```

#### Catálogo de Templates de Dicas

| Template | Gatilho | Categoria | Prioridade |
|----------|---------|-----------|------------|
| `earnings_best_hour` | Motorista não trabalha no melhor horário da região | earnings | 4 |
| `earnings_zone` | Existe zona quente próxima | earnings | 5 |
| `earnings_promotion` | Promoção ativa na região | earnings | 5 |
| `earnings_shift_suggestion` | Histórico mostra baixo ganho em horário atual | earnings | 3 |
| `behavior_acceptance` | Queda na taxa de aceitação > 5% no mês | behavior | 3 |
| `behavior_cancellation` | Aumento na taxa de cancelamento > 3% | behavior | 3 |
| `behavior_rating_drop` | Rating caiu > 0.3 no mês | behavior | 4 |
| `congrats_top10` | Motorista está no top 10% da cidade | behavior | 1 |
| `congrats_improvement` | Score subiu > 5 pontos no mês | behavior | 1 |
| `schedule_productive` | Baixo tempo produtivo (< 60%) | schedule | 3 |
| `schedule_peak_hours` | Motorista está online fora do pico | schedule | 2 |
| `safety_break` | > 3h sem pausa | safety | 5 |
| `safety_night` | Dirigindo em horário noturno com baixo score de sono | safety | 4 |
| `safety_erratic` | Padrão de direção errática detectado | safety | 5 |
| `maintenance_oil` | Troca de óleo próxima | maintenance | 3 |
| `maintenance_tires` | Pneus com desgaste avançado | maintenance | 4 |
| `maintenance_brakes` | Freios próximos da troca | maintenance | 4 |
| `maintenance_inspection` | Revisão periódica próxima | maintenance | 2 |

#### Componente DriverInsights

O componente `DriverInsights` renderiza os cards de dicas em uma lista rolável vertical com as seguintes regras de exibição:

- Máximo de 5 cards visíveis por vez
- Cards de prioridade 5 ficam fixos no topo (não podem ser dispensados até expirar)
- Cards de prioridade 1-4 podem ser dispensados (deslizar para a direita ou botão X)
- Cards dispensados não reaparecem por 7 dias
- Cards expirados são removidos automaticamente
- Se não houver dicas ativas, mostra mensagem "Nenhuma dica no momento. Continue dirigindo!"

```tsx
function DriverInsights() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const loadTips = async () => {
      const engine = NativeModules.DriverAIEngine;
      const allTips = await engine.getPersonalizedTips();
      const filtered = allTips.filter(
        tip => !dismissed.includes(tip.id) && (!tip.expiresAt || new Date(tip.expiresAt) > new Date())
      );
      setTips(filtered);
    };

    loadTips();
    const interval = setInterval(loadTips, 300000); // recarregar a cada 5 min
    return () => clearInterval(interval);
  }, [dismissed]);

  return (
    <View style={styles.container}>
      {tips.length === 0 ? (
        <EmptyState message="Nenhuma dica no momento. Continue dirigindo!" />
      ) : (
        <FlatList
          data={tips}
          renderItem={({ item }) => (
            <TipCard
              tip={item}
              onDismiss={() => setDismissed(prev => [...prev, item.id])}
            />
          )}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
}
```

## Componentes React

### DriverInsights

**Localização:** `src/screens/driver/DriverInsights.tsx`

**Função:** Exibe cards de dicas personalizadas geradas pelo módulo de Personalized Tips. O componente se posiciona na tela inicial do motorista (home) ou como uma aba dedicada "Insights".

**Props:**
```typescript
interface DriverInsightsProps {
  driverId: string;
  maxVisible?: number;       // default: 5
  showDismissButton?: boolean; // default: true
  onTipAction?: (tip: Tip) => void;
  refreshIntervalMs?: number;  // default: 300000
}
```

**Estados:**
- `loading`: Skeleton loader com 3 placeholders
- `empty`: Ilustração + texto "Nenhuma dica no momento"
- `tips`: Lista rolável de TipCard
- `error`: "Não foi possível carregar dicas. Verifique sua conexão."

### DriverEarningsChart

**Localização:** `src/screens/driver/DriverEarningsChart.tsx`

**Função:** Exibe gráficos interativos de ganhos do motorista com opções de filtro por período (dia, semana, mês) e breakdown por hora e zona.

**Props:**
```typescript
interface DriverEarningsChartProps {
  driverId: string;
  period?: 'day' | 'week' | 'month';
  showComparison?: boolean;  // comparar com média da cidade
  onPeriodChange?: (period: string) => void;
  height?: number;
}
```

**Dados renderizados:**
1. Gráfico de barras empilhadas: ganho por hora do dia (atual vs média da semana)
2. Gráfico de linha: ganho acumulado no mês com meta configurável
3. Tabela: breakdown por zona (nome, corridas, ganho bruto, gasolina, ganho líquido, tempo)
4. Card de destaque com melhor horário/zona do período

**Integração nativa:** O componente chama `DriverAIEngine.getEarningsInsight()` via bridge para obter os dados processados.

### DriverZoneHeatmap

**Localização:** `src/screens/driver/DriverZoneHeatmap.tsx`

**Função:** Renderiza um mapa térmico (heatmap) sobreposto ao mapa da cidade mostrando as zonas de maior demanda e ganho potencial. O motorista pode tocar em uma zona para ver detalhes e navegar até ela.

**Props:**
```typescript
interface DriverZoneHeatmapProps {
  driverId: string;
  cityId: number;
  heatmapType: 'demand' | 'earnings' | 'surge';
  onZoneSelect?: (zone: Zone) => void;
  showCurrentLocation?: boolean;
  initialZoom?: number;     // default: 12
}
```

**Camadas do mapa:**
- Polígonos das zonas com cores gradientes (verde = baixa, amarelo = média, vermelho = alta)
- Marcador da localização atual do motorista
- Marcadores de promoções ativas com ícone de 💰
- Popup ao tocar: nome da zona, ticket médio, demanda, tempo estimado até lá

**Atualização:** O heatmap é atualizado a cada 30 minutos ou quando o motorista dá pull-to-refresh.

### DriverSleepAlert

**Localização:** `src/screens/driver/DriverSleepAlert.tsx`

**Função:** Componente de alerta de sonolência com três níveis de severidade. Aparece como overlay na tela inteira em situações críticas e como banner nos níveis mais leves.

**Props:**
```typescript
interface DriverSleepAlertProps {
  severity: 'warning' | 'critical';
  drivingMinutes: number;
  confidence: number;
  onTakeBreak: () => void;
  onIgnore: () => void;
  onEmergencyCall: () => void;
  onDismiss?: () => void;
}
```

**Comportamento:**
- `warning`: Banner semi-transparente no topo com ícone de café, botão "Fazer pausa de 15min" e "Ignorar". Não bloqueia interação com o mapa.
- `critical`: Overlay full-screen vermelho com instruções "PARE O VEÍCULO IMEDIATAMENTE", botão pulsante "Emergência — Ligar Central" e botão secundário "Já parei". Bloqueia navegação até que o motorista interaja.

**Animações:**
- Warning: slide down do topo, duração 300ms
- Critical: fade-in com opacidade 0→0.95, duração 200ms + vibração do dispositivo
- Botão de emergência: pulse animation com escala 1.0→1.05→1.0

### DriverBehaviorGauge

**Localização:** `src/components/driver/DriverBehaviorGauge.tsx`

**Função:** Gauge circular que exibe o behavior score do motorista com breakdown por dimensão.

**Props:**
```typescript
interface DriverBehaviorGaugeProps {
  score: number;
  dimensions?: BehaviorDimension[];
  size?: 'small' | 'medium' | 'large';
  showBreakdown?: boolean;
  onDimensionPress?: (dimension: BehaviorDimension) => void;
}

interface BehaviorDimension {
  label: string;
  value: number;
  maxValue: number;
  weight: number;
  color: string;
}
```

### DriverPostTripCard

**Localização:** `src/components/driver/DriverPostTripCard.tsx`

**Função:** Card exibido após o término de cada corrida com sugestões de rota de retorno e análise de demanda no local de dropoff.

**Props:**
```typescript
interface DriverPostTripCardProps {
  dropoffLocation: LatLng;
  dropoffDemandScore: DropoffDemandScore;
  postTripAction: PostTripAction;
  onStayInZone: () => void;
  onNavigateToZone: (zone: Zone) => void;
  onReturnToPreferred: () => void;
  onDismiss: () => void;
}
```

## Modelos de Machine Learning

### Modelo de Previsão de Demanda

**Arquitetura:** LightGBM regressor

**Features de entrada:**
- Hora do dia (0-23), dia da semana (0-6), dia do mês (1-31)
- Feriado (binário), véspera de feriado (binário)
- Temperatura, condição climática (codificada)
- Eventos na cidade (show, jogo, festival) — distância e porte
- Histórico de demanda na última hora na região
- Número de motoristas ativos na região

**Target:** Número esperado de solicitações de corrida na próxima hora em cada zona

**Métrica de performance:** MAE < 3.0 (desvio médio absoluto de 3 corridas)

### Modelo de Sleep Detection

**Arquitetura:** LSTM bidirecional (BiLSTM)

**Features sequenciais (60 segundos, janela de 5s):**
- Velocidade instantânea
- Variação de heading (direção)
- Aceleração nos eixos X, Y, Z
- Ângulo de esterço (inferido do heading delta)
- Tempo desde última pausa (feature global, não sequencial)

**Treinamento:** Dataset sintético + 5.000 horas de dados reais de motoristas voluntários rotulados com sonolência via questionário pós-corrida.

### Modelo de Behavior Scoring

**Arquitetura:** Regressão logística com transformação polinomial de features

**Features:**
- Taxa de aceitação (últimas 100 solicitações)
- Rating médio (últimas 50 corridas)
- Tempo produtivo (últimos 30 dias)
- Taxa de cancelamento (últimas 100 aceitas)
- Ganho por km (últimos 30 dias)
- Quantidade de corridas no período
- Tempo médio de corrida

**Calibração:** Platt scaling para mapear saídas para o intervalo 0-100

## Segurança e Privacidade

### Dados de Localização

- A localização precisa (lat/lng) é armazenada apenas no dispositivo do motorista
- Para o backend, os dados são anonimizados e agregados por zona (nível de bairro)
- O motorista pode desativar o compartilhamento de localização a qualquer momento
- Quando a localização é desativada, a detecção de sono e a otimização de rotas são desabilitadas

### Consentimento

- O motorista deve aceitar explicitamente os termos de uso do Driver AI na primeira abertura
- O consentimento pode ser revogado nas configurações do app
- A coleta de telemetria para treinamento do modelo de sono é opcional

### Criptografia

- Dados em trânsito: TLS 1.3
- Dados em repouso no dispositivo: SQLite com encryption (SQLCipher)
- Dados em repouso no servidor: criptografia AES-256

## Métricas e Monitoramento

### Eventos Registrados

Cada ação do Driver AI é registrada para análise de efetividade:

```sql
CREATE TABLE ai_event_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         UUID NOT NULL REFERENCES auth.users(id),
  event_type        TEXT NOT NULL,
  event_data        JSONB NOT NULL,
  driver_action     TEXT, -- 'accepted' | 'dismissed' | 'ignored' | 'viewed'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_events_driver_type ON ai_event_log(driver_id, event_type);
```

### KPIs

| KPI | Fórmula | Meta |
|-----|---------|------|
| Taxa de aceitação de dicas | ações / impressões de dicas | > 40% |
| Redução de sleep events críticos | eventos críticos mês atual / mês anterior | > 20% redução |
| Aumento de ganho médio | ganho médio motoristas usando AI vs não usando | > 15% |
| Engajamento com heatmap | sessões com interação no heatmap / total de sessões | > 30% |
| Precisão do modelo de demanda | predições com erro < 3 corridas | > 85% |

### Logs e Debug

- Logs de inferência local são armazenados por 7 dias no dispositivo
- Logs de eventos críticos (sleep critical, erros de modelo) são enviados ao backend imediatamente
- Modo de debug: motorista pode ativar "Modo Desenvolvedor" que exibe scores brutos e decisões do modelo

## Testes

### Testes Unitários

```typescript
// behaviorScore.test.ts
describe('BehaviorScore', () => {
  it('calculates score correctly for elite driver', () => {
    const input = {
      acceptanceRate: 95,
      avgRating: 4.9,
      productiveTimeRatio: 85,
      cancellationRate: 2,
      earningsPerKm: 2.5,
    };
    const score = calculateBehaviorScore(input);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('penalizes high cancellation rate', () => {
    const input = {
      acceptanceRate: 80,
      avgRating: 4.5,
      productiveTimeRatio: 70,
      cancellationRate: 25,
      earningsPerKm: 2.0,
    };
    const score = calculateBehaviorScore(input);
    expect(score).toBeLessThan(60);
  });
});
```

### Testes de Integração

- Sleep detection: simular telemetria com padrão de volantadas e verificar alerta
- Earnings optimization: mock de dados históricos e verificar sugestão de horário
- Route suggestions: mock de road events e verificar rota alternativa

### Testes End-to-End

- Detox (React Native E2E) para fluxo completo: motorista recebe alerta de sono → faz pausa → recebe dica de zona → navega
- Teste de bateria: garantir que o Driver AI Engine não consome mais que 5% da bateria por hora de uso

## Implantação e CI/CD

### Pipeline

1. **Feature branch:** testes unitários + lint + typecheck
2. **Staging:** testes de integração + E2E em dispositivo físico
3. **Production:** rollout gradual (5% → 25% → 50% → 100%) com monitoramento de crash rate

### Feature Flags

```typescript
const DRIVER_AI_FLAGS = {
  sleepDetection: { enabled: true, rolloutPercentage: 100 },
  earningsOptimization: { enabled: true, rolloutPercentage: 100 },
  routeSuggestions: { enabled: false, rolloutPercentage: 0 }, // em beta
  predictiveMaintenance: { enabled: true, rolloutPercentage: 50 },
  personalizedTips: { enabled: true, rolloutPercentage: 100 },
};
```

### ONNX Model Deployment

- Modelos são armazenados no CDN (Supabase Storage) versionados por hash SHA-256
- App baixa modelos na inicialização se houver versão mais recente
- Fallback para regras programáticas se download falhar
- Modelos têm no máximo 5MB para garantir download rápido em redes 3G

## Apêndice

### A. Glossário

| Termo | Definição |
|-------|-----------|
| Surge | Multiplicador de preço em zona de alta demanda |
| Dropoff | Local onde o passageiro é deixado |
| Volantada | Correção brusca de direção indicando sonolência ou distração |
| Behavior Score | Pontuação composta de 0 a 100 avaliando o motorista |
| Dispatch | Algoritmo que aloca corridas para motoristas |
| Telemetry Collector | Módulo nativo que coleta sensores do dispositivo |
| ONNX Runtime | Framework de inferência cross-platform para modelos de ML |
| Edge Function | Função serverless no Supabase |
| Zone | Divisão geográfica da cidade (bairro ou conjunto de bairros) |

### B. Referências

- ONNX Runtime Mobile: https://onnxruntime.ai/
- LightGBM: https://lightgbm.readthedocs.io/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- React Native Maps: https://github.com/react-native-maps/react-native-maps
- MapLibre GL (heatmap): https://maplibre.org/

### C. Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-07-13 | Documento inicial com especificação completa do Driver AI |
| 1.1.0 | TBD | Adicionar suporte a detecção de distração por celular ao dirigir |
| 2.0.0 | TBD | Modelo de previsão de churn de motoristas integrado ao AI Engine |
