# TXAPP — Roadmap Concorrente (400+ Features)

> Use este documento como prompt para o Open Code. Cada módulo pode ser implementado em paralelo.

---

## 1. SISTEMA DE LOGIN & ONBOARDING MULTINACIONAL

**1.1** Tela de boas-vindas com seletor de país/cidadania (bandeira + idioma)
**1.2** Login por email + senha
**1.3** Login por telefone (SMS/WhatsApp OTP)
**1.4** Login biométrico (Face ID / Touch ID nativo)
**1.5** Login por Google
**1.6** Login por Apple ID
**1.7** Login por Facebook
**1.8** Login por carteira digital (Web3 / WalletConnect)
**1.9** Reconhecimento facial na onboarding (liveness detection)
**1.10** OCR automático de documentos (CNH, RG, CPF, Passaporte, RNE)
**1.11** Validação de CPF com dígito verificador
**1.12** Validação de CNPJ
**1.13** Validação de passaporte por regex por país
**1.14** Upload de selfie com comparação biométrica contra o documento
**1.15** Onboarding multi-etapas com progresso visual
**1.16** Seleção de tipo de conta: Passageiro | Motorista | Entregador | Empresa
**1.17** Termos de uso por país (GDPR, LGPD, CCPA, etc.)
**1.18** Consentimento de dados granulares (checkbox por finalidade)
**1.19** Verificação de idade com data de nascimento
**1.20** Tela de criação de perfil com foto, bio, preferências
**1.21** Onboarding com tutorial interativo em 3D
**1.22** Seletor de moeda nativa baseado no país
**1.23** Seletor de fuso horário automático
**1.24** Verificação de elegibilidade por país (idades mínimas, leis locais)
**1.25** Documentos digitais (CNH Digital, CRLV Digital) — suporte por país
**1.26** Integração com Serasa/SPC para verificação de crédito (motoristas)
**1.27** Integração com当局 governamentais (Receita Federal, Detran)
**1.28** Videochamada de verificação (KYC humano ao vivo)
**1.29** Face match contra base do governo (API Gov.br)
**1.30** Captura de assinatura digital no onboarding
**1.31** Prova de residência (upload de conta de luz/água)
**1.32** Anti-fake: detecção de documento photoshopado
**1.33** Anti-spoofing: piscar, sorrir, virar o rosto
**1.34** Notificação de aprovado/reprovado em tempo real
**1.35** Limite de tentativas de documento (3 strikes)

---

## 2. INTERNACIONALIZAÇÃO (i18n)

**2.1** Português (Brasil)
**2.2** Português (Portugal)
**2.3** Inglês (EUA)
**2.4** Inglês (Reino Unido)
**2.5** Espanhol (Espanha)
**2.6** Espanhol (México)
**2.7** Francês (França)
**2.8** Francês (Canadá)
**2.9** Italiano
**2.10** Alemão
**2.11** Holandês
**2.12** Japonês
**2.13** Chinês Simplificado
**2.14** Chinês Tradicional
**2.15** Coreano
**2.16** Russo
**2.17** Árabe
**2.18** Hindi
**2.19** Turco
**2.20** Vietnamita
**2.21** Tailandês
**2.22** Indonésio
**2.23** Ucraniano
**2.24** Polonês
**2.25** Romeno
**2.26** Swahili
**2.27** Detecção automática de idioma (Accept-Language / geolocalização)
**2.28** Traduções em tempo real do chat (Google Translate API / DeepL)
**2.29** Formatação de números por locale (1.000,00 vs 1,000.00)
**2.30** Formatação de data por locale
**2.31** Formatação de hora por locale (12h vs 24h)
**2.32** Suporte a RTL (árabe, hebraico, urdu) — espelhamento total da UI
**2.33** Teclado virtual por idioma
**2.34** Conteúdo legal traduzido por país
**2.35** Notificações push no idioma do usuário
**2.36** SMS/Email templates por idioma
**2.37** Fallback para inglês quando tradução não existe
**2.38** Editor de traduções no admin painel
**2.39** Traduções comunitárias (crowdsourcing)
**2.40** Export/Import de traduções (JSON/CSV)

---

## 3. MÚLTIPLAS MOEDAS & PAGAMENTOS

