SET search_path TO finance, public;

-- Migration to add a nullable reference_id column to the Transactions table
-- This enables us to store external gateway identifiers (like Stripe's pi_xxx or po_xxx)
-- while maintaining uniform TXNxxxx or UUID formats for the primary transaction_id column.

ALTER TABLE finance.transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON finance.transactions(reference_id);
