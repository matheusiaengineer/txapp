# TXAPP Security

## Visão Geral
Segurança em camadas: autenticação, 2FA, criptografia, detecção de fraude, KYC, compliance por país.

## Autenticação
- Supabase Auth (email + senha, magic link, OAuth Google/Apple)
- Phone + SMS verification (Twilio)
- Biometria (fingerprint / face ID) em mobile
- Session management com refresh token

## 2FA (TOTP, SMS, Email, WebAuthn, Backup Codes)
- Habilitado para motoristas (obrigatório) e passageiros (opcional)
- TOTP: padrão RFC 6238, 30s, 6 dígitos
- SMS: Twilio Verify
- Email: código de 6 dígitos
- WebAuthn: hardware key (YubiKey, Touch ID)
- Backup codes: 10 códigos de uso único

## Criptografia
- AES-256-GCM para dados sensíveis (documentos, bank_account)
- Chaves gerenciadas por Vault / environment variables
- Dados mascarados em logs (ex: "****1234")
- TLS 1.3 para todas as comunicações

## KYC (Know Your Customer)

### Document Verification
- OCR automático para extrair dados de documentos
- Liveness detection (piscar, sorrir, virar cabeça)
- Comparação facial (selfie vs documento)
- Verification levels: Basic (documento) → Full (documento + selfie) → Premium (visita presencial)

### Document Types by Country
| País | Documentos Aceitos |
|------|-------------------|
| BR | CPF, CNH, RG, Passaporte, CNPJ |
| US | SSN, Driver License, Passport |
| PT | NIF, CC (Cartão Cidadão), Passaporte |
| MX | CURP, INE, Passaporte |

## Fraud Detection

### Signup Fraud
- Mesmo CPF/email com múltiplas contas → bloqueio
- Dispositivo suspeito (VPN, emulador) → KYC reforçado
- Telefone descartável (VOIP) → não permitir

### Payment Fraud
- Cartão testado em múltiplas contas → block
- Padrão de corridas curtas com pagamento alto → sinal amarelo
- Chargeback rate > 1% → suspensão temporária

### Trip Fraud
- GPS spoofing: velocidade incompatível com trajeto → alerta
- Corridas fantasmas: mesma origem/destino repetido → fraude
- Motorista e passageiro combinados (mesmo device) → mutuamente bloqueados

### ML Fraud Models
- Anomaly detection em tempo real
- Score de risco por transação (0-100)
- Regras configuráveis por cidade

## RLS Policies (Row Level Security)
- Todas as tabelas têm RLS ativo
- Usuário vê apenas seus próprios dados
- Admin vê dados da sua cidade
- Superadmin vê dados globais
- Motorista vê dados do passageiro apenas durante corrida ativa

## Audit Logs
- Toda ação sensível é logada: login, pagamento, alteração de perfil, KYC
- Logs imutáveis (append-only)
- Retenção: 5 anos (LGPD), 3 anos (GDPR), 2 anos (CCPA)

## Compliance
- LGPD (Brasil): direito de exclusão, consentimento, DPO
- GDPR (Portugal): data portability, right to be forgotten
- CCPA (EUA): opt-out de venda de dados
- Lei Geral de Proteção de Dados (México): AVISO de privacidade
