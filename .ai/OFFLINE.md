# TXAPP Offline-First Strategy

## Visão Geral
O app deve funcionar sem internet. Dados são salvos localmente e sincronizados automaticamente quando a conexão volta. O objetivo é que motoristas possam registrar corridas, enviar mensagens, tirar fotos e coletar assinaturas mesmo em áreas sem cobertura de rede.

## Estratégia

### Service Worker (sw.js)
- Cache-first para assets estáticos (JS, CSS, fontes, imagens)
- Network-first para dados de API
- Offline fallback page
- Push notifications (mesmo fechado)
- Background sync para ações offline
- Cache de versão com versionamento automático
- Instalação: baixar assets críticos no install event
- Ativação: limpar caches antigos no activate event
- Estratégias de cache por tipo de recurso:
  - Cache-first: JS, CSS, fontes, imagens estáticas
  - Network-first: /api/*, /graphql
  - Stale-while-revalidate: /api/status/*
  - Cache-only: offline fallback page
  - Network-only: /api/payments/*
- Offline fallback page customizada com informações úteis
- Push notification click: abrir página relevante mesmo offline
- Background sync para ações offline:
  ```js
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-actions') {
      event.waitUntil(processOfflineQueue());
    }
  });
  ```

### IndexedDB
Estrutura:
- offline_actions: fila de ações pendentes
- trips_cache: corridas recentes offline
- messages_cache: mensagens do chat
- map_tiles_cache: tiles de mapa para áreas visitadas
- user_preferences: configurações offline
- routes_cache: rotas calculadas offline
- addresses_cache: endereços salvos e recentes
- vehicles_cache: veículos do motorista
- documents_cache: documentos KYC
- signatures_cache: assinaturas digitais
- payments_cache: pagamentos offline
- notifications_cache: notificações recebidas
- drivers_cache: dados de motoristas conhecidos
- passengers_cache: dados de passageiros frequentes
- cities_cache: configurações de cidades
- pricing_cache: tabela de preços offline
- promo_cache: cupons e promoções offline
- ratings_cache: avaliações offline
- photos_cache: fotos de road events
- logs_cache: logs de atividade offline
- schema_version: controle de versão do schema

Schema definitions:
```typescript
interface OfflineAction {
  id: string;
  type: 'create_trip' | 'send_message' | 'update_status'
        | 'upload_photo' | 'submit_document'
        | 'sign_document' | 'rate_driver'
        | 'rate_passenger' | 'update_location'
        | 'accept_ride' | 'complete_ride'
        | 'upload_document_kyc' | 'report_road_event';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed';
  priority: 'high' | 'normal' | 'low';
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}
interface CachedTrip {
  id: string;
  status: string;
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  driverId: string;
  passengerId: string;
  price: number;
  distance: number;
  duration: number;
  startedAt: number;
  completedAt?: number;
  cachedAt: number;
}
interface CachedMessage {
  id: string;
  tripId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'system';
  sentAt: number;
  deliveredAt?: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}
```

### O que salvar offline:
1. GPS location tracking (quando sem internet, salvar localmente e sincronizar)
2. Mensagens de chat (enfileirar e enviar quando voltar)
3. Atualizações de status (online/offline, aceitar corrida)
4. Fotos (documentos KYC, road events - salvar e enviar depois)
5. Assinaturas digitais (salvar localmente)
6. Pagamentos pendentes (marcar como pending_local e sincronizar)
7. Início e fim de corrida (salvar localmente se offline)
8. Atualizações de rota e GPS tracking (batch sync)
9. Avaliações de motoristas e passageiros
10. Relato de road events (acidentes, buracos, obras)
11. Formulários de suporte técnico
12. Atualizações de perfil (foto, documento, veículo)
13. Respostas de perguntas de segurança (KYB)
14. Confirmação de leitura de termos
15. Agendamento de corridas futuras
16. Preferências de busca (filtros salvos)
17. Favoritos (endereços, motoristas, rotas)
18. Relatório financeiro diário (motorista)
19. Logs de quilometragem
20. Comprovantes de pagamento (fotos)
21. Notas fiscais (fotos ou dados)
22. Cancelamento de corrida com motivo
23. Alteração de destino durante corrida
24. Pedido de ajuda (emergência)
25. Chat com suporte

### Sincronização
- Ao voltar a conexão: processar fila em ordem FIFO
- Conflitos: "last write wins" (timestamp)
- Mostrar indicador de "X ações pendentes para sincronizar"
- Se ação falhar (ex: pagamento), notificar usuário
- Prioridade: ações de pagamento > chat > gps > fotos
- Batch sync: agrupar ações em lotes de 10
- Sincronização em background (não bloquear UI)
- Mostrar toast ao completar sincronização
- Mostrar toast ao falhar sincronização com motivo
- Tentar sincronizar a cada 30 segundos enquanto online
- Sincronizar imediatamente ao abrir app se online
- Sincronizar imediatamente ao receber mensagem de chat
- Conflitos de dados do usuário: servidor vence (source of truth)
- Conflitos de timestamps: maior timestamp vence
- Ações conflitantes (ex: cancelar corrida já finalizada): servidor decide
- Notificar usuário de conflitos resolvidos
- Histórico de sincronização visível ao usuário
- Métricas de sincronização no admin dashboard
- Logs de sincronização para debug
- Fila de sincronização persistente (IndexedDB)
- Limpar ações sincronizadas após confirmação do servidor

### Offline Map Tiles
- Baixar tiles das áreas onde o motorista trabalha
- Cache LRU: manter tiles dos últimos 7 dias
- Prioridade: área atual do motorista > áreas vizinhas > área da cidade
- Download sob demanda: "Baixar esta área para uso offline"
- Download programado: baixar área da cidade durante Wi-Fi
- Formato: tiles em PNG ou WebP comprimido
- Zoom levels: 10-16 (rural 10-14, urbano 12-16)
- Tamanho máximo: 250MB de cache de tiles
- Limpar tiles não acessados por 30 dias
- Estilo de mapa otimizado para offline (menos detalhes)
- Vector tiles vs raster tiles (vector é menor)
- Compactar tiles com brotli no download
- Download em background (não bloquear app)
- Download progressivo (tiles centrais primeiro)
- Download apenas em Wi-Fi (evitar consumo de dados móveis)
- Pausar download quando bateria < 20%
- Gerenciamento de espaço: avisar quando cache > 200MB
- Tiles de mapa de calor offline (opcional)
- Fallback para tiles genéricos quando offline em área não baixada
- Grid de download: dividir cidade em quadrantes de 1km x 1km
- Download de tiles de trânsito não disponível offline
- Interface de gerenciamento de tiles offline (ver/remover áreas)
- Estatísticas de uso de tiles offline (quantas vezes usada)
- Compactação de tiles não acessados
- Tile server próprio para controle de qualidade
- Cache de geocoding reverso (endereços já consultados)

### Offline Detection
```typescript
const offlineManager = new OfflineManager();
offlineManager.onStatusChange((online) => {
  if (online) syncQueue();
  showBanner(!online, "Modo offline - dados serão sincronizados automaticamente");
});
```
- Detecção via navigator.onLine
- Detecção via eventos online/offline do window
- Heartbeat de 5s para confirmar conectividade
- Ping em endpoint confiável (/api/health) para validar conectividade real
- Fallback: timeout de 3s em requisição = offline
- Detectar mudança de rede (3G -> Wi-Fi, offline -> online)
- Detectar conexão medida (dados móveis) vs não medida (Wi-Fi)
- Network Information API para tipo de conexão (4G, 3G, 2G, slow-2G)
- Modo avião detectado
- VPN detection
- Proxy detection
- Mostrar indicador de "Conectado via dados móveis" (economia de dados)
- Mostrar indicador de "Conexão lenta" se slow-2G ou 3G fraco
- Não sincronizar fotos grandes em dados móveis
- Configuração: sincronizar apenas em Wi-Fi (toggle)
- Configuração: baixar tiles apenas em Wi-Fi (toggle)
- Notificar ao entrar em área com Wi-Fi disponível
- Histórico de conectividade para debug
- Eventos de conectividade para analytics
- Dados de conectividade para suporte técnico
- Fallback para detecção via server push (WebSocket status)

### Queue Processing
- Max 5 ações simultâneas na sincronização
- Retry com exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
- Se falhar após 5 retries: marcar como failed, notificar usuário
- Expirar ações com mais de 7 dias
- Ordem FIFO estrita por tipo (mensagens antes de GPS)
- Prioridade: pagamentos > chat > status > fotos > GPS
- Ações de mesma prioridade em FIFO
- Processar fila ao abrir app
- Processar fila ao voltar a conexão
- Processar fila a cada 30s se online
- Botão manual "Sincronizar agora"
- Indicador de progresso da sincronização
- Ações críticas (pagamento) com retry infinito (notificar sempre)
- Ações não-críticas (GPS logs) podem ser descartadas após 7 dias
- Tentativas de retry registradas na ação
- Dead letter queue para ações que falharam 10+ vezes
- Admin pode reprocessar ações da dead letter queue
- Limpar ações successful após 30 dias
- Estatísticas da fila (pendentes, processando, falhas)
- Performance: indexar fila por status e prioridade
- Evitar duplicação de ações (idempotência)
- Idempotency key gerada no cliente
- Servidor valida idempotency
- Rollback de ações parciais em caso de erro
- Transação por ação (tudo ou nada)
- Timeout de 30s por ação no servidor
- Ações que expiraram (7 dias) marcadas como expired
- Notificar usuário de ações expiradas
- Permitir reenviar ação expirada (se aplicável)
- Fila visível em tela de configurações
- Remover ações manualmente (usuário)

### UI Components
- OfflineBanner: barra no topo quando offline
  - Cor: amarelo quando offline, verde quando reconecta
  - Texto: "Você está offline - as ações serão sincronizadas automaticamente"
  - Botão: "Ver fila de sincronização" (abre tela de status)
  - Animação: slide down suave
  - Auto-dismiss após 3s quando reconecta
  - Persistente enquanto offline
  - Mostrar quantidade de ações pendentes
- SyncStatus: indicador de ações pendentes
  - Ícone de sync girando quando sincronizando
  - Badge com número de ações pendentes
  - Tooltip com detalhes: "5 ações pendentes (3 mensagens, 2 fotos)"
  - Click: abre tela detalhada de sincronização
  - Posição: canto superior direito (mobile), sidebar (desktop)
- PendingBadge: badge em botões com ações offline
  - Ex: botão de enviar mensagem mostra badge "pendente"
  - Ex: botão de finalizar corrida mostra "salvo localmente"
  - Indicar visualmente que ação será processada depois
  - Cor: laranja para pendente, verde para sincronizado
  - Tooltip: "Esta ação será enviada quando você estiver online"
- OfflineMap toggle: "Baixar esta área para uso offline"
  - Botão na tela do mapa
  - Selecionar área no mapa (retângulo ou círculo)
  - Mostrar tamanho estimado do download
  - Progresso do download (barra ou porcentagem)
  - "Baixar agora" ou "Agendar para Wi-Fi"
  - Gerenciar áreas baixadas (lista com tamanho, deletar)
  - "Baixar cidade inteira" (apenas Wi-Fi)
  - "Baixar área de trabalho" (configurável)
  - Recomendação automática baseada em rotas frequentes
- OfflineIndicator: ícone na status bar
  - Conexão boa: verde
  - Dados móveis: amarelo (com ícone de rede)
  - Offline: vermelho (com ícone de sem sinal)
  - Animação suave de transição entre estados
  - Click: mostra informações detalhadas de conectividade
- SyncDetailScreen: tela completa de sincronização
  - Lista de ações pendentes com tipo, data, status
  - Possibilidade de cancelar ação individual
  - Botão "Sincronizar tudo agora"
  - Histórico de sincronização (últimas 50 ações)
  - Filtro por tipo de ação (mensagem, foto, etc)
  - Filtro por status (pendente, falha, sucesso)
  - Cards expansíveis com detalhes da ação
  - Indicador de progresso geral
  - Estatísticas: total hoje, taxa de sucesso, média de tempo
  - Ações com falha: motivo do erro, botão "Tentar Novamente"
  - Botão "Limpar histórico" (apenas sucesso)
- StaleDataIndicator: indicador de dados desatualizados
  - Mostrar "Última atualização: há 2 horas" em listas
  - Botão "Atualizar agora" se online
  - Background subtle, não intrusivo
  - Em cards de corrida: "Dados de 30 min atrás"
  - Em perfil de motorista: "Info de 1h atrás"
- OfflineSettings: configurações de offline
  - "Sincronizar apenas no Wi-Fi" (toggle)
  - "Baixar tiles apenas no Wi-Fi" (toggle)
  - "Economia de dados" (toggle: não carregar imagens em 3G)
  - "Sincronizar fotos automaticamente" (toggle)
  - "Limite de cache de tiles" (slider: 100MB - 500MB)
  - "Áreas baixadas" (gerenciar)
  - "Limpar cache agora" (botão)
  - "Forçar sincronização" (botão)
  - "Status da fila" (resumo)
  - "Última sincronização" (timestamp)
  - "Total sincronizado hoje" (bytes/ações)

### Estratégias por Tipo de Dado

#### GPS Location Tracking
- Salvar coordenadas a cada 30s quando offline
- Batch de 50 pontos para sincronização
- Comprimir payload (delta encoding)
- Prioridade baixa na fila de sincronização
- Reter últimos 7 dias de histórico GPS
- Servidor interpola rotas quando reconecta
- Algoritmo de simplificação de trajetória (Douglas-Peucker)
- Reduzir frequência de coleta quando parado (1 min)
- Aumentar frequência quando em movimento (10s)
- Parar coleta quando app em background (5 min)
- Retomar coleta ao voltar para foreground
- Não coletar GPS se bateria < 15%
- Modo de baixo consumo de GPS (network provider vs GPS satélite)
- Geofencing: detectar entrada/saída de áreas
- Marcadores de eventos no track GPS (início/fim corrida)
- Sincronizar track GPS antes de expirar (7 dias)
- Comprimir track GPS com diferenças codificadas

#### Chat
- Salvar mensagens localmente imediatamente
- Enfileirar mensagens não enviadas
- Mostrar indicador de "enviando..." nas mensagens pendentes
- Mensagens offline em estilo diferente (borda tracejada)
- Ao reconectar, enviar em ordem cronológica
- Receber mensagens offline ao reconectar (pull de mensagens não lidas)
- Marcar mensagens como lidas localmente, sincronizar depois
- Notificação local para mensagens recebidas via WebSocket reconectado
- Cache das últimas 500 mensagens por chat
- Limpar mensagens com mais de 90 dias
- Fotos no chat: enfileirar upload, mostrar preview local
- Áudio no chat: salvar localmente, enviar depois
- Indicador de "digitando..." não funciona offline
- Chat com suporte: perguntas sem resposta marcadas como pendentes

#### Fotos e Documentos
- Salvar foto localmente (base64 ou file path)
- Comprimir antes de salvar (JPEG 80%)
- Redimensionar para max 1920px
- Enfileirar upload com prioridade baixa
- Mostrar preview local imediatamente
- Fotos de KYC: prioridade alta na fila
- Fotos de road events: prioridade normal
- Documentos: manter original + comprimido
- Upload apenas em Wi-Fi (configurável)
- Upload retry automático
- Não bloquear UI durante compressão/upload
- Web Worker para compressão de imagens
- Cache de fotos em IndexedDB (blobs)
- Limitar cache de fotos a 100MB
- Fotos de perfil: sincronizar imediatamente

#### Pagamentos
- Salvar comprovante localmente (foto + dados)
- Marcar pagamento como pending_local
- Prioridade máxima na fila de sincronização
- Notificar falha de pagamento imediatamente
- Tentar sincronizar a cada 10s até sucesso
- Gerar recibo local para o usuário
- Gateway de pagamento offline não suportado
- Apenas registrar intenção de pagamento offline
- Servidor processa pagamento quando recebe
- Se pagamento falhar no servidor (cartão negado), notificar via push
- Transação local com ID único (ULID)
- Idempotência: mesma transação não é cobrada duas vezes
- Timeout de 24h para pagamento offline expirar

#### Assinaturas
- Capturar assinatura em canvas
- Salvar como SVG (menor tamanho)
- Salvar como PNG (fallback)
- Associar a documento e timestamp
- Enfileirar upload
- Prioridade normal
- Comprovação local: assinatura visível offline
- Assinatura sincronizada = assinatura válida
- Hash da assinatura para verificação

### Considerações de Armazenamento
- IndexedDB: limite recomendado 250MB
- Cache de tiles: 250MB máximo
- Cache de fotos: 100MB máximo
- Cache de mensagens: 50MB máximo
- Cache geral: 50MB máximo
- Total: 700MB máximo em disco
- Verificar espaço disponível antes de baixar tiles
- Avisar usuário se espaço < 500MB
- Estratégia LRU para limpeza automática
- Limpar caches ao atingir 80% do limite
- Prioridade de limpeza: tiles > fotos > mensagens > dados essenciais
- Compressão de dados no IndexedDB quando possível
- Período de retenção: 90 dias para dados operacionais
- Período de retenção: 30 dias para fotos e mídia
- Período de retenção: 7 dias para GPS logs
- Período de retenção: 7 dias para ações da fila
- Data essencial (preferências, perfis, veículos) retido indefinidamente
- Compactação periódica do IndexedDB
- Fallback para localStorage se IndexedDB não disponível
- Fallback para memory storage se ambos falharem
- Testes de storage em todos os browsers alvo

### Testes
- Testes unitários: OfflineManager, QueueProcessor, CacheManager
- Testes de integração: IndexedDB schema + migrações
- Testes de sincronização: fila -> servidor mock
- Testes de conflito: "last write wins" edge cases
- Testes de storage: limite de espaço e limpeza LRU
- Testes de Service Worker: cache strategies, offline page
- Testes de UI: OfflineBanner, SyncStatus, componentes offline
- Testes de performance: fila com 1000 ações
- Testes de recovery: crash durante sincronização
- Testes de migração: schema v1 -> v2
- Testes em devices reais: Android, iOS, Web
- Testes em modo avião
- Testes em conexão intermitente (toggle quick)
- Testes em 3G lento (throttle)
- Testes de espaço baixo (simular storage full)
- Testes de background sync
- Testes de retry com falhas consecutivas
- Testes de concurrent sync (múltiplos batches)
- Testes de expiração de ações
- Testes de dead letter queue

### Métricas e Monitoramento
- Total de ações offline criadas por dia
- Taxa de sucesso de sincronização
- Tempo médio de sincronização por ação
- Número de retries por ação
- Ações expiradas por dia
- Tamanho total do cache (IndexedDB + SW)
- Espaço ocupado por tipo de dados
- Número de usuários usando modo offline
- Geografia dos usuários offline (cidades sem cobertura)
- Top ações offline realizadas
- Falhas por tipo de ação (pagamento vs chat vs foto)
- Fila pendente média por usuário
- Tempo médio entre offline -> online
- Sincronizações em Wi-Fi vs dados móveis
- Consumo de dados da sincronização (bytes)
- Impacto na bateria do tracking GPS
- Erros de storage (quota exceeded)
- Performance do IndexedDB (reads/writes por segundo)
- Cache hit rate de tiles de mapa
- Dashboard de monitoramento interno
- Alertas para taxa de falha > 10%
- Alertas para fila pendente > 100 ações média
- Logs centralizados de sincronização
- Correlação entre offline mode e churn
- Satisfação do usuário com modo offline (surveys)

### Segurança Offline
- Dados sensíveis (pagamentos, documentos) criptografados em repouso
- Usar Web Crypto API para AES-GCM
- Chave derivada de senha do usuário (PBKDF2)
- Cache de senha em memória apenas (não persistir)
- Limpar dados sensíveis após sincronização bem sucedida
- Não cachear dados de pagamento completo (apenas referência)
- Documentos KYC criptografados no cache
- Fotos de documentos criptografados
- Apagar cache ao fazer logout
- Apagar cache após 15 min de inatividade (se sensível)
- Verificação de integridade dos dados (hash checksums)
- Rate limiting de tentativas de descriptografia
- Ofuscação de estrutura do IndexedDB (nomes genéricos)
- Sanitizar todos os dados ao ler do cache
- Validar dados do cache contra schema conhecido
- Proteção contra XSS no cache (dados não executáveis)
- Dados de localização GPS não são sensíveis (anonimizados)
- Política de privacidade explicando cache offline
- Opção do usuário limpar todo cache local

### Implementação Priorizada

#### Fase 1 (MVP Offline)
- Service Worker com cache de assets estáticos
- Offline detection (navigator.onLine)
- OfflineBanner componente
- Cache de preferências do usuário (localStorage)
- Fila de ações offline (IndexedDB básico)
- Sincronização FIFO ao reconectar
- Chat offline (enfileirar mensagens)

#### Fase 2
- GPS tracking offline com batch sync
- Fotos offline (compressão local, upload posterior)
- Mapa offline (download de tiles)
- Assinaturas digitais offline
- SyncStatus e PendingBadge componentes
- Prioridades na fila de sincronização
- Retry com exponential backoff

#### Fase 3
- Background sync (Service Worker sync event)
- Pagamentos offline (pending_local)
- Documentos KYC offline
- Conflitos "last write wins"
- Dead letter queue
- Download programado de tiles (Wi-Fi)
- Criptografia de dados sensíveis
- Dashboard de métricas de sincronização
- Testes completos de cenários offline
- Suporte a push notifications offline (via SW)

### Referências
- Service Worker spec: https://w3c.github.io/ServiceWorker/
- IndexedDB spec: https://w3c.github.io/IndexedDB/
- Background Sync spec: https://wicg.github.io/background-sync/spec/
- Network Information API: https://wicg.github.io/netinfo/
- Cache Storage API: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
- Web Crypto API: https://www.w3.org/TR/WebCryptoAPI/
- Workbox (Google) para SW helpers: https://developer.chrome.com/docs/workbox/
- localForage para IndexedDB wrapper: https://localforage.github.io/localForage/
- idb (IndexedDB promisified): https://github.com/jakearchibald/idb
- TanStack Query para cache de API: https://tanstack.com/query/latest
- Next.js PWA documentation
- Manifesto Offline-First: http://offlinefirst.org/
- Google Web Fundamentals - Offline & Persistence
- MDN - Progressive Web Apps
