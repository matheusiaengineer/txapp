-- TXAP - Sistema de Rank de Influenciadores (Meta + Recompensa)

-- Tabela: influencer_referrals
CREATE TABLE IF NOT EXISTS influencer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_user_id UUID REFERENCES profiles(id),
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_given BOOLEAN DEFAULT false
);

-- Tabela: influencer_goals
CREATE TABLE IF NOT EXISTS influencer_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL,
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  reward_type VARCHAR(50),
  reward_value TEXT,
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_influencer ON influencer_referrals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON influencer_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_goals_influencer ON influencer_goals(influencer_id);

ALTER TABLE influencer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "influencer_see_own_referrals" ON influencer_referrals
    FOR SELECT USING (auth.uid() IN (SELECT created_by FROM influencers WHERE id = influencer_referrals.influencer_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_full_referrals" ON influencer_referrals
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "influencer_see_own_goals" ON influencer_goals
    FOR SELECT USING (auth.uid() IN (SELECT created_by FROM influencers WHERE id = influencer_goals.influencer_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_full_goals" ON influencer_goals
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
