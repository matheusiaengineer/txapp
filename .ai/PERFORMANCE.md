# TXAPP Performance Specification

## Metas Obrigatórias
- Cold start (primeiro carregamento): < 1 segundo
- Page transitions (navegação entre telas): < 200ms
- Animations: 60 FPS consistentes
- Time to Interactive (TTI): < 2 segundos
- Lighthouse Performance Score: > 90
- Core Web Vitals: LCP < 1.5s, FID < 50ms, CLS < 0.05
- Bundle size (gzip): < 200KB por rota
- JavaScript parse time: < 500ms
- First Contentful Paint (FCP): < 1.0s
- Largest Contentful Paint (LCP): < 1.5s
- First Input Delay (FID): < 50ms
- Cumulative Layout Shift (CLS): < 0.05
- Time to First Byte (TTFB): < 300ms
- Speed Index: < 2.0s
- Total Blocking Time (TBT): < 150ms
- Input responsiveness: < 50ms
- Smoothness score (RAIL): > 0.9
- Cache hit rate: > 80%
- API response time (p95): < 500ms
- Error rate: < 0.1%

## Técnicas

### 1. Lazy Loading
- Componentes carregados sob demanda: mapa, câmera (selfie), gráficos, animações 3D
- next/dynamic para componentes pesados
- Suspense boundaries com fallbacks skeleton
- Intersection Observer para carregar conteúdo abaixo da dobra
- Lazy load de imagens fora da viewport
- Lazy load de scripts de terceiros (maps, analytics, chat)
- Lazy load de fontes não-críticas
- Defer de JavaScript não-crítico
- Lazy load de Web Workers
- Lazy load de módulos de internacionalização (i18n)
- Lazy load de bibliotecas de edição de imagem
- Lazy load de bibliotecas de PDF
- Lazy load de bibliotecas de QR code
- Lazy load de bibliotecas de gráficos (Chart.js, D3)
- Lazy load de componentes de admin apenas para usuários admin
- Lazy load de componentes de pagamento apenas no checkout
- Lazy loading de seções abaixo da dobra usando Intersection Observer
- Lazy loading de embeds de vídeo
- Lazy loading de iframes
- Lazy loading de comentários e avaliações
- Lazy loading de histórico de viagens (carregar últimos 10, depois scroll)
- Lazy loading de notificações
- Lazy loading de chat messages (carregar últimas 50)
- Lazy loading de fotos de perfil em listas
- Componente LazyLoad wrapper reutilizável
- Configuração de threshold e rootMargin no Intersection Observer
- Placeholder skeletons com animação CSS
- Error boundaries para fallbacks de lazy loading
- Preload critical chunks usando <link rel="preload">
- Priority hints para recursos críticos
- Exemplo de lazy loading de mapa:
  ```tsx
  const MapView = dynamic(() => import('@/components/MapView'), {
    loading: () => <MapSkeleton />,
    ssr: false,
  });
  ```

### 2. Code Splitting
- Por rota (Next.js automatic)
- Por componente (dynamic imports)
- Por biblioteca (lucide-react importa só ícones usados)
- Por funcionalidade (admin, dashboard, ride, chat separados)
- Por condição de usuário (logado vs anônimo)
- Por dispositivo (mobile vs desktop)
- Por permissão (motorista vs passageiro)
- Análise: `npx next build` bundle analyzer
- Webpack bundle analyzer para visualizar tamanhos
- Identificar módulos duplicados com `why-did-you-render`
- Separar vendor chunks (react, react-dom, next)
- Separar polyfills em chunk próprio
- Chunk de mapa (Google Maps API)
- Chunk de câmera (KYC selfie, documentos)
- Chunk de chat (WebSocket, mensagens)
- Chunk de pagamentos (Stripe, PIX)
- Chunk de admin (dashboard, analytics)
- Chunk de notificações (push, in-app)
- Chunk de animações (framer-motion, Lottie)
- Chunk de áudio (chamadas, walkie-talkie)
- Chunk de mídia (upload de fotos, documentos)
- Evitar circular dependencies entre chunks
- Nomear chunks de forma legível para debugging
- Monitorar impacto de cada chunk no bundle total
- Usar `webpackChunkName` para nomes descritivos
- Configurar maxInitialRequests e maxAsyncRequests
- Lazy load de rotas administrativas
- Lazy load de modais e dialogs
- Lazy load de tooltips e popovers ricos
- Lazy load de editores rich text
- Lazy load de players de áudio/vídeo

