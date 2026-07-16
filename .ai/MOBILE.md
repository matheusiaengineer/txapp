# TXAPP Mobile Strategy

## Visão Geral
Estratégia mobile híbrida: PWA como primeira versão (já implementada), React Native como evolução futura.

## Fase 1: PWA (Atual)

### Já implementado
- Service Worker (sw.js) com cache-first para assets
- Web App Manifest (manifest.json)
- Instalação "Add to Home Screen"
- Offline detection
- Push notifications

### Próximos passos
- Map tile caching para uso offline
- Background sync para ações offline
- Deep linking (abrir app de links externos)
- Share API (compartilhar status de corrida)
- Vibration API (alerta de nova corrida)
- Screen Wake Lock (manter tela ligada durante navegação)

## Fase 2: React Native (Futuro)

### Por que React Native
- Acesso nativo a APIs: Bluetooth (conectar ao veículo), NFC (pagamento por aproximação), Background location (tracking mesmo com app fechado)
- Performance: animações nativas (Reanimated), listas (FlashList)
- Push notifications nativas (FCM / APNs)
- Google Maps SDK nativo (melhor performance que JS SDK)

### Estrutura de Telas React Native
```
src/
  - screens/
    - auth/ (login, register, forgot-password)
    - passenger/ (home, ride, history, wallet, favorites)
    - driver/ (home, map, earnings, kyc)
    - freight/ (marketplace, my-loads, my-bids, tracking)
    - admin/ (dashboard, users, verification)
    - community/ (feed, leaderboard, achievements)
  - components/ (shared components)
  - services/ (API, location, notification)
  - hooks/ (custom hooks)
  - navigation/ (stack + tab navigator)
  - utils/
```

### Shared Code (Planejamento)
- Lógica de negócio em módulos compartilháveis (turbo module / monorepo)
- Types e interfaces compartilhadas
- API client compartilhado
- i18n com mesmas traduções
- Config de cidades (Global Config Engine)

### Prioridade de Telas Nativas
1. Driver app (tracking, navegação, notificações push)
2. Passenger app (solicitar corrida, pagamento, tracking)
3. Admin app (monitoramento em tempo real)
4. Freight app (marketplace, tracking de carga)

### Build e Deploy Mobile
- EAS Build (Expo Application Services)
- CodePush para atualizações OTA
- TestFlight (iOS) + Play Console Internal Testing (Android)
- CI/CD: GitHub Actions → EAS Build → Store
