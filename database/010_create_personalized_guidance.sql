-- Personalized Guidance for Micro-Zones
CREATE TABLE IF NOT EXISTS personalized_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES micro_zones(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  guidance_text TEXT NOT NULL,
  priority_level VARCHAR(20) DEFAULT 'Normal', -- Low, Normal, High, Critical
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast report lookups
CREATE INDEX IF NOT EXISTS idx_guidance_zone_id ON personalized_guidance(zone_id);
CREATE INDEX IF NOT EXISTS idx_guidance_farm_id ON personalized_guidance(farm_id);
