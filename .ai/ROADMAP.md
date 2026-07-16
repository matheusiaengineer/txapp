# TXDAPP — Roadmap de Execução

## Estratégia

Lançar com dois fluxos sólidos: **corridas + entregas locais**. Depois expandir para empresas, fretes e marketplace.

Cada fase só começa quando a anterior está 100% operacional.

---

## FASE 0 — Fundação ✅
- [x] Next.js 16 + React 19 + TypeScript strict
- [x] Tema escuro, glassmorphism, animações globais
- [x] Estrutura `.ai/` com 21 arquivos de especificação
- [x] i18n (15 idiomas, RTL)
- [x] Global Config Engine (cidades configuráveis)

---

## FASE 1 — Cadastro, Login e Perfis 🔄
- [ ] Supabase Auth real (email + telefone + magic link)
- [ ] Cadastro multi-perfil (passageiro, motorista, empresa, admin)
- [ ] Login com persistência de sessão
- [ ] Recuperação de senha
- [ ] Onboarding 6-step com documentos por país
- [ ] Perfil público do motorista (foto, descrição, veículo, avaliação)

### Tabelas necessárias
- `users` / `profiles`
- `drivers` (dados estendidos)
- `vehicles`
- `companies`

---

## FASE 2 — KYC e Documentos
- [ ] Upload de documentos (Storage Supabase, buckets privados)
- [ ] OCR + liveness detection
- [ ] Fluxo de aprovação (pending → under_review → approved/rejected)
- [ ] Selfie obrigatória
- [ ] Foto do veículo (4 ângulos)
- [ ] Nenhum motorista aceita corridas antes da aprovação

### Tabelas
- `kyc_documents`
- `driver_verification_status`

---

## FASE 3 — Google Maps e Rotas
- [ ] Mobility Engine com Google Maps Provider
- [ ] Google Places API (autocomplete de endereços)
- [ ] Google Directions API (cálculo de rota + ETA)
- [ ] Google Distance Matrix (batch ETA para dispatch)
- [ ] Google Geocoding / Reverse Geocoding
- [ ] Google Traffic Layer (trânsito em tempo real)
- [ ] Google Roads API (snap to road para tracking)
- [ ] Location autocomplete com debounce

### Fluxo
```
Usuário → Permite GPS → Obtém localização → Busca endereço →
Seleciona destino → Calcula rota → Calcula ETA → Confirma
```

---

## FASE 4 — Tracking em Tempo Real
- [ ] GPS do motorista → Supabase Realtime
- [ ] Passageiro acompanha no mapa
- [ ] Mapa se movimenta em tempo real
- [ ] Snap to road (corrigir ruído do GPS)
- [ ] Histórico de rota (polyline codificada)
- [ ] Atualização a cada 3 segundos

### Tabelas
- `driver_locations` (índice GiST para queries geoespaciais)
- `tracking_history`

---

## FASE 5 — Corridas (MVP)
- [ ] Solicitar corrida (origem → destino → categoria)
- [ ] Score Dispatch (10 fatores, DB-driven)
- [ ] Batch offer (top 3 motoristas simultaneamente)
- [ ] Timeout 15s por motorista
- [ ] Aceitar / rejeitar corrida
- [ ] Cancelamento (passageiro e motorista)
- [ ] Iniciar viagem
- [ ] Finalizar viagem
- [ ] Cálculo de preço: distância × km + tempo × min + taxa base
- [ ] Preço dinâmico (surge) configurável por cidade
- [ ] Negociação: passageiro oferece valor, motorista aceita/recusa/contraoferta
- [ ] Notificações push (nova corrida, motorista a caminho, etc.)

### Tabelas
- `rides` (status: searching → offered → accepted → started → completed → cancelled)
- `ride_requests` (score, status, cancel_risk)
- `dispatcher_rules` (pesos configuráveis)
- `driver_scores`

---

## FASE 6 — Pagamentos (Stripe)
- [ ] Stripe Connect (contas Standard para BR)
- [ ] PIX (pagamento instantâneo, QR Code)
- [ ] Cartão de crédito/débito (Stripe PaymentElement)
- [ ] Dinheiro (registro de saldo devedor do motorista)
- [ ] Split automático: passageiro paga X → Stripe → plataforma + motorista
- [ ] Carteira digital (saldo, bloqueado, disponível)
- [ ] Saque para conta bancária
- [ ] Crédito de ativação (R$25 configurável por admin)
- [ ] Cashback e bônus de indicação
- [ ] Extrato e histórico de transações

