-- V3: Add Payment Transactions and Seed System Account

-- Create payment_transactions table to track external intents
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    reference_id VARCHAR(100) UNIQUE NOT NULL, -- Ref from external gateway
    type VARCHAR(20) NOT NULL, -- TOPUP, WITHDRAW
    amount DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, SUCCESS, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_type CHECK (type IN ('TOPUP', 'WITHDRAW')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

-- Seed System Bank Account (Nil UUID)
-- This account represents the 'Gateway' or the system's actual bank balance
INSERT INTO accounts (id, user_id, account_name, balance, currency, status, version)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'System Bank Account', 1000000000.0000, 'THB', 'ACTIVE', 0)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference_id);
CREATE INDEX idx_payment_transactions_account ON payment_transactions(account_id);
