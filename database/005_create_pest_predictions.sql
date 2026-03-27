CREATE TABLE IF NOT EXISTS pest_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES micro_zones(id) ON DELETE CASCADE,
  risk_level VARCHAR(20) NOT NULL,
  probability FLOAT NOT NULL,
  predicted_pest VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
