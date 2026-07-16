# TXAPP Stripe Integration

## Visão Geral
Stripe Connect para split de pagamentos entre plataforma, motoristas e empresas. Suporte a cartão, PIX, Boleto, Apple Pay, Google Pay.

## Arquitetura
```
Frontend (Payment Element) → Backend (PaymentIntent) → Stripe API
                            ↕
                    Stripe Connect (split automático)
                            ↕
                    Wallet Service (saldo do motorista)
```

## Fluxo de Pagamento (Ride)

1. Passageiro solicita corrida → frontend calcula preço estimado
2. Ao confirmar: backend cria Stripe PaymentIntent (autorização)
3. Passageiro vê "Valor autorizado: R$ XX,XX"
4. Motorista completa corrida → backend captura PaymentIntent
5. Stripe Connect faz split: plataforma + motorista
6. Motorista recebe na wallet (saldo disponível para saque)

## Fluxo de Pagamento (Frete)

1. Empresa publica frete com budget
2. Transportador dá lance e é aceito
3. Empresa deposita valor em escrow (PaymentIntent com capture later)
4. Transportador coleta e entrega
5. Empresa confirma entrega → captura PaymentIntent
6. Split: plataforma + transportador

## Stripe Connect

### Account Types
- **Standard** — motoristas/empresas criam conta Stripe própria (recomendado para BR)
- **Express** — onboarding simplificado (recomendado para US/PT/MX)

### Split Logic
```typescript
const splitPayment = async (amount: number, driverStripeId: string, platformFee: number) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'brl',
    application_fee_amount: Math.round(platformFee * 100),
    transfer_data: { destination: driverStripeId },
  });
  return paymentIntent;
};
```

## Métodos de Pagamento por País

| País | Cartão | PIX | Boleto | Apple Pay | Google Pay | MB Way | OXXO |
|------|--------|-----|--------|-----------|------------|--------|------|
| BR   | ✅     | ✅  | ✅     | ✅        | ✅         | ❌     | ❌   |
| US   | ✅     | ❌  | ❌     | ✅        | ✅         | ❌     | ❌   |
| PT   | ✅     | ❌  | ❌     | ✅        | ✅         | ✅     | ❌   |
| MX   | ✅     | ❌  | ❌     | ✅        | ✅         | ❌     | ✅   |

## Webhooks

- `payment_intent.succeeded` — liberar corrida / atualizar status
- `payment_intent.payment_failed` — notificar passageiro, tentar outro método
- `payment_intent.canceled` — reverter
- `transfer.created` — registrar transferência
- `payout.paid` — saque concluído
- `account.updated` — status do onboarding do motorista

## Cripto

- Aceitar USDC via Stripe (quando disponível) ou integration direta com circuito Onramp
- Converter automaticamente para moeda local no momento do pagamento

## Segurança

- Sempre usar PaymentIntent no servidor (nunca expor secret_key no frontend)
- Webhook signature verification
- Idempotency key para evitar duplicatas
- Amount sempre em centavos (evitar floating point)
