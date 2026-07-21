-- =========================================================================
-- TXDAPP — Seed Data (Poté/MG)
-- =========================================================================
-- ATENÇÃO: Este seed deve ser executado APÓS as migrations.
-- As senhas são hasheadas com bcrypt via Supabase Auth.
-- Execute com: supabase db reset
-- =========================================================================

BEGIN;

-- =========================================================================
-- 1. CIDADE: Poté/MG
-- =========================================================================
INSERT INTO public.cities (id, name, state, country, currency, unit, timezone, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Poté', 'MG', 'BR', 'BRL', 'km', 'America/Sao_Paulo', true
) ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. CATEGORIAS DE VEÍCULOS
-- =========================================================================
INSERT INTO public.vehicle_categories (id, name, display_name, max_passengers, max_load_weight_kg, is_active) VALUES
  ('v0000000-0000-0000-0000-000000000001', 'moto', 'Moto', 1, 20, true),
  ('v0000000-0000-0000-0000-000000000002', 'car', 'Carro Popular', 4, 0, true),
  ('v0000000-0000-0000-0000-000000000003', 'van', 'Van de Carga', 0, 1500, true),
  ('v0000000-0000-0000-0000-000000000004', 'truck', 'Caminhão', 0, 8000, true)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. REGRAS DE PREÇO (Poté/MG)
-- =========================================================================
INSERT INTO public.pricing_rules (city_id, vehicle_category_id, base_fare, price_per_unit, price_per_minute, min_fare, platform_fee_percent, surge_multiplier) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 3.00, 1.50, 0.30, 7.00, 15.00, 1.00),
  ('c0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000002', 5.00, 1.80, 0.40, 10.00, 15.00, 1.00),
  ('c0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000003', 15.00, 3.50, 0.80, 30.00, 12.00, 1.00),
  ('c0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000004', 50.00, 8.00, 2.00, 100.00, 10.00, 1.00)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 4. CUPONS DE DESCONTO
-- =========================================================================
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_value, max_discount, max_uses, expires_at) VALUES
  ('BEMVINDO10', '10% de desconto na primeira corrida', 'percentage', 10, 0, 15.00, 100, '2027-12-31 23:59:59-03'),
  ('POTE5', 'R$ 5 de desconto em corridas em Poté', 'fixed', 5.00, 10.00, 5.00, 50, '2027-12-31 23:59:59-03'),
  ('INDICA20', 'R$ 20 de bônus por indicação', 'fixed', 20.00, 0, 20.00, 200, '2027-12-31 23:59:59-03')
ON CONFLICT (code) DO NOTHING;

-- =========================================================================
-- 5. ÁREA DE COBERTURA (Poté/MG)
-- =========================================================================
INSERT INTO public.coverage_areas (city, state, boundary) VALUES
  ('Poté', 'MG', ST_GeomFromText('POLYGON((-41.8 -17.8, -41.7 -17.8, -41.7 -17.7, -41.8 -17.7, -41.8 -17.8))', 4326))
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 6. USUÁRIOS DE TESTE (via auth.users + profiles)
-- =========================================================================
-- NOTA: Como não podemos criar auth.users diretamente via SQL,
-- usamos a função signUp da API. Estes são os seeds para referência.
-- Execute no aplicativo: registrar cada um manualmente ou use a API.

-- Inserir perfis de demonstração após criar auth.users manualmente
-- Os IDs abaixo são placeholders — substitua pelos UUIDs reais após criar os usuários.

