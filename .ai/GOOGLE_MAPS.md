# TXAPP Mobility Engine & Google Maps Integration

## Visão Geral

A Mobility Engine é a camada de abstração de mapas do TXAPP. **NUNCA** chamar Google Maps diretamente no código da aplicação. Toda chamada de funcionalidade geoespacial passa obrigatoriamente pelo Mobility Engine, que pode utilizar Google Maps, Mapbox, Here, TomTom ou OpenStreetMap como provider. Essa abstração permite trocar de provedor sem alterar o código dos componentes de UI ou lógica de negócio.

### Princípios fundamentais

1. **Provider-agnostic** — a aplicação nunca depende diretamente de um provedor específico
2. **Failover automático** — se um provedor exceder quota ou falhar, o engine faz fallback para o próximo disponível
3. **Cache inteligente** — resultados são cacheados em memória com TTL configurável para reduzir custos e latência
4. **Rate limiting** — cada provider tem seu próprio controle de taxa para evitar rejeição de requisições
5. **Custo controlado** — chamadas de API são monitoradas e limitadas por sessão

---

## Arquitetura

`
UI Components (map-view, map-picker, location-autocomplete, etc.)
  ↕  (importam apenas Mobility Engine via engine.ts)
Mobility Engine (src/lib/mobility/engine.ts)
  ↕  (interface IMobilityProvider)
Providers (src/lib/mobility/providers/):
  ├── GoogleMapsProvider       (ativo, implementado)
  ├── MapboxProvider           (ativo, implementado)
  ├── HereProvider             (futuro)
  ├── TomTomProvider           (futuro)
  └── OpenStreetMapProvider    (futuro)
`

### Fluxo de requisição

1. Componente de UI chama engine.calculateRoute(origin, destination)
2. Engine verifica cache (MapCache) — se hit, retorna imediatamente
3. Engine delega ao provider ativo (GoogleMapsProvider)
4. Provider faz requisição HTTP à API externa
5. Provider aplica tratamento de erros e rate limiting
6. Resposta é parseada para o tipo padronizado (RouteInfo)
7. Engine armazena no cache e retorna ao componente

---

## Interface IMobilityProvider

Definição TypeScript completa da interface que todos os providers devem implementar.

`	ypescript
export interface ICoordinates {
  lat: number
  lng: number
}

export interface IRouteLeg {
  distance: { text: string; value: number }
  duration: { text: string; value: number }
  durationInTraffic?: { text: string; value: number }
  startAddress: string
  endAddress: string
  startLocation: ICoordinates
  endLocation: ICoordinates
  steps: IRouteStep[]
  polyline: string
}

export interface IRouteStep {
  instruction: string
  distance: { text: string; value: number }
  duration: { text: string; value: number }
  startLocation: ICoordinates
  endLocation: ICoordinates
  polyline: string
  maneuver?: string
}

export interface RouteInfo {
  id: string
  legs: IRouteLeg[]
  waypoints: ICoordinates[]
  polyline: string
  bounds: { northeast: ICoordinates; southwest: ICoordinates }
  fare?: { currency: string; value: number; text: string }
  duration: number
  distance: number
  durationInTraffic?: number
  trafficModel?: string
  alternatives?: RouteInfo[]
}

export interface Place {
  id: string
  name: string
  address: string
  coordinates: ICoordinates
  placeType?: string
  rating?: number
  userRatingsTotal?: number
  openingHours?: { openNow: boolean; periods: any[] }
  phone?: string
  website?: string
  photoRef?: string
  plusCode?: string
  distance?: number
}

export interface AddressPreview {
  formattedAddress: string
  streetNumber: string
  route: string
  neighborhood: string
  city: string
  state: string
  stateCode: string
  country: string
  countryCode: string
  postalCode: string
  plusCode: string
}

export interface DistanceMatrix {
  originAddresses: string[]
  destinationAddresses: string[]
  rows: DistanceMatrixRow[]
}

export interface DistanceMatrixRow {
  elements: DistanceMatrixElement[]
}

export interface DistanceMatrixElement {
  status: string
  duration: { text: string; value: number }
  durationInTraffic?: { text: string; value: number }
  distance: { text: string; value: number }
  fare?: { currency: string; value: number; text: string }
}

export interface SnappedPoint {
  originalIndex: number
  location: ICoordinates
  originalLocation: ICoordinates
  snapped: boolean
  placeId?: string
  streetSegment?: string
}

export interface TrafficData {
  timestamp: number
  bounds: { northeast: ICoordinates; southwest: ICoordinates }
  congestionLevels: CongestionLevel[]
}

export interface CongestionLevel {
  polyline: string
  level: 'UNKNOWN' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'SEVERE'
  speed?: number
}

export interface StreetViewData {
  panoramaId: string
  location: ICoordinates
  tiles: { baseUrl: string; tileSize: { width: number; height: number } }
  copyright: string
  links: { heading: number; description: string; panoId: string }[]
  date?: string
}

export interface ElevationData {
  results: { location: ICoordinates; elevation: number; resolution: number }[]
}

export interface TimezoneData {
  dstOffset: number
  rawOffset: number
  timeZoneId: string
  timeZoneName: string
}

export interface GeofenceData {
  center: ICoordinates
  radius: number
  polygon: ICoordinates[]
  isInside: (point: ICoordinates) => boolean
}

export interface IMobilityProvider {
  readonly name: string

  calculateRoute(
    origin: ICoordinates | string,
    destination: ICoordinates | string,
    options?: RouteOptions
  ): Promise<RouteInfo>

  getETA(
    origin: ICoordinates | string,
    destination: ICoordinates | string
  ): Promise<number>

  searchPlaces(
    query: string,
    location?: ICoordinates,
    options?: { radius?: number; type?: string; language?: string }
  ): Promise<Place[]>

  reverseGeocode(coord: ICoordinates): Promise<string>

  getAddressPreview(coord: ICoordinates): Promise<AddressPreview>

  getDistanceMatrix(
    origins: (ICoordinates | string)[],
    destinations: (ICoordinates | string)[],
    options?: { trafficModel?: string; departureTime?: Date }
  ): Promise<DistanceMatrix>

  snapToRoad(points: ICoordinates[]): Promise<SnappedPoint[]>

  getTrafficLayer(bounds: { northeast: ICoordinates; southwest: ICoordinates }): Promise<TrafficData>

  getStreetView(coord: ICoordinates): Promise<StreetViewData>

  getElevation(path: ICoordinates[]): Promise<ElevationData>

  getTimezone(coord: ICoordinates): Promise<TimezoneData>

  getGeofence(center: ICoordinates, radius: number): Promise<GeofenceData>
}

export interface RouteOptions {
  alternatives?: boolean
  trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
  departureTime?: Date
  avoid?: ('tolls' | 'highways' | 'ferries' | 'indoor')[]
  unitSystem?: 'metric' | 'imperial'
  language?: string
  region?: string
}

export enum ProviderType {
  GOOGLE = 'google',
  MAPBOX = 'mapbox',
  HERE = 'here',
  TOMTOM = 'tomtom',
  OSM = 'openstreetmap',
}
`

