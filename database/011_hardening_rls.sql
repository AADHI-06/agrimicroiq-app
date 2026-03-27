-- 🛡️ AgriMicro IQ Security Hardening: Row-Level Security (RLS)

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies

-- USERS: Users can only see their own profile. Service role has full access.
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- FARMS: Users can only see/edit their own farms.
CREATE POLICY "Users can manage own farms" ON farms
  FOR ALL USING (auth.uid() = user_id);

-- MICRO_ZONES: Users can only see zones belonging to their farms.
CREATE POLICY "Users can manage own zones" ON micro_zones
  FOR ALL USING (
    farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
  );

-- PEST_PREDICTIONS: Users can only see predictions for their zones.
CREATE POLICY "Users can view own pest predictions" ON pest_predictions
  FOR SELECT USING (
    zone_id IN (
      SELECT mz.id FROM micro_zones mz
      JOIN farms f ON mz.farm_id = f.id
      WHERE f.user_id = auth.uid()
    )
  );

-- RESOURCE_RECOMMENDATIONS: Similarly restricted.
CREATE POLICY "Users can view own recommendations" ON resource_recommendations
  FOR SELECT USING (
    zone_id IN (
      SELECT mz.id FROM micro_zones mz
      JOIN farms f ON mz.farm_id = f.id
      WHERE f.user_id = auth.uid()
    )
  );

-- LOGS: Backend (service role) can write, but public/anon cannot.
-- By default, no policy = no access for anon/auth users.
-- We keep logs restricted to Service Role only.
