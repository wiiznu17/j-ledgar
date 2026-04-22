CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  approval_type VARCHAR(50),
  maker_id UUID NOT NULL,
  checker_id UUID,
  status VARCHAR(20) DEFAULT 'PENDING',
  data JSONB,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