---
## Google APIs a Integrar

### 1. Maps JavaScript SDK

**Descrição:** SDK JavaScript que renderiza mapas interativos no navegador. Usado no componente map-view para exibir mapas com marcadores, camadas de tráfego, street view e controles de navegação.

**Tipo:** SDK client-side (biblioteca JavaScript)

**Parâmetros principais:**
- key (string) — API key
- libraries (string[]) — bibliotecas adicionais: places, directions, geometry, drawing, 	raffic, street-view
- egion (string) — código de região (ex: BR)
- language (string) — idioma (ex: pt-BR)

**Exemplo de uso no Mobility Engine:**
`	ypescript
await GoogleMapsLoader.load({
  key: await getApiKey(),
  libraries: ['places', 'directions', 'geometry', 'traffic', 'street-view'],
  language: 'pt-BR',
  region: 'BR',
})

const map = new google.maps.Map(element, {
  center: { lat: -23.5505, lng: -46.6333 },
  zoom: 14,
  styles: darkMapStyles,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
})
`

**Tratamento de erro:**
- Falha no carregamento do script: onerror no elemento script — tentar recarregar com backoff
- SDK carregado mas API key inválida: google.maps.event.addListenerOnce(map, 'error', handler)

**Rate limits:** Baseado no plano: 28.000 carregamentos/mês na camada gratuita. Cada carregamento de página conta como 1 requisição.

**Cache strategy:** SDK é carregado uma vez e reutilizado (singleton). Não recarregar em navegação SPA.

**Cost considerations:**  por 1.000 carregamentos (média/ano, planos Premium). Cada carregamento = 1 sessão de mapa. Otimizar com carregamento sob demanda (lazy load).

---

### 2. Places API

**Descrição:** Autocomplete e detalhamento de lugares. Usado no location-autocomplete para sugerir endereços e no map-picker para buscar locais próximos ao pin.

**Endpoint REST:**
`
POST https://places.googleapis.com/v1/places:autocomplete
GET  https://places.googleapis.com/v1/places/{placeId}
`

**Parâmetros principais:**
- input (string) — texto da busca
- locationBias (object) — viés de localização ({ circle: { center, radius } })
- language (string) — idioma
- egion (string) — região
- 	ypes (string[]) — filtrar tipos (address, locality, establishment, etc.)

**Exemplo de uso no Mobility Engine:**
`	ypescript
async searchPlaces(query: string, location?: ICoordinates): Promise<Place[]> {
  const sessionToken = this.generateSessionToken()
  const response = await fetch(
    'https://places.googleapis.com/v1/places:autocomplete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
      },
      body: JSON.stringify({
        input: query,
        locationBias: location ? {
          circle: { center: { latitude: location.lat, longitude: location.lng }, radius: 50000 },
        } : undefined,
        language: 'pt-BR',
        region: 'BR',
      }),
    }
  )

  if (!response.ok) {
    this.handleError(response)
    return []
  }

  const data = await response.json()
  const placeIds = data.suggestions
    .filter((s: any) => s.placePrediction)
    .map((s: any) => s.placePrediction.placeId)

  const places = await Promise.all(
    placeIds.map((id: string) => this.getPlaceDetails(id, sessionToken))
  )

  return places.filter(Boolean) as Place[]
}
`

**Tratamento de erro:**
- 400 INVALID_REQUEST: request mal formatado — logar e retornar vazio
- 404 NOT_FOUND: place ID inválido — retornar null
- 403 REQUEST_DENIED: chave inválida — alertar admin e fallback para Mapbox
- 429 OVER_QUERY_LIMIT: rate limit — exponencial backoff, depois fallback
- 503 Service Unavailable: retry com backoff

**Rate limits:**
- Autocomplete: até 10.000 requisições/dia (gratuito)
- Place Details: até 10.000 requisições/dia (gratuito)
- Request adicional: .83–.00 por 1.000 (depende do SKU)

**Cache strategy:**
- Resultados de autocomplete: TTL 60 segundos (endereços podem mudar, mas viés local é estável)
- Place Details: TTL 24 horas (dados não mudam com frequência)
- Cache em MapCache com chave = places:{query}:{location?.lat}:{location?.lng}

**Cost considerations:**
- Usar session tokens agrupa múltiplas requisições (autocomplete + details) como uma única requisição faturada
- Debounce de 300ms no campo de busca reduz chamadas desnecessárias
- Cache de resultados recentes evita refetch

---

### 3. Directions API

**Descrição:** Calcula rotas entre origem e destino com instruções passo a passo. Usado no cálculo de rotas para motoristas e na exibição do caminho no mapa.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/directions/json
`

**Parâmetros principais:**
- origin (string|lat,lng) — origem
- destination (string|lat,lng) — destino
- waypoints (string[]) — waypoints intermediários (máx. 25)
- lternatives (boolean) — se deve retornar rotas alternativas
- 	raffic_model (string) — est_guess, pessimistic, optimistic
- departure_time (string) — timestamp (now = traffic-aware)
- void (string) — 	olls|highways|ferries|indoor
- language (string) — idioma
- egion (string) — região
- units (string) — metric|imperial

**Exemplo de uso no Mobility Engine:**
`	ypescript
async calculateRoute(
  origin: ICoordinates | string,
  destination: ICoordinates | string,
  options?: RouteOptions
): Promise<RouteInfo> {
  const originStr = typeof origin === 'string' ? origin : ${origin.lat},
  const destStr = typeof destination === 'string' ? destination : ${destination.lat},

  const params = new URLSearchParams({
    origin: originStr,
    destination: destStr,
    key: this.apiKey,
    language: 'pt-BR',
    region: 'BR',
    units: 'metric',
    alternatives: options?.alternatives ? 'true' : 'false',
    departure_time: options?.departureTime
      ? String(Math.floor(options.departureTime.getTime() / 1000))
      : 'now',
  })

  if (options?.trafficModel) params.set('traffic_model', options.trafficModel)
  if (options?.avoid) params.set('avoid', options.avoid.join('|'))

  const response = await fetch(
    https://maps.googleapis.com/maps/api/directions/json?
  )

  if (!response.ok) {
    this.handleError(response)
    throw new Error(Directions API error: )
  }

  const data = await response.json()

  if (data.status === 'ZERO_RESULTS') {
    return null as any
  }

  if (data.status !== 'OK') {
    this.handleDirectionsStatus(data.status)
    throw new Error(Directions API: )
  }

  return this.parseDirectionResponse(data)
}
`

**Tratamento de erro:**
- ZERO_RESULTS: retornar null (sem rota possível)
- OVER_QUERY_LIMIT: backoff + fallback Mapbox
- REQUEST_DENIED: alertar admin
- INVALID_REQUEST: logar e retornar erro
- UNKNOWN_ERROR: retry 3x com backoff

**Rate limits:** 2.500 requisições/dia (gratuito) | .00 por 1.000 requisições (Premium)

**Cache strategy:**
- TTL 5 minutos para mesmo origin + destination + modo de viagem
- Se lternatives: true, cachear cada alternativa separadamente
- Não cachear rotas com departure_time: now (tráfego em tempo real)
- Cache key: directions:{originStr}:{destStr}:{optionsHash}

**Cost considerations:**
- Routes API é mais barata e mais precisa — preferir Routes API sobre Directions
- Cache agressivo de rotas sem tráfego
- Agrupar waypoints (máx. 25) em uma única requisição

---

### 4. Distance Matrix API

**Descrição:** Calcula distâncias e ETAs entre múltiplas origens e destinos. Usado no dispatch para calcular ETA de todos os motoristas disponíveis para uma corrida.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/distancematrix/json
`

