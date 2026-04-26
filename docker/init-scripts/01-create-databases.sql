-- Services use separate schemas within this database
-- Create schemas for new hybrid modular architecture
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS kyc;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;

-- Keep old schemas for migration compatibility (will be removed after migration)
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS admin_auth_schema;
CREATE SCHEMA IF NOT EXISTS user_kyc_schema;
CREATE SCHEMA IF NOT EXISTS core_schema;
