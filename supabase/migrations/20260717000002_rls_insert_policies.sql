-- =========================================================================
-- Fix: Add missing INSERT policies for profiles and related tables
-- Users were getting 403 errors on signup because INSERT policies
-- were missing (only SELECT and UPDATE existed)
-- Rode este script no SQL Editor do Supabase
-- =========================================================================

DO $$ BEGIN
  CREATE POLICY "Usuários podem inserir próprio perfil"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Motoristas podem inserir seus dados"
    ON public.driver_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Motoristas podem inserir próprio veículo"
    ON public.vehicles FOR INSERT
    WITH CHECK (auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Funcionários podem inserir próprio perfil"
    ON public.employee_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Empresas podem inserir própria empresa"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
