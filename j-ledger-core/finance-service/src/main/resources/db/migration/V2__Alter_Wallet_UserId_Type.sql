-- Set search path to finance schema
SET search_path TO finance, public;

-- Drop and recreate all tables with user_id as VARCHAR(36) for UUID
DROP TABLE IF EXISTS transaction_holds CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;

-- Create wallets table
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    wallet_id VARCHAR(50) NOT NULL UNIQUE,
    balance DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    daily_limit DECIMAL(19, 4) NOT NULL DEFAULT 50000.0000,
    monthly_limit DECIMAL(19, 4) NOT NULL DEFAULT 500000.0000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0
);

-- Create ledger_entries table (double-entry bookkeeping)
CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    transaction_id VARCHAR(100) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    balance_after DECIMAL(19, 4) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    from_wallet_id BIGINT REFERENCES wallets(id),
    to_wallet_id BIGINT REFERENCES wallets(id),
    amount DECIMAL(19, 4) NOT NULL,
    fee DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create transaction_holds table
CREATE TABLE transaction_holds (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    transaction_id VARCHAR(100) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    hold_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP
);

-- Create system_settings table
CREATE TABLE system_settings (
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
    daily_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 500000.0000,
    monthly_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 5000000.0000,
    per_transaction_limit DECIMAL(19, 4) NOT NULL DEFAULT 100000.0000,
    wallet_balance_limit DECIMAL(19, 4) NOT NULL DEFAULT 1000000.0000,
    daily_top_up_limit DECIMAL(19, 4) NOT NULL DEFAULT 200000.0000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_wallet_id ON wallets(wallet_id);
CREATE INDEX idx_wallets_status ON wallets(status);
CREATE INDEX idx_ledger_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_transactions_from_wallet ON transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON transactions(to_wallet_id);
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_holds_wallet_id ON transaction_holds(wallet_id);
CREATE INDEX idx_holds_transaction_id ON transaction_holds(transaction_id);
CREATE INDEX idx_holds_status ON transaction_holds(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (system_name, company_name, support_email, support_phone, default_currency, business_hours_start, business_hours_end, email_notifications_enabled, sms_notifications_enabled, kyc_required, two_factor_auth_required, default_language, timezone, session_timeout_minutes, registration_mode, transfer_fee_fixed, transfer_fee_percentage, top_up_fee_fixed, top_up_fee_percentage, bill_payment_fee_fixed, bill_payment_fee_percentage, withdrawal_fee_fixed, withdrawal_fee_percentage, minimum_fee, daily_transaction_limit, monthly_transaction_limit, per_transaction_limit, wallet_balance_limit, daily_top_up_limit)
VALUES ('J-Ledger', 'J-Ledger Co., Ltd.', 'support@jledger.com', '+66-2-123-4567', 'THB', '09:00', '17:00', true, true, true, false, 'th', 'Asia/Bangkok', 30, 'open', 5.0000, 0.0100, 0.0000, 0.0000, 10.0000, 0.0050, 25.0000, 0.0200, 1.0000, 500000.0000, 5000000.0000, 100000.0000, 1000000.0000, 200000.0000)
ON CONFLICT DO NOTHING;