**Parâmetros principais:**
- origins (string[]) — lista de origens (máx. 25)
- destinations (string[]) — lista de destinos (máx. 25)
- 	raffic_model (string) — est_guess, pessimistic, optimistic
- departure_time (string) — 
ow para tráfego em tempo real
- language (string), egion (string), units (string), void (string)

**Exemplo:**
`	ypescript
async getDistanceMatrix(
  origins: (ICoordinates | string)[],
  destinations: (ICoordinates | string)[],
  options?: { trafficModel?: string; departureTime?: Date }
): Promise<DistanceMatrix> {
  const originStrs = origins.map(o =>
    typeof o === 'string' ? o : ${o.lat},
  )
  const destStrs = destinations.map(d =>
    typeof d === 'string' ? d : ${d.lat},
  )

  if (originStrs.length > 25 || destStrs.length > 25) {
    throw new Error('Distance Matrix max 25 origins x 25 destinations')
  }

  const params = new URLSearchParams({
    origins: originStrs.join('|'),
    destinations: destStrs.join('|'),
    key: this.apiKey,
    language: 'pt-BR',
    region: 'BR',
    units: 'metric',
    departure_time: 'now',
  })

  if (options?.trafficModel) params.set('traffic_model', options.trafficModel)
  if (options?.departureTime) {
    params.set('departure_time', String(Math.floor(options.departureTime.getTime() / 1000)))
  }

  const response = await fetch(
    https://maps.googleapis.com/maps/api/distancematrix/json?
  )

  if (!response.ok) throw new Error(Distance Matrix error: )
  const data = await response.json()
  if (data.status !== 'OK') throw new Error(Distance Matrix: )

  return data as DistanceMatrix
}
`

**Tratamento de erro:**
- OVER_QUERY_LIMIT: reduzir batch size e tentar novamente
- MAX_ELEMENTS_EXCEEDED: reduzir número de origens/destinos (max 625 elements)
- ZERO_RESULTS: elemento individual com status ZERO_RESULTS

**Rate limits:** 2.500 requisições/dia (gratuito) | .00 por 1.000 requisições

**Cache strategy:**
- TTL 2 minutos (ETAs mudam com tráfego)
- Não cachear requisições com departure_time: now
- Cache key: distmatrix:{origins.join(',')}:{destinations.join(',')}:{trafficModel || ''}

**Cost considerations:**
- Uma requisição com 25x25 destinos = 625 elementos, mas conta como 1 requisição
- Agrupar sempre o máximo possível para otimizar custo
- Considerar lógica de cluster: calcular distância aproximada por geofence, depois Distance Matrix refinado

---

### 5. Geocoding API

**Descrição:** Converte endereço textual em coordenadas geográficas.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/geocode/json
`

**Parâmetros:** ddress, components, language, egion, ounds

**Exemplo:**
`	ypescript
async geocode(address: string): Promise<ICoordinates | null> {
  const params = new URLSearchParams({
    address,
    key: this.apiKey,
    language: 'pt-BR',
    region: 'BR',
  })
  const res = await fetch(https://maps.googleapis.com/maps/api/geocode/json?)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results.length) return null
  return data.results[0].geometry.location
}
`

**Tratamento de erro:** retornar null se ZERO_RESULTS; backoff se OVER_QUERY_LIMIT.

**Rate limits:** 2.500/dia (gratuito); .00/1.000 (Premium).

**Cache:** TTL 7 dias (endereços raramente mudam). Chave = geocode:{addressNormalized}.

---

### 6. Reverse Geocoding API

**Descrição:** Converte coordenadas em endereço legível. Usado no map-picker quando o usuário solta o pin.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}
`

**Parâmetros:** latlng, language, esult_type

**Exemplo:**
`	ypescript
async reverseGeocode(coord: ICoordinates): Promise<string> {
  const cacheKey = everse:,
  const cached = this.cache.get<string>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    latlng: ${coord.lat},,
    key: this.apiKey,
    language: 'pt-BR',
    result_type: 'street_address|route|locality',
  })
  const res = await fetch(https://maps.googleapis.com/maps/api/geocode/json?)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results.length) return 'Endereco nao encontrado'

  const address = data.results[0].formatted_address
  this.cache.set(cacheKey, address, 300_000)
  return address
}
`

**Tratamento de erro:** retornar fallback string "Endereco nao encontrado".

**Rate limits:** mesmo que Geocoding (compartilha quota).

**Cache:** TTL 5 minutos.

---

### 7. Routes API (Preferred)

**Descrição:** API mais moderna e precisa que a Directions API. Suporta computação avançada de rotas com mais parâmetros e melhor precisão de tráfego. Deve ser usada como preferência sobre Directions.

**Endpoint REST:**
`
POST https://routes.googleapis.com/directions/v2:computeRoutes
`

**Parâmetros principais:**
- origin (object) — { location: { latLng: { latitude, longitude } } }
- destination (object) — { location: { latLng: { latitude, longitude } } }
- intermediates (object[]) — waypoints
- 	ravelMode (string) — DRIVE, WALK, BICYCLE, TRANSIT
- outingPreference (string) — TRAFFIC_AWARE ou TRAFFIC_UNAWARE
- departureTime (string) — timestamp
- computeAlternativeRoutes (boolean)
- outeModifiers (object) — { avoidTolls, avoidHighways, avoidFerries }
- ieldMask (string) — controle granular dos campos retornados

**Exemplo:**
`	ypescript
async calculateRouteWithRoutesAPI(
  origin: ICoordinates,
  destination: ICoordinates,
  options?: RouteOptions
): Promise<RouteInfo> {
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    departureTime: new Date().toISOString(),
    computeAlternativeRoutes: options?.alternatives ?? false,
    routeModifiers: {
      avoidTolls: options?.avoid?.includes('tolls') ?? false,
      avoidHighways: options?.avoid?.includes('highways') ?? false,
      avoidFerries: options?.avoid?.includes('ferries') ?? false,
    },
    language: 'pt-BR',
    units: 'METRIC',
    region: 'BR',
  }

  const response = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline,routes.legs,routes.description',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) throw new Error(Routes API error: )
  const data = await response.json()
  return this.parseRoutesAPIResponse(data)
}
`

**Tratamento de erro:**
- OVER_LIMIT: retry com backoff
- INVALID_ARGUMENT: logar request body (erro de validação)
- NOT_FOUND: rota não encontrada
- PERMISSION_DENIED: API key sem permissão

**Rate limits:** .00–.00 por 1.000 requisições. Sem camada gratuita (requer ativação de faturamento).

**Cache strategy:**
- Cache apenas para rotas TRAFFIC_UNAWARE (TTL 10 min)
- Rotas TRAFFIC_AWARE não devem ser cacheadas (dados em tempo real)

**Cost considerations:**
- Mais caro que Directions API, mas mais preciso e com menos requisições (field mask reduz payload)
- Usar TRAFFIC_UNAWARE para simulações e pré-visualizações (mais barato)
- Field mask reduz tamanho da resposta e custo (cobrado por campo retornado)

---
### 8. Street View

**Descrição:** Imagens panorâmicas de ruas. Usado para exibir visualização do local de embarque para o motorista e do destino para o passageiro.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lng}
GET https://maps.googleapis.com/maps/api/streetview?location={lat},{lng}&size={width}x{height}
`

**Parâmetros:** location, size, heading, pitch, ov, adius, source

**Exemplo:**
`	ypescript
async getStreetView(coord: ICoordinates): Promise<StreetViewData> {
  const params = new URLSearchParams({
    location: ${coord.lat},,
    radius: '50',
    source: 'outdoor',
    key: this.apiKey,
  })

  const metaRes = await fetch(
    https://maps.googleapis.com/maps/api/streetview/metadata?
  )
  const metaData = await metaRes.json()

  if (metaData.status !== 'OK') {
    throw new Error('Street View not available at location')
  }

  return {
    panoramaId: metaData.pano_id,
    location: { lat: metaData.location.lat, lng: metaData.location.lng },
    tiles: {
      baseUrl: https://maps.googleapis.com/maps/api/streetview?location=,&key=,
      tileSize: { width: 640, height: 480 },
    },
    copyright: metaData.copyright || '',
    links: [],
    date: metaData.date,
  }
}
`

**Tratamento de erro:**
- ZERO_RESULTS: street view não disponível — retornar null (UI mostra fallback)
- NOT_FOUND: sem imagem no raio especificado
- OVER_QUERY_LIMIT: backoff

**Rate limits:** .00 por 1.000 imagens (Standard). Metadata: .00 por 1.000.

**Cache strategy:**
- Cache de URLs de imagens por 1 hora (TTL 3.600.000ms)
- Cache de metadata (se panorama existe) por 24 horas
- Cache key: streetview:{coord.lat},{coord.lng}

**Cost considerations:**
- Sempre verificar metadata antes de buscar a imagem (evita custo de imagem sem retorno)
- Cache agressivo: motoristas buscando a mesma localização em curto intervalo
- Usar tamanhos menores de imagem em listas/thumbnails (320x240)

---

### 9. Traffic Layer

**Descrição:** Camada de tráfego em tempo real sobre o mapa. Usado para visualização de congestionamento e ajuste de rotas.

**Tipo:** SDK client-side (biblioteca 	raffic do Maps JS SDK)

**Exemplo:**
`	ypescript
const trafficLayer = new google.maps.TrafficLayer()
trafficLayer.setMap(this.map)

