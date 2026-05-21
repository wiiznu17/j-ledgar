-- =============================================================================
-- J-Ledger Finance Service - Consolidated Database Schema (V1 - FINAL VERIFIED)
-- This script initializes the entire 'finance' schema, verified against Java Entities.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS finance;
SET search_path TO finance, public;

-- -----------------------------------------------------------------------------
-- 1. Helper Functions & Triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -----------------------------------------------------------------------------
-- 2. Core Wallet Tables (Model Package)
-- -----------------------------------------------------------------------------

-- Wallets: Main user balance storage (com.jledger.finance.model.Wallet)
CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    wallet_id VARCHAR(50) NOT NULL UNIQUE,
    balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    daily_limit DECIMAL(19, 4) NOT NULL DEFAULT 50000.0000,
    monthly_limit DECIMAL(19, 4) NOT NULL DEFAULT 500000.0000,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transactions: Wallet transaction history (com.jledger.finance.model.Transaction)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    from_wallet_id BIGINT,
    to_wallet_id BIGINT,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    fee DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Linked Bank Accounts: External banks (com.jledger.finance.model.LinkedBankAccount)
CREATE TABLE IF NOT EXISTS linked_bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'SAVINGS',
    is_default BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Accounting & Audit Tables (Domain Package)
-- -----------------------------------------------------------------------------

-- Accounts: System assets and liabilities (com.jledger.finance.domain.Account)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50), -- ตัวใหม่: PENDING, VAT, FEE, REVENUE, etc.
    balance DECIMAL(20, 4) NOT NULL DEFAULT 0.0000,
    daily_limit DECIMAL(20, 4) NOT NULL DEFAULT 500000.0000,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SUBMITTED',
    kyc_review_date TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Internal Ledger Entries: Audit trail for system accounts (com.jledger.finance.domain.LedgerEntry)
CREATE TABLE IF NOT EXISTS internal_ledger_entries (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    amount DECIMAL(20, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation Reports: Audit results (com.jledger.finance.domain.ReconciliationReport)
CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_system_assets DECIMAL(20, 4) NOT NULL,
    total_user_liabilities DECIMAL(20, 4) NOT NULL,
    discrepancy DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. Operations, Risk & Settings
-- -----------------------------------------------------------------------------

-- Integration Outbox: Event persistence (com.jledger.finance.domain.IntegrationOutbox)
CREATE TABLE IF NOT EXISTS integration_outbox (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions: External payments (com.jledger.finance.domain.PaymentTransaction)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    reference_id VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suspicious Activities: Fraud/AML (com.jledger.finance.domain.SuspiciousActivity)
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    transfer_id UUID,
    activity_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 4),
    description TEXT,
    risk_score INTEGER,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    reported_to_amlo_at TIMESTAMP WITH TIME ZONE,
    amlo_reference VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Limits: (com.jledger.finance.domain.TransactionLimit)
CREATE TABLE IF NOT EXISTS transaction_limits (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    limit_type VARCHAR(20) NOT NULL,
    limit_amount DECIMAL(20, 4) NOT NULL,
    current_amount DECIMAL(20, 4),
    reset_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reward Accounts: (com.jledger.finance.domain.RewardAccount)
CREATE TABLE IF NOT EXISTS reward_accounts (
    account_id UUID PRIMARY KEY,
    points_balance DECIMAL(20, 4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System Settings: (com.jledger.finance.domain.SystemSettings)
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL DEFAULT 'J-Ledger',
    company_name VARCHAR(200),
    support_email VARCHAR(100),
    support_phone VARCHAR(20),
    default_currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    business_hours_start VARCHAR(5),
    business_hours_end VARCHAR(5),
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    kyc_required BOOLEAN NOT NULL DEFAULT true,
    two_factor_auth_required BOOLEAN NOT NULL DEFAULT false,
    default_language VARCHAR(10) NOT NULL DEFAULT 'th',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Bangkok',
    session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
    registration_mode VARCHAR(20) NOT NULL DEFAULT 'open',
    transfer_fee_fixed DECIMAL(19, 4) NOT NULL DEFAULT 5.0000,
    transfer_fee_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0100,
    top_up_fee_fixed DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    top_up_fee_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    bill_payment_fee_fixed DECIMAL(19, 4) NOT NULL DEFAULT 10.0000,
    bill_payment_fee_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0050,
    withdrawal_fee_fixed DECIMAL(19, 4) NOT NULL DEFAULT 25.0000,
    withdrawal_fee_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0200,
    minimum_fee DECIMAL(19, 4) NOT NULL DEFAULT 1.0000,
    merchant_fee_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0300,
    vat_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0700,
    min_merchant_payment DECIMAL(19, 4) NOT NULL DEFAULT 5.0000,
    min_p2p_transfer DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    daily_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 500000.0000,
    monthly_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 5000000.0000,
    per_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 100000.0000,
    wallet_balance_limit DECIMAL(19, 4) NOT NULL DEFAULT 1000000.0000,
    daily_top_up_limit DECIMAL(19, 4) NOT NULL DEFAULT 200000.0000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Legacy Tables (Reserved for backward compatibility)
-- -----------------------------------------------------------------------------

-- Old wallet ledger (Not mapped to an entity)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    balance_after DECIMAL(19, 4) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Old hold system (Not mapped to an entity)
CREATE TABLE IF NOT EXISTS transaction_holds (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    hold_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- 6. Indexes & Triggers
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_id ON wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_linked_bank_user_id ON linked_bank_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_linked_bank_default_per_user ON linked_bank_accounts(user_id) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_ref ON payment_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_integration_outbox_status ON integration_outbox(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_user ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_limits_account ON transaction_limits(account_id);

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_linked_bank_updated_at BEFORE UPDATE ON linked_bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suspicious_updated_at BEFORE UPDATE ON suspicious_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_limits_updated_at BEFORE UPDATE ON transaction_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
