<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TXAP — Platform Architecture

## Stack
- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS 4
- **Mobile**: PWA (installable), future React Native
- **Backend**: Next.js API Routes (server-side)
- **Database**: Supabase (PostgreSQL + PostGIS + RLS)
- **Auth**: Supabase Auth (JWT + Refresh Token)
- **Payments**: Stripe + PIX (internal wallet)
- **Maps**: Leaflet + OSRM (routing), PostGIS (nearby drivers)
- **Realtime**: Supabase Realtime (trips, heartbeats, messages, notifications)
- **Cache**: Upstash Redis (rate limiting)
- **Hosting**: Vercel (auto-deploy from GitHub)
- **CI/CD**: GitHub Actions (typecheck → lint → build → smoke test)

## Database Schema (60+ tables)
See `supabase/consolidated.sql` — 2000+ lines, fully production-ready.

### Core Tables
- `profiles` — All users (passengers, drivers, companies, admins)
- `driver_profiles` — Driver-specific data (CPF, rating, modalities)
- `vehicles` — Registered vehicles
- `companies` — Business accounts
- `cities` — Operating cities with currency/unit/timezone

### Mobility Engine
- `trips` — All rides/deliveries/freights
- `trip_offers` — Driver matching system
- `driver_heartbeats` — Real-time driver locations
- `drivers_online` — Active driver status
- `pricing_rules` — Per-city, per-vehicle pricing
- `driver_pricing` — Per-driver custom pricing
- `negotiations` — Price negotiation between passenger/driver

### Freight Marketplace
- `freight_loads` / `loads` — Freight requests
- `freight_bids` / `bids` — Transporter bids
- `freight_tracking` — Shipment tracking

### Financial
- `wallets` — User wallets
- `wallet_transactions` — All financial movements (deposit, withdrawal, ride_payment, ride_earning, etc.)
- `withdrawals` — PIX withdrawal requests
- `payment_methods` — Saved payment methods
- `coupons` — Discount coupons
- `promotions` — Business promotions

### Social / Feed
- `feed_posts` — Instagram-like feed (promos, events, updates, photos)
- `post_comments` — Comments on posts
- `post_likes` — Likes on posts
- `favorites` — Saved drivers/places/routes

### Business / Companies
- `businesses` — Business directory listings
- `business_products` — Product catalog
- `business_reviews` — Business reviews
- `company_products` / `company_orders` — Company e-commerce
- `company_services` — Service listings
- `company_subscriptions` — Subscription plans
- `professional_directory` — Professional services

### Security
- `mfa_factors` — MFA/2FA factors (TOTP, SMS, email)
- `biometric_credentials` — WebAuthn passkeys
- `banned_devices` — Device bans
- `signup_attempts_log` — Signup audit trail
- `content_reports` — Abuse reports
- `audit_logs` — System audit trail
- `app_errors` — Error tracking

### Notifications & Messaging
- `notifications` — Push/in-app notifications
- `push_tokens` — FCM push notification tokens
- `trip_messages` / `messages` — In-trip chat

### Genesis Protocol (City Launches)
- `city_launches` — City launch campaigns
- `seed_missions` — Driver onboarding missions
- `driver_guarantees` — Earnings guarantees
- `respiratory_snapshots` — Supply/demand balancing

### Other
- `addresses` — Saved addresses
- `documents` — KYC documents
- `verifications` — Driver verification status
- `coverage_areas` — Service coverage polygons
- `app_config` / `global_config` — Platform configuration
- `road_events` — Traffic incidents (accident, jam, police, etc.)
- `influencers` / `influencer_referrals` / `influencer_goals` — Influencer program
- `events` / `city_events` — City events
- `city_jobs` — Job listings
- `orders` — Generic order system

## Security Architecture
- **Auth**: Supabase Auth (JWT + Refresh Token rotation)
- **RLS**: Enabled on ALL 60+ tables with granular policies
- **Proxy**: `src/proxy.ts` — Route protection (redirects unauthenticated users)
- **API Auth**: Every route checks `supabase.auth.getUser()` + role verification
- **Field Whitelist**: Profile update only allows safe fields
- **Rate Limiting**: Upstash Redis on sensitive routes
- **Open Redirect Prevention**: Auth callback validates `next` param
- **XSS/CSRF**: Next.js built-in + Content Security Policy headers
- **Admin-only**: Role check on all admin endpoints (service role for webhooks)
- **Audit Trail**: wallet_transactions trigger → audit_logs
- **Ban System**: profiles.is_banned + banned_devices + signup_attempts_log

## Admin Panel (`/admin/dashboard`)
Single-page app with tabs:
- **Dashboard**: Real-time stats (revenue, trips, drivers online, users)
- **Verifications**: Approve/reject driver documents
- **Influencers**: CRUD influencer profiles
- **Users**: List/filter/search all users
- **Config**: Platform configuration

## Vehicle Types
| Name | Display | Max Passengers | Max Load |
|------|---------|---------------|----------|
| car | Carro Popular | 4 | - |
| moto | Moto | 1 | 20kg |
| van | Van de Carga | - | 1500kg / 10m³ |
| truck | Caminhão | - | 8000kg / 40m³ |

## Trip Status Flow
REQUEST_CREATED → SEARCHING_DRIVER → DRIVER_NOTIFIED → DRIVER_ACCEPTED → GOING_TO_PICKUP → ARRIVED → PASSENGER_ON_BOARD → IN_PROGRESS → FINISHING → COMPLETED → PAYMENT_PENDING → PAYMENT_CONFIRMED → FINISHED

## Development Rules
1. Never create files outside `src/`
2. Always check `supabase/consolidated.sql` for table schema before writing API code
3. All API routes must use `export const dynamic = "force-dynamic"`
4. All API routes must authenticate with `supabase.auth.getUser()` (never trust client)
5. All API routes must check role for admin endpoints
6. Never use legacy tables (`rides`, `transactions`, `stripe_accounts`) — use `trips`, `wallet_transactions`, `profiles.stripe_connect_account_id`
7. Vehicle category names: `car`, `moto`, `van`, `truck` (English, not Portuguese)
8. Build must pass: `npx next build` — 0 TS errors
9. Never hardcode UUIDs
10. Never commit secrets — use `.env.local`

## Key Files
- `src/proxy.ts` — Route protection middleware
- `src/lib/supabase/browser.ts` — Client-side Supabase
- `src/lib/supabase/server.ts` — Server-side Supabase
- `src/lib/hooks/` — React hooks for data fetching
- `src/lib/payment/constants.ts` — Payment configuration
- `src/lib/api-middleware.ts` — Rate limiting wrapper
- `src/app/api/` — All API routes
- `src/components/` — Shared UI components
- `src/components/maps/` — Map components (Leaflet)
- `supabase/consolidated.sql` — Database schema (source of truth)
- `vercel.json` — Deployment config + security headers
- `.env.production.example` — Required environment variables