**3.1** BRL (Real)
**3.2** USD (Dólar Americano)
**3.3** EUR (Euro)
**3.4** GBP (Libra Esterlina)
**3.5** JPY (Iene)
**3.6** CNY (Yuan)
**3.7** ARS (Peso Argentino)
**3.8** MXN (Peso Mexicano)
**3.9** COP (Peso Colombiano)
**3.10** CLP (Peso Chileno)
**3.11** PEN (Sol Peruano)
**3.12** UYU (Peso Uruguaio)
**3.13** PYG (Guarani)
**3.14** BOB (Boliviano)
**3.15** VES (Bolívar Venezuelano)
**3.16** INR (Rupia Indiana)
**3.17** THB (Baht Tailandês)
**3.18** IDR (Rupia Indonésia)
**3.19** PHP (Peso Filipino)
**3.20** NGN (Naira Nigeriana)
**3.21** ZAR (Rand Sul-Africano)
**3.22** KES (Xelim Queniano)
**3.23** EGP (Libra Egípcia)
**3.24** AED (Dirham dos EAU)
**3.25** SAR (Riyal Saudita)
**3.26** Conversão automática entre moedas (taxa atualizada a cada 5min)
**3.27** Criptomoedas: BTC, ETH, USDT, USDC, SOL
**3.28** Stablecoins como forma de pagamento
**3.29** Carteira digital interna (TX Wallet)
**3.30** Stripe Connect (cartão de crédito/débito)
**3.31** Apple Pay
**3.32** Google Pay
**3.33** Samsung Pay
**3.34** PayPal
**3.35** Mercado Pago
**3.36** PicPay
**3.37** PIX (Brasil) — pagamento e recebimento
**3.38** Boleto Bancário
**3.39** Transferência bancária (TED/PIX)
**3.40** Débito automático
**3.41** Carteira virtual com recarga (pré-pago)
**3.42** Cartão pré-pago virtual (Visa/Mastercard)
**3.43** Pagamento em dinheiro (opção offline)
**3.44** Pagamento parcelado (credário)
**3.45** Split de pagamento entre múltiplos passageiros
**3.46** Gorjeta digital (pós-corrida)
**3.47** Cashback em TX Coins
**3.48** Programa de fidelidade (pontos por corrida)
**3.49** Voucher promocional / cupom de desconto
**3.50** Plano de assinatura (passageiro frequente)
**3.51** Plano de assinatura (motorista parceiro)
**3.52** Plano corporativo (empresas com limite mensal)
**3.53** Invoice/fatura automática por email
**3.54** Nota fiscal eletrônica (NF-e / NFS-e)
**3.55** Comprovante de pagamento em PDF
**3.56** Histórico financeiro completo com filtros
**3.57** Extrato mensal exportável (CSV/PDF/OFX)
**3.58** Conciliação bancária automática
**3.59** Chargeback detection e disputa
**3.60** Anti-fraude de pagamento (Score, Geolocalização, Device Fingerprint)
**3.61** Limite de gastos por usuário
**3.62** Cartão corporativo com multi-usuários
**3.63** Saque automário (diário/semanal) para motoristas
**3.64** Saque instantâneo (taxa)
**3.65** Múltiplas contas bancárias por motorista
**3.66** Verificação de titularidade bancária
**3.67** Microcrédito para motoristas (antecipação de ganhos)
**3.68** Seguro de cancelamento
**3.69** Seguro viagem embutido
**3.70** Taxa de serviço dinâmica (demanda/oferta)

---

## 4. COMISSÃO & REPASSE (COMMISSION ENGINE)

**4.1** Comissão percentual por tipo de serviço
**4.2** Comissão fixa por corrida
**4.3** Comissão mista (fixa + percentual)
**4.4** Comissão por faixa de distância
**4.5** Comissão por faixa de valor
**4.6** Comissão dinâmica (horário de pico)
**4.7** Comissão reduzida para motoristas top-rated
**4.8** Comissão zero para primeira corrida (incentivo)
**4.9** Comissão por indicação (referral bonus)
**4.10** Taxa de cancelamento para passageiro
**4.11** Taxa de cancelamento para motorista
**4.12** Taxa de no-show (passageiro não aparece)
**4.13** Taxa de espera (minuto extra)
**4.14** Taxa de bagagem
**4.15** Taxa de pedágio (repassada)
**4.16** Taxa de aeroporto
**4.17** Taxa de chuva/surge (multiplicador)
**4.18** Taxa noturna (adicional)
**4.19** Taxa de área (regiões premium)
**4.20** Comissão para empresas parceiras (frota)
**4.21** Comissão para afiliados/indicadores
**4.22** Split automático TXD vs Motorista vs Empresa
**4.23** Split para múltiplos motoristas (viagem compartilhada)
**4.24** Split para entregas (remetente + transportadora + motorista)
**4.25** Painel de comissões no admin (edição em tempo real)
**4.26** Histórico de alteração de comissão (audit trail)
**4.27** Simulador de comissão (quanto o motorista ganha)
**4.28** Regras de comissão por cidade/estado/país
**4.29** Regras de comissão por categoria de veículo
**4.30** Regras de comissão por tipo de pagamento
**4.31** Mínimo garantido por hora para motorista
**4.32** Bônus por corridas completadas (meta diária)
**4.33** Bônus por horário de pico
**4.34** Bônus por área de demanda
**4.35** Multa por recusa de corrida
**4.36** Multa por atraso
**4.37** Retenção de imposto automática (IR, ISS)
**4.38** Relatório fiscal por país
**4.39** Geração de Danfe/CT-e para fretes
**4.40** NFC-e para cada transação

---

## 5. TRANSPORTE DE PASSAGEIROS (MOBILITY)

**5.1** TXD Moto (transporte por moto)
**5.2** TXD Moto Luxo (moto premium, capacete incluso)
**5.3** TXD Moto Entregas (pequenos objetos de moto)
**5.4** TXD Pop (carro econômico)
**5.5** TXD Comfort (carro sedã, ar condicionado)
**5.6** TXD Black (carro premium, motorista de terno)
**5.7** TXD Van (até 15 passageiros)
**5.8** TXD Executivo (transfer empresarial)
**5.9** TXD Pet (carro adaptado para animais)
**5.10** TXD Bike (transporte por bicicleta)
**5.11** TXD Patinete (transporte por patinete elétrico)
**5.12** TXD Barco (transporte aquaviário)
**5.13** TXD Helicóptero (helitáxi)
**5.14** TXD Feminino (motoristas mulheres para passageiras)
**5.15** TXD Acessível (cadeirante, rampa)
**5.16** TXD Criança (cadeirinha infantil inclusa)
**5.17** TXD Grupo (viagem em grupo, divisão de valor)
**5.18** TXD Compartilhado (carona dividindo rota)
**5.19** TXD Rotas Fixas (linhas tipo bus, horários agendados)
**5.20** TXD Escolar (transporte de estudantes)
**5.21** Agendamento de corrida (agora / depois / recorrente)
**5.22** Corrida programada semanal (ex: toda segunda 8h)
**5.23** Corrida multi-paradas (até 5 paradas)
**5.24** Corrida com volta (ida e volta)
**5.25** Cancelamento com motivo e taxa
**5.26** Repúdio de motorista (passageiro não gostou)
**5.27** Match com motorista favorito
**5.28** Lista de motoristas salvos como favoritos
**5.29** Compartilhar rota ao vivo com contato de emergência
**5.30** Botão de emergência (pânico) durante a corrida
**5.31** Alerta de velocidade (motorista acima do limite)
**5.32** Notificação de início/fim de corrida para contato
**5.33** Histórico de corridas com replay do trajeto no mapa
**5.34** Favoritos: endereços salvos (casa, trabalho, etc.)
**5.35** Busca de endereço com autocomplete preditivo
**5.36** Geocoding reverso (nome do lugar)
**5.37** Seleção no mapa (pick qualquer ponto)
**5.38** Confirmação de endereço com foto do local
**5.39** Ponto de encontro inteligente (pickup sugere local seguro)
**5.40** Estimativa de preço antes de confirmar
**5.41** Detalhamento do preço (distância, tempo, taxas)
**5.42** Preço dinâmico (surge pricing com aviso)
**5.43** Congelamento de preço (se aceitar, não muda)
**5.44** Leilão de corrida (motorista dá lance)
**5.45** Espera máxima do motorista (timer + taxa)
**5.46** Notificação "motorista chegou"
**5.47** Contagem regressiva para no-show
**5.48** Código de PIN para embarque (verificação)
**5.49** Selfie de embarque (prova de que é o passageiro)
**5.50** Check-in automático por geofence