### 3. Image Optimization
- next/image com lazy loading nativo
- WebP + AVIF formatos
- Imagens responsivas (srcSet)
- Blur placeholder para imagens acima da dobra
- CDN para imagens de usuário (avatar, documentos)
- Comprimir imagens automaticamente no build (sharp)
- Usar dimensões explícitas para evitar CLS
- Priorizar imagens acima da dobra com priority
- Otimizar imagens de fundo (CSS gradients vs images)
- Usar SVG para ícones e ilustrações
- Sprite sheets para ícones pequenos
- Imagens vetoriais para mapas estáticos
- Cache de imagens processadas no servidor
- WebP fallback para browsers sem suporte
- AVIF para browsers compatíveis
- Qualidade adaptativa (80% para fotos, 90% para ilustrações)
- Redimensionar imagens no upload para tamanhos padrão
- Gerar múltiplas resoluções (320w, 640w, 960w, 1280w, 2560w)
- Lazy load de imagens em grids e galerias
- Preload de imagens críticas (hero, logo, avatar do usuário)
- Imagens decorativas com loading="lazy" e role="presentation"
- Alt text obrigatório para acessibilidade
- Configuração de domínios permitidos no next.config.js
- Usar tamanhos de placeholder blur proporcionais
- Evitar imagens maiores que o container
- Monitorar Cumulative Layout Shift causado por imagens
- Otimizar imagens de documentos (KYC, road events)
- Compressão com mozjpeg para JPEG
- Compressão com pngquant para PNG
- Conversão automática para WebP no build

### 4. Caching
- Service Worker cache-first para assets estáticos
- Network-first para dados de API
- Cache Directions/ETA results por 5 minutos
- Cache de traduções em memória (nunca refetch)
- localStorage para preferências do usuário
- IndexedDB para dados offline
- Cache de requisições de API com SWR ou TanStack Query
- Stale-while-revalidate para dados não-críticos
- Cache de mapa (tiles) em IndexedDB
- Cache de rotas calculadas por 30 minutos
- Cache de preços estimados por 5 minutos
- Cache de geocoding reverso por 24 horas
- Cache de placas de veículos por 1 hora
- Cache de avaliações de motoristas por 10 minutos
- Cache de configurações de cidade por 1 hora
- HTTP cache headers em API routes:
  - public, max-age=31536000, immutable para assets
  - public, max-age=300, stale-while-revalidate=60 para direções
  - private, no-cache para dados do usuário
  - no-store para dados sensíveis (pagamento)
- Cache de respostas GraphQL (quando implementado)
- Cache de queries de banco de dados no servidor (Redis)
- Invalidação de cache ao atualizar perfil
- Invalidação de cache ao finalizar corrida
- Purge de cache de tiles após 7 dias
- Cache de fontes com cache-first no SW
- Cache de CSS e JS com cache-first no SW
- Estratégia de cache no Service Worker:
  ```js
  // Cache-first para assets estáticos
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (isStaticAsset(request)) {
      event.respondWith(cacheFirst(request));
    } else if (isApiRequest(request)) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(networkOnly(request));
    }
  });
  ```

