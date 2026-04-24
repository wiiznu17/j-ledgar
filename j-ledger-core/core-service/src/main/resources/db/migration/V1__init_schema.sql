CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    balance DECIMAL(20, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SUBMITTED',
    kyc_review_date TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_accounts_balance_non_negative CHECK (balance >= 0),
    CONSTRAINT chk_accounts_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_accounts_status CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'))
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    from_account_id UUID NOT NULL,
    to_account_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    flagged BOOLEAN DEFAULT false,
    flag_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_from_account
        FOREIGN KEY (from_account_id) REFERENCES accounts (id),
    CONSTRAINT fk_transactions_to_account
        FOREIGN KEY (to_account_id) REFERENCES accounts (id),
    CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_transactions_accounts_distinct CHECK (from_account_id <> to_account_id),
    CONSTRAINT chk_transactions_type CHECK (transaction_type IN ('TRANSFER')),
    CONSTRAINT chk_transactions_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_transactions_status CHECK (status IN ('PENDING', 'SUCCESS'))
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    account_id UUID NOT NULL,
    entry_type VARCHAR(10) NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_entries_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions (id),
    CONSTRAINT fk_ledger_entries_account
        FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT chk_ledger_entries_type CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_ledger_entries_amount_positive CHECK (amount > 0)
);

CREATE TABLE transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_logs_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions (id)
);

CREATE TABLE integration_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_integration_outbox_status CHECK (status IN ('PENDING', 'PROCESSED', 'DEAD_LETTER'))
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_type CHECK (type IN ('TOPUP', 'WITHDRAW')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED')),
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

CREATE TABLE reward_accounts (
    account_id UUID PRIMARY KEY REFERENCES accounts(id),
    points_balance DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reconciliation_reports (
    id UUID PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_system_assets DECIMAL(20, 4) NOT NULL,
    total_user_liabilities DECIMAL(20, 4) NOT NULL,
    discrepancy DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE kyc_face_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_data_id UUID NOT NULL,
  selfie_image_sha256 VARCHAR(64),
  id_image_sha256 VARCHAR(64),
  similarity_score FLOAT,
  match_status VARCHAR(20),
  provider_reference VARCHAR(255),
  performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pii_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type VARCHAR(50),
  s3_path VARCHAR(500),
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kyc_ocr_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_data_id UUID NOT NULL,
  id_number_hash VARCHAR(64),
  first_name_hash VARCHAR(64),
  last_name_hash VARCHAR(64),
  birth_date_hash VARCHAR(64),
  address_hash VARCHAR(64),
  extraction_confidence FLOAT,
  provider VARCHAR(50),
  extracted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transfer_id UUID,
  activity_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 4),
  risk_score INTEGER,
  description TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  reported_to_amlo_at TIMESTAMPTZ,
  amlo_reference VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
  id BIGSERIAL PRIMARY KEY,
  system_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  support_email VARCHAR(255),
  support_phone VARCHAR(50),
  default_currency VARCHAR(3) NOT NULL,
  business_hours_start VARCHAR(5),
  business_hours_end VARCHAR(5),
  email_notifications_enabled BOOLEAN NOT NULL,
  sms_notifications_enabled BOOLEAN NOT NULL,
  kyc_required BOOLEAN NOT NULL,
  two_factor_auth_required BOOLEAN NOT NULL,
  default_language VARCHAR(10) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  session_timeout_minutes INTEGER NOT NULL,
  registration_mode VARCHAR(20) NOT NULL,
  transfer_fee_fixed DECIMAL(20, 4) NOT NULL,
  transfer_fee_percentage DECIMAL(5, 4) NOT NULL,
  top_up_fee_fixed DECIMAL(20, 4) NOT NULL,
  top_up_fee_percentage DECIMAL(5, 4) NOT NULL,
  bill_payment_fee_fixed DECIMAL(20, 4) NOT NULL,
  bill_payment_fee_percentage DECIMAL(5, 4) NOT NULL,
  withdrawal_fee_fixed DECIMAL(20, 4) NOT NULL,
  withdrawal_fee_percentage DECIMAL(5, 4) NOT NULL,
  minimum_fee DECIMAL(20, 4) NOT NULL,
  daily_transaction_limit DECIMAL(20, 4) NOT NULL,
  monthly_transaction_limit DECIMAL(20, 4) NOT NULL,
  per_transaction_limit DECIMAL(20, 4) NOT NULL,
  wallet_balance_limit DECIMAL(20, 4) NOT NULL,
  daily_top_up_limit DECIMAL(20, 4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  limit_type VARCHAR(20) NOT NULL,
  limit_amount DECIMAL(20, 4) NOT NULL,
  current_amount DECIMAL(20, 4),
  reset_date TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries (transaction_id);
CREATE INDEX idx_ledger_entries_account_id ON ledger_entries (account_id);
CREATE INDEX idx_transaction_logs_transaction_id ON transaction_logs (transaction_id);
CREATE INDEX idx_integration_outbox_status ON integration_outbox (status);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference_id);
CREATE INDEX idx_payment_transactions_account ON payment_transactions(account_id);

-- Seed System Bank Account (Nil UUID)
INSERT INTO accounts (id, user_id, account_name, balance, currency, status, version)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'System Bank Account', 1000000000.0000, 'THB', 'ACTIVE', 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Merchant Account
INSERT INTO accounts (id, user_id, account_name, balance, currency, status, version, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Mock Coffee Shop',
    0.00,
    'THB',
    'ACTIVE',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Seed System Settings
INSERT INTO system_settings (
  system_name, company_name, support_email, support_phone, default_currency,
  business_hours_start, business_hours_end, email_notifications_enabled,
  sms_notifications_enabled, kyc_required, two_factor_auth_required,
  default_language, timezone, session_timeout_minutes, registration_mode,
  transfer_fee_fixed, transfer_fee_percentage, top_up_fee_fixed, top_up_fee_percentage,
  bill_payment_fee_fixed, bill_payment_fee_percentage, withdrawal_fee_fixed,
  withdrawal_fee_percentage, minimum_fee, daily_transaction_limit,
  monthly_transaction_limit, per_transaction_limit, wallet_balance_limit, daily_top_up_limit
)
VALUES (
  'J-Ledger', 'J-Ledger Co., Ltd.', 'support@jledger.com', '+66-2-123-4567', 'THB',
  '09:00', '17:00', true, true, true, false, 'th', 'Asia/Bangkok', 30, 'open',
  5.00, 0.01, 0.00, 0.00, 10.00, 0.005, 25.00, 0.02, 1.00,
  500000.00, 5000000.00, 100000.00, 1000000.00, 200000.00
)
ON CONFLICT DO NOTHING;
