-- Services use separate schemas within this database
-- Create schemas for multi-schema Prisma setup
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS admin_auth_schema;
CREATE SCHEMA IF NOT EXISTS user_kyc_schema;
CREATE SCHEMA IF NOT EXISTS core_schema;