trafficLayer.setOptions({
  autoRefresh: true,
  refreshInterval: 120_000,
})
`

**Tratamento de erro:**
- SDK não carregado: aguardar carregamento e tentar novamente
- Provider sem suporte a traffic layer (Mapbox): fallback para overlay customizado

**Rate limits:** Não aplicável (SDK client-side). Custo incluso no carregamento do SDK.

**Cache strategy:**
- Não cachear (dados em tempo real)
- Refresh automático a cada 2 minutos via utoRefresh
- Se o usuário não estiver interagindo, pausar refresh (economia de CPU)

**Cost considerations:**
- Custo incluso na sessão do Maps SDK
- Reduzir refresh rate para 5 minutos quando app estiver em background

---

### 10. Roads API

**Descrição:** Corrige pontos GPS ruidosos ajustando-os às estradas mais próximas (snap to road). Usado durante corridas ativas para rastrear a rota real do motorista.

**Endpoint REST:**
`
POST https://roads.googleapis.com/v1/snapToRoads
`

**Parâmetros:** path (max 100 pontos), interpolate, placeId

**Exemplo:**
`	ypescript
async snapToRoad(points: ICoordinates[]): Promise<SnappedPoint[]> {
  if (points.length > 100) {
    const batches = []
    for (let i = 0; i < points.length; i += 100) {
      batches.push(points.slice(i, i + 100))
    }
    const results = await Promise.all(batches.map(b => this.snapToRoad(b)))
    return results.flat()
  }

  const pathStr = points.map(p => ${p.lat},).join('|')
  const params = new URLSearchParams({
    path: pathStr,
    interpolate: 'true',
    key: this.apiKey,
  })

  const response = await fetch(
    https://roads.googleapis.com/v1/snapToRoads?
  )

  if (!response.ok) throw new Error(Roads API error: )
  const data = await response.json()

  return (data.snappedPoints || []).map((sp: any) => ({
    originalIndex: sp.originalIndex,
    location: { lat: sp.location.latitude, lng: sp.location.longitude },
    originalLocation: points[sp.originalIndex],
    snapped: true,
    placeId: sp.placeId,
  }))
}
`

**Tratamento de erro:**
- INVALID_ARGUMENT: path vazio ou mal formatado
- OVER_QUERY_LIMIT: backoff
- NOT_FOUND: pontos não encontrados nas estradas

**Rate limits:** 10.000 requisições/dia (gratuito) | .00 por 1.000 requisições (Premium)

**Cache strategy:**
- Não cachear (dados de GPS em tempo real, único por trip)
- Armazenar snapped polyline no banco para replay de trip (persistente, não cache)

**Cost considerations:**
- Só chamar durante trips ativas (não chamar em background/idle)
- Batch de 100 pontos por requisição (maximiza eficiência)
- Interpolar pontos reduz ruído sem chamar API adicional

---

### 11. Elevation API

**Descrição:** Retorna dados de elevação para coordenadas. Usado em rotas de frete para calcular variação de altitude e impacto no consumo de combustível.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/elevation/json
`

**Parâmetros:** locations (max 512), path, samples

**Exemplo:**
`	ypescript
async getElevation(path: ICoordinates[]): Promise<ElevationData> {
  const locationsStr = path.map(p => ${p.lat},).join('|')
  const params = new URLSearchParams({
    locations: locationsStr,
    key: this.apiKey,
  })

  const response = await fetch(
    https://maps.googleapis.com/maps/api/elevation/json?
  )

  if (!response.ok) throw new Error(Elevation API error: )
  const data = await response.json()
  if (data.status !== 'OK') throw new Error(Elevation: )

  return {
    results: data.results.map((r: any) => ({
      location: { lat: r.location.lat, lng: r.location.lng },
      elevation: r.elevation,
      resolution: r.resolution,
    })),
  }
}
`