### 5. Prefetch
- next/link prefetch automático para links visíveis
- Prefetch páginas prováveis (baseado em Passenger AI)
- DNS prefetch para domínios externos (maps.googleapis.com, api.stripe.com)
- Preconnect para origens críticas
- Prefetch de chunks de código ao hover em links
- Prefetch de dados de perfil ao login
- Prefetch da próxima página de wizard (cadastro)
- Prefetch de páginas de destino ao scrollar
- Prefetch de recursos críticos no service worker idle time
- Prefetch condicional (apenas em conexões rápidas, evitar em 3G)
- Usar `rel="prefetch"` para páginas prováveis
- Usar `rel="preload"` para recursos críticos
- Usar `rel="preconnect"` para origins terceiras
- Usar `rel="dns-prefetch"` para fallback de preconnect
- Prefetch de tiles de mapa para área atual
- Prefetch de traduções para idioma do usuário
- Prefetch de fontes para páginas seguintes
- Prefetch de imagens de motoristas próximos
- Prefetch de resultados de busca de endereço
- Priorizar prefetch de recursos acima da dobra
- Cachear prefetched data em memória
- Limitar prefetch a 5 recursos por página
- Monitorar bandwidth usado por prefetch
- Desabilitar prefetch em conexões medidas (via Network Information API)
- Prefetch de páginas de ajuda e FAQ
- Prefetch de página de pagamento ao solicitar corrida
- Prefetch de página de avaliação ao finalizar corrida

### 6. SSR / Streaming
- Páginas estáticas onde possível (landing pages, termos de uso)
- SSR para páginas dinâmicas (dashboard, ride)
- Streaming para páginas com dados pesados (admin analytics)
- ISR para conteúdo semi-dinâmico (config de cidade)
- SSG para páginas de marketing e blog
- Partial hydratation para páginas com SSR
- Server Components para reduzir JS client-side
- Streaming de HTML com React Suspense
- Priorizar conteúdo acima da dobra no stream
- Render-to-Stream em vez de render-to-string
- Configurar timeout de SSR (máx 5s, fallback para SPA)
- Monitorar TTFB em páginas SSR
- Cache de páginas SSR no servidor (por usuário quando apropriado)
- Cache de páginas SSG no CDN
- Revalidate ISR a cada 1 hora para conteúdo de cidade
- Evitar SSR para conteúdo pesado (usar streaming)
- Lazy load de componentes não-críticos no SSR (suppressHydrationWarning)
- Usar `dynamic(() => import(...), { ssr: false })` para componentes client-only
- Server Components para listas de dados
- Suspense boundaries estratégicos no streaming
- Fallback UI para chunks de streaming atrasados
- ISR on-demand (revalidateTag/revalidatePath)
- Incremental Static Regeneration para landing pages
- Static export para páginas puramente informativas
- SSR seletivo por user agent (bots recebem HTML completo)
- Otimizar server components para cache em edge

### 7. Virtualization
- Listas longas: react-window ou virtualized list para histórico de rides, transações, chat
- Grids: virtualized grid para marketplace de fretes
- Feed: infinite scroll com virtualização
- Lista de motoristas próximos virtualizada
- Lista de mensagens do chat virtualizada (scroll para topo carrega mais)
- Lista de notificações virtualizada
- Lista de pagamentos e extrato virtualizada
- Tabela de admin virtualizada (react-virtualized table)
- Timeline de viagens virtualizada
- Grid de fotos de documentos (KYC) virtualizado
- Lista de endereços salvos virtualizada
- Lista de veículos cadastrados virtualizada
- Lista de rotas frequentes virtualizada
- Lista de promoções e cupons virtualizada
- Lista de avaliações recebidas virtualizada
- Altura de linha fixa para melhor performance
- Altura de linha variável quando necessário com medida dinâmica
- Overscan de 5 itens para scroll suave
- Scroll restoration ao voltar para lista
- Scroll-to-index ao abrir chat em mensagem específica
- Window scroller para lists full-page
- Auto-sizer para dimensões responsivas
- CellMeasurer para conteúdo dinâmico
- Infinite loader com threshold de 80% do scroll
- Debounce de scroll handler (100ms)
- Evitar re-renders durante scroll (useMemo nos itens)
- Key corretos para minimizar remounts
- Testar performance com 10.000+ itens
- Modo "reverse" para chat (scroll para baixo)
- Agrupar items por data (histórico de rides)

