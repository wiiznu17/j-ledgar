SET search_path TO finance, public;

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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_linked_bank_user_id
    ON linked_bank_accounts(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_linked_bank_default_per_user
    ON linked_bank_accounts(user_id)
    WHERE is_default = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_linked_bank_updated_at'
    ) THEN
        CREATE TRIGGER update_linked_bank_updated_at
            BEFORE UPDATE ON linked_bank_accounts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
