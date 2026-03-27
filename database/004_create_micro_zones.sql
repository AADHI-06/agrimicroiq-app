CREATE TABLE IF NOT EXISTS micro_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  zone_polygon JSONB NOT NULL,
  ndvi_value FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