**Tratamento de erro:**
- INVALID_REQUEST: parâmetros inválidos
- OVER_QUERY_LIMIT: backoff
- DATA_NOT_AVAILABLE: dados não disponíveis para coordenadas oceânicas (retornar 0)

**Rate limits:** 2.500 requisições/dia (gratuito) | .00 por 1.000 requisições (Premium)

**Cache strategy:** TTL 30 dias (elevação não muda). Cache key: elevation:{locations hash}.

**Cost considerations:** Usar apenas para rotas de frete. Cache de longa duração. Amostrar a cada 500m.

---

### 12. Timezone API

**Descrição:** Retorna fuso horário para coordenadas. Usado para exibir horários corretos em localizações de pickup/dropoff e calcular ETA considerando mudanças de fuso.

**Endpoint REST:**
`
GET https://maps.googleapis.com/maps/api/timezone/json
`

**Parâmetros:** location, 	imestamp

**Exemplo:**
`	ypescript
async getTimezone(coord: ICoordinates): Promise<TimezoneData> {
  const params = new URLSearchParams({
    location: ${coord.lat},,
    timestamp: String(Math.floor(Date.now() / 1000)),
    key: this.apiKey,
  })

  const response = await fetch(
    https://maps.googleapis.com/maps/api/timezone/json?
  )

  if (!response.ok) throw new Error(Timezone API error: )
  const data = await response.json()
  if (data.status !== 'OK') throw new Error(Timezone: )

  return {
    dstOffset: data.dstOffset,
    rawOffset: data.rawOffset,
    timeZoneId: data.timeZoneId,
    timeZoneName: data.timeZoneName,
  }
}
`

**Tratamento de erro:** INVALID_REQUEST, OVER_QUERY_LIMIT, ZERO_RESULTS.

**Rate limits:** 2.500 requisições/dia (gratuito) | .00 por 1.000 requisições (Premium)

**Cache strategy:** TTL 24 horas. Cache key: 	imezone:{coord.lat},{coord.lng}.

**Cost considerations:** Chamada barata — cache agressivo por cidade.

---

### 13. Geolocation API

**Descrição:** Estima localização do dispositivo usando WiFi e torres de celular. Usado como fallback quando GPS não está disponível.

**Endpoint REST:**
`
POST https://www.googleapis.com/geolocation/v1/geolocate
`

**Parâmetros:** homeMobileCountryCode, homeMobileNetworkCode, adioType, cellTowers, wifiAccessPoints, considerIp

**Exemplo:**
`	ypescript
async geolocate(): Promise<ICoordinates> {
  const response = await fetch(
    https://www.googleapis.com/geolocation/v1/geolocate?key=,
    { method: 'POST', body: '{}' }
  )

  if (!response.ok) throw new Error(Geolocation error: )
  const data = await response.json()
  return { lat: data.location.lat, lng: data.location.lng }
}
`

**Tratamento de erro:** 404 (não encontrado), OVER_QUERY_LIMIT, PERMISSION_DENIED.

**Rate limits:** 2.500 requisições/dia (gratuito) | .00 por 1.000 requisições (Premium)

**Cache strategy:** Não cachear. Cooldown mínimo de 30s entre requisições.

**Cost considerations:** Usar apenas quando GPS falhar. Considerar considerIp: true.

---

### 14. Maps Embed API

**Descrição:** Gera HTML embutível para mostrar mapas em modais, notificações ou páginas web externas. Usado para compartilhar localização via link.

**Endpoint:**
`
GET https://www.google.com/maps/embed/v1/place?key={key}&q={place}
GET https://www.google.com/maps/embed/v1/directions?key={key}&origin={origin}&destination={dest}
GET https://www.google.com/maps/embed/v1/view?key={key}&center={lat},{lng}&zoom={zoom}
`

**Parâmetros:** q, center, zoom, origin, destination, mode

**Exemplo:**
`	ypescript
generateEmbedUrl(type: 'place' | 'directions' | 'view', params: Record<string, string>): string {
  const baseUrl = 'https://www.google.com/maps/embed/v1'
  const query = new URLSearchParams({ key: this.apiKey, ...params })
  return ${baseUrl}/?
}
`

**Tratamento de erro:** Se a chave não tiver Maps Embed API ativada, o iframe mostra erro.

**Rate limits:** 25.000 carregamentos/dia (gratuito) | Após, .50 por 1.000.

**Cache strategy:** URLs geradas sob demanda, sem cache necessário.

**Cost considerations:** Gratuito até 25.000 carregamentos/dia. Baixo custo após.

---
## Map Component (map-view.tsx)

Componente React principal de exibição de mapas com dark theme, markers, layers e controles.

```tsx
interface MapViewProps {
  initialCenter?: google.maps.LatLngLiteral
  initialZoom?: number
  markers?: MapMarker[]
  onMapClick?: (coord: ICoordinates) => void
  onBoundsChanged?: (bounds: google.maps.LatLngBounds) => void
  showTraffic?: boolean
  showTransit?: boolean
  showHeatmap?: boolean
  heatmapData?: google.maps.LatLng[]
  interactive?: boolean
  className?: string
  style?: React.CSSProperties
}

interface MapMarker {
  id: string
  coordinates: ICoordinates
  label?: string
  icon?: string
  color?: string
  draggable?: boolean
  onClick?: () => void
  onDragEnd?: (coord: ICoordinates) => void
}
```

Características do componente:
- Dark theme por padrão com custom map styles
- Suporte a AdvancedMarkerElement (Google Maps v3.55+)
- Camadas: traffic, transit, heatmap (toggleáveis)
- Controles: zoom, pan, fullscreen, street view, current location
- Eventos: click (sem debounce), bounds_changed (debounce 300ms), zoom_changed (throttle 150ms)
- Performance: canvas renderer, lazy load do SDK
- Restrição de bounds: Brasil (opcional, configurável)

### Dark Map Styles

Tema escuro customizado para o mapa, aplicado via `google.maps.MapOptions.styles`. Cobre estilização de:

