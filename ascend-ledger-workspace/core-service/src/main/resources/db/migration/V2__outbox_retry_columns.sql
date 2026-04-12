-- [MED-4] Add retry tracking columns to integration_outbox
-- Prevents malformed events from blocking the queue head indefinitely.
ALTER TABLE integration_outbox
    ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN last_error  TEXT;

-- Expand status constraint to include DEAD_LETTER for poison-pill events
ALTER TABLE integration_outbox
    DROP CONSTRAINT IF EXISTS chk_integration_outbox_status;

ALTER TABLE integration_outbox
    ADD CONSTRAINT chk_integration_outbox_status
        CHECK (status IN ('PENDING', 'PROCESSED', 'DEAD_LETTER'));