---

## 6. TRANSPORTE DE MERCADORIAS (FREIGHT & LOGISTICS)

**6.1** TXD Carga Leve (até 100kg, furgão)
**6.2** TXD Carga Média (até 500kg, caminhão pequeno)
**6.3** TXD Carga Pesada (até 5 toneladas)
**6.4** TXD Carga Fracionada (divide espaço com outras)
**6.5** TXD Mudança (caminhão de mudança + ajudantes)
**6.6** TXD Muda Express (mudança pequena, 1 viagem)
**6.7** TXD Entrega Same-Day (entrega no mesmo dia)
**6.8** TXD Entrega Next-Day (entrega no dia seguinte)
**6.9** TXD Entrega Scheduled (agendada)
**6.10** TXD Entrega Flash (30 minutos)
**6.11** TXD Documentos (malote, documentos)
**6.12** TXD Alimentos (refeição, mercado)
**6.13** TXD Farmácia (medicamentos e delivery)
**6.14** TXD Bebidas (caixas de bebida)
**6.15** TXD Moto Entrega (entregas de moto, até 10kg)
**6.16** TXD Bike Entrega (entregas de bike, até 5kg)
**6.17** TXD Internacional (frete entre países)
**6.18** TXD Interestadual (frete entre estados)
**6.19** TXD Carga Frigorificada (caminhão refrigerado)
**6.20** TXD Carga Perigosa (produtos químicos, licença)
**6.21** TXD Carga Viva (animais, transporte regulado)
**6.22** TXD Carga Pesada Especial (guindaste, escolta)
**6.23** Cotação automática de frete (peso x distância x volume)
**6.24** Cálculo por cubagem (peso volumétrico)
**6.25** Cálculo por km rodado
**6.26** Cálculo por eixo do caminhão
**6.27** Cálculo por tipo de carga
**6.28** Seguro de carga integrado (valor declarado)
**6.29** Rastreamento de carga em tempo real (GPS + foto)
**6.30** Prova de entrega (foto + assinatura digital)
**6.31** Código de autorização para retirada
**6.32** Código de autorização para entrega
**6.33** Notificação ao remetente (retirada confirmada)
**6.34** Notificação ao destinatário (saiu para entrega)
**6.35** Notificação ao destinatário (entregue)
**6.36** Notificação com ETA preciso ao destinatário
**6.37** Mapa ao vivo compartilhado com remetente e destinatário
**6.38** Cancelamento de frete com política
**6.39** Reagendamento de coleta
**6.40** Reagendamento de entrega
**6.41** Histórico de entregas do motorista
**6.42** Histórico de fretes da empresa
**6.43** Manifesto de carga digital
**6.44** CT-e (Conhecimento de Transporte Eletrônico)
**6.45** MDF-e (Manifesto Eletrônico)
**6.46** Danfe (Documento Auxiliar)
**6.47** Gestão de frota (admin empresa)
**6.48** Gestão de motoristas (admin empresa)
**6.49** Gestão de veículos (admin empresa)
**6.50** Gestão de rotas (admin empresa)
**6.51** Roteirização otimizada (múltiplas entregas)
**6.52** Otimização de carga (aproveitamento de espaço)
**6.53** Plataforma de marketplace de fretes (carga disponível)
**6.54** Lance em frete disponível (transportadores)
**6.55** Leilão reverso de frete
**6.56** Contrato de frete mensal (empresa fecha pacote)
**6.57** Nota de remetente (avaliação)
**6.58** Prova de coleta (foto)
**6.59** Romaneio de carga digital
**6.60** Checklist de saída do veículo (fotos)

---

## 7. CHAT & COMUNICAÇÃO (REAL-TIME)

