SET search_path TO finance, public;

-- Migration to backfill from_account_id and to_account_id for old transactions
-- This ensures that transaction history is visible after the UUID migration.

-- 1. Backfill from_account_id
UPDATE transactions t
SET from_account_id = a.id
FROM wallets w
JOIN accounts a ON CAST(w.user_id AS UUID) = a.user_id AND w.currency = a.currency
WHERE t.from_wallet_id = w.id
AND t.from_account_id IS NULL;

-- 2. Backfill to_account_id
UPDATE transactions t
SET to_account_id = a.id
FROM wallets w
JOIN accounts a ON CAST(w.user_id AS UUID) = a.user_id AND w.currency = a.currency
WHERE t.to_wallet_id = w.id
AND t.to_account_id IS NULL;

-- Commentary: New transactions created via the refactored WalletService will have these IDs populated automatically.
