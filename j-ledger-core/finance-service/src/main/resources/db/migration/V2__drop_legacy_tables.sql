-- -----------------------------------------------------------------------------
-- Migration: V2__drop_legacy_tables
-- Description: Drop unused legacy tables to clean up the schema.
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS finance.ledger_entries CASCADE;
DROP TABLE IF EXISTS finance.transaction_holds CASCADE;