**7.1** Chat motorista ↔ passageiro
**7.2** Chat motorista ↔ empresa
**7.3** Chat passageiro ↔ suporte
**7.4** Chat empresa ↔ suporte
**7.5** Chat motorista ↔ motorista (grupos de área)
**7.6** Chat grupo de viagem (carona compartilhada)
**7.7** Chat grupo de frota (empresa com motoristas)
**7.8** Mensagens de texto
**7.9** Mensagens de voz (áudio gravado)
**7.10** Mensagens de voz transcritas para texto
**7.11** Envio de fotos
**7.12** Envio de vídeos (curtos, até 30s)
**7.13** Envio de documentos (PDF, DOC)
**7.14** Envio de localização atual
**7.15** Envio de contato (compartilhar)
**7.16** Emojis e reações
**7.17** Stickers personalizados da TXD
**7.18** GIFs integrados (Giphy API)
**7.19** Mensagens pré-programadas (quick replies)
**7.20** Mensagem programada (ex: "Estou chegando em 5 min")
**7.21** Notificação de "digitando..."
**7.22** Confirmação de entrega (✓)
**7.23** Confirmação de leitura (✓✓)
**7.24** Criptografia ponta a ponta (E2EE)
**7.25** Chat expirável (auto-delete pós corrida)
**7.26** Moderação automática (profanity filter)
**7.27** Moderação por IA (conteúdo impróprio)
**7.28** Bloqueio de contato
**7.29** Denúncia de mensagem
**7.30** Silenciar notificações do chat
**7.31** Chat persistente entre corridas (motorista favorito)
**7.32** Chat com suporte por ticket (histórico)
**7.33** Chat com suporte por IA (chatbot)
**7.34** Chat com suporte humano (live agent)
**7.35** Chat com suporte multilíngue em tempo real
**7.36** Chat de emergência (Canal direto com segurança)
**7.37** Compartilhar tela (suporte remoto)
**7.38** Chat em grupo com administrador da corrida
**7.39** Auto-respostas do sistema (ex: "Seu motorista chegou")
**7.40** Notificações push de mensagens
**7.41** Resposta rápida no notification shade
**7.42** Indicador de chat não lido
**7.43** Pesquisa no histórico de mensagens
**7.44** Exportar chat (PDF/TXT)
**7.45** Chat anônimo (motorista não vê número do passageiro)
**7.46** Números mascarados (ligação anônima)
**7.47** Ligação por VoIP dentro do app
**7.48** Videochamada (suporte ou verificação)
**7.49** Gravação de chamada (consentimento)
**7.50** Chat offline com fila de mensagens

---

## 8. REALIDADE AUMENTADA & 3D

**8.1** Splash screen 3D animada (logo TXD girando)
**8.2** Fundo 3D na tela de login (partículas animadas)
**8.3** Mapa 3D com edifícios (Google Maps 3D / Mapbox 3D)
**8.4** Carro 3D do motorista no mapa (modelo realista)
**8.5** Animação 3D de chegada do motorista (confete/partículas)
**8.6** AR Camera para encontrar o carro (seta no mundo real)
**8.7** AR Navigation (setas no chão via câmera)
**8.8** AR para calcular volume de carga (escaneia a caixa)
**8.9** Avatar 3D do usuário no perfil
**8.10** Efeitos de partículas (névoa, faíscas, chuva)
**8.11** Transições animadas entre telas (page transitions)
**8.12** Animação de loading 3D (carro correndo)
**8.13** Animação de confete ao completar 100 corridas
**8.14** Modelo 3D interativo do veículo (gire e veja)
**8.15** Fundo animado com ondas/partículas no dashboard
**8.16** Animação de ondas sonoras no chat de áudio
**8.17** Efeito de vidro fosco (glassmorphism) com blur animado
**8.18** Gradientes animados (shimmer effect)
**8.19** Tema neon com glow pulsante
**8.20** Efeito parallax no scroll
**8.21** Micro-interações: botão pulsa ao clicar
**8.22** Haptic feedback (vibração) em ações
**8.23** Animação de like/coração ao avaliar
**8.24** Animação de estrelas ao dar nota
**8.25** Animação de dinheiro/subindo (ganhos do motorista)
**8.26** Three.js / React Three Fiber (3D scenes)
**8.27** Fogos de artifício 3D em conquistas
**8.28** Efeito de mapa de calor 3D (zonas de demanda)
**8.29** Raycasting para interação com objetos 3D
**8.30** Realidade aumentada para mostrar preço da corrida no chão

---

## 9. DESIGN & EXPERIÊNCIA VISUAL (UI/UX)

**9.1** Tema escuro nativo (dark mode)
**9.2** Tema claro opcional
**9.3** Tema dinâmico (muda cor baseado na cidade)
**9.4** Modo noturno automático (sensor de luz)
**9.5** Cores vibrantes neon (roxo, verde, azul elétrico)
**9.6** Gradientes em todos os cards
**9.7** Glassmorphism em modais e painéis
**9.8** Esquema de cores por tipo de serviço (moto=amarelo, carro=roxo, frete=azul)
**9.9** Ícones animados (lottie animations)
**9.10** Splash screen animada personalizada
**9.11** Loading skeleton personalizado
**9.12** Pull-to-refresh com animação TXD
**9.13** Swipe gestures (deslizar para aceitar, cancelar)
**9.14** Bottom sheet com transição suave
**9.15** Cartões expansíveis com acordeão
**9.16** Tab bar animada (iOS-style)
**9.17** Floating action button (FAB) animado
**9.18** Menu radial (circular) no motorista
**9.19** Grade de serviços com ícones grandes e cores
**9.20** Tipografia personalizada (TX Font)
**9.21** Fontes variáveis (weight dinâmico)
**9.22** Ícones customizados (não apenas Lucide)
**9.23** Responsividade total (mobile, tablet, desktop)
**9.24** Modo paisagem no mapa
**9.25** Suporte a telas dobravéis (foldable)
**9.26** Suporte a notch / Dynamic Island
**9.27** Widgets iOS/Android (preço da corrida na tela inicial)
**9.28** Live Activities (iOS) para corrida ativa
**9.29** Always-On Display support
**9.30** Redesign sazonal (Natal, Carnaval, Halloween)
**9.31** Modo festival (cores vibrantes, animações extras)
**9.32** Temas colecionáveis (NFT-themed)
**9.33** Customização de cores do app pelo usuário
**9.34** Modo daltônico (acessibilidade)
**9.35** Fontes acessíveis (dislexia friendly)
**9.36** Legendas em áudios do chat
**9.37** VoiceOver / TalkBack suporte total
**9.38** Alto contraste opcional
**9.39** Redução de movimento opcional
**9.40** Modo de navegação simplificada (motorista)

