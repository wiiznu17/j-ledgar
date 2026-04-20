CREATE TABLE kyc_liveness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_data_id UUID NOT NULL,
  session_id VARCHAR(128),
  confidence_score FLOAT,
  liveness_detected BOOLEAN,
  challenge_passed BOOLEAN,
  retry_count INT DEFAULT 0,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
