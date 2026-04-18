-- V4: Add Reward Accounts and Seed Merchant Data
CREATE TABLE reward_accounts (
    account_id UUID PRIMARY KEY REFERENCES accounts(id),
    points_balance DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed a fixed Merchant Account (UUID chosen for easy testing)
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
