-- Wallet Transactions + Trigger + RLS fixes

-- Tabela de transacoes da carteira
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'bonus')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Trigger: atualiza balance na wallets ao inserir transacao
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wallets
    SET balance = NEW.balance_after,
        updated_at = now()
    WHERE id = NEW.wallet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wallet_transaction ON public.wallet_transactions;
CREATE TRIGGER trg_wallet_transaction
    AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_wallet_balance();

-- Trigger: cria wallet automaticamente se nao existir
CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (profile_id, balance, is_qualified)
    VALUES (NEW.id, 0, false)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ensure_wallet ON public.profiles;
CREATE TRIGGER trg_ensure_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_wallet();

-- RLS policies
DO $$ BEGIN
    CREATE POLICY "Usuarios veem proprias transacoes"
        ON public.wallet_transactions FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.wallets WHERE id = wallet_transactions.wallet_id AND profile_id = auth.uid())
        );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Sistema insere transacoes"
        ON public.wallet_transactions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- RLS faltante para wallets (INSERT/UPDATE via servidor)
DO $$ BEGIN
    CREATE POLICY "Sistema gerencia carteiras"
        ON public.wallets FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Sistema atualiza carteiras"
        ON public.wallets FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions (type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON public.wallet_transactions (reference_type, reference_id);
