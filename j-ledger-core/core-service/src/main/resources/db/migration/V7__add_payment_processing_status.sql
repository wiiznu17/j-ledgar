-- V7: Add PROCESSING status to payment_transactions for atomic webhook idempotency
-- This intermediate status is used to atomically claim a webhook delivery,
-- eliminating the TOCTOU race condition when concurrent webhooks arrive for the same reference_id.
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE payment_transactions ADD CONSTRAINT chk_payment_status
    CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'));
