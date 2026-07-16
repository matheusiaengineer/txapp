# TXAPP Payment System

## Visão Geral
Sistema completo de pagamentos com carteira digital, split automático, 19 moedas (15 fiat + 4 crypto), métodos locais por país, cashback, referência e gorjeta.

## 19 Moedas

### Fiat (15)
BRL, USD, EUR, GBP, JPY, CNY, INR, ARS, MXN, PEN, COP, CLP, PTE, CHF, CAD

### Crypto (4)
USDC, USDT, BTC, ETH

## Currency Formatting
```typescript
const formatCurrency = (amount: number, currency: string, locale: string) => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};
```

## Wallet Service

### Funcionalidades
- Saldo disponível (driver earnings)
- Saldo bloqueado (corridas em andamento)
- Depósito (passageiro adicionar fundos)
- Saque (driver transferir para conta bancária)
- Split (dividir conta entre passageiros)
- Cashback (percentual de volta em corridas)
- Referência (bônus para quem indicou)
- Gorjeta (adicionar ao final da corrida)

### Transaction Types
- deposit, withdrawal, payment (ride/freight), refund, commission, cashback, referral_bonus, split, tip, adjustment

## Métodos de Pagamento Locais

### Brasil
- PIX: pagamento instantâneo (5 segundos), QR Code + chave
- Boleto: vencimento em 3 dias úteis, processamento em 2 dias
- Cartão: crédito (parcelado) + débito

### Portugal
- MB Way: pagamento por app, associado ao cartão
- Multibanco: referência para pagamento em ATM

### México
- OXXO: pagamento em loja de conveniência
- SPEI: transferência eletrônica (similar ao PIX)

### EUA
- Cartão de crédito/débito
- ACH: direct bank transfer
- Apple Pay / Google Pay

## Escrow Service

Para fretes: valor fica retido até confirmação de entrega.
- Provider cobra taxa de escrow (1-2%)
- Liberação automática 48h após confirmação
- Disputa: suporte humano analisa

## Cashback Engine
- 5% de cashback em corridas para passageiros frequentes (>10/mês)
- 10% de cashback na primeira corrida do mês
- Cashback em crédito na wallet (não sacável)
- Expira em 30 dias

## Referral System
- Passageiro indica amigo → ambos ganham R$ 20
- Motorista indica motorista → ambos ganham R$ 50
- Bônus creditado após primeira corrida do indicado
- Limite de 10 indicações/mês

## Segurança
- Dupla autenticação para saques > R$ 500
- Limite diário de saque: R$ 5.000 (ajustável por perfil)
- Anti-fraude: detectar padrões suspeitos de transação
- Histórico de transações auditável