---

## 10. MAPA & GEOLOCALIZAÇÃO

**10.1** Google Maps como provedor principal
**10.2** Mapbox como fallback
**10.3** OpenStreetMap (camada gratuita)
**10.4** Mapa com tema escuro customizado
**10.5** Mapa com tema claro
**10.6** Mapa 3D com edifícios
**10.7** Mapa de satélite
**10.8** Mapa de trânsito ao vivo
**10.9** Camada de calor (zonas quentes de corrida)
**10.10** Camada de chuva/clima no mapa
**10.11** Marcadores animados para motoristas próximos
**10.12** Marcador do passageiro (pulse animation)
**10.13** Rota desenhada no mapa com animação (carro andando)
**10.14** Polilinha da rota com cor gradiente
**10.15** Pontos de referência (postos, hospitais, polícia)
**10.16** Geocercas (zonas de exclusão, prioridade)
**10.17** Geofencing para preço dinâmico
**10.18** Snap to road (corrigir GPS para a via)
**10.19** Reverse geocoding com cache
**10.20** Autocomplete de endereços com throttle
**10.21** Place Details (foto, horário, telefone do local)
**10.22** Integração com Foursquare / Yelp (pontos de interesse)
**10.23** Distância real vs distância linear
**10.24** Cálculo de ETA com trânsito
**10.25** Rotas alternativas (3 opções)
**10.26** Evitar pedágio (preferência do passageiro)
**10.27** Evitar estrada de terra
**10.28** Evitar rodovia
**10.29** Rota mais econômica (combustível)
**10.30** Rota mais rápida
**10.31** Street View integrado (ver local antes de ir)
**10.32** Bússola no mapa (orientação)
**10.33** Zoom automático no trajeto
**10.34** Follow mode (câmera segue o carro)
**10.35** Modo picture-in-picture (mapa em miniatura)
**10.36** Bateria otimizada (modo de localização econômico)
**10.37** Background location (funciona com app fechado)
**10.38** Geofencing para check-in automático
**10.39** Beacon Bluetooth para embarque em estacionamento
**10.40** Integração com Waze (via deep link)

---

## 11. NOTIFICAÇÕES & COMUNICAÇÃO

**11.1** Push notification (Firebase Cloud Messaging)
**11.2** Push notification (APNs - Apple)
**11.3** Push notification (Web Push API)
**11.4** SMS de confirmação (Twilio / AWS SNS)
**11.5** WhatsApp notification (Business API)
**11.6** Email notification (Resend / SendGrid)
**11.7** In-app notification center
**11.8** Badge count no ícone do app
**11.9** Notificação local (lembrete de corrida agendada)
**11.10** Notificação rica (imagem, botões de ação)
**11.11** Notificação de promoção (cupom, desconto)
**11.12** Notificação de status (motorista a caminho)
**11.13** Notificação de pagamento recebido
**11.14** Notificação de avaliação recebida
**11.15** Notificação de documento expirando
**11.16** Notificação de verificação pendente
**11.17** Notificação de meta atingida
**11.18** Notificação de bônus disponível
**11.19** Notificação de área de alta demanda
**11.20** Agrupamento inteligente de notificações
**11.21** Preferências de notificação (que receber)
**11.22** Quiet hours (não perturbe)
**11.23** Notificação de segurança (viagem suspeita)
**11.24** Notificação de recall (problema no veículo)
**11.25** Notificação de atualização do app

---

## 12. DASHBOARD DO PASSAGEIRO

**12.1** Home: serviços disponíveis (grade)
**12.2** Campo "Para onde você vai?" com autocomplete
**12.3** Mapa com heatmap de motoristas
**12.4** Preço estimado por categoria
**12.5** Histórico de corridas (lista + mapa replay)
**12.6** Favoritos (endereços salvos)
**12.7** Formas de pagamento (gerenciar)
**12.8** Carteira TXD (saldo, extrato)
**12.9** Programa de fidelidade (pontos, nível)
**12.10** Minhas avaliações (notas dadas)
**12.11** Motoristas favoritos
**12.12** Corridas agendadas (próximas)
**12.13** Central de ajuda / FAQ
**12.14** Suporte (chat + tickets)
**12.15** Meus dados (perfil)
**12.16** Notificações (histórico)
**12.17** Configurações
**12.18** Indicar amigos (referral link)
**12.19** Promoções ativas
**12.20** Cartão TXD (programa de assinatura)
**12.21** Segurança (contatos de emergência)
**12.22** Dashboard de gastos mensais (gráfico)
**12.23** Comparativo de preços entre categorias
**12.24** Estimador de preço (calculadora)
**12.25** Mapa de zonas (preço dinâmico)

---

## 13. DASHBOARD DO MOTORISTA

