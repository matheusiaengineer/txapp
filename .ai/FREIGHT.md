# TXAPP Freight Marketplace

## Visão Geral

O TXAPP Freight Marketplace é uma plataforma digital que conecta empresas que precisam transportar cargas com transportadores e motoristas autônomos. O marketplace opera sob um modelo de lances (bidding), onde empresas publicam fretes com descrição detalhada da carga, origem, destino, prazos e orçamento, e transportadores habilitados podem dar lances para executar o serviço.

A plataforma cobre 17 categorias de veículos de carga, desde motos e bicicletas até carretas bitrem e máquinas agrícolas, oferecendo uma solução completa para logística urbana e rodoviária.

O sistema inclui funcionalidades de geolocalização, tracking em tempo real, assinatura digital, sistema de pontuação de transportadores, análise de rotas, cálculo de fretes sugeridos com base em inteligência artificial, e integração com meios de pagamento.

### Público-Alvo

- **Empresas contratantes:** comércios eletrônicos, indústrias, distribuidoras, agroindústrias, construtoras, lojas de varejo, transportadoras que precisam de frota terceirizada
- **Transportadores:** motoristas autônomos (MEI), pequenas transportadoras, cooperativas de transporte, frotistas
- **Segmentos atendidos:** entregas urbanas (last mile), cargas fracionadas, cargas completas (FTL), mudanças, transporte de máquinas, remoção de entulho, transporte agrícola

### Diferenciais Competitivos

- **17 categorias de veículos** — cobertura total do mercado de transporte de cargas
- **Geolocalização inteligente** — busca de fretes por raio de distância da origem
- **Sistema de pontuação** — ranking de transportadores baseado em performance
- **Tracking em tempo real** — visibilidade total da carga para a empresa contratante
- **Assinatura digital** — comprovação de entrega com validade jurídica
- **Contra-proposta** — negociação direta entre empresa e transportador
- **Fotos da carga** — documentação visual antes/durante/depois do transporte
- **Cálculo inteligente de frete** — sugestão de orçamento baseado em categoria, distância, peso, volume e histórico de mercado
- **Proteção ao contratante** — seguro obrigatório, documento do veículo, CNH compatível

### Objetivos de Negócio

1. Reduzir custos de frete para empresas contratantes através da competição entre transportadores
2. Aumentar a taxa de ocupação da frota de transportadores autônomos
3. Garantir segurança e rastreabilidade em todas as etapas do transporte
4. Criar um ecossistema de logística confiável com ratings e reputação
5. Automatizar processos de contratação de frete, pagamento e comprovação fiscal

---

## Arquitetura

### Visão Macro

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    TXAPP Platform                    │
                    │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
                    │  │   Frontend   │  │   Backend    │  │    DB     │ │
                    │  │  (React/RN)  │  │ (Node/Bun)   │  │(Supabase) │ │
                    │  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
                    └─────────┼──────────────────┼────────────────┼───────┘
                              │                  │                │
                              ▼                  ▼                ▼
                    ┌────────────────────────────────────────────────────┐
                    │              Freight Marketplace Module            │
                    │  ┌──────────┐  ┌────────┐  ┌────────┐  ┌───────┐ │
                    │  │ Bidding  │  │Tracking│  │Rating  │  │Payment│ │
                    │  │ Engine   │  │Service │  │System  │  │Gateway│ │
                    │  └──────────┘  └────────┘  └────────┘  └───────┘ │
                    └────────────────────────────────────────────────────┘
```

### Fluxo de Dados Principal

```
Company → Publish Load → Freight Marketplace → Drivers/Transporters Bid
                                                      │
                                                      ▼
                                              Company Accepts Bid
                                                      │
                                                      ▼
                                              Driver goes to Collection
                                                      │
                                                      ▼
                                              Driver Picks Up (Photo)
                                                      │
                                                      ▼
                                              Delivery In Transit (GPS)
                                                      │
                                                      ▼
                                              Driver Delivers (Photo + Signature)
                                                      │
                                                      ▼
                                              Company Confirms + Rates Driver
                                                      │
                                                      ▼
                                              Payment Released to Driver