- **Geometry**: fundo escuro (#242f3e)
- **Roads**: cinza escuro (#38414e) com labels claros (#9ca5b3)
- **Highways**: tom terroso (#746855) para destaque
- **Water**: azul escuro (#17263c)
- **Parks**: verde escuro (#263c3f)
- **POI labels**: dourado (#d59563)
- **Transit**: cinza azulado (#2f3948)

Implementado como array de `google.maps.MapTypeStyle[]` exportado para reuso.

---

## Map Picker (map-picker.tsx)

Componente de seleção de localização com pin arrastável, busca inline e reverse geocode.

```tsx
interface MapPickerProps {
  initialLocation?: ICoordinates
  onLocationSelected: (location: ICoordinates, address: string) => void
  onClose?: () => void
  title?: string
}
```

Funcionalidades:
- **Draggable pin**: usuário arrasta o pin para a localização desejada
- **Reverse geocode on pin drop**: ao soltar o pin, busca o endereço automaticamente
- **Search places inline**: campo de busca com autocomplete integrado
- **Confirm location button**: botão de confirmação (desabilitado enquanto reverse geocode não completa)
- **Pin shadow overlay**: indicador visual abaixo do pin para precisão
- **Estado de dragging**: evita confirmação enquanto o pin está sendo arrastado

---

## Location Autocomplete (location-autocomplete.tsx)

Componente de autocomplete para endereços com debounce, navegação por teclado e histórico local.

```tsx
interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, place?: Place) => void
  placeholder?: string
  location?: ICoordinates
  radius?: number
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  error?: string
  className?: string
}
```

Funcionalidades:
- **Debounced search (300ms)**: evita chamadas desnecessárias à API enquanto o usuário digita
- **Google Places predictions**: busca lugares via Places API (nova API, não a antiga)
- **Recent searches (localStorage)**: armazena até 10 lugares recentes
- **Keyboard navigation**: ArrowUp, ArrowDown, Enter, Escape
- **Scroll into view**: quando navegando por teclado, o item ativo é sempre visível
- **Custom styling (dark theme)**: integrado com o tema escuro do app
- **Minimum 3 characters**: só dispara busca após 3 caracteres (mostra recentes abaixo)
- **Loading indicator**: spinner durante a busca
- **Blur handling**: fecha a lista com 200ms de delay para permitir clique

---

## Traffic-Aware Routing

Roteamento consciente de tráfego em três camadas:

### 1. Cálculo inicial da rota
- Usa `calculateRoute` com `trafficModel: 'best_guess'` e `departureTime: now`
- Retorna até 3 alternativas de rota
- Ordena alternativas por duração no tráfego (menor primeiro)

### 2. Monitoramento de tráfego em rota ativa
- Durante uma trip ativa, monitorar mudanças significativas de tráfego a cada 2 minutos
- Se o ETA aumentar mais de 20% em relação ao original, dispara evento de sugestão de rerrota
- O `TrafficMonitor` class gerencia o intervalo e eventos
- Não interrompe a trip em caso de erro (silent fail)

### 3. Visualização de tráfego no mapa
- `google.maps.TrafficLayer` com autoRefresh a cada 2 minutos
- Cores padrão do Google: verde (livre), amarelo (moderado), laranja (intenso), vermelho (congestionado)
- Refresh pausado quando app em background
- Fallback sem tráfego: mostrar ETA sem tráfego com indicador visual

---

## Road Matching (snap to road)

Snap de pontos GPS para estradas durante corridas ativas.

### Quando ativar
- Só chamar `snapToRoad` durante trips com status `IN_PROGRESS`
- Frequência: a cada 10 segundos (ou a cada 100 pontos acumulados)
- Parar quando a trip for encerrada

### GpsTracker class
- `watchPosition` com `enableHighAccuracy: true`
- Acumula pontos raw, envia em batch de 100 para snap
- Armazena snapped polyline no backend para replay de trip
- Fallback: se snap falhar, armazena pontos raw

### Encoded polyline
- Usar Google Polyline Algorithm para armazenamento eficiente
- Codifica diferenças de latitude/longitude em 5 casas decimais
- Reduz tamanho de armazenamento em ~70% comparado a JSON

---

## Error Handling

### Matriz de tratamento de erros

| Código | Status | Causa | Ação |
|--------|--------|-------|------|
| QUOTA_EXCEEDED | 403 | Quota diária excedida | Fallback para MapboxProvider, alertar admin |
| REQUEST_DENIED | 403 | API key inválida | Alertar admin, fallback Mapbox |
| OVER_QUERY_LIMIT | 429 | Muitas requisições/s | Exponential backoff (1s, 2s, 4s, 8s) |
| NOT_FOUND | 404 | Recurso não encontrado | Retornar null (UI mostra estado vazio) |
| ZERO_RESULTS | 200 | Nenhum resultado | Retornar array vazio / null |
| INVALID_REQUEST | 400 | Parâmetros inválidos | Logar detalhes, não retentar |
| MAX_ELEMENTS_EXCEEDED | 400 | Muitos elementos | Reduzir batch size e retentar |
| SERVICE_UNAVAILABLE | 503 | Serviço indisponível | Retry 3x com backoff, depois fallback |
| Network error | — | Sem conexão | Retry 3x com backoff, depois erro |
| Timeout | — | Requisição lenta | Abortar após 10s, retentar |

### Exponential Backoff

```typescript
async function executeWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      if (attempt === maxRetries) break
      // Don't retry on 400, 403, 404
      if (err instanceof GoogleAPIError && [400, 403, 404].includes(err.status)) throw err
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

### Fallback Provider Chain

```typescript
const FALLBACK_CHAIN: ProviderType[] = [
  ProviderType.GOOGLE,
  ProviderType.MAPBOX,
  ProviderType.HERE,
  ProviderType.TOMTOM,
  ProviderType.OSM,
]

async function withProviderFallback<T>(
  fnName: string,
  fn: (provider: IMobilityProvider) => Promise<T>
): Promise<T> {
  const engine = getMobilityEngine()
  let lastError: Error | null = null

  for (const providerType of FALLBACK_CHAIN) {
    try {
      engine.setProvider(providerType)
      return await fn(engine.provider)
    } catch (err) {
      lastError = err as Error
      if (err instanceof GoogleAPIError && err.name !== 'QuotaExceededError') throw err
      console.warn(`Provider ${providerType} failed:`, err)
    }
  }

  throw new Error(`All providers failed for ${fnName}: ${lastError?.message}`)
}
```

### GoogleAPIError class

```typescript
class GoogleAPIError extends Error {
  status: number
  statusText: string
  body: string

  constructor(status: number, statusText: string, body: string) {
    super(`Google API Error ${status}: ${statusText} - ${body}`)
    this.name = 'GoogleAPIError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}
```

---

## Performance & Cost Optimization

### Cache Strategy Summary

| API | TTL | Chave | Motivo |
|-----|-----|-------|--------|
| Directions (no traffic) | 5 min | directions:{origin}:{dest}:{options} | Rotas sem tráfego são estáveis |
| Directions (traffic) | 0 (no cache) | — | Dados em tempo real |
| Routes API (TRAFFIC_UNAWARE) | 10 min | routes:{origin}:{dest} | Sem tráfego, cacheável |
| Routes API (TRAFFIC_AWARE) | 0 (no cache) | — | Dados em tempo real |
| Distance Matrix | 2 min | distmatrix:{origins}:{destinations} | ETAs mudam, mas cache curto ajuda |
| Geocoding | 7 dias | geocode:{address} | Endereços raramente mudam |
| Reverse Geocoding | 5 min | reverse:{lat},{lng} | Pode haver mudanças |
| Place Autocomplete | 60 s | places:{query}:{location} | Resultados frescos |
| Place Details | 24 h | place:{id} | Dados estáveis |
| Street View | 1 h | streetview:{lat},{lng} | Imagens mudam raramente |
| Street View Metadata | 24 h | streetview:meta:{lat},{lng} | Panorama ID não muda |
| Elevation | 30 dias | elevation:{locations} | Elevação nunca muda |
| Timezone | 24 h | timezone:{lat},{lng} | Fuso é estável |

### Rate Limiting

```typescript
interface RateLimiterOptions {
  maxRequestsPerSecond: number  // default 50
  maxRequestsPerDay: number     // default 2500
}

export class RateLimiter {
  private timestamps: number[] = []
  private dailyCounter: number = 0
  private dailyResetTime: number
  private options: RateLimiterOptions

  constructor(options: RateLimiterOptions) {
    this.options = options
    this.dailyResetTime = this.getNextMidnight()
    this.loadDailyCounter()
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => now - t < 1000)

    if (this.timestamps.length >= this.options.maxRequestsPerSecond) {
      const oldest = this.timestamps[0]
      const waitTime = 1000 - (now - oldest) + 50
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.resetDailyIfNeeded()
    if (this.dailyCounter >= this.options.maxRequestsPerDay) {
      throw Object.assign(new Error('Daily quota exceeded'), { name: 'QuotaExceededError' })
    }

    this.timestamps.push(Date.now())
    this.dailyCounter++
    this.saveDailyCounter()
  }

  private resetDailyIfNeeded(): void {
    if (Date.now() > this.dailyResetTime) {
      this.dailyCounter = 0
      this.dailyResetTime = this.getNextMidnight()
    }
  }

  private getNextMidnight(): number {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 0, 0, 0)
    return midnight.getTime()
  }

  private loadDailyCounter(): void {
    try {
      const stored = localStorage.getItem('google_maps_daily_quota')
      if (stored) {
        const { date, count } = JSON.parse(stored)
        if (date === new Date().toDateString()) this.dailyCounter = count
      }
    } catch {}
  }

  private saveDailyCounter(): void {
    try {
      localStorage.setItem('google_maps_daily_quota', JSON.stringify({
        date: new Date().toDateString(),
        count: this.dailyCounter,
      }))
    } catch {}
  }
}
```

### Cost-Saving Measures

1. **Prefer Routes API sobre Directions API** — field mask reduz payload e custo
2. **Session tokens no Places API** — agrupa autocomplete + details em uma única cobrança
3. **Batch Distance Matrix** — 25x25 destinos por requisição em vez de várias individuais
4. **Cache agressivo** — reduz chamadas repetidas em até 70%
5. **Limit requests per session** — controle no client-side:

```typescript
const SessionQuota = {
  maxGeocodePerSession: 20,
  maxDirectionsPerSession: 30,
  maxPlacesPerSession: 50,
  maxStreetViewPerSession: 10,
  maxElevationPerSession: 5,
}
```

6. **Lazy load do Maps SDK** — carregar apenas quando o componente de mapa for montado
7. **Desligar traffic layer em background** — quando app minimizado, pausar refresh
8. **Debounce de eventos** — 300ms para bounds_changed, 150ms para zoom_changed
9. **Canvas renderer** — usar `google.maps.RenderingType.CANVAS` para performance em dispositivos lentos
10. **Monitoramento de custos** — log de cada requisição com custo estimado enviado ao backend

### Session Tracker

```typescript
class SessionTracker {
  private counts: Record<string, number> = {}
  private sessionId: string

  constructor() {
    this.sessionId = `session_${Date.now()}`
    this.loadFromStorage()
  }

  canMakeRequest(type: string): boolean {
    const key = `max${type}PerSession` as keyof typeof SessionQuota
    const max = SessionQuota[key]
    return max ? (this.counts[type] || 0) < max : true
  }

  recordRequest(type: string): void {
    this.counts[type] = (this.counts[type] || 0) + 1
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('txapp_session_quota')
      if (stored) {
        const { id, counts } = JSON.parse(stored)
        if (id === this.sessionId) this.counts = counts
      }
    } catch {}
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('txapp_session_quota', JSON.stringify({
        id: this.sessionId, counts: this.counts,
      }))
    } catch {}
  }
}
```

### Cost Monitor

```typescript
interface CostLogEntry {
  timestamp: number
  api: string
  method: string
  provider: string
  estimatedCost: number
  duration: number
  success: boolean
}

class CostMonitor {
  private log: CostLogEntry[] = []
  private maxEntries = 10000

  logRequest(entry: Omit<CostLogEntry, 'timestamp'>): void {
    this.log.push({ ...entry, timestamp: Date.now() })
    if (this.log.length > this.maxEntries) this.log.shift()
    this.flushIfNeeded()
  }

  private flushIfNeeded(): void {
    if (this.log.length >= 100) this.flush()
  }

  flush(): void {
    const batch = this.log.splice(0, this.log.length)
    navigator.sendBeacon('/api/analytics/maps-cost', JSON.stringify(batch))
  }

  getSessionCost(): number {
    return this.log.reduce((sum, entry) => sum + entry.estimatedCost, 0)
  }
}
```

---

## Provider Configuration

```typescript
export interface ProviderConfig {
  google: {
    enabled: boolean
    apiKeyEndpoint: string
    preferred: boolean
    libraries: string[]
    options: { language: string; region: string }
    rateLimits: { maxPerSecond: number; maxPerDay: number }
  }
  mapbox: {
    enabled: boolean
    apiKeyEndpoint: string
    preferred: boolean
    options: { language: string; country: string }
    rateLimits: { maxPerSecond: number; maxPerDay: number }
  }
  fallbackStrategy: 'instant' | 'on-failure' | 'manual'
  cache: {
    enabled: boolean
    defaultTTL: number
    maxSize: number
    cleanupInterval: number
  }
  costControl: {
    enabled: boolean
    maxDailyBudget: number
    maxPerSession: { geocode: number; directions: number; places: number; streetview: number; elevation: number }
    logToAnalytics: boolean
  }
}

export const defaultConfig: ProviderConfig = {
  google: {
    enabled: true,
    apiKeyEndpoint: '/api/config/maps-key',
    preferred: true,
    libraries: ['places', 'directions', 'geometry', 'traffic', 'street-view', 'marker'],
    options: { language: 'pt-BR', region: 'BR' },
    rateLimits: { maxPerSecond: 50, maxPerDay: 2500 },
  },
  mapbox: {
    enabled: true,
    apiKeyEndpoint: '/api/config/mapbox-key',
    preferred: false,
    options: { language: 'pt-BR', country: 'BR' },
    rateLimits: { maxPerSecond: 50, maxPerDay: 5000 },
  },
  fallbackStrategy: 'on-failure',
  cache: { enabled: true, defaultTTL: 300_000, maxSize: 500, cleanupInterval: 60_000 },
  costControl: {
    enabled: true, maxDailyBudget: 10.00,
    maxPerSession: { geocode: 20, directions: 30, places: 50, streetview: 10, elevation: 5 },
    logToAnalytics: true,
  },
}
```

---

## Testes

### Testes unitários do Mobility Engine

```typescript
describe('MobilityEngine', () => {
  let engine: MobilityEngine

  beforeEach(() => {
    engine = new MobilityEngine(async () => 'test-key')
    jest.useFakeTimers()
  })

  afterEach(() => {
    engine.clearCache()
    jest.useRealTimers()
  })

  test('should cache route results', async () => {
    const origin = { lat: -23.5505, lng: -46.6333 }
    const dest = { lat: -22.9068, lng: -43.1729 }
    const result1 = await engine.calculateRoute(origin, dest)
    const result2 = await engine.calculateRoute(origin, dest)
    expect(result1).toEqual(result2)
  })

  test('should fallback to Mapbox when Google quota exceeded', async () => {
    GoogleMapsProvider.prototype.calculateRoute = jest.fn()
      .mockRejectedValueOnce(Object.assign(new Error('Quota exceeded'), { name: 'QuotaExceededError' }))
    MapboxProvider.prototype.calculateRoute = jest.fn().mockResolvedValueOnce(mockRouteInfo)

    const route = await engine.calculateRoute(
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 }
    )
    expect(route).toBeDefined()
    expect(MapboxProvider.prototype.calculateRoute).toHaveBeenCalled()
  })

  test('should throw when all providers fail', async () => {
    GoogleMapsProvider.prototype.calculateRoute = jest.fn()
      .mockRejectedValue(new Error('Generic error'))

    await expect(engine.calculateRoute(
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 }
    )).rejects.toThrow('Generic error')
  })

  test('should clear cache', async () => {
    engine.setProvider(ProviderType.GOOGLE)
    const origin = { lat: -23.5505, lng: -46.6333 }
    const dest = { lat: -22.9068, lng: -43.1729 }
    await engine.calculateRoute(origin, dest)
    engine.clearCache()
    await engine.calculateRoute(origin, dest)
    expect(GoogleMapsProvider.prototype.calculateRoute).toHaveBeenCalledTimes(2)
  })
})
```

### Testes do MapCache

```typescript
describe('MapCache', () => {
  let cache: MapCache

  beforeEach(() => {
    cache = new MapCache({ defaultTTL: 60_000, maxSize: 100, cleanupInterval: 60_000 })
  })

  test('should store and retrieve values', () => {
    cache.set('key1', { data: 'value1' })
    expect(cache.get('key1')).toEqual({ data: 'value1' })
  })

  test('should return undefined for expired entries', () => {
    cache.set('key1', 'value1', -1000)
    expect(cache.get('key1')).toBeUndefined()
  })

  test('should evict oldest when max size reached', () => {
    for (let i = 0; i < 110; i++) cache.set(`key${i}`, `value${i}`)
    expect(cache.size).toBeLessThanOrEqual(100)
  })

  test('should track hits and misses', () => {
    cache.set('key1', 'value1')
    cache.get('key1')
    cache.get('nonexistent')
    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
  })
})
```

### Testes de integração com Google API Mock

```typescript
describe('GoogleMapsProvider Integration', () => {
  let provider: GoogleMapsProvider
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    provider = new GoogleMapsProvider(
      async () => 'fake-key',
      new MapCache({ defaultTTL: 60_000, maxSize: 100, cleanupInterval: 60_000 })
    )
    fetchMock = jest.spyOn(global, 'fetch')
  })

  afterEach(() => fetchMock.mockRestore())

  test('should parse Directions API response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        routes: [{
          legs: [{
            distance: { text: '429 km', value: 429000 },
            duration: { text: '4 hours', value: 14400 },
            start_address: 'Sao Paulo',
            end_address: 'Rio de Janeiro',
            start_location: { lat: -23.5505, lng: -46.6333 },
            end_location: { lat: -22.9068, lng: -43.1729 },
            steps: [],
            duration_in_traffic: { text: '4 hours 30 min', value: 16200 },
          }],
          overview_polyline: { points: 'abc123' },
          bounds: {
            northeast: { lat: -22.9, lng: -43.1 },
            southwest: { lat: -23.6, lng: -46.7 },
          },
        }],
      }),
    })

    const route = await provider.calculateRoute(
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 }
    )
    expect(route.distance).toBe(429000)
    expect(route.duration).toBe(14400)
    expect(route.legs).toHaveLength(1)
    expect(route.polyline).toBe('abc123')
  })

  test('should handle ZERO_RESULTS', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', routes: [] }),
    })
    await expect(provider.calculateRoute(
      { lat: 0, lng: 0 }, { lat: 0, lng: 0 }
    )).rejects.toThrow('No route found')
  })

  test('should handle network error with retry', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        routes: [{ legs: [], overview_polyline: {}, bounds: {} }],
      }),
    })
    const route = await provider.calculateRoute(
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 }
    )
    expect(route).toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('should throw on INVALID_REQUEST', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Invalid parameters',
    })
    await expect(provider.calculateRoute(
      { lat: 0, lng: 0 }, { lat: 0, lng: 0 }
    )).rejects.toThrow('Google API Error 400')
  })
})
```

---

## Security Considerations

1. **API key never exposed in client code** — obtida via backend com autenticação
2. **Backend endpoint protegido** — `/api/config/maps-key` requer cookie de sessão
3. **Referrer restriction** — API key configurada no GCP Console para aceitar apenas requests do domínio do app
4. **No logging de API keys** — keys nunca aparecem em logs ou analytics
5. **Session tokens** — usados no Places API para evitar abuse
6. **Rate limiting client-side** — proteção adicional contra uso excessivo acidental
7. **Daily quota tracking** — armazenado no localStorage para controle cross-session

---

## Diretrizes de Desenvolvimento

1. **NUNCA** chamar Google Maps API diretamente — sempre via Mobility Engine
2. **NUNCA** hardcodar API keys — sempre via backend
3. **Sempre** implementar tratamento de erros e fallback
4. **Sempre** cachear resultados quando possível
5. **Sempre** usar session tokens no Places API
6. **Preferir** Routes API sobre Directions API
7. **Monitorar** custos por sessão e por dia
8. **Testar** fallback providers periodicamente
9. **Documentar** qualquer novo provider seguindo IMobilityProvider
10. **Revisar** quotas e custos mensalmente

---

## Referências

- Google Maps Platform: https://developers.google.com/maps
- Routes API: https://developers.google.com/maps/documentation/routes
- Places API (nova): https://developers.google.com/maps/documentation/places/web-service
- Directions API: https://developers.google.com/maps/documentation/directions
- Distance Matrix API: https://developers.google.com/maps/documentation/distance-matrix
- Geocoding API: https://developers.google.com/maps/documentation/geocoding
- Roads API: https://developers.google.com/maps/documentation/roads
- Elevation API: https://developers.google.com/maps/documentation/elevation
- Timezone API: https://developers.google.com/maps/documentation/timezone
- Geolocation API: https://developers.google.com/maps/documentation/geolocation
- Maps Embed API: https://developers.google.com/maps/documentation/embed
- Google Polyline Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js