**13.1** Home: status ONLINE / OFFLINE (toggle grande)
**13.2** Mapa com áreas de calor (demanda)
**13.3** Fila de corridas disponíveis
**13.4** Card de oferta de corrida (valor, distância, destino)
**13.5** Timer de decisão (15s para aceitar)
**13.6** Navegação integrada (Google Maps / Waze)
**13.7** Painel de ganhos hoje (tempo real)
**13.8** Painel de ganhos da semana
**13.9** Painel de ganhos do mês
**13.10** Extrato financeiro detalhado
**13.11** Saque (agendar, instantâneo)
**13.12** Conta bancária (gerenciar)
**13.13** Métricas: KM rodados hoje
**13.14** Métricas: corridas hoje
**13.15** Métricas: taxa de aceitação
**13.16** Métricas: taxa de cancelamento
**13.17** Métricas: nota média
**13.18** Métricas: tempo online
**13.19** Métricas: gorjetas recebidas
**13.20** Gráfico de ganhos (linha do tempo)
**13.21** Mapa de calor pessoal (onde mais ganha)
**13.22** Bônus e metas (progresso visual)
**13.23** Nível do motorista (Bronze, Prata, Ouro, Platina)
**13.24** Badges de conquista
**13.25** Histórico de corridas (com detalhes)
**13.26** Avaliações recebidas (com comentários)
**13.27** Documentos (status de verificação)
**13.28** Perfil do motorista (foto, bio, veículo)
**13.29** Gerenciar veículos (adicionar, remover)
**13.30** Documentos do veículo (status)
**13.31** Áreas de preferência (onde quer rodar)
**13.32** Horários de preferência
**13.33** Modo destino (voltar para casa, recebe corridas no caminho)
**13.34** Filtro de corrida (só aceita certos tipos)
**13.35】 Modo férias (pausa longa)
**13.36** Central de ajuda específica motorista
**13.37** Suporte prioritário (motorista top)
**13.38** Fórum de motoristas (comunidade)
**13.39** Avisos (manutenção do app, legislação)
**13.40** Termos de motorista parceiro
**13.41** Escala de motorista de frota (empresa)
**13.42** Checklist diário do veículo (fotos obrigatórias)
**13.43** Relatório de segurança (incidentes reportados)
**13.44** Seguro do veículo (status, renovação)
**13.45** Financiamento de veículo (parcerias)
**13.46** Abastecimento mais barato (parceiros)
**13.47** Mecânicos parceiros (desconto)
**13.48** Mapa de postos com preço de combustível
**13.49** Alerta de manutenção preventiva
**13.50** Declaração de imposto de renda (relatório anual)

---

## 14. DASHBOARD EMPRESA (B2B)

**14.1** Gestão de frota (veículos)
**14.2** Gestão de motoristas (vínculo, escala)
**14.3** Gestão de entregas (fretes ativos)
**14.4** Criação de fretes (solicitar coleta)
**14.5** Relatórios de entregas (PDF/CSV)
**14.6** Dashboard de gastos (gráficos)
**14.7** Faturamento mensal (NF por período)
**14.8** Múltiplas contas de usuário (administradores)
**14.9** Limite de gastos por funcionário
**14.10** Aprovação de viagens (workflow)
**14.11** Centro de custos por departamento
**14.12** Relatório de sustentabilidade (CO2 economizado)
**14.13** API corporativa (integração com SAP/ERP)
**14.14** Webhook de eventos (corrida criada, finalizada)
**14.15** Suporte empresarial 24/7
**14.16** Contrato personalizado (condições comerciais)
**14.17** SLA (tempo máximo de espera)
**14.18** Motoristas dedicados (frota exclusiva)
**14.19** Painel de rotas mais usadas
**14.20** Alerta de gastos (orçamento estourado)

---

## 15. ADMIN PAINEL (BACKOFFICE COMPLETO)

**15.1** Dashboard geral (receita, usuários, corridas)
**15.2** Gestão de usuários (CRUD, blocK, filter)
**15.3** Gestão de motoristas (aprovação KYC)
**15.4** Gestão de empresas (aprovação)
**15.5** Gestão de corridas (status, cancelar, reembolsar)
**15.6** Gestão de fretes (monitorar)
**15.7** Gestão de pagamentos (estornos)
**15.8** Gestão de commission (regras)
**15.9** Gestão de promoções (cupons, descontos)
**15.10** Gestão de categorias (preços por cidade)
**15.11** Gestão de áreas (geocercas, preço dinâmico)
**15.12** Gestão de conteúdo (banners, notificações push)
**15.13** Gestão de traduções (i18n editor)
**15.14** Gestão de suporte (tickets, chat)
**15.15** Gestão de documentos (auditoria)
**15.16** Gestão de fraudes (flagged users)
**15.17** Relatórios de receita (daily, weekly, monthly)
**15.18** Relatórios de corridas completadas
**15.19** Relatórios de motoristas online
**15.20** Relatórios de tempo médio de espera
**15.21** Relatórios de satisfação (NPS)
**15.22** Relatórios de churn (motoristas)
**15.23** Relatórios de churn (passageiros)
**15.24** Exportação de dados (CSV, JSON, Excel)
**15.25** Logs de auditoria (quem fez o que)
**15.26** Gestão de admins (RBAC, permissões)
**15.27** Gestão de cidades (ativar/desativar)
**15.28** Simulador de preço (admin testa)
**15.29** Visualização de mapa (todas as corridas ativas)
**15.30** Modo manutenção (app em manutenção por cidade)
**15.31** Gestão de versão do app (force update)
**15.32** Analytics (GA4 / Mixpanel / Amplitude)
**15.33** Mapa de calor de usuários
**15.34** Funnel de conversão (cadastro → primeira corrida)
**15.35** Retenção de motoristas (coorte)
**15.36** Notificação de queda de servidor
**15.37** Backup e restore (um clique)
**15.38** Gestão de APIs externas (chaves, limites)
**15.39** Webhook receiver (eventos externos)
**15.40** Health check dos serviços

---

## 16. SEGURANÇA & COMPLIANCE