### Fluxo Dinheiro
```
Passageiro paga R$25 em dinheiro → Motorista recebe R$25 →
Sistema registra: Motorista deve R$3,75 (comissão) →
Próximas corridas ou saque: saldo devedor é descontado automaticamente
```

### Tabelas
- `wallets` (saldo, bloqueado, créditos)
- `transactions` (depósito, saque, pagamento, comissão, cashback)
- `driver_balance` (saldo devedor de corridas em dinheiro)
- `payment_methods`

---

## FASE 7 — Avaliações e Histórico
- [ ] Avaliação por critérios:
  - Passageiro: educação, pontualidade, pagamento
  - Motorista: direção, simpatia, veículo, pontualidade
  - Entrega: produto correto, embalagem, tempo, foto
  - Empresa: atendimento, organização, tempo, precisão
- [ ] Favoritos (motoristas favoritos, rotas favoritas)
- [ ] Histórico completo de corridas

### Tabelas
- `ratings`
- `favorites`

---

## FASE 8 — Entregas
- [ ] Fluxo de entrega pessoal:
  1. Cliente seleciona ENTREGA
  2. Origem → Destino → Descrição → Peso → Foto → Valor
  3. Motoristas recebem → Aceita → Busca → Entrega
  4. Foto da entrega + GPS + Data/hora
- [ ] Categorias de entrega: documentos, alimentação, farmácia, mercado, encomendas
- [ ] Rastreamento em tempo real
- [ ] Foto como comprovante (obrigatório)
- [ ] "Comprar para mim": motorista compra + anexa comprovante

### Tabelas
- `deliveries`
- `delivery_items`
- `delivery_tracking`

---

## FASE 9 — Empresas
- [ ] Cadastro empresarial (CNPJ, razão social, responsável)
- [ ] Aprovação manual pelo admin
- [ ] Dashboard da empresa:
  - Criar pedidos de entrega
  - Acompanhar em tempo real
  - Gerenciar funcionários
  - Relatórios financeiros
  - Histórico completo
  - Emitir comprovantes
- [ ] Múltiplos funcionários com permissões (admin, operador, financeiro)
- [ ] Centro de custos por departamento
- [ ] Contratos recorrentes (transporte de funcionários, cargas)

### Tabelas
- `companies`
- `company_users` (funcionários com permissões)
- `company_orders`
- `cost_centers`

---

## FASE 10 — Painel Administrativo
- [ ] Aprovar motoristas
- [ ] Aprovar empresas
- [ ] Editar taxas e comissões
- [ ] Editar categorias e preços
- [ ] Suspender usuários
- [ ] Visualizar corridas, entregas, fretes
- [ ] Visualizar mapa ao vivo
- [ ] Visualizar auditoria
- [ ] Relatórios financeiros
- [ ] Gerenciar promoções e cupons
- [ ] Gerenciar créditos de ativação (R$25 configurável)

### Tabelas
- `audit_logs`
- `promotions`
- `coupons`
- `platform_commission` (configurável por cidade/categoria)
- `pricing_rules` (configurável por cidade/categoria/horário)

---

## FASE 11 — TXD Live e Engajamento
- [ ] Motoristas publicam status:
  - "Estou disponível no Centro"
  - "Fazendo entregas até 22h"
  - "Aceito fretes até 500kg"
  - "Viagem para [cidade] às 14h"
- [ ] Feed ou mapa com atualizações ao vivo
- [ ] Usuários veem motoristas ativos na região

### Tabelas
- `driver_status_updates`

---

## FASE 12 — Lançamento
- [ ] Comprar domínio (.com.br ou regional)
- [ ] Deploy na Vercel
- [ ] Configurar e-mails transacionais (confirmação, recuperação)
- [ ] Configurar monitoramento (Sentry)
- [ ] Beta fechado: 20-50 usuários na região
- [ ] Coletar feedback
- [ ] Ajustar com base no uso real
- [ ] Lançamento público

---

## Pós-lançamento (futuro)
- IA para previsão de demanda
- Recomendação inteligente de rotas
- Programa de fidelidade
- Marketplace de fretes
- Integração com transporte corporativo
- App nativo (React Native)
- Expansão para novas cidades e estados
