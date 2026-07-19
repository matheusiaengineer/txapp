-- =====================================================
-- TXDAPP — Wallet Integrity & Governance Migration
-- Rules: 9, 11–20, 81–100, 121–140, 143, 181–190
-- =====================================================
-- Migration: 20260718000007_wallet_integrity
-- Description: Calculated balance, deposit flow, audit,
--   error logs, geofencing, verification, RLS policies
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CALCULATED BALANCE (Rule 12)
-- =====================================================

-- Drop the static column if it exists on wallets
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance'
  ) THEN
    ALTER TABLE wallets DROP COLUMN balance;
  END IF;
END $$;

-- Materialized snapshot of wallet balances
DROP MATERIALIZED VIEW IF EXISTS wallet_balance_snapshot;
CREATE MATERIALIZED VIEW wallet_balance_snapshot AS
SELECT
  profile_id,
  SUM(
    CASE
      WHEN type IN ('deposit', 'refund', 'bonus', 'cashback') THEN amount
      ELSE -amount
    END
  ) AS balance
FROM wallet_transactions
WHERE status = 'confirmed'
GROUP BY profile_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_balance_snapshot_profile
  ON wallet_balance_snapshot(profile_id);

-- Function to get calculated balance for a given profile
CREATE OR REPLACE FUNCTION get_calculated_balance(p_profile_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT
    COALESCE(
      SUM(
        CASE
          WHEN type IN ('deposit', 'refund', 'bonus', 'cashback') THEN amount
          ELSE -amount
        END
      ),
      0
    )
  INTO v_balance
  FROM wallet_transactions
  WHERE profile_id = p_profile_id AND status = 'confirmed';

  RETURN v_balance;
END;
$$;

-- Trigger function to validate balance-relevant changes
CREATE OR REPLACE FUNCTION validate_wallet_balance()
RETURNS TRIGGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  IF NEW.status = 'confirmed' THEN
    v_balance := get_calculated_balance(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. DEPOSIT FLOW — Add missing columns (Rules 11–20)
-- =====================================================

ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS geo_location JSONB,
  ADD COLUMN IF NOT EXISTS hard_delete_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days';

-- Minimum deposit constraint (Rule 18) — amount in centavos (R$10,00 = 1000 centavos)
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_amount_min_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_amount_min_check
  CHECK (amount >= 1000);

-- Block pending deposits (Rule 17)
CREATE OR REPLACE FUNCTION check_pending_deposit(p_profile_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_has_pending BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM wallet_transactions
    WHERE profile_id = p_profile_id AND status = 'pending'
  ) INTO v_has_pending;
  RETURN v_has_pending;
END;
$$;

CREATE OR REPLACE FUNCTION trg_block_deposit_if_pending()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'deposit' AND check_pending_deposit(NEW.profile_id) THEN
    RAISE EXCEPTION 'A pending deposit already exists for this profile'
      USING HINT = 'Wait for the current deposit to be confirmed or expired';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_deposit_if_pending ON wallet_transactions;
CREATE TRIGGER trg_block_deposit_if_pending
  BEFORE INSERT ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_block_deposit_if_pending();

-- Hard-delete cancelled transactions after 30 days (Rule 20)
CREATE OR REPLACE FUNCTION cleanup_cancelled_transactions()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM wallet_transactions
  WHERE status = 'cancelled' AND hard_delete_at <= NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- 3. RPC FUNCTIONS FOR WALLET (Rules 21–60)
-- =====================================================

-- get_verified_balance: returns the server-calculated balance
CREATE OR REPLACE FUNCTION get_verified_balance(p_profile_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN get_calculated_balance(p_profile_id);
END;
$$;

-- validate_balance_parity: compares local frontend balance with server
CREATE OR REPLACE FUNCTION validate_balance_parity(
  p_profile_id UUID,
  p_local_balance INTEGER
)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_server_balance INTEGER;
  v_diff INTEGER;
BEGIN
  v_server_balance := get_calculated_balance(p_profile_id);
  v_diff := p_local_balance - v_server_balance;

  RETURN jsonb_build_object(
    'is_valid', v_diff = 0,
    'server_balance', v_server_balance,
    'difference', v_diff
  );
END;
$$;

-- request_deposit: creates a pending deposit transaction
CREATE OR REPLACE FUNCTION request_deposit(
  p_profile_id UUID,
  p_amount INTEGER,
  p_ip TEXT DEFAULT NULL,
  p_geo JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Validate no pending deposit (Rule 17)
  IF check_pending_deposit(p_profile_id) THEN
    RAISE EXCEPTION 'A pending deposit already exists for this profile';
  END IF;

  -- Validate minimum amount (Rule 18)
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum deposit amount is 1000 centavos (R$10,00)';
  END IF;

  v_expires_at := NOW() + INTERVAL '30 minutes';

  INSERT INTO wallet_transactions (
    profile_id, type, amount, status, expires_at, ip_address, geo_location
  ) VALUES (
    p_profile_id, 'deposit', p_amount, 'pending', v_expires_at, p_ip, p_geo
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'expires_at', v_expires_at
  );
END;
$$;

-- confirm_deposit: marks a pending deposit as confirmed
CREATE OR REPLACE FUNCTION confirm_deposit(p_transaction_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallet_transactions
  SET status = 'confirmed'
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not in pending status';
  END IF;
END;
$$;

-- cancel_deposit: marks a pending deposit as cancelled
CREATE OR REPLACE FUNCTION cancel_deposit(p_transaction_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallet_transactions
  SET status = 'cancelled'
  WHERE id = p_transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not in pending status';
  END IF;
END;
$$;

-- =====================================================
-- 4. AUDIT LOGS (Rules 143, 9)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_profile ON audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- =====================================================
-- 5. ERROR LOGS (Rules 181–190)
-- =====================================================

CREATE TABLE IF NOT EXISTS app_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  endpoint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_errors_type ON app_errors(error_type);

-- =====================================================
-- 6. GEOFENCING (Rules 81–100)
-- =====================================================

CREATE TABLE IF NOT EXISTS coverage_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  boundary GEOGRAPHY(POLYGON) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverage_areas_boundary
  ON coverage_areas USING GIST(boundary);

CREATE OR REPLACE FUNCTION is_point_in_coverage(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM coverage_areas
    WHERE ST_DWithin(
      ST_MakePoint(p_lng, p_lat)::GEOGRAPHY,
      boundary,
      0
    )
    AND is_active = true
  );
$$;

-- =====================================================
-- 7. VERIFICATION TABLE (Rules 121–140)
-- =====================================================

CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  selfie_url TEXT,
  document_url TEXT,
  document_type TEXT,
  selfie_status TEXT DEFAULT 'pending'
    CHECK (selfie_status IN ('pending', 'approved', 'rejected')),
  document_status TEXT DEFAULT 'pending'
    CHECK (document_status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. TRIGGER: auto-audit wallet transactions
-- =====================================================

CREATE OR REPLACE FUNCTION trg_wallet_transaction_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (profile_id, action, metadata)
  VALUES (
    NEW.profile_id,
    'wallet.transaction.' || NEW.type,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'status', NEW.status,
      'type', NEW.type
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_transaction_audit ON wallet_transactions;
CREATE TRIGGER trg_wallet_transaction_audit
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_wallet_transaction_audit();

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Audit logs: user sees own, admin sees all
DROP POLICY IF EXISTS audit_logs_select_self ON audit_logs;
CREATE POLICY audit_logs_select_self ON audit_logs FOR SELECT
  USING (profile_id = auth.uid() OR auth.role() = 'admin');

-- App errors: insert by anyone, select by admin only
DROP POLICY IF EXISTS app_errors_insert ON app_errors;
CREATE POLICY app_errors_insert ON app_errors FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS app_errors_select_admin ON app_errors;
CREATE POLICY app_errors_select_admin ON app_errors FOR SELECT
  USING (auth.role() = 'admin');

-- Coverage areas: read by all authenticated
DROP POLICY IF EXISTS coverage_areas_select ON coverage_areas;
CREATE POLICY coverage_areas_select ON coverage_areas FOR SELECT
  USING (true);

-- Verifications: user reads/updates own, admin reads all
DROP POLICY IF EXISTS verifications_select_self ON verifications;
CREATE POLICY verifications_select_self ON verifications FOR SELECT
  USING (profile_id = auth.uid() OR auth.role() = 'admin');

DROP POLICY IF EXISTS verifications_insert_self ON verifications;
CREATE POLICY verifications_insert_self ON verifications FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS verifications_update_self ON verifications;
CREATE POLICY verifications_update_self ON verifications FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- =====================================================
-- Refresh materialized view
-- =====================================================
REFRESH MATERIALIZED VIEW wallet_balance_snapshot;

COMMIT;
