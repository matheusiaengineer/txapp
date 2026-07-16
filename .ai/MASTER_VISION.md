# TXDAPP — Master Vision

## Nossa Missão

O TXDAPP é uma plataforma inteligente de mobilidade e logística desenvolvida para conectar pessoas, empresas e transportadores de forma rápida, segura e moderna.

Nosso objetivo é oferecer uma experiência simples para o usuário, justa para o motorista e eficiente para empresas que precisam transportar pessoas ou mercadorias.

A plataforma nasce preparada para crescer, atendendo desde pequenas cidades até operações regionais e nacionais.

## Posicionamento

Não competimos com a Uber nacionalmente. Resolvemos problemas locais onde ainda não existe serviço estruturado.

> *"A principal plataforma de mobilidade e logística da nossa região, conectando passageiros, motoristas, motoboys, empresas e transportadores em um único aplicativo moderno."*

## O que o aplicativo oferece

### 🚗 Transporte de passageiros
- Corridas de carro
- Corridas de moto
- Motoristas particulares
- Viagens entre cidades
- Agendamento de viagens

### 📦 Entregas
- Documentos e encomendas
- Alimentação e farmácia
- Compras em supermercados
- Entregas empresariais

### 🚚 Fretes
- Caminhonetes e vans
- Caminhões e mudanças
- Materiais de construção
- Máquinas e equipamentos

### 🏢 Empresas
- Entregas corporativas
- Transporte de funcionários
- Transporte de cargas
- Contratos recorrentes
- Painel administrativo

## Arquitetura

```
Frontend (Next.js 16 + React 19) → Landing Page + App
  ↕ API Routes / Server Actions
Supabase (Auth + DB + Storage + Realtime)
  ↕ RLS: cada usuário vê apenas seus dados
Stripe Connect (Pagamentos)
  ↕ PaymentIntent + Split automático
Mobility Engine (abstração de mapas)
  ↕ Google Maps (primary) → Mapbox/Here/TomTom (fallback)
```

## Estratégia de Lançamento

**Fase 1 — MVP:** Apenas o essencial.
1. Cadastro e login
2. Passageiro solicita corrida
3. Motorista aceita
4. Rastreamento em tempo real
5. Pagamento (PIX, cartão, dinheiro)
6. Avaliação

**Fase 2 — Entregas:** Adicionar fluxo de entregas pessoais e empresariais.

**Fase 3 — Empresas:** Módulo empresarial com painel, pedidos, relatórios.

**Fase 4 — Expansão:** Fretes, marketplace, fidelidade, IA.

Nunca lançar com 400 funcionalidades. Lançar forte no essencial e evoluir com feedback real.

## Modelo de Negócio

- App gratuito para usuários
- Receita: comissão sobre corridas, entregas e fretes
- Planos para empresas
- Taxa competitiva para atrair motoristas

## Princípios Técnicos

1. **Tudo configurável por cidade** — Preços, comissões, regras no banco (tabela `pricing_rules`). Zero código para lançar nova cidade.
2. **Nunca valores fixos** — Toda regra de negócio vem do banco.
3. **Supabase é o núcleo** — Nenhum dado crítico local. DB + Auth + Storage + Realtime.
4. **Mobility Engine** — Única camada que chama APIs de mapa. Trocar de provider não altera UI.
5. **Stripe Connect** — Infraestrutura financeira. Split automático, PIX, cartão, escrow.
6. **RLS em todas as tabelas** — Segurança por linha. Usuário vê apenas seus dados.
7. **Offline-first** — Service Worker + IndexedDB. Sincronização automática.
8. **Multi-moeda, multi-idioma** — Preparado para crescer, mas começa local (BRL, pt-BR).

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, framer-motion, lucide-react
- **Backend:** Supabase (Auth + DB + Storage + Realtime)
- **Pagamentos:** Stripe Connect (PIX, cartão, boleto), Mercado Pago (futuro)
- **Mapas:** Google Maps API (primary), Mapbox (fallback)
- **Mobile:** PWA (fase 1), React Native (fase 2)
- **Infra:** Vercel + Cloudflare
