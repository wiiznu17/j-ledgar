-- =============================================================================
-- Migration V3: Add Audit Fields to Internal Ledger Entries
-- Adds 'transaction_id' and 'description' to internal_ledger_entries table.
-- =============================================================================

SET search_path TO finance, public;

ALTER TABLE internal_ledger_entries 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS description VARCHAR(255);

-- Optional: Create index for transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_internal_ledger_tx_id ON internal_ledger_entries(transaction_id);