-- =========================================================================
-- 6. CONFIGURAÇÕES DO APP (Poté/MG)
-- =========================================================================
INSERT INTO public.app_config (key, value, description, city_id) VALUES
  ('city.price_per_km', '{"default": 2000, "min": 1500, "max": 4000}'::jsonb, 'Preço por km em centavos - Poté', 'c0000000-0000-0000-0000-000000000001'),
  ('city.search_radius_km', '{"default": 15, "min": 5, "max": 30}'::jsonb, 'Raio de busca em km - Poté', 'c0000000-0000-0000-0000-000000000001'),
  ('city.platform_fee', '{"default": 15}'::jsonb, 'Taxa da plataforma % - Poté', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (key, city_id) DO NOTHING;

-- =========================================================================
-- 7. DADOS DE DEMONSTRAÇÃO PARA O FRONTEND (Dashboard Preview)
-- =========================================================================
-- Inserir dados de exemplo que aparecem na landing page
-- Estes registros usam IDs especiais de demonstração (não vinculados a auth.users reais)

-- Perfil Admin de demonstração
INSERT INTO public.profiles (id, full_name, email, phone, role, country, language, accepted_terms)
VALUES (
  'demo-admin-0000-0000-0000-000000000000',
  'Admin TXDAPP', 'admin@txdapp.com', '+5533999999999',
  'admin', 'BR', 'pt-BR', true
) ON CONFLICT (id) DO NOTHING;

-- Perfil Motorista de demonstração
INSERT INTO public.profiles (id, full_name, email, phone, role, country, language, accepted_terms)
VALUES (
  'demo-driver-0000-0000-0000-000000000000',
  'Carlos Silva', 'carlos@example.com', '+5533988888888',
  'driver', 'BR', 'pt-BR', true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.driver_profiles (id, cpf, status, rating, total_trips, acceptance_rate, cancellation_rate, current_live_status)
VALUES (
  'demo-driver-0000-0000-0000-000000000000',
  '12345678901', 'approved', 4.9, 1520, 98.5, 1.2, 'ONLINE'
) ON CONFLICT (id) DO NOTHING;

-- Perfil Passageiro de demonstração
INSERT INTO public.profiles (id, full_name, email, phone, role, country, language, accepted_terms)
VALUES (
  'demo-passenger-0000-0000-0000-000000000000',
  'Ana Oliveira', 'ana@example.com', '+5533977777777',
  'passenger', 'BR', 'pt-BR', true
) ON CONFLICT (id) DO NOTHING;

-- Perfil Empresa de demonstração
INSERT INTO public.profiles (id, full_name, email, phone, role, country, language, accepted_terms)
VALUES (
  'demo-company-0000-0000-0000-000000000000',
  'Empresa Exemplo Ltda', 'empresa@example.com', '+5533966666666',
  'company', 'BR', 'pt-BR', true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.companies (id, corporate_name, trade_name, cnpj, responsible_name, status)
VALUES (
  'demo-company-0000-0000-0000-000000000000',
  'Empresa Exemplo Ltda', 'Exemplo', '11222333000181', 'João Empresário', 'approved'
) ON CONFLICT (id) DO NOTHING;

-- Veículo do motorista demo
INSERT INTO public.vehicles (id, driver_id, category, license_plate, brand, model, color, year)
VALUES (
  'demo-vehicle-0000-0000-0000-000000000000',
  'demo-driver-0000-0000-0000-000000000000',
  'car', 'ABC1234', 'Toyota', 'Corolla', 'Prata', 2023
) ON CONFLICT (id) DO NOTHING;

-- Corridas de demonstração
INSERT INTO public.trips (id, passenger_id, driver_id, vehicle_category_id, origin_lat, origin_lng, origin_address, dest_lat, dest_lng, dest_address, status, estimated_distance_km, estimated_duration_min, estimated_fare, final_fare, completed_at) VALUES
  (
    'demo-trip-0000-0000-0000-000000000001',
    'demo-passenger-0000-0000-0000-000000000000',
    'demo-driver-0000-0000-0000-000000000000',
    'v0000000-0000-0000-0000-000000000002',
    -17.8059, -41.7864, 'Rua Principal, 100 - Poté/MG',
    -17.8072, -41.7819, 'Praça da Matriz, s/n - Poté/MG',
    'FINISHED', 3.5, 12, 15.00, 15.00, now() - interval '2 days'
  ),
  (
    'demo-trip-0000-0000-0000-000000000002',
    'demo-passenger-0000-0000-0000-000000000000',
    'demo-driver-0000-0000-0000-000000000000',
    'v0000000-0000-0000-0000-000000000001',
    -17.8050, -41.7870, 'Av. Getúlio Vargas, 200 - Poté/MG',
    -17.8080, -41.7830, 'Rua dos Andradas, 50 - Poté/MG',
    'CANCELLED', 2.1, 8, 8.50, NULL, now() - interval '1 day'
  ),
  (
    'demo-trip-0000-0000-0000-000000000003',
    'demo-passenger-0000-0000-0000-000000000000',
    'demo-driver-0000-0000-0000-000000000000',
    'v0000000-0000-0000-0000-000000000002',
    -17.8059, -41.7864, 'Rua Principal, 100 - Poté/MG',
    -17.8100, -41.7800, 'Rodoviária de Poté - Poté/MG',
    'SEARCHING_DRIVER', 4.0, 15, 18.00, NULL, NULL
  ) ON CONFLICT (id) DO NOTHING;

-- Avaliações de demonstração
INSERT INTO public.ratings (id, rater_id, ratee_id, trip_id, score, comment, rating_type) VALUES
  (
    'demo-rating-0000-0000-0000-000000000001',
    'demo-passenger-0000-0000-0000-000000000000',
    'demo-driver-0000-0000-0000-000000000000',
    'demo-trip-0000-0000-0000-000000000001',
    5, 'Excelente motorista, muito educado!', 'passenger_to_driver'
  ),
  (
    'demo-rating-0000-0000-0000-000000000002',
    'demo-driver-0000-0000-0000-000000000000',
    'demo-passenger-0000-0000-0000-000000000000',
    'demo-trip-0000-0000-0000-000000000001',
    5, 'Passageira muito educada', 'driver_to_passenger'
  ) ON CONFLICT (id) DO NOTHING;

-- Endereços salvos de demonstração
INSERT INTO public.saved_locations (user_id, name, type, full_address, lat, lng) VALUES
  ('demo-passenger-0000-0000-0000-000000000000', 'Minha Casa', 'home', 'Rua Principal, 100 - Poté/MG', -17.8059, -41.7864),
  ('demo-passenger-0000-0000-0000-000000000000', 'Trabalho', 'work', 'Av. Getúlio Vargas, 200 - Poté/MG', -17.8050, -41.7870),
  ('demo-driver-0000-0000-0000-000000000000', 'Minha Casa', 'home', 'Rua das Flores, 50 - Poté/MG', -17.8040, -41.7850)
ON CONFLICT DO NOTHING;

-- Carteiras de demonstração
INSERT INTO public.wallets (id, profile_id, balance, is_qualified) VALUES
  ('demo-wallet-passenger', 'demo-passenger-0000-0000-0000-000000000000', 50.00, true),
  ('demo-wallet-driver', 'demo-driver-0000-0000-0000-000000000000', 320.00, true),
  ('demo-wallet-admin', 'demo-admin-0000-0000-0000-000000000000', 1200.00, true),
  ('demo-wallet-company', 'demo-company-0000-0000-0000-000000000000', 5000.00, true)
ON CONFLICT (id) DO NOTHING;

-- Transações de demonstração
INSERT INTO public.wallet_transactions (profile_id, wallet_id, type, amount, balance_before, balance_after, status, description) VALUES
  ('demo-passenger-0000-0000-0000-000000000000', 'demo-wallet-passenger', 'deposit', 50.00, 0, 50.00, 'confirmed', 'Depósito inicial'),
  ('demo-passenger-0000-0000-0000-000000000000', 'demo-wallet-passenger', 'ride_payment', 15.00, 50.00, 35.00, 'confirmed', 'Corrida para Praça da Matriz'),
  ('demo-driver-0000-0000-0000-000000000000', 'demo-wallet-driver', 'deposit', 500.00, 0, 500.00, 'confirmed', 'Depósito inicial'),
  ('demo-driver-0000-0000-0000-000000000000', 'demo-wallet-driver', 'ride_earning', 12.75, 500.00, 512.75, 'confirmed', 'Ganhos corrida (líquido)'),
  ('demo-driver-0000-0000-0000-000000000000', 'demo-wallet-driver', 'withdrawal', 200.00, 512.75, 312.75, 'confirmed', 'Saque PIX'),
  ('demo-admin-0000-0000-0000-000000000000', 'demo-wallet-admin', 'deposit', 1200.00, 0, 1200.00, 'confirmed', 'Fundo da plataforma')
ON CONFLICT DO NOTHING;

-- Motoristas online demo (próximos a Poté/MG)
INSERT INTO public.drivers_online (driver_id, lat, lng, heading, status, vehicle_category) VALUES
  ('demo-driver-0000-0000-0000-000000000000', -17.8059, -41.7864, 180, 'ONLINE', 'car')
ON CONFLICT (driver_id) DO NOTHING;

-- Notificações de demonstração
INSERT INTO public.notifications (user_id, type, title, body, read) VALUES
  ('demo-passenger-0000-0000-0000-000000000000', 'ride', 'Corrida concluída', 'Sua corrida para Praça da Matriz foi finalizada. Avalie o motorista!', false),
  ('demo-passenger-0000-0000-0000-000000000000', 'promo', 'Cupom disponível', 'Use o cupom POTE5 e ganhe R$ 5 de desconto!', false),
  ('demo-driver-0000-0000-0000-000000000000', 'earning', 'Ganhos atualizados', 'Você ganhou R$ 12,75 na última corrida.', true),
  ('demo-driver-0000-0000-0000-000000000000', 'system', 'Bem-vindo!', 'Seu perfil de motorista foi aprovado!', true)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 8. APP_CONFIG demos
-- =========================================================================
INSERT INTO public.app_config (key, value, description) VALUES
  ('demo.features', '{"ride_enabled": true, "freight_enabled": true, "chat_enabled": true, "negotiation_enabled": true}'::jsonb, 'Features habilitadas para demonstração')
ON CONFLICT (key) DO NOTHING;

COMMIT;