**16.1** Autenticação 2FA (TOTP)
**16.2** Autenticação 2FA (SMS)
**16.3** Autenticação 2FA (email)
**16.4** Biometria (digital, facial)
**16.5** Chave de segurança física (WebAuthn)
**16.6** Criptografia de dados em repouso (AES-256)
**16.7** Criptografia de dados em trânsito (TLS 1.3)
**16.8** E2EE no chat
**16.9** Mascaramento de telefone (chamadas anônimas)
**16.10** Mascaramento de email
**16.11** Token de sessão rotativo
**16.12** Logout remoto (admin desloga usuário)
**16.13** Rate limiting (proteção contra brute force)
**16.14** Captcha (reCAPTCHA v3 / Cloudflare Turnstile)
**16.15** Detecção de device rootado/jailbreak
**16.16** Detecção de emulador
**16.17** Detecção de GPS falso (mock location)
**16.18** Anti-fraude de pagamento
**16.19** Anti-fraude de cadastro (documento duplicado)
**16.20** Anti-fraude de corrida (motorista fantasma)
**16.21** Análise comportamental (velocidade, padrões)
**16.22** Verificação de motorista por vídeo
**16.23** Botão de pânico (corrida)
**16.24** Alerta de rota não usual
**16.25** Alerta de parada prolongada
**16.26** Compartilhamento de local com emergência
**16.27** Contatos de emergência (até 5)
**16.28** LGPD compliance (Brasil)
**16.29** GDPR compliance (Europa)
**16.30** CCPA compliance (Califórnia)
**16.31** COPPA compliance (menores)
**16.32** PCI DSS compliance (pagamentos)
**16.33** SOX compliance (empresas públicas)
**16.34** Política de retenção de dados
**16.35** Direito ao esquecimento (excluir dados)
**16.36** Portabilidade de dados (download zip)
**16.37** Consentimento granular
**16.38** Cookie consent banner
**16.39** Termo de uso por país
**16.40** Política de privacidade por país

---

## 17. PERFORMANCE & OFFLINE

**17.1** Service Worker (PWA)
**17.2** Cache de mapa em modo offline
**17.3** Cache de preços (última cotação offline)
**17.4** Enfileiramento de ações offline (fila de sincronização)
**17.5** Banner de "modo offline" com reconexão automática
**17.6** Imagens otimizadas (WebP, AVIF)
**17.7** Lazy loading de componentes
**17.8** Code splitting por rota
**17.9** Virtual list (grandes listas)
**17.10** Infinite scroll (histórico, chat)
**17.11** Compressão de áudio (chat de voz)
**17.12** Compressão de imagem (upload)
**17.13** Skeleton loading em todas as telas
**17.14** Prefetch de dados (páginas seguintes)
**17.15** CDN para assets estáticos
**17.16** Edge Functions (cálculos próximos ao usuário)
**17.17** Database indexes estratégicos
**17.18** Query optimization (N+1 prevention)
**17.19** Redis cache (preços, distâncias)
**17.20** Real-time com WebSocket (otimizado)
**17.21** Batched notifications (agrupar push)
**17.22** Throttle de GPS (economia de bateria)
**17.23** Background fetch (iOS/Android)
**17.24** Redução de payload (GraphQL ou REST otimizado)
**17.25** Monitoramento de performance (Sentry / DataDog)
**17.26** Logs estruturados (ELK / Grafana)
**17.27** Alertas de latência alta
**17.28** Auto-scaling (infra)
**17.29** Load balancing
**17.30** Multi-region database (latência baixa)

---

## 18. MICRO-SERVIÇOS & ARQUITETURA

**18.1** Auth Service (Supabase Auth + JWT)
**18.2** KYC Service (verificação documental)
**18.3** Mobility Service (motor de corridas)
**18.4** Freight Service (motor de fretes)
**18.5** Dispatch Service (algoritmo de matching)
**18.6** Payment Service (Stripe + wallets)
**18.7** Notification Service (push, SMS, email)
**18.8** Chat Service (WebSocket + E2EE)
**18.9** Rating Service (avaliações)
**18.10** Analytics Service (eventos)
**18.11** Fraud Service (detecção de fraude)
**18.12** Commission Service (cálculo de taxas)
**18.13** Pricing Service (preço dinâmico)
**18.14** Location Service (rastreio GPS)
**18.15** Map Service (abstração de mapas)
**18.16** File Service (upload de documentos)
**18.17** Translation Service (i18n + tradução)
**18.18** AI Service (chatbot, moderação)
**18.19** Webhook Gateway (eventos externos)
**18.20** Admin API (backoffice)

---

## 19. INTELIGÊNCIA ARTIFICIAL & ML

**19.1** Preço preditivo (IA sugere preço ideal)
**19.2** ETA inteligente (IA ajusta com histórico)
**19.3** Rota otimizada (ML aprende rotas mais rápidas)
**19.4** Matching inteligente (motorista ideal para passageiro)
**19.5** Detecção de fraude (ML model)
**19.6** Moderação de chat (NLP)
**19.7** Chatbot de suporte (GPT / Claude)
**19.8** Transcrição de áudio (chat de voz → texto)
**19.9** Tradução automática de mensagens
**19.10** OCR de documentos (extração automática)
**19.11** Reconhecimento facial (face match)
**19.12** Liveness detection (anti-spoofing)
**19.13** Recomendação de motorista (baseado em preferências)
**19.14** Recomendação de promoção (baseado em hábitos)
**19.15** Previsão de demanda (zonas quentes)
**19.16** Previsão de oferta (motoristas offline)
**19.17** Precificação dinâmica (surge com ML)
**19.18** Análise de sentimento (feedback do passageiro)
**19.19** Geração automática de relatórios
**19.20** Detecção de sono do motorista (câmera)

---

## 20. EXTRAS & DIFERENCIAIS COMPETITIVOS