### 8. Bundle Optimization
- Tree shaking ativo (Next.js default)
- Remover dead code (TypeScript strict ajuda)
- Lodash: importar funções individuais (não a lib toda)
- Moment.js -> date-fns (tree-shakeable)
- Mantenha framer-motion mas evite animações desnecessárias
- Remover console.log em produção (terser)
- Remover código de desenvolvimento em produção
- Usar dayjs ou date-fns em vez de moment.js
- Importar apenas ícones usados do lucide-react
- Evitar duplicação de bibliotecas (ex: duas libs de data)
- Bundle analyzer para identificar dependências pesadas
- Vendor chunk separado para estabilidade de cache
- Module federation para micro-frontends futuros
- Evitar barrel files (index.ts) que exportam tudo
- Preferir exports named a exports default
- Código morto: usar cobertura de código para identificar
- Evitar import * from 'library' (importa tudo)
- Usar babel-plugin-transform-imports para bibliotecas grandes
- Configurar sideEffects: false no package.json
- Remover polyfills não utilizados (core-js, regenerator-runtime)
- Otimizar imagens SVGs com SVGO no build
- Minificar CSS com cssnano
- Concatenar CSS crítico inline
- Usar codegen para tipos (graphql-codegen) sem bibliotecas runtime
- Evitar dependências com árvore grande (ex: axios vs fetch nativo)
- Preferir @radix-ui sobre headless-ui (menor bundle)
- Monitorar bundle size a cada PR com GitHub Actions
- Alertas automáticos se bundle aumentar > 5%
- Analisar dependências com `npx next build` e `ANALYZE=true`
- Separar polyfills para browsers específicos
- Usar import dinâmico para bibliotecas grandes
- Configurar webpack para dividir chunks otimamente

### 9. Rendering Optimization
- React.memo para componentes que renderizam com mesmas props
- useMemo e useCallback para cálculos pesados
- Evitar re-renders desnecessários (estado local vs global)
- useRef para valores que não precisam re-renderizar
- Estado global mínimo (Zustand com slices pequenos)
- Estado local para UI transient (modais, tooltips)
- Estado server (TanStack Query) separado de estado UI
- useMemo em listas filtradas e ordenadas
- useCallback em handlers passados para children
- React.memo em list items, cards, cells
- Evitar arrow functions inline em props (useCallback)
- Evitar objetos/arrays inline em props (useMemo)
- Virtualização de listas para reduzir DOM nodes
- Fragmentos (<>...</>) em vez de divs extras
- Evitar renderização condicional complexa
- Splitted components para reduzir escopo de re-render
- useWhyDidYouRender para debug (dev only)
- Profiler do React DevTools para identificar gargalos
- Flatten props para evitar mudanças profundas
- Estado derivado com useMemo em vez de useState + useEffect
- Debounce em inputs de busca (300ms)
- Throttle em handlers de scroll e resize
- Passive event listeners para scroll/touch
- Evitar layout thrashing (ler e escrever DOM separadamente)
- Usar transform e opacity para animações (não layout properties)
- will-change: transform em elementos animados
- content-visibility: auto para seções abaixo da dobra
- contain: layout style paint em cards e listas
- Evitar manipulação direta do DOM (usar React)
- Batched updates com React 18 automatic batching
- Transitions para atualizações não urgentes (startTransition)
- useDeferredValue para valores que podem ficar desatualizados
- Evitar useEffect sem dependências (componentDidMount replacement)
- Cleanup em useEffect para evitar memory leaks
- AbortController para fetch canceláveis
- Pooling de conexões WebSocket
- Destruir mapas Google Maps ao desmontar componente
- Limpar timers e intervals

