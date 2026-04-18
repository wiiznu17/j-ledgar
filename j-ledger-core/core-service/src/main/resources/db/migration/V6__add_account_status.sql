-- Ensure status column has a default value
ALTER TABLE accounts ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- Update the status check constraint to include CLOSED
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_accounts_status;
ALTER TABLE accounts ADD CONSTRAINT chk_accounts_status CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'));