**20.1** Modo carona solidária (passageiros dividem)
**20.2** TXD Mulher (só motoristas mulheres)
**20.3** Modo Pet (motoristas que aceitam animais)
**20.4** TXD Economia (carona em rota já existente)
**20.5** TXD Turismo (guia + motorista)
**20.6** TXD Compras (motorista faz compras pra você)
**20.7** TXD Chave (buscar pessoa bêbada em casa)
**20.8** TXD Mecânico (reboque e assistência)
**20.9** TXD Saúde (transporte de pacientes, cadeira de rodas)
**20.10** TXD Vacina (transporte para posto de saúde)
**20.11** Programa de fidelidade com níveis
**20.12** Milhas TXD (acumula e troca por corridas)
**20.13** Parceria com bancos (pontos do cartão viram TXD)
**20.14** Parceria com postos de gasolina (desconto)
**20.15** Parceria com montadoras (desconto em carro novo)
**20.16** Parceria com seguradoras (seguro especial)
**20.17** Marketplace de serviços automotivos
**20.18** Loja de merchandise TXD
**20.19** NFT de conquista (badge colecionável na blockchain)
**20.20** Gamificação: ranking de motoristas na cidade
**20.21** Gamificação: desafios semanais
**20.22** Leaderboard de motoristas (por cidade)
**20.23** Mapa de conquistas (estilo Xbox achievements)
**20.24** Selo de verificado (motorista premium)
**20.25** Perfil público do motorista (portfólio)
**20.26** Prova social (corridas completadas com selo)
**20.27** Reviews com fotos do veículo
**20.28** Votação da comunidade (melhor motorista do mês)
**20.29** Eventos TXD (encontros de motoristas)
**20.30** TXD Festival (desconto em eventos parceiros)
**20.31** TXD Music (playlist integrada Spotify/Apple Music)
**20.32** TXD Podcast (conteúdo exclusivo para motoristas)
**20.33** Modo karaokê (só por diversão)
**20.34** Integração com calendário (Google Calendar, Outlook)
**20.35** Integração com CRM (HubSpot, Salesforce)
**20.36** Integração com ERP (SAP, Oracle, Totvs)
**20.37** TXD API pública (terceiros integram)
**20.38** TXD SDK (React Native, Flutter, Swift, Kotlin)
**20.39** Webhook público (eventos em tempo real)
**20.40** Plugin para WordPress / Shopify (e-commerce) 
**20.41** Plugin para iFood / Rappi (delivery)
**20.42** Smartwatch app (Apple Watch, Wear OS)
**20.43** Tablet mode (motorista usa tablet como central)
**20.44** Android Auto / Apple CarPlay (modo motorista)
**20.45** Comandos de voz ("TXD, me leve para casa")
**20.46** Auto-pilot mode (app sugere ações)
**20.47** Dark store integration (micro-centros de distribuição)
**20.48** Lockers inteligentes (entrega em armário)
**20.49** Drone delivery (visão futura)
**20.50** Carro autônomo (preparação para API Waymo/Tesla)

---

## 21. INFRAESTRUTURA & DEVOPS

**21.1** Docker containerização
**21.2** CI/CD pipeline (GitHub Actions)
**21.3** Testes unitários (Jest + React Testing Library)
**21.4** Testes de integração
**21.5** Testes E2E (Playwright / Cypress)
**21.6** Testes de carga (k6)
**21.7** Testes de segurança (OWASP ZAP)
**21.8** Lint automatizado (ESLint, Prettier)
**21.9** TypeScript strict mode
**21.10** Husky + lint-staged (pre-commit)
**21.11** SonarQube (qualidade de código)
**21.12** Vercel deployment (frontend)
**21.13** Supabase hosting (backend)
**21.14** Cloudflare (DNS, CDN, DDoS)
**21.15** AWS S3 / Cloudflare R2 (uploads)
**21.16** Redis Upstash (cache)
**21.17** Monitoring (Sentry, Logtail)
**21.18** Uptime monitoring (Better Uptime)
**21.19** Feature flags (GrowthBook / LaunchDarkly)
**21.20** A/B testing framework
**21.21** Error tracking (Sentry)
**21.22** Performance monitoring (Lighthouse CI)
**21.23** Analytics (Plausible / PostHog)
**21.24** Backup automático do banco
**21.25** Disaster recovery plan
**21.26** Staging environment
**21.27** Canary releases
**21.28** Blue-green deployment
**21.29** IaC (Terraform / Pulumi)
**21.30** Kubernetes (orquestração futura)

---

## 22. MODO CONVERSACIONAL & COMUNIDADE

**22.1** Feed social de motoristas (posts, fotos)
**22.2** Grupos de motoristas por cidade
**22.3** Fórum de dúvidas (FAQ dinâmico)
**22.4** Avaliação pública de corridas (feedbacks)
**22.5** Dicas de trânsito compartilhadas
**22.6** Alerta de blitz/radar (compartilhado)
**22.7** Mapa colaborativo (postos, perigos)
**22.8** Denúncia de assédio (canal direto)
**22.9** Campanhas de segurança viária
**22.10** Programa de embaixadores (motoristas influenciadores)
**22.11** Lives TXD (streaming de eventos)
**22.12** TXD TV (conteúdo exclusivo no app)
**22.13** Classificados (motoristas vendem serviços)
**22.14** Indicação em cadeia (rede de referral)
**22.15** Eventos presenciais (encontros)
**22.16** Sorteios e promoções dentro do app
**22.17** Pesquisa de satisfação (pós-corrida)
**22.18** Votação de funcionalidades (feature request)
**22.19** Roadmap público (changelog no app)
**22.20** Bug bounty (reportar bugs ganha crédito)

---

## TOTAL: ~850+ FEATURES

> Use este documento seção por seção como prompt para o Open Code. Exemplo:

```
Open Code, implemente os itens 5.1 a 5.10 do ROADMAP-COMPLETO.md (categorias de transporte TXD Moto, Pop, Comfort, etc.)
```

> Para o visual 3D e animações: use `framer-motion` (já instalado), `three.js` / `@react-three/fiber`, e `lottie-react` para animações leves. As cores vibrantes já estão configuradas no `globals.css` com o tema escuro neon.