### 10. Network Optimization
- HTTP/2 ou HTTP/3
- Request coalescing (agrupar chamadas de API)
- GraphQL para queries complexas (futuro)
- Compressão: brotli > gzip
- API routes com Response.json() e cache headers
- Connection pooling para API calls
- Keep-alive connections
- Preconnect para origins de API
- DNS caching
- Otimizar payload de API (apenas campos necessários)
- Paginação de listas (cursor-based, 20 itens por página)
- Debounce de chamadas de API (auto-save, search)
- Abortar requests desnecessárias ao navegar
- Retry com exponential backoff em falhas de rede
- Timeout de 10s para chamadas de API
- Upload de arquivos com resumable upload (tus protocol)
- Chunked transfer encoding para streaming
- Server-Sent Events para notificações em tempo real
- WebSocket para chat e localização em tempo real
- Compressão de payload com brotli no servidor
- GraphQL batch queries (quando implementado)
- API versioning para evitar breaking changes
- Rate limiting client-side para evitar abuso
- Monitorar latência de API por endpoint
- Prioridade de requests (critical vs low priority)
- Request deduplication (mesma chamada simultânea)
- Response caching em memória (SWR)
- Prefetch de dados otimista (acreditar que vai usar)
- Optimistic UI para ações (like, favoritar) sem esperar resposta
- Rollback de optimistic update em caso de erro

### 11. Font Optimization
- Inter font: subset only, woff2, display=swap
- Pré-carregar fontes críticas
- Font fallback para evitar layout shift
- Usar font-display: swap para evitar FOIT (Flash of Invisible Text)
- Subset de fontes para caracteres latinos apenas
- Pré-carregar fontes com <link rel="preload" as="font" crossorigin
- Fontes auto-hospedadas (sem Google Fonts request externo)
- Usar woff2 com fallback para woff
- Tamanho máximo de fonte: 40KB (woff2)
- Inline fontes críticas (base64) para hero text
- Usar font-face com range de Unicode
- Definir fallback fonts com tamanho ajustado (size-adjust)
- Evitar FOUT (Flash of Unstyled Text) com Critical FOFT
- Fontes variáveis para reduzir múltiplos arquivos
- Pré-conectar para Google Fonts se usado
- Usar sistema de fontes padrão para conteúdo não-crítico
- Definir font stack com fallbacks otimistas
- Cache de fontes no service worker
- Avoid Google Fonts dynamic loader (carregar estaticamente)
- Pré-carregar fontes para o idioma do usuário
- Fontes para suporte a CJK characters carregadas sob demanda
- Ícones como fonte vs SVG (SVG é melhor para performance)
- Medir impacto de fontes no LCP e CLS
- Usar @font-face com format hints
- Fontes para internacionalização carregadas por idioma
- Fallback para monospace em código
- Tamanho de fontes otimizado para mobile
- Evitar múltiplos pesos de fonté desnecessários
- Usar font-weight: 400, 500, 700 (evitar 300, 600, 800, 900)
- Font subset dinâmico por página

### 12. Measuring
- Web Vitals (Next.js Analytics)
- Custom performance marks para transições de página
- RUM (Real User Monitoring)
- Lighthouse CI para monitorar regressões
- Performance budgets no CI (falhar se exceder)
- Custom metrics: time-to-ride-request, time-to-payment
- Monitorar FPS de animações com requestAnimationFrame
- Long tasks monitoring (>50ms)
- Cumulative Layout Shift tracking com PerformanceObserver
- First Input Delay tracking com polyfill
- Largest Contentful Paint tracking com PerformanceObserver
- Navigation Timing API para TTFB, FCP, DOMContentLoaded
- Resource Timing API para assets individuais
- User Timing API para custom marks e measures
- Web Vitals report para dashboard interno
- Alertas quando Core Web Vitals pioram
- A/B testing de performance
- Monitoramento de bundle size por rota
- Server-side timing headers
- APM integration (Datadog, New Relic, Sentry)
- Error tracking com breadcrumbs de performance
- Session replay para sessões lentas
- Log de "why did this render" em dev
- Network throttling para testes manuais
- CPU throttling para testes de devices lentos
- Profiling no React DevTools e Chrome DevTools
- Heap snapshots para memory leaks
- Performance budget tabela:
  | Métrica       | Budget  | Warning |
  |--------------|---------|---------|
  | Bundle (gzip)| 200KB   | 150KB   |
  | LCP          | 1.5s    | 1.0s    |
  | FID          | 50ms    | 30ms    |
  | CLS          | 0.05    | 0.02    |
  | TTFB         | 300ms   | 200ms   |
  | FCP          | 1.0s    | 0.8s    |
  | TBT          | 150ms   | 100ms   |

