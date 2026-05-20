SET search_path TO finance, public;

-- Migration to unify Wallet and Account identifiers in the Transaction ledger
-- We add UUID columns to support the new standardized accounting system
-- while keeping the legacy BIGINT columns for backward compatibility.

ALTER TABLE finance.transactions 
ADD COLUMN IF NOT EXISTS from_account_id UUID,
ADD COLUMN IF NOT EXISTS to_account_id UUID;

-- Optional: Create indexes for the new UUID columns to ensure performance
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON finance.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON finance.transactions(to_account_id);

-- Commentary: These columns will be populated for all new transactions.
-- Existing transactions can be back-filled via a background migration if needed.
