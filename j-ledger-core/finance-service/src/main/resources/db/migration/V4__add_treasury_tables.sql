-- =============================================================================
-- J-Ledger Finance Service - Treasury Management Schema (V4)
-- =============================================================================

SET search_path TO finance, public;

-- 1. Treasury Bank Accounts: Company-owned accounts
CREATE TABLE IF NOT EXISTS treasury_bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    provider VARCHAR(20) NOT NULL, -- SCB, KBANK, STRIPE, etc.
    balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Treasury Payouts: Tracking money moving out of Stripe or between accounts
CREATE TABLE IF NOT EXISTS treasury_payouts (
    id BIGSERIAL PRIMARY KEY,
    stripe_payout_id VARCHAR(100) UNIQUE,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    destination_account_id BIGINT REFERENCES treasury_bank_accounts(id),
    arrival_date TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for updated_at
CREATE TRIGGER update_treasury_bank_accounts_updated_at
    BEFORE UPDATE ON treasury_bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treasury_payouts_updated_at
    BEFORE UPDATE ON treasury_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

