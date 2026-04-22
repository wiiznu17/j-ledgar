CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    balance DECIMAL(20, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
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