### 13. Build Analysis
```bash
npx next build
ANALYZE=true npx next build
```
- Monitorar tamanho de bundle por rota
- Identificar dependências pesadas
- Evitar bundles > 200KB (gzip)
- Analisar dependências duplicadas
- Verificar tree shaking efetivo
- Identificar oportunidades de code splitting
- Monitorar crescimento de bundle entre versões
- Remover dependências não utilizadas
- Substituir bibliotecas pesadas por alternativas leves
- Auditoria automática de dependências com `npm audit`
- Verificar impacto de cada import no bundle final
- Analisar webpack stats com `webpack-bundle-analyzer`
- Gerar relatório de bundle a cada build
- Comparar bundle entre branches no CI
- Bloquear PRs que excedem budget
- Visualizar dependências com `madge`
- Circular dependency detection
- Análise de impacto de dependências novas
- Verificar tamanho de cada dependência individual
- Identificar dependências que importam módulos grandes
- Analisar chunk groups no webpack
- Verificar porcentagem de código usado por página
- Pareto analysis (20% de código responsável por 80% do bundle)
- Track critical path do bundle inicial
- Analisar dependências transitivas
- Verificar polyfills desnecessários por browser target
- Configurar webpack com splitChunks otimizado
- Usar `webpack-remove-empty-scripts` plugin
- Limpar chunks não utilizados

