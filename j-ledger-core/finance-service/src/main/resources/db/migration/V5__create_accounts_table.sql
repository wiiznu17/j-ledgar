SET search_path TO finance, public;

-- Create accounts table for internal ledger
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    balance DECIMAL(20, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SUBMITTED',
    kyc_review_date TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create internal_ledger_entries table to avoid conflict with wallet ledger_entries
CREATE TABLE IF NOT EXISTS internal_ledger_entries (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    amount DECIMAL(20, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_ledger_account_id ON internal_ledger_entries(account_id);