```

### Stack Tecnológica

| Componente | Tecnologia |
|------------|-----------|
| Frontend Web | React 18+ com TypeScript |
| Frontend Mobile | React Native |
| Backend | Node.js + Bun runtime |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime / WebSockets |
| Mapas | Mapbox GL / Leaflet + OpenStreetMap |
| Geocoding | Nominatim / Google Maps API |
| Autenticação | Supabase Auth (JWT) |
| Upload Fotos | Supabase Storage |
| Pagamentos | Stripe / Mercado Pago |
| Notificações | Push notifications (Firebase) + Email (SendGrid) |
| Cache | Redis (upstash) |
| Filas | BullMQ (Redis) — para processamento de tracking batches |
| IA | Modelo de precificação baseado em ML |

### Estrutura de Módulos

```
src/
├── modules/
│   └── freight/
│       ├── api/                    # Rotas da API REST
│       │   ├── loads.ts           # CRUD de fretes
│       │   ├── bids.ts            # Lances e contrapostas
│       │   ├── tracking.ts        # Tracking e geolocalização
│       │   ├── profiles.ts        # Perfis de empresa/transportador
│       │   ├── ratings.ts         # Avaliações
│       │   ├── categories.ts      # Categorias de veículos
│       │   └── payment.ts         # Pagamentos e liberação
│       ├── components/
│       │   ├── FreightMarketplace.tsx
│       │   ├── FreightLoadCard.tsx
│       │   ├── FreightPublishForm.tsx
│       │   ├── FreightBidForm.tsx
│       │   ├── FreightDetail.tsx
│       │   ├── FreightTracking.tsx
│       │   ├── FreightHistory.tsx
│       │   └── FreightBidList.tsx
│       ├── hooks/
│       │   ├── useFreightLoads.ts
│       │   ├── useFreightBids.ts
│       │   ├── useFreightTracking.ts
│       │   ├── useFreightHistory.ts
│       │   └── useGeolocation.ts
│       ├── services/
│       │   ├── freightService.ts
│       │   ├── trackingService.ts
│       │   ├── bidService.ts
│       │   ├── paymentService.ts
│       │   ├── ratingService.ts
│       │   ├── notificationService.ts
│       │   └── routeService.ts
│       ├── utils/
│       │   ├── distance.ts        # Cálculo de distância, raio, geohash
│       │   ├── pricing.ts         # Algoritmo de precificação sugerida
│       │   ├── validators.ts      # Validação de CNPJ, CNH, documentos
│       │   ├── formatters.ts      # Formatação de moeda, datas
│       │   └── scoring.ts         # Cálculo de pontuação do transportador
│       ├── types/
│       │   └── index.ts           # TypeScript types/interfaces
│       └── i18n/
│           ├── pt-BR.ts
│           └── en-US.ts
```

### Princípios de Design

1. **Domain-Driven Design** — cada módulo encapsula seu domínio de negócio
2. **Event-Driven Architecture** — eventos de domínio (frete publicado, lance aceito, entrega confirmada) disparam workflows assíncronos
3. **CQRS** — separação entre comandos (publicar, dar lance) e queries (listar fretes, buscar por raio)
4. **API-First** — todas as funcionalidades expostas via REST API, consumidas pelo frontend e por integrações externas
5. **Offline-First** — tracking funciona offline com sincronização quando conectado

### Workflows Assíncronos (Event-Driven)

| Evento | Ação |
|--------|------|
| `freight.published` | Notificar transportadores próximos, sugerir preço por IA |
| `freight.bid_received` | Notificar empresa, atualizar ranking do transportador |
| `freight.bid_accepted` | Bloquear frete, notificar transportador vencedor |
| `freight.picked_up` | Atualizar status, disparar tracking, notificar empresa |
| `freight.delivered` | Notificar empresa para confirmação, liberar avaliação |
| `freight.confirmed` | Processar pagamento, atualizar rating, emitir nota fiscal |
| `freight.cancelled` | Calcular penalidades, notificar partes, liberar frete |
| `freight.expired` | Fechar lances automaticamente, notificar empresa |

---

## Categorias de Veículos

### Tabela freight_categories

```sql
create table freight_categories (
  id            text primary key,
  name          text not null,                    -- nome em inglês
  name_pt       text not null,                    -- nome em português
  icon          text not null,                    -- ícone Lucide/nome do ícone
  color         text not null,                    -- cor hexadecimal (#RRGGBB)
  max_weight_kg numeric(8,2) not null,            -- peso máximo em kg
  max_volume_m3 numeric(8,2) not null,            -- volume máximo em m³
  max_height_cm numeric(6,2) not null,            -- altura máxima em cm
  max_width_cm  numeric(6,2) not null,            -- largura máxima em cm
  max_length_cm numeric(6,2) not null,            -- comprimento máximo em cm
  requires_cnh  text not null default '',         -- CNH requerida: A, B, C, D, E ou combinações (ex: "B,C")
  requires_insurance         boolean not null default false,
  requires_vehicle_documents boolean not null default false,
  enabled       boolean not null default true,
  sort_order    integer not null default 0,
  description   text not null default '',         -- descrição detalhada em português
  examples      text[] not null default '{}',     -- exemplos de uso
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices
create index idx_freight_categories_enabled on freight_categories(enabled);
create index idx_freight_categories_sort on freight_categories(sort_order);
```

### As 17 Categorias

```sql
insert into freight_categories (id, name, name_pt, icon, color, max_weight_kg, max_volume_m3, max_height_cm, max_width_cm, max_length_cm, requires_cnh, requires_insurance, requires_vehicle_documents, enabled, sort_order, description, examples) values

  -- 1. Moto
  ('moto', 'Motorcycle', 'Moto', 'bike', '#FF6B6B', 30, 0.1, 60, 60, 80, 'A', false, false, true, 1,
   'Entregas rápidas de pequenos volumes utilizando motocicletas. Ideal para documentos, alimentos, pequenos pacotes e encomendas urgentes em área urbana.',
   '{"Documentos","Refeição delivery","Remédios","Pequenos pacotes","Encomendas urgentes"}'),

  -- 2. Bike
  ('bike', 'Bicycle', 'Bike', 'bike', '#FFA502', 20, 0.08, 50, 50, 70, '', false, false, true, 2,
   'Entregas sustentáveis de curta distância utilizando bicicletas. Ideal para região central, áreas de difícil acesso e entregas ecológicas.',
   '{"Documentos","Refeição delivery","Pequenas encomendas","Entregas ecológicas"}'),

  -- 3. Carro
  ('carro', 'Car', 'Carro', 'car', '#1E90FF', 200, 1.0, 80, 100, 120, 'B', false, false, true, 3,
   'Transporte de volumes médios utilizando automóveis de passeio. Ideal para entregas urbanas, cargas fracionadas e documentos volumosos.',
   '{"Caixas médias","Mudas de plantas","Peças automotivas","Equipamentos eletrônicos","Mala de viagem"}'),

  -- 4. SUV
  ('suv', 'SUV', 'SUV', 'car-front', '#2ED573', 400, 1.5, 90, 110, 150, 'B', false, false, true, 4,
   'Transporte de volumes maiores utilizando veículos utilitários esportivos. Maior capacidade que carros convencionais, ideal para cargas semivolumosas.',
   '{"Móveis pequenos","Eletrodomésticos","Mudas grandes","Equipamentos de som","Compras em volume"}'),

  -- 5. Pickup
  ('pickup', 'Pickup Truck', 'Pickup', 'truck', '#F7B731', 1000, 3.0, 120, 150, 200, 'B', false, false, true, 5,
   'Transporte de cargas utilizando picapes com caçamba aberta ou fechada. Ideal para materiais de construção, mudanças pequenas e cargas a granel.',
   '{"Materiais de construção","Mudanças pequenas","Móveis","Eletrodomésticos","Cargas a granel"}'),

  -- 6. Van
  ('van', 'Van', 'Van', 'van', '#45AAF2', 1500, 8.0, 150, 180, 300, 'B', false, false, true, 6,
   'Transporte de cargas maiores utilizando vans com compartimento de carga fechado. Ideal para mudanças residenciais, cargas fracionadas e entregas de comércio eletrônico.',
   '{"Mudanças","Móveis planejados","Equipamentos de academia","Cargas de e-commerce","Suprimentos de escritório"}'),

  -- 7. HR (Hand Road)
  ('hr', 'Hand Road (HR)', 'HR (Hand Road)', 'truck', '#5F27CD', 3000, 15.0, 180, 200, 500, 'C', true, true, true, 7,
   'Veículo de carga médio com capacidade intermediária. Ideal para distribuição urbana, entregas regionais e cargas paletizadas de médio porte.',
   '{"Paletes","Distribuição urbana","Cargas paletizadas","Materiais de construção","Suprimentos industriais"}'),

  -- 8. 3/4
  ('34', 'Light Truck (3/4)', 'Toco 3/4', 'truck', '#8854D0', 4000, 20.0, 200, 220, 600, 'C', true, true, true, 8,
   'Caminhão leve 3/4 com carroceria aberta ou baú. Ideal para cargas fracionadas, distribuição intermunicipal e cargas que exigem maior capacidade que HR.',
   '{"Cargas fracionadas","Mudanças","Distribuição","Materiais de construção","Produtos alimentícios"}'),

  -- 9. Toco
  ('toco', 'Rigid Truck (Toco)', 'Toco', 'truck', '#A55EEA', 6000, 30.0, 220, 250, 700, 'C', true, true, true, 9,
   'Caminhão toco (eixo simples dianteiro + eixo simples traseiro) com cabine e carroceria integradas. Ideal para cargas de médio porte, distribuição e fretes intermunicipais.',
   '{"Cargas médias","Distribuição","Mudanças grandes","Materiais de construção","Produtos industrializados"}'),

  -- 10. Truck
  ('truck', 'Truck', 'Truck', 'truck', '#D980FA', 12000, 50.0, 250, 260, 1000, 'C', true, true, true, 10,
   'Caminhão truck (dois eixos traseiros) com maior capacidade de carga. Ideal para cargas pesadas, fretes rodoviários de longa distância e transporte interestadual.',
   '{"Cargas pesadas","Fretes rodoviários","Transporte interestadual","Máquinas","Cargas paletizadas pesadas"}'),

  -- 11. Bitrem
  ('bitrem', 'Bitrem', 'Bitrem', 'truck', '#E056FD', 25000, 80.0, 280, 260, 1500, 'E', true, true, true, 11,
   'Combinação de cavalo mecânico com dois semirreboques articulados. Ideal para grandes volumes, transporte de grãos, cargas paletizadas em grande escala.',
   '{"Grãos","Cargas paletizadas","Transporte de longo curso","Combustíveis","Produtos químicos"}'),

  -- 12. Carreta
  ('carreta', 'Semi-Trailer (Carreta)', 'Carreta', 'truck', '#C44569', 40000, 100.0, 280, 260, 1500, 'E', true, true, true, 12,
   'Cavalo mecânico com semirreboque. Maior capacidade de peso do segmento. Ideal para cargas pesadíssimas, contêineres, aço, bobinas e granéis sólidos.',
   '{"Contêineres","Aço e bobinas","Granéis sólidos","Cargas pesadíssimas","Produtos siderúrgicos"}'),

  -- 13. Guincho
  ('guincho', 'Tow Truck (Guincho)', 'Guincho', 'truck', '#574B90', 3000, 0, 0, 0, 0, 'C', true, true, true, 13,
   'Veículo especializado para reboque e remoção de veículos. Ideal para guincho de automóveis, motos e veículos de pequeno e médio porte.',
   '{"Reboque de veículos","Remoção de automóveis","Guincho 24h","Transporte de veículos acidentados"}'),

  -- 14. Munck
  ('munck', 'Truck with Crane (Munck)', 'Munck', 'truck', '#3DC1D3', 8000, 0, 0, 0, 0, 'C', true, true, true, 14,
   'Caminhão com guindaste hidráulico articulado (munck) para carga e descarga de materiais pesados. Ideal para transporte e içamento de máquinas, equipamentos e materiais de construção.',
   '{"Máquinas industriais","Equipamentos pesados","Ar condicionado","Transformadores","Estruturas metálicas"}'),

  -- 15. Caçamba
  ('cacamba', 'Dump Truck (Caçamba)', 'Caçamba', 'truck', '#F97F51', 5000, 0, 0, 0, 0, 'C', true, true, true, 15,
   'Caminhão basculante (caçamba) para transporte de entulho, terra, areia, brita e materiais a granel. Ideal para construção civil, demolições e limpeza de terrenos.',
   '{"Entulho","Terra e areia","Brita","Demolição","Limpeza de terreno"}'),

  -- 16. Trator
  ('trator', 'Tractor', 'Trator', 'tractor', '#82CCDD', 0, 0, 0, 0, 0, 'B', true, true, true, 16,
   'Trator agrícola para transporte de implementos, reboques e cargas no campo. Ideal para atividades rurais, preparo de solo e transporte interno em fazendas.',
   '{"Implementos agrícolas","Reboques","Preparo de solo","Transporte em fazendas","Grade e arado"}'),

  -- 17. Máquinas Agrícolas
  ('maquinas-agricolas', 'Agricultural Machinery', 'Máquinas Agrícolas', 'tractor', '#26A65B', 0, 0, 0, 0, 0, 'B', true, true, true, 17,
   'Transporte de máquinas agrícolas de grande porte como colheitadeiras, plantadeiras, pulverizadores e implementos especiais. Necessita de equipamentos de carga especiais.',
   '{"Colheitadeiras","Plantadeiras","Pulverizadores","Implementos especiais","Máquinas de irrigação"}');
```

### Regras por Categoria

| Categoria | CNH | Seguro | Documentos | Observações |
|-----------|-----|--------|------------|-------------|
| Moto | A | Não | Não | Capacete obrigatório, baú ou mochila |
| Bike | — | Não | Não | Entrega ecológica, sem motor |
| Carro | B | Não | Não | Porta-malas, banco traseiro |
| SUV | B | Não | Não | Espaçoso, teto pode ser usado |
| Pickup | B | Não | Não | Caçamba aberta, lona recomendada |
| Van | B | Não | Não | Baú fechado, ideal para mudanças |
| HR | C | Sim | Sim | Primeira categoria com restrições |
| 3/4 | C | Sim | Sim | Categoria de transição |
| Toco | C | Sim | Sim | Muito comum em frete rodoviário |
| Truck | C | Sim | Sim | Documentação rigorosa |
| Bitrem | E | Sim | Sim | Exige curso MOPP se carga perigosa |
| Carreta | E | Sim | Sim | Exige AET (Autorização Especial de Trânsito) se exceder limites |
| Guincho | C | Sim | Sim | Equipamento de reboque homologado |
| Munck | C | Sim | Sim | Operador com NR-11 (operação de guindaste) |
| Caçamba | C | Sim | Sim | Lona obrigatória para evitar derramamento |
| Trator | B | Sim | Sim | Uso exclusivo rural |
| Máq. Agrícolas | B | Sim | Sim | Transporte em carretas especiais |

---

## Tabela freight_loads

```sql
create table freight_loads (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references company_freight_profiles(id),
  title               text not null,
  description         text not null default '',
  origin_address      text not null,
  origin_lat          numeric(10,7) not null,
  origin_lng          numeric(10,7) not null,
  destination_address text not null,
  destination_lat     numeric(10,7) not null,
  destination_lng     numeric(10,7) not null,
  category_id         text not null references freight_categories(id),
  weight_kg           numeric(10,2),
  volume_m3           numeric(10,2),
  height_cm           numeric(8,2),
  width_cm            numeric(8,2),
  length_cm           numeric(8,2),
  requires_cnh        text not null default '',
  requires_insurance  boolean not null default false,
  requires_packaging  boolean not null default false,
  budget_min          numeric(12,2) not null,
  budget_max          numeric(12,2) not null,
  status              text not null default 'open'
                        check (status in ('open','bidding','in_progress','completed','cancelled')),
  pickup_start        timestamptz not null,
  pickup_end          timestamptz not null,
  delivery_start      timestamptz not null,
  delivery_end        timestamptz not null,
  photos              jsonb not null default '[]'::jsonb,
  special_instructions text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  expires_at          timestamptz not null,
  -- metadados adicionais
  distance_km         numeric(10,2),               -- distância calculada entre origem e destino
  estimated_duration_min integer,                   -- duração estimada do trajeto em minutos
  cargo_value         numeric(14,2),                -- valor declarado da carga (para seguro)
  is_fragile          boolean not null default false,
  is_urgent           boolean not null default false,
  allow_partial       boolean not null default false, -- permite coleta parcial
  max_bids            integer not null default 10,    -- número máximo de lances
  winner_bid_id       uuid,                            -- id do lance vencedor
  region_id           text,                            -- região/metrópole para geofencing
  vehicle_requirements jsonb not null default '{}'::jsonb, -- requisitos adicionais do veículo
  documents_required  jsonb not null default '[]'::jsonb   -- documentos exigidos (ex: notas fiscais)
);

-- Índices
create index idx_freight_loads_status on freight_loads(status);
create index idx_freight_loads_company on freight_loads(company_id);
create index idx_freight_loads_category on freight_loads(category_id);
create index idx_freight_loads_created on freight_loads(created_at desc);
create index idx_freight_loads_expires on freight_loads(expires_at);
create index idx_freight_loads_pickup on freight_loads(pickup_start, pickup_end);
create index idx_freight_loads_location on freight_loads(origin_lat, origin_lng);
create index idx_freight_loads_budget on freight_loads(budget_min, budget_max);

-- Índice espacial (se usar PostGIS)
-- create index idx_freight_loads_geo on freight_loads using gist (st_setpoint(st_makepoint(origin_lng, origin_lat)));

-- Trigger para updated_at
create trigger trg_freight_loads_updated
  before update on freight_loads
  for each row execute function update_updated_at_column();
```

### Enum de Status freight_loads

| Status | Descrição |
|--------|-----------|
| `open` | Frete publicado, aceitando lances |
| `bidding` | Em processo de avaliação de lances (período de lances encerrado) |
| `in_progress` | Transporte em andamento (desde a coleta até a entrega) |
| `completed` | Entrega confirmada e avaliação concluída |
| `cancelled` | Cancelado pela empresa ou por inatividade (24h sem lances) |

### Metadados e Campos de Suporte

**Campo photos (jsonb)**
```json
[
  {
    "url": "https://txap.com.br/storage/freight/123/photo-1.jpg",
    "thumbnail": "https://txap.com.br/storage/freight/123/photo-1-thumb.jpg",
    "type": "cargo",       // cargo, packaging, document
    "description": "Carga completa",
    "uploaded_at": "2026-07-13T10:00:00Z"
  }
]
```

**Campo vehicle_requirements (jsonb)**
```json
{
  "body_type": "bau",           // baú, aberto, graneleiro, sider, frigorífico, tanque
  "has_lift_gate": true,
  "has_ramp": false,
  "has_air_conditioning": true,
  "has_temperature_control": false,
  "min_temp_celsius": null,
  "max_temp_celsius": null,
  "has_liferaft": false,
  "requires_mopp": false,
  "requires_aet": false,
  "requires_nr11": false,
  "requires_nr35": false
}
```

**Campo documents_required (jsonb)**
```json
[
  {
    "type": "nota_fiscal",
    "description": "Nota fiscal da carga",
    "required": true,
    "uploaded_by_company": true
  },
  {
    "type": "manifesto",
    "description": "Manifesto de carga",
    "required": false,
    "uploaded_by_company": false
  }
]
```

### Regras de Validação de freight_loads

1. `budget_min` deve ser menor ou igual a `budget_max`
2. `pickup_start` deve ser anterior a `pickup_end`
3. `delivery_start` deve ser anterior a `delivery_end`
4. `pickup_end` deve ser anterior a `delivery_start`
5. `expires_at` deve ser posterior a `created_at`
6. Peso, volume e dimensões não podem exceder os limites da `category_id` referenciada
7. `requires_cnh` é preenchido automaticamente com base na categoria (pode ser sobrescrito)
8. `requires_insurance` é preenchido automaticamente se `cargo_value >= 10000`
9. `max_bids` deve ser entre 1 e 50
10. Se `is_urgent`, o intervalo `pickup_start` a `pickup_end` deve ser ≤ 24 horas

### Gatilhos Automáticos

- Ao criar: definir `expires_at` = `created_at + 7 days` (padrão) ou conforme parâmetro da empresa
- Ao expirar: se status `open` e sem lances, alterar para `cancelled` automaticamente (job schedulado)
- Ao aceitar lance: alterar status para `in_progress`, registrar `winner_bid_id`
- Ao completar entrega: alterar status para `completed`
- Ao cancelar: verificar se há lance aceito; se sim, notificar transportador

---

## Tabela freight_bids

```sql
create table freight_bids (
  id                uuid primary key default gen_random_uuid(),
  load_id           uuid not null references freight_loads(id) on delete cascade,
  driver_id         uuid not null references driver_profiles(id),
  amount            numeric(12,2) not null,
  message           text not null default '',
  estimated_pickup  timestamptz not null,
  estimated_delivery timestamptz not null,
  status            text not null default 'pending'
                      check (status in ('pending','accepted','rejected','countered')),
  countered_amount  numeric(12,2),                  -- valor da contra-proposta
  countered_message text,                            -- mensagem da contra-proposta
  countered_at      timestamptz,                     -- quando a contra-proposta foi feita
  responded_at      timestamptz,                     -- quando o transportador respondeu à contra
  expires_at        timestamptz,                     -- prazo para resposta do transportador
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- critérios de desempate
  driver_score      numeric(4,2),                    -- score do transportador no momento do lance
  driver_response_time_min integer,                  -- tempo médio de resposta a lances do transportador
  driver_completion_rate numeric(5,2),               -- taxa de conclusão do transportador
  -- metadados
  is_automated      boolean not null default false,  -- lance automático (sistema)
  cancellation_reason text,
  cancelled_at      timestamptz,
  payment_release_id uuid,
  payment_status    text default 'pending'
                      check (payment_status in ('pending','processing','released','failed'))
);

-- Índices
create index idx_freight_bids_load on freight_bids(load_id);
create index idx_freight_bids_driver on freight_bids(driver_id);
create index idx_freight_bids_status on freight_bids(status);
create index idx_freight_bids_amount on freight_bids(amount);
create index idx_freight_bids_created on freight_bids(created_at desc);

-- Unique: apenas um lance pending/accepted por driver por load
create unique index idx_freight_bids_unique_active
  on freight_bids(load_id, driver_id)
  where status in ('pending','accepted','countered');

-- Trigger para updated_at
create trigger trg_freight_bids_updated
  before update on freight_bids
  for each row execute function update_updated_at_column();
```

### Regras de Negócio — Lances

| Regra | Descrição |
|-------|-----------|
| Limite por transportador | Apenas 1 lance ativo por frete por transportador |
| Valor mínimo | Lance deve ser >= 50% do budget_min |
| Valor máximo | Lance deve ser <= 150% do budget_max |
| Prazo máximo | Lance deve ser feito antes de `expires_at` do frete |
| Edição | Não pode editar lance após criado (precisa cancelar e criar novo) |
| Cancelamento | Pode cancelar antes de ser aceito (afeta score) |
| Contra-proposta | Empresa faz contra-proposta, transportador tem 24h para responder |
| Auto-resposta | Contra-proposta expira automaticamente se não respondida |
| Limite de lances | Máximo de 20 lances por frete (configurável) |

### Fluxo de Lance

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│  Driver  │        │   API    │        │ Company  │
│          │        │          │        │          │
│ BID ─────┼────────┤ POST     │        │          │
│          │        │ /bids    │        │          │
│          │        │          │        │          │
│          │        │ status   │        │          │
│          │        │ =pending │        │          │
│          │        │          ├────────┤───────── │
│          │        │          │ NOTIFY │          │
│          │        │          │        │ REVIEWS │
│          │        │          │        │          │
│          │        │          │ ACCEPT │◄──────── │
│          │        │◄─────────┼────────┤          │
│          │        │          │        │          │
│  NOTIFIED│◄───────┼──────────┤        │          │
│          │        │          │        │          │
│ ┌──────┐ │        │          │        │          │
│ │BID   │ │        │          │        │          │
│ │ACCEPT│ │        │          │        │          │
│ └──────┘ │        │          │        │          │
└──────────┘        └──────────┘        └──────────┘
```

---

## Tabela freight_tracking

```sql
create table freight_tracking (
  id          uuid primary key default gen_random_uuid(),
  load_id     uuid not null references freight_loads(id) on delete cascade,
  driver_id   uuid not null references driver_profiles(id),
  status      text not null
                check (status in ('assigned','going_to_pickup','arrived_at_pickup',
                                  'picked_up','in_transit','stopped',
                                  'arrived_at_destination','delivered','returned')),
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  altitude_m   numeric(8,2),                       -- altitude em metros
  speed_kmh    numeric(6,2),                        -- velocidade no momento da leitura
  heading      integer,                             -- direção em graus (0-360)
  accuracy_m   numeric(6,2),                        -- precisão do GPS em metros
  address      text,                                -- endereço reverso do ponto
  photo        text,                                -- URL da foto (coleta/entrega)
  signature    text,                                -- URL da assinatura digital (entrega)
  notes        text,                                -- observações do transportador
  timestamp    timestamptz not null default now(),
  battery_level integer,                            -- bateria do dispositivo do motorista (%)
  is_offline   boolean not null default false,      -- marcado se enviado offline
  sync_key     text,                                -- chave de sincronização offline
  created_at   timestamptz not null default now()
);

-- Índices
create index idx_freight_tracking_load on freight_tracking(load_id, timestamp desc);
create index idx_freight_tracking_driver on freight_tracking(driver_id, timestamp desc);
create index idx_freight_tracking_status on freight_tracking(load_id, status);
create index idx_freight_tracking_timestamp on freight_tracking(timestamp desc);

-- Trigger para compressão automática de pontos (manter no máximo 1 ponto por minuto após 24h)
-- create or replace function compress_tracking_points() returns trigger as $$
-- begin
--   delete from freight_tracking
--   where load_id = new.load_id
--     and timestamp < now() - interval '24 hours'
--     and id in (
--       select id from (
--         select id, row_number() over (
--           partition by load_id, date_trunc('minute', timestamp)
--           order by timestamp desc
--         ) as rn
--         from freight_tracking
--         where load_id = new.load_id
--           and timestamp < now() - interval '24 hours'
--       ) sub where sub.rn > 1
--     );
--   return new;
-- end;
-- $$ language plpgsql;
```

### Status do Tracking

| Status | Significado | Ação do Transportador |
|--------|-------------|----------------------|
| `assigned` | Frete atribuído ao transportador | — |
| `going_to_pickup` | A caminho da origem | Iniciar navegação GPS |
| `arrived_at_pickup` | Chegou no local da coleta | Notificar empresa |
| `picked_up` | Carga coletada | Foto da carga + assinatura da empresa |
| `in_transit` | Em trânsito para destino | GPS tracking contínuo |
| `stopped` | Parada (descanso/trânsito) | Informar motivo da parada |
| `arrived_at_destination` | Chegou no destino | Notificar destinatário |
| `delivered` | Entrega concluída | Foto + assinatura do destinatário |
| `returned` | Carga retornada à origem | Motivo do retorno |

### Política de Tracking

1. **Frequência de atualização:** a cada 30 segundos quando `in_transit`, a cada 60 segundos quando `stopped`
2. **Modo offline:** pontos são armazenados localmente e sincronizados quando a conexão é restabelecida
3. **Geofencing:** alertas quando o transportador entra/ sai de áreas definidas (origem, destino, waypoints)
4. **Retenção de dados:** tracking bruto mantido por 90 dias; após 90 dias, compressão para 1 ponto a cada 5 minutos
5. **Notificações:** mudanças de status disparam notificações push para a empresa contratante

### Assinatura Digital

A assinatura digital é capturada no momento da entrega:

```typescript
interface DigitalSignature {
  dataUrl: string;          // base64 da assinatura em PNG
  signedAt: string;         // timestamp ISO
  signerName: string;       // nome do recebedor
  signerDocument: string;   // CPF/RG do recebedor
  signerRole: string;       // cargo/função do recebedor
  latitude: number;
  longitude: number;
  ipAddress: string;
  deviceId: string;
}
```

---

## Tabela company_freight_profiles

```sql
create table company_freight_profiles (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  company_name      text not null,
  trading_name      text,                             -- nome fantasia
  document_type     text not null check (document_type in ('cnpj','cpf')),  -- PF ou PJ
  document_number   text not null,                    -- CNPJ (14 dígitos) ou CPF (11 dígitos)
  state_registration text,                            -- inscrição estadual
  municipal_registration text,                        -- inscrição municipal
  address_zipcode   text,
  address_street    text,
  address_number    text,
  address_complement text,
  address_neighborhood text,
  address_city      text,
  address_state     text,
  address_country   text not null default 'Brasil',
  phone             text,
  phone_secondary   text,
  email             text,
  website           text,
  logo_url          text,
  rating            numeric(3,2) default 0.00 check (rating >= 0 and rating <= 5),
  total_loads       integer not null default 0,
  completed_loads   integer not null default 0,
  cancelled_loads   integer not null default 0,
  avg_budget        numeric(12,2) default 0.00,       -- valor médio dos fretes publicados
  total_spent       numeric(14,2) default 0.00,        -- valor total gasto em fretes
  payment_terms     text default 'net_30',             -- prazo de pagamento: net_15, net_30, net_60, net_90
  payment_method    text default 'pix',                -- método preferencial: pix, boleto, transferencia, cartao
  auto_approve      boolean not null default false,    -- aprovação automática de lances (até certo valor)
  auto_approve_max  numeric(12,2),                     -- valor máximo para aprovação automática
  preferred_categories text[],                         -- categorias preferidas
  service_regions   text[],                            -- regiões de atuação
  is_verified       boolean not null default false,    -- perfil verificado
  verification_docs jsonb default '[]'::jsonb,         -- documentos enviados para verificação
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Índices
create unique index idx_company_freight_profiles_company on company_freight_profiles(company_id);
create index idx_company_freight_profiles_document on company_freight_profiles(document_number);
create index idx_company_freight_profiles_rating on company_freight_profiles(rating desc);

-- Trigger para updated_at
create trigger trg_company_freight_profiles_updated
  before update on company_freight_profiles
  for each row execute function update_updated_at_column();
```

### Perfil do Transportador (driver_profiles)

```sql
create table driver_profiles (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references users(id) on delete cascade,
  full_name               text not null,
  document_type           text not null check (document_type in ('cnpj','cpf')),
  document_number         text not null,
  cnh_number              text,                       -- número do registro da CNH
  cnh_category            text,                       -- A, B, C, D, E
  cnh_expiration          date,
  cnh_front_url           text,                       -- foto frente da CNH
  cnh_back_url            text,                       -- foto verso da CNH
  cnh_verified            boolean not null default false,
  phone                   text not null,
  phone_secondary         text,
  email                   text,
  address_zipcode         text,
  address_street          text,
  address_number          text,
  address_complement      text,
  address_neighborhood    text,
  address_city            text,
  address_state           text,
  avatar_url              text,
  rating                  numeric(3,2) default 0.00 check (rating >= 0 and rating <= 5),
  total_ratings           integer not null default 0,
  total_loads             integer not null default 0,
  completed_loads         integer not null default 0,
  cancelled_loads         integer not null default 5, -- começa com 5 slots de cancelamento sem penalidade
  total_earned            numeric(14,2) default 0.00,
  avg_response_time_min   integer default 0,          -- tempo médio para responder a lances
  acceptance_rate         numeric(5,2) default 0.00,  -- taxa de aceitação de fretes
  cancellation_rate       numeric(5,2) default 0.00,  -- taxa de cancelamento
  score                   numeric(5,2) default 0.00,  -- pontuação geral (0-100)
  score_updated_at        timestamptz,
  vehicle_id              uuid references driver_vehicles(id),
  vehicles                uuid[],                     -- lista de veículos cadastrados
  preferred_regions       text[],                     -- regiões preferidas
  max_distance_km         integer default 100,        -- distância máxima para buscar fretes
  available               boolean not null default true, -- disponível para novos fretes
  availability_hours      jsonb,                      -- horários de disponibilidade
  pix_key                 text,                       -- chave PIX para recebimento
  pix_key_type            text,                       -- cpf, cnpj, email, phone, random
  bank_info               jsonb,                      -- dados bancários (banco, agência, conta)
  is_verified             boolean not null default false,
  verified_at             timestamptz,
  is_active               boolean not null default true,
  last_location_lat       numeric(10,7),              -- última localização conhecida
  last_location_lng       numeric(10,7),
  last_location_at        timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Índices
create unique index idx_driver_profiles_user on driver_profiles(user_id);
create index idx_driver_profiles_document on driver_profiles(document_number);
create index idx_driver_profiles_score on driver_profiles(score desc);
create index idx_driver_profiles_available on driver_profiles(available);
create index idx_driver_profiles_location on driver_profiles(last_location_lat, last_location_lng);

-- Trigger para atualizar score automaticamente
create or replace function update_driver_score()
returns trigger as $$
begin
  new.score := (
    (coalesce(new.total_loads, 0) > 0)::int * 0 +
    case when new.total_loads > 0
      then (
        -- 40%: entregas no prazo
        -- 30%: rating
        -- 15%: tempo de resposta
        -- 10%: taxa de aceitação
        -- 5%: taxa de cancelamento
        40.0 * (new.completed_loads::numeric / greatest(new.total_loads, 1)) +
        30.0 * (new.rating / 5.0) +
        15.0 * greatest(0, 1.0 - (new.avg_response_time_min::numeric / 120.0)) +
        10.0 * (new.acceptance_rate / 100.0) +
        5.0  * (1.0 - (new.cancellation_rate / 100.0))
      )
      else 0
    end
  );
  new.score_updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_driver_score
  before update on driver_profiles
  for each row execute function update_driver_score();
```

### Tabela driver_vehicles

```sql
create table driver_vehicles (
  id                uuid primary key default gen_random_uuid(),
  driver_id         uuid not null references driver_profiles(id) on delete cascade,
  plate             text not null,                    -- placa do veículo (formato Mercosul)
  renavam           text,                             -- RENAVAM
  brand             text not null,                    -- marca
  model             text not null,                    -- modelo
  year_manufacture  integer,                          -- ano de fabricação
  year_model        integer,                          -- ano do modelo
  color             text,
  category_id       text not null references freight_categories(id),
  max_weight_kg     numeric(8,2),                     -- capacidade de carga do veículo
  max_volume_m3     numeric(8,2),
  body_type         text,                             -- baú, aberto, graneleiro, sider, frigorífico, tanque
  has_lift_gate     boolean not null default false,
  has_ramp          boolean not null default false,
  has_air_conditioning boolean not null default false,
  has_temperature_control boolean not null default false,
  vehicle_docs_url  text[],                           -- fotos dos documentos do veículo
  insurance_policy  text,                             -- apólice de seguro
  insurance_expiry  date,
  is_active         boolean not null default true,
  is_verified       boolean not null default false,
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Índices
create index idx_driver_vehicles_driver on driver_vehicles(driver_id);
create index idx_driver_vehicles_category on driver_vehicles(category_id);
create index idx_driver_vehicles_active on driver_vehicles(driver_id, is_active);
```

---

## Fluxo Completo

### Para Empresas

#### 1. Cadastrar Perfil de Empresa

```
Empresa acessa TXAPP → Cadastro → Perfil de Frete
├── Informações básicas: Razão social, CNPJ, endereço, telefone
├── Documentos: Contrato social, CNPJ, alvará, certificado digital
├── Configurações de pagamento: prazo (net_30), método (PIX/boleto/cartão)
├── Categorias preferidas: selecionar as categorias que mais utiliza
├── Regiões de atuação: CEPs ou cidades onde costuma contratar fretes
└── Aprovação automática: definir valor máximo para auto-approve
```

**Validações:**
- CNPJ/CPF válido (algoritmo de dígitos verificadores)
- CNPJ não cadastrado anteriormente na plataforma
- Documentos enviados para análise (verificação manual ou automática via API gov.br)
- Endereço geocodificado para coordenadas

#### 2. Publicar Frete

```
Empresa → Novo Frete
├── Passo 1: Informações da Carga
│   ├── Título (ex: "Entrega de móveis planificados")
│   ├── Descrição detalhada da carga
│   ├── Categoria do veículo (dropdown com as 17 categorias)
│   ├── Peso (kg), Volume (m³) — opcionais mas recomendados
│   ├── Dimensões (altura, largura, comprimento em cm)
│   ├── Valor da carga (para cálculo de seguro)
│   ├── Carga frágil? Urgente?
│   └── Fotos da carga (até 10)
│
├── Passo 2: Origem e Destino
│   ├── Endereço de coleta (com autocomplete + mapa)
│   ├── Coordenadas geográficas (preenchidas automaticamente)
│   ├── Janela de coleta (data/hora início e fim)
│   ├── Endereço de entrega (com autocomplete + mapa)
│   ├── Coordenadas geográficas
│   ├── Janela de entrega (data/hora início e fim)
│   ├── Distância calculada (km)
│   └── Duração estimada
│
├── Passo 3: Orçamento e Condições
│   ├── Budget mínimo (R$)
│   ├── Budget máximo (R$)
│   ├── Preço sugerido pelo sistema (IA)
│   ├── Requer seguro? (automático se valor carga >= R$ 10.000)
│   ├── Requer embalagem?
│   ├── CNH necessária (preenchido automaticamente pela categoria)
│   ├── Instruções especiais (ex: "portaria 24h", "carga precisa de rampa")
│   └── Data de expiração dos lances
│
└── Passo 4: Revisão e Publicação
    ├── Resumo completo do frete
    ├── Custo estimado de taxa da plataforma
    ├── Checkbox: "Li e aceito os termos de uso do marketplace"
    └── Publicar frete
```

#### 3. Receber Lances

```
Após publicar o frete:
├── Notificações push em tempo real a cada novo lance
├── Painel de lances com:
│   ├── Nome do transportador (com foto, rating, score)
│   ├── Valor do lance (R$)
│   ├── Mensagem do transportador
│   ├── Previsão de coleta e entrega
│   ├── Score do transportador
│   ├── Distância do transportador até a origem
│   └── Botões: Aceitar / Contra-propor / Rejeitar
│
├── Ordenação padrão: menor valor primeiro
├── Ordenação alternativa: melhor score primeiro / mais próximo / entrega mais rápida
└── Painel de lances expirados/rejeitados (histórico)
```

#### 4. Aceitar Lance ou Contra-Proposta

```
Empresa avalia lances → Escolhe uma ação:

[ACEITAR]
├── Confirmação: "Você confirma a aceitação do lance de R$ X por [nome]?"
├── Ao confirmar:
│   ├── Status do frete → in_progress
│   ├── Transportador notificado (push + email + SMS)
│   ├── Endereço de coleta compartilhado com transportador
│   ├── Instruções de coleta enviadas
│   └── Tracking habilitado
└── Opção: Aceitar e já agendar coleta

[CONTRA-PROPOSTA]
├── Formulário: Novo valor (R$), Mensagem opcional
├── Transportador notificado
├── Transportador tem 24h para aceitar/recusar
└── Se recusar ou expirar: lance volta a pending

[REJEITAR]
├── Motivo opcional (valor alto, prazo incompatível, etc.)
└── Transportador notificado
```

#### 5. Acompanhar Tracking em Tempo Real

```
Empresa → Frete em Andamento → Tracking
├── Mapa interativo com rota calculada
├── Posição do transportador em tempo real (ícone do veículo)
├── Timeline de status:
│   ├── ✅ Lance aceito (timestamp)
│   ├── ⏳ A caminho da coleta
│   ├── 📍 Chegou na coleta
│   ├── 📸 Carga coletada (foto)
│   ├── 🚛 Em trânsito
│   ├── 📍 Chegou no destino
│   └── 📦 Entregue (foto + assinatura)
├── Informações do transportador:
│   ├── Nome
│   ├── Telefone (disponível após aceite)
│   ├── Placa do veículo
│   └── Score
├── Previsão de chegada (ETA)
├── Distância restante
├── Notificações push a cada mudança de status
└── Chat com o transportador (mensagens de texto + fotos)
```

#### 6. Confirmar Entrega

```
Empresa/Destinatário recebe a carga:
├── Verificar integridade da carga
├── Verificar quantidade vs. nota fiscal
├── Assinar digitalmente (ou confirmar via app)
├── Foto da carga recebida (opcional)
└── Confirmar entrega
```

#### 7. Avaliar Transportador

```
Após entrega confirmada:
├── Rating geral (1-5 estrelas)
├── Critérios opcionais:
│   ├── ⏱ Pontualidade
│   ├── 📦 Cuidado com a carga
│   ├── 🚗 Dirigão
│   ├── 💬 Comunicação
│   └── 👍 Recomendação
├── Comentário (texto livre)
└── Empresa pode avaliar anonimamente
```

#### 8. Pagamento Liberado

```
Após confirmação da entrega + avaliação:
├── Se período de contestação (48h) não for acionado:
│   ├── Pagamento processado automaticamente
│   ├── Valor do lance transferido para conta do transportador
│   ├── Taxa da plataforma retida (ex: 5-12% dependendo do plano)
│   ├── Nota fiscal emitida (se aplicável)
│   └── Comprovante enviado para ambas as partes
│
├── Se houver contestação:
│   ├── Disputa aberta
│   ├── Mediação TXAPP
│   └── Pagamento suspenso até resolução
│
└── Histórico de pagamentos disponível no financeiro
```

### Para Transportadores/Motoristas

#### 1. Ver Fretes Disponíveis no Marketplace

```
Transportador → Marketplace
├── Lista de fretes disponíveis (status = open)
├── Filtros:
│   ├── Categoria do veículo (até 17 categorias)
│   ├── Raio de distância (5km, 10km, 25km, 50km, 100km, personalizado)
│   ├── Budget mínimo e máximo
│   ├── Data de coleta (hoje, amanhã, esta semana, personalizado)
│   ├── Região/cidade
│   ├── Tipo de carga (frágil, urgente, paletizada, etc.)
│   ├── Distância do trajeto
│   └── Ordenar por: menor budget, maior budget, mais recente, mais perto
│
├── Visualização em mapa (clusters de fretes na região)
├── Busca textual por título/palavras-chave
└── Cada frete exibe: título, categoria, origem → destino, budget,
    peso/volume, data de coleta, distância, número de lances
```

#### 2. Dar Lance

```
Transportador seleciona frete → Detalhes do frete → Dar Lance
├── FreightDetail exibido:
│   ├── Todas as informações do frete
│   ├── Fotos da carga
│   ├── Mapa de origem e destino
│   ├── Distância e duração estimada
│   ├── Orçamento sugerido (range)
│   ├── Se o transportador já deu lance: status do lance
│   └── Quantos lances já foram dados (sem identificar valores)
│
├── Formulário de lance:
│   ├── Valor do lance (R$) — sugestão automática baseada no budget
│   ├── Mensagem opcional (ex: "Disponível para coleta imediata")
│   ├── Previsão de coleta (data/hora)
│   │   ├── Automática: baseada na distância do transportador até origem
│   │   └── Manual: o transportador pode ajustar
│   ├── Previsão de entrega (data/hora)
│   ├── Se veículo compatível com o frete:
│   │   ├── Selecionar veículo cadastrado
│   │   └── Verificar se categoria do veículo atende aos requisitos
│   └── Confirmar lance
│
├── Regras:
│   ├── Transportador não pode dar lance em frete próprio
│   ├── Transportador precisa ter perfil completo + documentos
│   ├── Veículo precisa estar verificado se categoria exige
│   └── Apenas 1 lance ativo por frete
│
└── Após confirmar:
    ├── Lance registrado como pending
    ├── Empresa notificada
    └── Transportador pode cancelar lance antes de ser aceito
```

#### 3. Lance Aceito — Ir para Coleta

```
Transportador notificado → Lance aceito!
├── Notificação push + email + SMS
├── Informações completas do frete:
│   ├── Endereço de coleta (com mapa e navegação)
│   ├── Endereço de entrega
│   ├── Contato da empresa (telefone, nome do responsável)
│   ├── Instruções especiais
│   ├── Documentos necessários (se houver)
│   └── Código de confirmação QR (para escanear na coleta)
│
├── Opção: Iniciar rota para coleta
│   ├── Tracking GPS ativado
│   ├── Status → going_to_pickup
│   └── Empresa notificada
│
└── Opção: Cancelar (com penalidade no score se sem justificativa)
```

#### 4. Confirmar Coleta (Foto)

```
Transportador chega na origem:
├── Escanear QR code da empresa (opcional)
├── Tirar foto da carga (obrigatório)
│   ├── Foto da carga no local de coleta
│   ├── Foto dos documentos (nota fiscal, manifesto)
│   └── Foto do veículo com a carga (opcional)
├── Confirmar início do transporte
├── Status → picked_up
├── Timestamp registrado
└── Empresa notificada: "Carga coletada!"
```

#### 5. Transporte com Tracking GPS

```
Durante o transporte:
├── GPS tracking automático a cada 30 segundos
├── Mapa exibido para o transportador (rota + progresso)
├── Informações em tempo real:
│   ├── Velocidade média
│   ├── Distância percorrida
│   ├── Distância restante
│   ├── ETA
│   └── Tempo restante
│
├── Paradas:
│   ├── Botão "Parar" (descanso, trânsito, refeição)
│   ├── Motivo da parada (obrigatório)
│   └── Tempo máximo de parada configurável
│
├── Chat com a empresa:
│   ├── Mensagens de texto
│   ├── Envio de fotos (ex: problema na estrada)
│   └── Chamada de emergência
│
├── Alertas:
│   ├── Desvio de rota (se afastar >5km da rota otimizada)
│   ├── Velocidade acima do permitido
│   ├── Bateria fraca
│   └── Chegada próxima ao destino
│
└── Opção: modo offline (pontos sincronizados quando voltar)
```

#### 6. Confirmar Entrega (Foto + Assinatura Digital)

```
Transportador chega no destino:
├── Notificar destinatário (app/ SMS)
├── Coletar assinatura digital do recebedor:
│   ├── Nome completo do recebedor
│   ├── CPF/RG do recebedor (opcional)
│   ├── Assinatura manuscrita na tela (canvas)
│   └── Foto do recebedor com a carga (opcional)
│
├── Tirar foto da carga entregue
├── Observações (opcional): "Entregue na portaria", "Recebido por terceiros"
├── Confirmar entrega
├── Status → delivered
├── Timestamp registrado
└── Empresa + TXAPP notificados
```

#### 7. Receber Pagamento

```
Após confirmação da empresa:
├── Período de contestação: 48h
├── Se nenhuma contestação:
│   ├── Status do pagamento → released
│   ├── Valor creditado na conta do transportador:
│   │   ├── PIX: crédito em até 1h (dependendo do banco)
│   │   ├── Transferência: D+1
│   │   └── Saldo TXAPP: imediato (pode sacar depois)
│   ├── Taxa da plataforma já descontada
│   ├── Extrato financeiro atualizado
│   ├── Nota fiscal recebida (se aplicável)
│   └── Comprovante de pagamento enviado
│
├── Se contestação:
│   ├── Pagamento suspenso
│   ├── TXAPP analisa evidências (fotos, tracking, assinatura)
│   └── Resolução em até 72h
│
└── Transportador avalia a empresa (opcional)
```

---

## Regras de Negócio

### Cancelamento

| Cenário | Quem Cancela | Consequência |
|---------|--------------|--------------|
| Nenhum lance após 24h | Sistema automático | Frete fechado, empresa notificada |
| Nenhum lance até expires_at | Sistema automático | Frete cancelado, empresa notificada |
| Antes de aceitar lance | Empresa | Sem penalidade |
| Antes de aceitar lance | Transportador | Sem penalidade (afeta score: -1% taxa de cancelamento) |
| Após aceite, antes da coleta | Empresa | Notificar transportador, pagar taxa de desistência (10% do valor do lance) |
| Após aceite, antes da coleta | Transportador | Penalidade no score (-5% taxa de cancelamento), notificação empresa, bloqueio temporário (1ª vez: 24h, 2ª: 7 dias, 3ª: banimento) |
| Após coleta, durante trânsito | Empresa | Pagamento integral ao transportador até o ponto atual + taxa de retorno |
| Após coleta, durante trânsito | Transportador | Penalidade grave (-10% score), bloqueio de 30 dias, avaliação negativa automática, empresa reembolsada |

### Budget por Categoria

| Categoria | Budget Mínimo (R$) | Budget Máximo (R$) | Sugestão Média (R$/km) |
|-----------|-------------------|-------------------|----------------------|
| Moto | 5 | 50 | R$ 0,80/km (mín. R$ 5) |
| Bike | 3 | 30 | R$ 0,50/km (mín. R$ 3) |
| Carro | 15 | 200 | R$ 1,20/km (mín. R$ 15) |
| SUV | 25 | 350 | R$ 1,50/km (mín. R$ 25) |
| Pickup | 40 | 600 | R$ 2,00/km (mín. R$ 40) |
| Van | 60 | 900 | R$ 2,50/km (mín. R$ 60) |
| HR | 100 | 1.500 | R$ 3,50/km (mín. R$ 100) |
| 3/4 | 150 | 2.000 | R$ 4,00/km (mín. R$ 150) |
| Toco | 200 | 3.000 | R$ 5,00/km (mín. R$ 200) |
| Truck | 300 | 5.000 | R$ 6,00/km (mín. R$ 300) |
| Bitrem | 800 | 10.000 | R$ 8,00/km (mín. R$ 800) |
| Carreta | 1.000 | 15.000 | R$ 10,00/km (mín. R$ 1.000) |
| Guincho | 80 | 500 | Taxa fixa + R$ 3,00/km |
| Munck | 200 | 3.000 | Taxa fixa + R$ 5,00/km |
| Caçamba | 80 | 800 | Taxa fixa + R$ 3,50/km |
| Trator | 100 | 1.000 | Taxa fixa + R$ 4,00/km |
| Máq. Agrícolas | 500 | 8.000 | Taxa fixa + R$ 7,00/km |

> Os valores acima são configurações base (default). Cada cidade/região pode ter valores customizados através da tabela `freight_category_pricing`:

```sql
create table freight_category_pricing (
  id              uuid primary key default gen_random_uuid(),
  category_id     text not null references freight_categories(id),
  city            text not null,
  state           text not null,
  min_budget      numeric(12,2) not null,
  max_budget      numeric(12,2) not null,
  suggested_km    numeric(8,4) not null,
  min_distance_km integer not null default 1,
  active          boolean default true,
  created_at      timestamptz not null default now(),
  unique(category_id, city, state)
);
```

### Seguro Obrigatório

- Cargas com valor declarado >= R$ 10.000: seguro obrigatório
- O seguro pode ser contratado:
  1. **Pela plataforma TXAPP** (parceria com seguradoras — mais barato)
  2. **Pelo transportador** (apólice própria — precisa ser verificada)
  3. **Pela empresa contratante** (apólice corporativa)
- Cobertura mínima: valor declarado da carga
- Cobertura adicional: danos a terceiros (recomendado)
- Prêmio: 0.5% a 2% do valor da carga, dependendo da categoria e distância

### Documentação Obrigatória

| Categoria | Documentos Exigidos |
|-----------|---------------------|
| Moto, Bike | — |
| Carro, SUV, Pickup, Van | CNH (B), CRLV |
| HR, 3/4, Toco, Truck | CNH (C), CRLV, Antt (RNTRC), Seguro |
| Bitrem, Carreta | CNH (E), CRLV, Antt (RNTRC), Seguro, AET (se aplicável) |
| Guincho | CNH (C), CRLV, Antt, Registro de guincho |
| Munck | CNH (C), CRLV, Antt, NR-11 (operador) |
| Caçamba | CNH (C), CRLV, Antt |
| Trator, Máq. Agrícolas | CNH (B/B), Documento da máquina |

### Bloqueios e Suspensões

| Infração | 1ª vez | 2ª vez | 3ª vez |
|----------|--------|--------|--------|
| Cancelamento após aceite (transp.) | 24h suspenso | 7 dias suspenso | Banimento |
| Não comparecimento na coleta | Advertência + -2% score | 3 dias suspenso + -5% score | 15 dias suspenso |
| Entrega atrasada (>= 4h) | Notificação | -1% score | -3% score |
| Carga danificada por negligência | Reembolso + advertência | Reembolso + 7 dias suspenso | Banimento + reembolso |
| Descumprimento de instruções | Advertência | -2% score | 5 dias suspenso |
| Uso de veículo incompatível | Lance cancelado + -1% score | 3 dias suspenso | 15 dias suspenso |
| Fraude documental | Banimento imediato + notificação autoridades | — | — |

---

## Pontuação de Transportadores

### Fórmula de Cálculo do Score

O score do transportador é calculado em uma escala de **0 a 100**, baseado em 5 pilares:

```
Score = (OnTimeDeliveries × 0.40) + (Rating × 0.30) + (ResponseTime × 0.15) +
        (AcceptanceRate × 0.10) + (CancellationRate × 0.05)
```

#### 1. Entregas no Prazo (40% — até 40 pontos)

```
OnTimeDeliveries = (Entregas dentro do prazo / Total de entregas concluídas) × 40
```

- Considera a janela `delivery_end` do frete
- Se entregou antes de `delivery_end`: dentro do prazo ✅
- Se entregou após `delivery_end`: fora do prazo ❌
- Atraso por caso fortuito ou força maior (comprovação via fotos/documentos): não conta como atraso

#### 2. Rating das Empresas (30% — até 30 pontos)

```
RatingScore = (Média de avaliações dos últimos 50 fretes / 5) × 30
```

- Rating de 1 a 5 estrelas
- São consideradas apenas avaliações dos últimos 50 fretes ou 12 meses (o que for maior)
- Empresas com menos de 5 avaliações no período: peso reduzido (fator 0.5)
- Se o transportador tem < 3 avaliações no total: rating score = 0 até ter avaliações suficientes

#### 3. Tempo de Resposta a Lances (15% — até 15 pontos)

```
ResponseTimeScore = MAX(0, 1 - (TempoMédioRespostaMinutos / 120)) × 15
```

- Tempo entre o transportador ver o frete e dar o lance
- Quanto mais rápido, maior a pontuação
- Tempo médio calculado sobre os últimos 30 lances
- Bônus de +2 pontos se tempo médio < 15 minutos
- Penalidade de -2 pontos se tempo médio > 4 horas

#### 4. Taxa de Aceitação (10% — até 10 pontos)

```
AcceptanceScore = (Lances aceitos / Total de lances respondidos) × 10
```

- Considera apenas lances onde o transportador respondeu à contra-proposta (aceitou ou recusou)
- Lances expirados ou ignorados: contam como recusa
- Taxa calculada sobre os últimos 50 lances
- Mínimo de 5 lances para começar a contar

#### 5. Taxa de Cancelamento (5% — até 5 pontos)

```
CancellationScore = MAX(0, 1 - (CancelamentosApósAceite / TotalAceites)) × 5
```

- Apenas cancelamentos **após o aceite do lance**
- Cancelamentos antes do aceite: desconto de -1% na taxa de aceitação (não nesse componente)
- Os 5 primeiros cancelamentos no ano são tolerados (não afetam score)
- A partir do 6º cancelamento no ano: penalidade integral

### Níveis de Score

| Faixa | Nível | Selo | Benefícios |
|-------|-------|------|------------|
| 0-25 | Iniciante | 🟡 Bronze | Acesso básico ao marketplace, limite de 3 lances/dia |
| 26-50 | Regular | ⚪ Prata | Limite de 10 lances/dia, destaque em 10% das buscas |
| 51-75 | Profissional | 🟢 Ouro | Limite de 30 lances/dia, destaque em 30% das buscas, taxa reduzida (8%) |
| 76-90 | Elite | 🔵 Platina | Limite de 100 lances/dia, destaque em 50% das buscas, taxa reduzida (5%), saque prioritário |
| 91-100 | Lenda | 🔴 Diamante | Sem limites, destaque em 80% das buscas, taxa reduzida (3%), suporte prioritário 24h, acesso a fretes exclusivos |

### Recálculo do Score

- **Recálculo automático:** a cada novo frete concluído ou cancelado
- **Recálculo diário:** batch noturno que recalcula todos os scores
- **Decaimento:** scores de transportadores inativos (>90 dias sem atividade) decaem 10% ao mês
- **Reset:** transportador pode solicitar reset do score uma vez a cada 12 meses (volta para 25)

### Badges e Reconhecimentos

| Badge | Requisito | Bônus |
|-------|-----------|-------|
| 🚀 Entrega Rápida | 20 entregas com antecedência ≥ 2h | +2 score |
| 📸 Documentador | 50 fretes com fotos em todas as etapas | +1 score |
| 🌟 Super Avaliado | 100 avaliações com média ≥ 4.8 | +3 score |
| 🤝 Confiável | 200 fretes sem cancelamento | +5 score |
| 🏆 Top Mês | Maior volume de fretes no mês | +2 score (temporário 30 dias) |
| 🗺️ Nacional | Fretes em 10+ estados diferentes | +2 score |
| 🌱 Eco-Friendly | 50+ fretes de bike ou veículo elétrico | +1 score |

---

## Componentes React

### 1. FreightMarketplace

**Props:**
```typescript
interface FreightMarketplaceProps {
  userType: 'company' | 'driver' | null;
  initialFilters?: FreightFilterOptions;
  onLoadSelect?: (loadId: string) => void;
  onPublishClick?: () => void;
}
```

**Funcionalidades:**
- Barra de busca textual com autocomplete
- Filtros avançados em painel expansível:
  - Categoria (multi-select com ícones)
  - Raio de distância (slider + input numérico)
  - Budget (range slider)
  - Data de coleta (date picker)
  - Urgente (toggle)
  - Ordenação (dropdown: relevância, menor preço, maior preço, mais recente, mais perto)
- Visualização em grid (desktop) ou lista (mobile)
- Botão de alternância entre lista e mapa
- Mapa com clusters de fretes (Mapbox/Leaflet)
- Cards de fretes com lazy loading (infinite scroll)
- Indicador de novos fretes (puxar para atualizar)
- Botão "Publicar Frete" (para empresas)
- Estado vazio: ilustração + "Nenhum frete encontrado" + sugestões
- Estado de erro: mensagem + botão "Tentar novamente"
- Estado de carregamento: skeleton loading (8 cards)

**Ciclo de Vida:**
```
mount → useFreightLoads(initialFilters)
├── loading: skeleton
├── error: mensagem de erro + retry
├── empty: ilustração + "nenhum frete encontrado"
└── success: lista de FreightLoadCard

onFilterChange → updateFilters → refetch
onScroll → paginate (cursor-based)
onRefresh → pullToRefresh → refetch
```

### 2. FreightLoadCard

**Props:**
```typescript
interface FreightLoadCardProps {
  load: FreightLoadSummary;  // versão resumida do load
  onSelect: (loadId: string) => void;
  userType?: 'company' | 'driver';
  variant?: 'default' | 'compact' | 'detailed';
}
```

**Layout (default):**
```
┌─────────────────────────────────────┐
│  [ÍCONE CATEGORIA]  [STATUS BADGE]  │
│  Título do Frete                     │
│  📍 Origem → Destino                 │
│  📏 XX km  ⏱ XX min                  │
│  💰 R$ XXX - R$ XXXX                  │
│  📦 XX kg · XX m³                    │
│  🗓️ Coleta: DD/MM · Entrega: DD/MM  │
│  ┌────────────────────────────────┐  │
│  │  [N lances]                    │  │
│  └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Estados:**
- Normal: dados completos
- Urgente: borda vermelha + badge "URGENTE"
- Destaque: fundo levemente azulado (pago)
- Expirado: opacidade reduzida + badge "EXPIRADO"
- Em andamento: badge verde "EM ANDAMENTO" (para empresa ver seus fretes ativos)
- Sem lances: badge "SEM LANCES" (após 12h)

### 3. FreightPublishForm

**Props:**
```typescript
interface FreightPublishFormProps {
  companyId: string;
  initialData?: Partial<FreightLoadCreate>;
  onPublished: (load: FreightLoad) => void;
  onCancel: () => void;
}
```

**Componente de formulário multi-step com 4 etapas:**

**Step 1 — Carga:**
- Título (input text, max 100 chars, contador)
- Descrição (textarea, max 1000 chars)
- Categoria (grid com as 17 categorias, cada uma com ícone + nome + tooltip com specs)
- Peso (input number, valida contra max da categoria)
- Volume (input number, valida contra max da categoria)
- Dimensões: altura, largura, comprimento (3 inputs number)
- Valor da carga (input currency)
- Frágil? (toggle)
- Urgente? (toggle) — disponível apenas se categoria tem veículos disponíveis
- Fotos (upload drag-drop + preview, max 10, max 5MB cada)
- Progresso da etapa na parte superior

**Step 2 — Origem e Destino:**
- Endereço de coleta (address autocomplete + mapa interativo)
- Mapa com pin arrastável na origem
- Janela de coleta: data início, data fim (datetime picker)
- Endereço de entrega (address autocomplete + mapa interativo)
- Mapa com pin arrastável no destino
- Janela de entrega: data início, data fim (datetime picker)
- Rota calculada no mapa (linha de origem a destino)
- Distância calculada (km) — automática via API de rota
- Duração estimada — automática via API de rota
- Botão "Inverter origem/destino"
- Salvar endereços como template (opcional)

**Step 3 — Orçamento e Condições:**
- Budget mínimo (input currency)
- Budget máximo (input currency)
- Preço sugerido pelo sistema (exibido com info: "Com base em fretes similares na sua região")
- Seguro: toggle ON/OFF (se valor carga >= R$10.000, forçado ON + aviso)
- Embalagem: toggle (se a empresa precisa que o transportador embale)
- CNH: auto-preenchido pela categoria, editável
- Instruções especiais (textarea, max 500 chars)
- Exige nota fiscal? (toggle)
- Data de expiração dos lances (date picker, max 30 dias)
- Número máximo de lances (input, default 10, max 50)
- Permitir coleta parcial? (toggle)

**Step 4 — Revisão:**
- Resumo completo em formato de card:
  ```
  ┌─────────────────────────────────────┐
  │  📋 RESUMO DO FRETE                  │
  │                                       │
  │  Categoria: [ÍCONE] NOME              │
  │  Título: ...                          │
  │  Peso: ...                            │
  │  Volume: ...                          │
  │  Dimensões: ...                       │
  │                                       │
  │  📍 Coleta:                           │
  │     [Endereço]                        │
  │     [Data/hora]                       │
  │                                       │
  │  📍 Entrega:                          │
  │     [Endereço]                        │
  │     [Data/hora]                       │
  │                                       │
  │  💰 Orçamento: R$ X - R$ Y            │
  │  📏 Distância: XX km                  │
  │  🛡️ Seguro: Sim/Não                   │
  │                                       │
  │  Taxa da plataforma: X% (R$ Z)        │
  │  Você receberá (estimado): R$ W       │
  │                                       │
  │  [✅ Li e aceito os termos]           │
  │                                       │
  │  [VOLTAR]           [PUBLICAR FRETE]  │
  └─────────────────────────────────────┘
  ```

**Validação por etapa:**
- Step 1: título obrigatório, categoria obrigatória, peso/volume/dimensões dentro dos limites
- Step 2: origem e destino obrigatórios, coordenadas válidas, janelas de tempo coerentes
- Step 3: budget_min <= budget_max, budget dentro dos limites da categoria
- Step 4: termos aceitos

### 4. FreightBidForm

**Props:**
```typescript
interface FreightBidFormProps {
  loadId: string;
  load: FreightLoad;
  driverId: string;
  onBidSubmitted: (bid: FreightBid) => void;
  onCancel: () => void;
  existingBid?: FreightBid;  // para editar lance existente (se permitido)
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│  💰 DAR LANCE                        │
│                                       │
│  Frete: [Título]                      │
│  Categoria: [Ícone] [Nome]            │
│  Budget: R$ X - R$ Y                  │
│  Distância: XX km                     │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 💰 Valor do lance                │  │
│  │ [R$        ]                     │  │
│  │ Sugestão: R$ XXX (médio)         │  │
│  │ 50% ─────●────── 150%            │  │
│  │ do budget                        │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 📅 Previsão de coleta           │  │
│  │ [__________] a [__________]     │  │
│  │ ⏱ Distância até origem: X km   │  │
│  │ ⏱ Tempo estimado: XX min       │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 📅 Previsão de entrega          │  │
│  │ [__________] a [__________]     │  │
│  │ ⏱ Tempo estimado: XhXXmin      │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Selecione o veículo             │  │
│  │ [▼ Veículo compatível]          │  │
│  │ 🚛 [Placa] - [Modelo]          │  │
│  │ Categoria: [Nome]               │  │
│  └─────────────────────────────────┘  │
│                                       │
│  Mensagem (opcional):                 │
│  ┌─────────────────────────────────┐  │
│  │ [textarea...]                   │  │
│  │ 0/200 caracteres                │  │
│  └─────────────────────────────────┘  │
│                                       │
│  Taxa da plataforma: X%               │
│  Você receberá: R$ Z                  │
│                                       │
│  [CANCELAR]           [DAR LANCE]     │
└─────────────────────────────────────┘
```

**Estados:**
- Normal: formulário preenchível
- Vehicle not selected: aviso "Selecione um veículo compatível"
- Budget out of range: warning se valor fora do range
- Duplicate bid: erro se já existe lance ativo
- Loading: spinner no botão "DAR LANCE"
- Success: toast + redirecionamento para detalhes do frete
- Error: toast com mensagem de erro

### 5. FreightDetail

**Props:**
```typescript
interface FreightDetailProps {
  loadId: string;
  userType: 'company' | 'driver';
  onBidClick?: () => void;
  onTrackingClick?: () => void;
  onEditClick?: () => void;
  onCancelClick?: () => void;
}
```

**Layout (abas):**

```
┌─────────────────────────────────────────────┐
│  ⬅ Voltar ao Marketplace                     │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Header: Título · Badge Status          │ │
│  │  [Ícone] Categoria · ✅ Verificado      │ │
│  │                                           │ │
│  │  💰 R$ 500 - R$ 800 · 📏 45 km          │ │
│  │  📦 200 kg · 1.5 m³ · 🗓️ Urgente       │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  [📋 Detalhes][💬 Lances][🗺️ Rota][📷 Fotos] │
│                                               │
│  ── Detalhes ──                               │
│  📍 Coleta                                    │
│  Rua X, 123 - Centro - São Paulo/SP           │
│  🗓️ 15/07/2026 08:00 - 18:00                 │
│                                               │
│  📍 Entrega                                   │
│  Av. Y, 456 - Barra - Rio de Janeiro/RJ      │
│  🗓️ 17/07/2026 08:00 - 18:00                 │
│                                               │
│  Descrição:                                   │
│  Transporte de móveis planificados...          │
│                                               │
│  Instruções:                                  │
│  • Portaria 24h                               │
│  • Precisa de carrinho para descarga         │
│  • Nota fiscal obrigatória                   │
│                                               │
│  ── Lances ──                                 │
│  [Se for EMPRESA: botão "Atualizar lances"]  │
│                                               │
│  Ordenar por: [Menor valor ▼]                 │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Lance #1                               │ │
│  │  👤 Nome do motorista   ⭐ 4.8 (92)     │ │
│  │  💰 R$ 550,00                           │ │
│  │  📅 Coleta: 15/07 10:00                 │ │
│  │  📅 Entrega: 17/07 14:00                │ │
│  │  💬 "Disponível para coleta imediata"   │ │
│  │  🚛 Fiat Fiorino - ABC-1234             │ │
│  │  [✓ ACEITAR] [⟳ CONTRA-PROPOR] [✕ RECUSAR]│ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Lance #2                               │ │
│  │  ...                                     │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ── Rota ──                                   │
│  [Mapa interativo com rota calculada]         │
│  📏 45 km · ⏱ 50 min                         │
│                                               │
│  ── Fotos ──                                  │
│  [Grid de fotos da carga]                     │
└─────────────────────────────────────────────┘
```

**Estados:**
- Loading: skeleton em todas as seções
- Load not found: mensagem "Frete não encontrado ou expirado"
- Load cancelled: aviso + motivo + data
- No bids (company): "Ainda não há lances. Compartilhe este frete!"
- Has bids (company): lista de lances com ações
- Bids closed (company): "Período de lances encerrado" + lance vencedor
- Driver hasn't bid: botão "Dar Lance" em destaque
- Driver has bid pending: "Seu lance de R$ X está pendente"
- Driver has bid accepted: "Lance aceito!" + botão "Ir para Coleta"

### 6. FreightTracking

**Props:**
```typescript
interface FreightTrackingProps {
  loadId: string;
  userType: 'company' | 'driver';
  onComplete?: () => void;
  onProblemReport?: () => void;
}
```

**Layout (empresa):**
```
┌─────────────────────────────────────────────┐
│  ⬅ Voltar                                    │
│                                               │
│  🚛 FREIGHT IN TRANSIT                        │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  [MAPA INTERATIVO EM TELA CHEIA]        │ │
│  │  • Rota: linha azul origem-destino      │ │
│  │  • Veículo: ícone animado na posição    │ │
│  │  • Origem: marcador verde               │ │
│  │  • Destino: marcador vermelho            │ │
│  │  • Waypoints intermediários (se houver) │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ├── Transportador ─────────────────────────┤ │
│  │  👤 Nome do motorista                     │ │
│  │  ⭐ 4.8 · Score: 92                       │ │
│  │  🚛 Fiat Fiorino - ABC-1234               │ │
│  │  📞 (11) 99999-9999                       │ │
│  │  [💬 Chat com motorista]                  │ │
│  ├────────────────────────────────────────────┤ │
│                                               │
│  ├── Progresso ─────────────────────────────┤ │
│  │  ✅ Lance aceito      15/07 10:00         │ │
│  │  ✅ A caminho da coleta 15/07 11:30       │ │
│  │  📍 Chegou na coleta  15/07 12:15         │ │
│  │  ⏳ Coleta em andamento                    │ │
│  │  [■■■■■■■□□□□] 70%                        │ │
│  ├────────────────────────────────────────────┤ │
│                                               │
│  ├── Informações ───────────────────────────┤ │
│  │  📏 Distância restante: 12 km             │ │
│  │  ⏱ ETA: 14:35 (em 25 min)                │ │
│  │  🚗 Velocidade: 45 km/h                   │ │
│  │  ⏱ Tempo total: 2h15min                   │ │
│  ├────────────────────────────────────────────┤ │
│                                               │
│  ├── Ações ─────────────────────────────────┤ │
│  │  [💬 Chat] [📞 Ligar] [⚠️ Reportar]       │ │
│  └────────────────────────────────────────────┘ │
│                                               │
│  [Última atualização: 2 min atrás]            │
└─────────────────────────────────────────────┘
```

**Layout (transportador):**
```
┌─────────────────────────────────────────────┐
│  [MAPA COM ROTA + GPS]                       │
│                                               │
│  Status atual: EM TRÂNSITO                    │
│                                               │
│  📍 Próximo: Rua X, 123 - Centro             │
│  📏 Faltam: 5 km                             │
│  ⏱ ETA: 5 min                               │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  [🛑 PARAR]  [⚠️ PROBLEMA]  [📸 FOTO]  │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ├── Rota ──────────────────────────────────┤ │
│  │  🔵 Origem: Rua X, 123                    │ │
│  │  🟢 Você está aqui                         │ │
│  │  🔴 Destino: Av. Y, 456                   │ │
│  ├────────────────────────────────────────────┤ │
│                                               │
│  ├── Checklist ─────────────────────────────┤ │
│  │  ✅ Coleta realizada (foto)               │ │
│  │  ☐ Entrega (foto + assinatura)           │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Mapa com Leaflet/Mapbox (rota, veículo em tempo real, marcadores)
- Timeline de status com timestamps
- ETA dinâmico (recalculado a cada posição)
- Botão de emergência (reportar problema)
- Chat integrado
- Alternância entre mapa e lista (mobile)

### 7. FreightHistory

**Props:**
```typescript
interface FreightHistoryProps {
  userId: string;
  userType: 'company' | 'driver';
  initialTab?: 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}
```

**Layout:**
```
┌─────────────────────────────────────────────┐
│  📋 Histórico de Fretes                      │
│                                               │
│  [📋 Todos] [📌 Abertos] [🚛 Em Andamento]   │
│  [✅ Concluídos] [❌ Cancelados]              │
│                                               │
│  Período: [Últimos 30 dias ▼]                │
│                                               │
│  ── Estatísticas ──                           │
│  [Para empresa]                              │
│  Total: 45 fretes · R$ 38.450 gastos         │
│  Média: R$ 854/frete                         │
│  Taxa de conclusão: 93%                      │
│                                               │
│  [Para transportador]                        │
│  Total: 128 fretes · R$ 89.200 recebidos     │
│  Média: R$ 697/frete                         │
│  Score: 87 · Nível: Platina                  │
│                                               │
│  ── Lista de Fretes ──                       │
│  ┌─────────────────────────────────────────┐ │
│  │  15/07/2026                             │ │
│  │  🟢 Concluído                           │ │
│  │  📦 Móveis planificados                 │ │
│  │  📍 SP → RJ · 450 km                    │ │
│  │  💰 R$ 750,00                            │ │
│  │  👤 Motorista: João Silva ⭐ 4.9        │ │
│  │  [Ver detalhes]                         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  14/07/2026                             │ │
│  │  🟡 Em andamento                        │ │
│  │  ...                                     │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  [Carregar mais...]                          │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Abas de filtro por status
- Período selecionável (7, 30, 90, 365 dias ou personalizado)
- Cards com resumo + cor de status
- Estatísticas agregadas no topo
- Paginação infinita (scroll)
- Exportar relatório (CSV/PDF)
- Busca textual
- Gráfico de fretes por mês (visão geral)

---

## APIs

### Especificação REST

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | /api/freight/categories | Listar categorias de veículos | Pública |
| GET | /api/freight/loads | Listar fretes disponíveis | Pública (filtros) |
| GET | /api/freight/loads/:id | Detalhes do frete | Empresa/Driver |
| POST | /api/freight/loads | Publicar novo frete | Empresa |
| PUT | /api/freight/loads/:id | Editar frete | Empresa (dona) |
| DELETE | /api/freight/loads/:id | Cancelar frete | Empresa (dona) |
| GET | /api/freight/loads/:id/bids | Listar lances de um frete | Empresa |
| POST | /api/freight/loads/:id/bid | Dar lance | Driver |
| PUT | /api/freight/bids/:id/accept | Aceitar lance | Empresa |
| PUT | /api/freight/bids/:id/reject | Rejeitar lance | Empresa |
| PUT | /api/freight/bids/:id/counter | Contra-proposta | Empresa |
| PUT | /api/freight/bids/:id/respond | Responder contra-proposta | Driver |
| GET | /api/freight/tracking/:loadId | Obter tracking do frete | Empresa/Driver |
| POST | /api/freight/tracking | Atualizar tracking | Driver |
| POST | /api/freight/tracking/photo | Enviar foto do tracking | Driver |
| POST | /api/freight/tracking/signature | Enviar assinatura digital | Driver |
| GET | /api/freight/history | Histórico de fretes | Empresa/Driver |
| GET | /api/freight/stats | Estatísticas do usuário | Empresa/Driver |
| POST | /api/freight/ratings | Avaliar transportador | Empresa |
| POST | /api/freight/profiles | Criar/editar perfil empresa | Empresa |
| GET | /api/freight/profiles/me | Meu perfil empresa | Empresa |
| POST | /api/freight/driver/profiles | Criar/editar perfil motorista | Driver |
| GET | /api/freight/driver/profiles/me | Meu perfil motorista | Driver |
| GET | /api/freight/driver/vehicles | Listar veículos do motorista | Driver |
| POST | /api/freight/driver/vehicles | Cadastrar veículo | Driver |

### Endpoints Detalhados

#### GET /api/freight/loads

Lista fretes disponíveis (status = open) com filtros.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|------------|-----------|
| category_id | string | Não | Filtrar por categoria |
| lat | number | Não | Latitude da posição do usuário (para busca por raio) |
| lng | number | Não | Longitude da posição do usuário |
| radius_km | number | Não | Raio de busca a partir de lat/lng (default: 50) |
| budget_min | number | Não | Valor mínimo do budget |
| budget_max | number | Não | Valor máximo do budget |
| pickup_date_from | date | Não | Data mínima de coleta |
| pickup_date_to | date | Não | Data máxima de coleta |
| weight_max | number | Não | Peso máximo da carga |
| urgent | boolean | Não | Apenas fretes urgentes |
| fragile | boolean | Não | Apenas fretes frágeis |
| search | string | Não | Busca textual por título |
| sort | string | Não | Ordenação: 'recent', 'budget_asc', 'budget_desc', 'distance', 'deadline' |
| page | number | Não | Número da página (default: 1) |
| limit | number | Não | Itens por página (default: 20, max: 50) |

**Resposta (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Entrega de móveis",
      "category": {
        "id": "van",
        "name": "Van",
        "icon": "van",
        "color": "#45AAF2"
      },
      "origin": {
        "city": "São Paulo",
        "state": "SP",
        "lat": -23.5505,
        "lng": -46.6333
      },
      "destination": {
        "city": "Rio de Janeiro",
        "state": "RJ",
        "lat": -22.9068,
        "lng": -43.1729
      },
      "distance_km": 430.5,
      "budget_min": 500.00,
      "budget_max": 800.00,
      "weight_kg": 200,
      "volume_m3": 1.5,
      "pickup_start": "2026-07-15T08:00:00Z",
      "pickup_end": "2026-07-15T18:00:00Z",
      "delivery_start": "2026-07-17T08:00:00Z",
      "delivery_end": "2026-07-17T18:00:00Z",
      "is_urgent": false,
      "is_fragile": true,
      "bid_count": 3,
      "photos_count": 2,
      "created_at": "2026-07-13T10:00:00Z",
      "expires_at": "2026-07-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

#### POST /api/freight/loads

Publicar um novo frete.

**Request Body:**
```json
{
  "title": "Entrega de móveis planificados",
  "description": "3 conjuntos de móveis planificados caixa 1.80x0.90x0.50",
  "origin_address": "Rua Augusta, 1500 - Consolação, São Paulo - SP",
  "origin_lat": -23.5578,
  "origin_lng": -46.6590,
  "destination_address": "Av. Atlântica, 2000 - Copacabana, Rio de Janeiro - RJ",
  "destination_lat": -22.9711,
  "destination_lng": -43.1823,
  "category_id": "van",
  "weight_kg": 200,
  "volume_m3": 1.5,
  "height_cm": 50,
  "width_cm": 90,
  "length_cm": 180,
  "requires_insurance": true,
  "requires_packaging": true,
  "budget_min": 500.00,
  "budget_max": 800.00,
  "pickup_start": "2026-07-15T08:00:00Z",
  "pickup_end": "2026-07-15T18:00:00Z",
  "delivery_start": "2026-07-17T08:00:00Z",
  "delivery_end": "2026-07-17T18:00:00Z",
  "photos": [
    "https://txap.com.br/storage/freight/temp/photo-1.jpg"
  ],
  "special_instructions": "Portaria 24h. Precisa de carrinho para descarga.",
  "cargo_value": 15000.00,
  "is_fragile": true,
  "is_urgent": false
}
```

**Resposta (201):**
```json
{
  "id": "uuid-do-frete",
  "status": "open",
  "created_at": "2026-07-13T10:00:00Z",
  "expires_at": "2026-07-20T10:00:00Z"
}
```

#### GET /api/freight/loads/:id

Detalhes completos de um frete.

**Resposta (200):**
```json
{
  "id": "uuid",
  "company": {
    "id": "uuid",
    "name": "Empresa XYZ Ltda",
    "rating": 4.5,
    "total_loads": 230,
    "completed_loads": 218,
    "logo_url": "https://txap.com.br/storage/logos/logo.png",
    "is_verified": true
  },
  "title": "Entrega de móveis planificados",
  "description": "3 conjuntos de móveis planificados caixa 1.80x0.90x0.50",
  "origin": {
    "address": "Rua Augusta, 1500 - Consolação, São Paulo - SP",
    "lat": -23.5578,
    "lng": -46.6590
  },
  "destination": {
    "address": "Av. Atlântica, 2000 - Copacabana, Rio de Janeiro - RJ",
    "lat": -22.9711,
    "lng": -43.1823
  },
  "distance_km": 430.5,
  "estimated_duration_min": 360,
  "category": {
    "id": "van",
    "name": "Van",
    "namePt": "Van",
    "icon": "van",
    "color": "#45AAF2",
    "maxWeightKg": 1500,
    "maxVolumeM3": 8
  },
  "cargo": {
    "weight_kg": 200,
    "volume_m3": 1.5,
    "height_cm": 50,
    "width_cm": 90,
    "length_cm": 180,
    "cargo_value": 15000.00,
    "is_fragile": true,
    "is_urgent": false
  },
  "budget": {
    "min": 500.00,
    "max": 800.00
  },
  "schedule": {
    "pickup_start": "2026-07-15T08:00:00Z",
    "pickup_end": "2026-07-15T18:00:00Z",
    "delivery_start": "2026-07-17T08:00:00Z",
    "delivery_end": "2026-07-17T18:00:00Z"
  },
  "requirements": {
    "requires_cnh": "B",
    "requires_insurance": true,
    "requires_packaging": true,
    "body_type": null,
    "has_lift_gate": false,
    "has_temperature_control": false
  },
  "status": "open",
  "photos": [
    {
      "url": "https://txap.com.br/storage/freight/123/photo-1.jpg",
      "thumbnail": "https://txap.com.br/storage/freight/123/photo-1-thumb.jpg",
      "type": "cargo",
      "description": "Carga completa",
      "uploaded_at": "2026-07-13T10:00:00Z"
    }
  ],
  "special_instructions": "Portaria 24h. Precisa de carrinho para descarga.",
  "bid_count": 3,
  "bids": [
    {
      "id": "uuid",
      "driver": {
        "id": "uuid",
        "name": "João Silva",
        "rating": 4.9,
        "score": 92,
        "avatar_url": null,
        "vehicle": {
          "plate": "ABC-1234",
          "brand": "Fiat",
          "model": "Fiorino",
          "category_id": "van"
        }
      },
      "amount": 550.00,
      "message": "Disponível para coleta imediata",
      "estimated_pickup": "2026-07-15T10:00:00Z",
      "estimated_delivery": "2026-07-17T14:00:00Z",
      "status": "pending",
      "created_at": "2026-07-13T11:30:00Z"
    }
  ],
  "created_at": "2026-07-13T10:00:00Z",
  "expires_at": "2026-07-20T10:00:00Z",
  "my_bid": null
}
```

#### POST /api/freight/loads/:id/bid

Dar lance em um frete.

**Request Body:**
```json
{
  "amount": 550.00,
  "message": "Disponível para coleta imediata",
  "estimated_pickup": "2026-07-15T10:00:00Z",
  "estimated_delivery": "2026-07-17T14:00:00Z",
  "vehicle_id": "uuid-do-veiculo"
}
```

**Resposta (201):**
```json
{
  "id": "uuid-do-lance",
  "load_id": "uuid-do-frete",
  "amount": 550.00,
  "status": "pending",
  "created_at": "2026-07-13T11:30:00Z"
}
```

**Erros:**
- `400`: orçamento fora do range, veículo incompatível, categoria incompatível
- `409`: já existe lance ativo para este frete
- `403`: perfil incompleto, documento pendente
- `404`: frete não encontrado ou expirado

#### PUT /api/freight/bids/:id/accept

Aceitar um lance.

**Request Body:**
```json
{}
```

**Resposta (200):**
```json
{
  "id": "uuid-do-lance",
  "status": "accepted",
  "load_id": "uuid-do-frete",
  "load_status": "in_progress",
  "accepted_at": "2026-07-13T12:00:00Z"
}
```

**Efeitos colaterais:**
- Status do frete → `in_progress`
- Demais lances → `rejected`
- Transportador notificado
- Tracking inicializado com status `assigned`

#### PUT /api/freight/bids/:id/counter

Fazer contra-proposta ao lance.

**Request Body:**
```json
{
  "countered_amount": 600.00,
  "countered_message": "Podemos fechar por R$ 600?"
}
```

**Resposta (200):**
```json
{
  "id": "uuid-do-lance",
  "status": "countered",
  "countered_amount": 600.00,
  "countered_message": "Podemos fechar por R$ 600?",
  "countered_at": "2026-07-13T12:00:00Z",
  "expires_at": "2026-07-14T12:00:00Z"
}
```

#### PUT /api/freight/bids/:id/respond

Transportador responde à contra-proposta.

**Request Body:**
```json
{
  "accept": true
}
```

**Resposta (200) — Aceitou:**
```json
{
  "id": "uuid-do-lance",
  "status": "accepted",
  "accepted_at": "2026-07-13T14:00:00Z"
}
```

**Resposta (200) — Recusou:**
```json
{
  "id": "uuid-do-lance",
  "status": "rejected",
  "rejected_at": "2026-07-13T14:00:00Z"
}
```

#### POST /api/freight/tracking

Atualizar tracking (enviado pelo driver a cada 30s).

**Request Body:**
```json
{
  "load_id": "uuid-do-frete",
  "status": "in_transit",
  "location_lat": -23.5505,
  "location_lng": -46.6333,
  "altitude_m": 760,
  "speed_kmh": 45,
  "heading": 180,
  "accuracy_m": 5,
  "battery_level": 85,
  "is_offline": false,
  "sync_key": "sync-123456"
}
```

**Resposta (200):**
```json
{
  "id": "uuid-do-ponto",
  "timestamp": "2026-07-15T12:30:00Z"
}
```

#### GET /api/freight/tracking/:loadId

Obter tracking completo de um frete.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| since | ISO timestamp | Não | Retornar pontos a partir desta data |

**Resposta (200):**
```json
{
  "load_id": "uuid-do-frete",
  "driver": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "+5511999999999",
    "vehicle_plate": "ABC-1234",
    "vehicle_model": "Fiat Fiorino"
  },
  "current_status": "in_transit",
  "current_location": {
    "lat": -23.5505,
    "lng": -46.6333,
    "address": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
  },
  "eta": {
    "minutes": 25,
    "distance_km": 12.5,
    "estimated_at": "2026-07-15T13:55:00Z"
  },
  "route": {
    "origin": { "lat": -23.5578, "lng": -46.6590 },
    "destination": { "lat": -22.9711, "lng": -43.1823 },
    "polyline": "encoded-polyline-string"
  },
  "timeline": [
    {
      "status": "assigned",
      "timestamp": "2026-07-15T10:00:00Z",
      "location": null
    },
    {
      "status": "going_to_pickup",
      "timestamp": "2026-07-15T11:00:00Z",
      "location": { "lat": -23.5600, "lng": -46.6500 }
    },
    {
      "status": "arrived_at_pickup",
      "timestamp": "2026-07-15T11:30:00Z",
      "location": { "lat": -23.5578, "lng": -46.6590 }
    },
    {
      "status": "picked_up",
      "timestamp": "2026-07-15T12:00:00Z",
      "location": { "lat": -23.5578, "lng": -46.6590 },
      "photo": "https://txap.com.br/storage/tracking/123/pickup.jpg"
    },
    {
      "status": "in_transit",
      "timestamp": "2026-07-15T12:30:00Z",
      "location": { "lat": -23.5505, "lng": -46.6333 }
    }
  ],
  "tracking_points": [
    {
      "lat": -23.5505,
      "lng": -46.6333,
      "timestamp": "2026-07-15T12:30:00Z",
      "speed_kmh": 45
    }
  ]
}
```

### Códigos de Erro Padrão

| Código | Erro | Descrição |
|--------|------|-----------|
| ERR_LOAD_NOT_FOUND | Frete não encontrado | ID inválido ou expirado |
| ERR_LOAD_CLOSED | Frete fechado | Já não aceita lances |
| ERR_LOAD_CANCELLED | Frete cancelado | Cancelado pela empresa |
| ERR_BID_ALREADY_EXISTS | Lance já existente | Transportador já deu lance |
| ERR_BID_NOT_FOUND | Lance não encontrado | ID inválido |
| ERR_BID_EXPIRED | Lance expirado | Contra-proposta expirou |
| ERR_BID_AMOUNT_INVALID | Valor de lance inválido | Fora do range permitido |
| ERR_VEHICLE_INCOMPATIBLE | Veículo incompatível | Categoria não atende |
| ERR_PROFILE_INCOMPLETE | Perfil incompleto | Documentos pendentes |
| ERR_CATEGORY_MISMATCH | Categoria incompatível | Veículo não atende categoria |
| ERR_DRIVER_UNAVAILABLE | Motorista indisponível | Já em outro frete |
| ERR_COMPANY_INACTIVE | Empresa inativa | Perfil suspenso ou banido |
| ERR_DRIVER_BLOCKED | Motorista bloqueado | Suspensão temporária |
| ERR_INVALID_COORDINATES | Coordenadas inválidas | Fora do Brasil |
| ERR_DISTANCE_EXCEEDED | Distância excedida | Raio máximo do transportador |
| ERR_INSURANCE_REQUIRED | Seguro obrigatório | Carga acima de R$ 10.000 |

### Webhooks

| Evento | Payload | Destino |
|--------|---------|---------|
| freight.created | load_id, company_id, category, budget_range | Notificação push |
| freight.bid_received | load_id, driver_id, amount | Notificação push empresa |
| freight.bid_accepted | load_id, driver_id, amount | Notificação push driver |
| freight.picked_up | load_id, driver_id, photo_url | Notificação push empresa |
| freight.delivered | load_id, driver_id, photo_url, signature_url | Notificação push empresa |
| freight.cancelled | load_id, reason, cancelled_by | Notificação push |
| freight.rating_received | load_id, driver_id, rating | Notificação push driver |
| freight.payment_released | load_id, driver_id, amount | Notificação push driver |

### WebSocket (Realtime)

Canais do Supabase Realtime:

| Canal | Evento | Descrição |
|-------|--------|-----------|
| `freight:{loadId}:bids` | INSERT/UPDATE | Novos lances ou mudanças |
| `freight:{loadId}:tracking` | INSERT | Novos pontos de tracking |
| `freight:{loadId}:status` | UPDATE | Mudança de status do frete |
| `freight:{loadId}:chat` | INSERT | Novas mensagens no chat |
| `user:{userId}:notifications` | INSERT | Notificações do usuário |

---

## Segurança e Compliance

### Autenticação e Autorização

- Autenticação via Supabase Auth (JWT)
- Roles: `company`, `driver`, `admin`
- Políticas RLS (Row Level Security) no PostgreSQL:
  - Empresa vê apenas seus próprios fretes (company_id = auth.uid)
  - Transportador vê fretes abertos (status = open) + seus próprios lances
  - Tracking visível apenas para empresa do frete e transportador designado
  - Dados financeiros visíveis apenas para o próprio usuário

### Proteção de Dados (LGPD)

- Dados pessoais armazenados com criptografia em repouso
- CPF/CNPJ: hash+salt para buscas, criptografia para exibição
- Consentimento explícito para compartilhamento de dados entre empresa e transportador
- Período de retenção: 5 anos após último frete (conforme legislação fiscal)
- Direito de exclusão: anonimização de dados após solicitação
- Logs de acesso a dados pessoais

### Prevenção a Fraudes

- Verificação de documentos via OCR + validação gov.br
- Detecção de lances automáticos (mesmo IP, mesmo dispositivo, padrão suspeito)
- Verificação de identidade por vídeo (para valores acima de R$ 5.000)
- Análise de padrões de geolocalização (GPS spoofing detection)
- Rate limiting: max 50 lances/hora por transportador
- Limite de criação de fretes: max 10/dia por empresa (pode ser ajustado)

---

## Métricas e KPIs

### Para Operação da Plataforma

| Métrica | Definição | Meta |
|---------|-----------|------|
| GMV (Gross Merchandise Volume) | Valor total de fretes negociados | R$ 10M/mês (ano 1) |
| Take Rate | % da taxa da plataforma | 8-12% |
| Active Loads | Fretes abertos simultâneos | > 1.000 |
| Active Drivers | Transportadores ativos no mês | > 5.000 |
| Active Companies | Empresas ativas no mês | > 500 |
| Match Rate | % de fretes com pelo menos 1 lance | > 85% |
| Fill Rate | % de fretes concluídos | > 75% |
| Avg Time to First Bid | Tempo médio para primeiro lance | < 30 min |
| Avg Time to Accept | Tempo médio para aceitação | < 4h |
| Driver Retention (M+3) | % motoristas ativos após 3 meses | > 60% |
| Company Retention (M+3) | % empresas ativas após 3 meses | > 70% |
| NPS | Net Promoter Score | > 50 |

### Para Empresas

| Métrica | Definição |
|---------|-----------|
| Avg Freight Cost | Custo médio por frete |
| Avg Distance | Distância média por frete |
| Cost per km | Custo médio por km rodado |
| On-Time Delivery % | % de entregas dentro do prazo |
| Driver Rating Avg | Média de avaliação dos transportadores contratados |
| Load Cancellation % | % de fretes cancelados |
| Budget Utilization | % do budget utilizado (lance / budget_max) |

### Para Transportadores

| Métrica | Definição |
|---------|-----------|
| Avg Earnings per Load | Ganho médio por frete |
| Avg Earnings per Month | Ganho médio mensal |
| Loads per Month | Fretes realizados por mês |
| Km per Load | Km rodados por frete |
| Rating Avg | Média de avaliações recebidas |
| Acceptance Rate | % de lances aceitos vs. dados |
| Cancellation Rate | % de fretes cancelados após aceite |
| On-Time Delivery % | % de entregas dentro do prazo |
| Response Time | Tempo médio para responder a lances |

---

## Considerações de Performance

### Otimizações de Banco

- Índices compostos para queries frequentes (status + created_at, category_id + budget)
- Particionamento de `freight_tracking` por mês (partições por range de timestamp)
- Materialized view para fretes disponíveis (atualizada a cada 5 min)
- Cursor-based pagination em vez de offset para listas grandes
- Geo-indexing com PostGIS (índice GIST nas coordenadas)

### Cache

- Redis para:
  - Listas de fretes disponíveis (chave: `freight:available:page:{n}`, TTL: 2 min)
  - Categorias de veículos (chave: `freight:categories`, TTL: 1h)
  - Distâncias calculadas (chave: `route:distance:{origin_lat}:{origin_lng}:{dest_lat}:{dest_lng}`, TTL: 24h)
  - Perfis de empresa/transportador (chave: `profile:{type}:{id}`, TTL: 5 min)
  - Scores de transportadores (chave: `driver:score:{id}`, TTL: 1h)
  - Sessão e rate limiting

### Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| GET /api/freight/loads | 60 requests | 1 minuto |
| POST /api/freight/loads | 10 requests | 1 hora |
| POST /api/freight/loads/:id/bid | 30 requests | 1 hora |
| POST /api/freight/tracking | 120 requests | 1 minuto |
| POST /api/freight/ratings | 20 requests | 1 hora |
| Demais endpoints | 30 requests | 1 minuto |

---

## Mobile (React Native)

### Telas Específicas Mobile

- **Tracking Mapa** — tela cheia com GPS em tempo real, otimizada para uso enquanto dirige
- **Coleta Rápida** — fluxo simplificado de coleta com câmera integrada
- **Entrega com Assinatura** — captura de assinatura touch + foto
- **Scanner QR** — leitura de QR code na coleta/entrega para confirmação
- **Modo Offline** — funcionalidades básicas sem internet (ver fretes baixados, tracking offline)

### Recursos Nativos

| Funcionalidade | API Nativa |
|----------------|-----------|
| GPS Tracking | react-native-maps + expo-location |
| Câmera/Fotos | expo-camera, expo-image-picker |
| Assinatura | react-native-signature-canvas |
| Push Notifications | expo-notifications, Firebase |
| Offline Storage | AsyncStorage, SQLite (expo-sqlite) |
| Scanner QR | expo-camera (bar code scanner) |
| Background Location | expo-task-manager, expo-location (background) |
| Geofencing | expo-location (geofencing) |
| Deep Links | expo-linking |

---

## Testes

### E2E

- **Publicar frete:** preencher formulário completo → publicar → verificar se aparece no marketplace
- **Dar lance:** selecionar frete → dar lance → verificar se empresa recebe
- **Aceitar lance:** empresa aceita → status muda → motorista notificado
- **Fluxo completo:** publicar → dar lance → aceitar → coletar → tracking → entregar → avaliar → pagamento
- **Cancelamento:** cancelar antes da coleta → verificar penalidades

### Testes de Carga

- Simular 1.000 transportadores dando lance simultaneamente no mesmo frete
- Simular 10.000 pontos de tracking por minuto
- Testar busca por raio com 100.000 fretes ativos

### Testes de Segurança

- Validação de CNPJ/CPF
- SQL Injection em campos de busca
- Rate limiting em endpoints críticos
- Verificação de permissões RLS
- Validação de coordenadas (fora do Brasil, mar aberto)

---

## Internacionalização

Atualmente os termos e categorias estão documentados em português (Brasil), com suporte a inglês via arquivos i18n. O sistema deve suportar:

- 📍 **Português (Brasil)** — padrão
- 📍 **Español** — expansão futura (América Latina)
- 📍 **English** — expansão futura (EUA, mercado de cross-border)

Os campos `name_pt` e `name` nas `freight_categories` já preveem os dois idiomas principais.

---

## Glossário

| Termo | Definição |
|-------|-----------|
| Frete | Serviço de transporte de carga entre origem e destino |
| Marketplace | Plataforma que conecta empresas a transportadores |
| Lance (Bid) | Proposta de valor feita pelo transportador para executar um frete |
| Contra-proposta (Counter) | Novo valor proposto pela empresa em resposta ao lance |
| Budget | Faixa de valor que a empresa está disposta a pagar |
| Tracking | Acompanhamento em tempo real da localização da carga |
| Score | Pontuação do transportador (0-100) baseada em performance |
| Rating | Avaliação (1-5) dada pela empresa ao transportador |
| Coleta | Ação de retirar a carga no local de origem |
| Entrega | Ação de deixar a carga no local de destino |
| CNH | Carteira Nacional de Habilitação |
| RNTRC | Registro Nacional de Transportadores Rodoviários de Carga |
| AET | Autorização Especial de Trânsito (cargas excedentes) |
| MOPP | Movimentação e Operação de Produtos Perigosos |
| Antt | Agência Nacional de Transportes Terrestres |
| ETA | Estimated Time of Arrival (previsão de chegada) |
| GMV | Gross Merchandise Volume (volume total transacionado) |
| Take Rate | Percentual de taxa cobrada pela plataforma |

---

Este documento constitui a especificação completa do módulo **TXAPP Freight Marketplace**. Todas as tabelas, regras de negócio, fluxos, componentes e APIs aqui descritos devem ser implementados conforme as definições acima. Atualizações e revisões devem ser documentadas neste mesmo arquivo, mantendo o histórico de versões no final do documento.

### Histórico de Revisões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-07-13 | TXAPP Team | Versão inicial completa |