### 14. Performance Checklist
- [ ] Página carrega em < 1s (cold start)
- [ ] LCP < 1.5s
- [ ] FID < 50ms
- [ ] CLS < 0.05
- [ ] TTFB < 300ms
- [ ] FCP < 1.0s
- [ ] TBT < 150ms
- [ ] Speed Index < 2.0s
- [ ] Lighthouse score > 90
- [ ] Bundle gzip < 200KB
- [ ] Imagens otimizadas (WebP/AVIF, resposivo)
- [ ] Imagens acima da dobra com priority
- [ ] Lazy loading de imagens abaixo da dobra
- [ ] Fontes carregadas com display=swap
- [ ] Font críticas pré-carregadas
- [ ] Componentes pesados com dynamic import
- [ ] Listas virtualizadas (>50 itens)
- [ ] Service worker registrado
- [ ] Cache de API com SWR/TanStack Query
- [ ] Código dividido por rota e funcionalidade
- [ ] Tree shaking ativo
- [ ] Console.log removido em produção
- [ ] Animações a 60 FPS
- [ ] Transições de página < 200ms
- [ ] Prefetch de links visíveis
- [ ] DNS prefetch para domínios externos
- [ ] Preconnect para origins críticas
- [ ] React.memo em componentes de lista
- [ ] useMemo/useCallback em cálculos pesados
- [ ] Estado global mínimo
- [ ] Evitar re-renders desnecessários
- [ ] Content-visibility em seções abaixo da dobra
- [ ] HTTP/2 ou HTTP/3 habilitado
- [ ] Brotli compression habilitado
- [ ] Cache headers configurados
- [ ] Service worker com cache-first para assets
- [ ] Service worker com network-first para API
- [ ] Infinite scroll com virtualização
- [ ] Debounce em inputs de busca
- [ ] Throttle em handlers de scroll
- [ ] AbortController para fetch canceláveis
- [ ] Timeout de 10s para chamadas de API
- [ ] Retry com exponential backoff
- [ ] Bundle analyzer rodando no CI
- [ ] Performance monitoramento (RUM)
- [ ] Alertas de regressão de performance
- [ ] Testes de performance no CI
- [ ] Nenhuma dependência moment.js
- [ ] Nenhum import * de bibliotecas grandes
- [ ] Páginas estáticas onde possível (SSG)
- [ ] ISR para conteúdo semi-dinâmico
- [ ] Streaming para páginas pesadas
- [ ] Partial hydratation
- [ ] Server Components onde possível
- [ ] Estado server separado de estado UI
- [ ] useDeferredValue para valores não urgentes
- [ ] startTransition para transições não críticas
- [ ] Layout shift tracking ativo
- [ ] FID polyfill carregado
- [ ] Resource hints otimizados
- [ ] Subset de fontes configurado
- [ ] CDN configurado para assets
- [ ] Imagens de usuário em CDN
- [ ] Tiles de mapa cacheados
- [ ] Rotas cacheadas por 30 min
- [ ] Preços cacheados por 5 min
- [ ] Traduções cacheadas em memória
- [ ] CSS crítico inline
- [ ] JavaScript assíncrono/deferido
- [ ] Third-party scripts lazy loaded
- [ ] Third-party scripts com async
- [ ] Mapas carregados sob demanda
- [ ] Câmera carregada sob demanda
- [ ] Gráficos carregados sob demanda
- [ ] QR code lib carregada sob demanda
- [ ] PDF lib carregada sob demanda
- [ ] Video embeds lazy loaded
- [ ] Iframes lazy loaded
- [ ] Comentários lazy loaded
- [ ] Chat carrega últimas 50 mensagens
- [ ] Histórico carrega últimos 10 items
- [ ] Notificações lazy loaded
- [ ] Admin modules lazy loaded
- [ ] Payment modules lazy loaded
- [ ] Fontes não-críticas lazy loaded
- [ ] Polyfills carregados sob demanda
- [ ] Network Information API para adaptar prefetch
- [ ] Save-Data header para modo economia
- [ ] prefers-reduced-motion para animações
- [ ] prefers-color-scheme para temas
- [ ] Sem dependências circulares
- [ ] Build analisado a cada release
- [ ] Performance budgets no CI
- [ ] Cobertura de código monitorada
- [ ] Dead code detection ativo
- [ ] Webpack chunks nomeados
- [ ] Vendor chunk separado
- [ ] Common chunk para shared modules
- [ ] Side effects marcados no package.json
- [ ] SVGO para otimização de SVGs
- [ ] cssnano para minificação de CSS
- [ ] Terser para minificação de JS
- [ ] Bundle size tracking histórico
- [ ] Performance regression tests
- [ ] Load testing para API endpoints
- [ ] Stress testing para WebSocket
- [ ] Memory leak tests
- [ ] Testes em devices reais (baixo custo)
- [ ] Testes em conexões lentas (3G)
- [ ] Testes em CPU throttled
- [ ] Monitoramento de erro com breadcrumbs
- [ ] APM integrado
- [ ] Web Vitals dashboard
- [ ] Custom metrics para funções críticas
- [ ] SLA de performance definido
- [ ] Performance review em code review
- [ ] Documentação de performance mantida
- [ ] Alertas configurados para métricas
- [ ] Responsáveis por performance definidos

## Notas Finais
- Performance é responsabilidade de todos os desenvolvedores
- Toda feature nova deve ter análise de impacto em performance
- Regressões de performance devem ser tratadas como bugs críticos
- Manter este documento atualizado com novas técnicas
- Revisar métricas de performance semanalmente
- Testar em dispositivos reais de baixo custo
- Priorizar performance mobile (maioria dos usuários)
- Otimizar para conexões 3G em áreas rurais
- Este documento deve ser revisado a cada sprint
- Qualquer dúvida, consultar o time de performance
