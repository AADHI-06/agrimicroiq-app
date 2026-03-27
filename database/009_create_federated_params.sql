CREATE TABLE IF NOT EXISTS federated_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_set JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
