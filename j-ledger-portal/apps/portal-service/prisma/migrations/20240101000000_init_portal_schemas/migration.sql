-- Create schemas for portal service
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS kyc;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;

-- Identity Schema
CREATE TABLE IF NOT EXISTS identity.users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- KYC Schema
CREATE TABLE IF NOT EXISTS kyc.documents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ocr_data JSONB,
  face_match_score NUMERIC(5,2),
  reviewed_by BIGINT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kyc.pii_records (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  field_type VARCHAR(100) NOT NULL,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin Schema
CREATE TABLE IF NOT EXISTS admin.staff (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin.roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin.staff_roles (
  id BIGSERIAL PRIMARY KEY,
  staff_id BIGINT NOT NULL REFERENCES admin.staff(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES admin.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, role_id)
);

-- Integration Schema
CREATE TABLE IF NOT EXISTS integration.banks (
  id BIGSERIAL PRIMARY KEY,
  bank_code VARCHAR(20) NOT NULL UNIQUE,
  bank_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration.merchants (
  id BIGSERIAL PRIMARY KEY,
  merchant_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Schema
CREATE TABLE IF NOT EXISTS audit.logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  staff_id BIGINT,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reporting Schema
CREATE TABLE IF NOT EXISTS reporting.reports (
  id BIGSERIAL PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  parameters JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'GENERATING',
  file_url VARCHAR(500),
  generated_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_identity_users_phone ON identity.users(phone);
CREATE INDEX IF NOT EXISTS idx_identity_users_email ON identity.users(email);
CREATE INDEX IF NOT EXISTS idx_identity_sessions_user_id ON identity.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_sessions_token ON identity.sessions(token);
CREATE INDEX IF NOT EXISTS idx_identity_refresh_tokens_user_id ON identity.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_refresh_tokens_token ON identity.refresh_tokens(token);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc.documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_pii_records_user_id ON kyc.pii_records(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_staff_email ON admin.staff(email);
CREATE INDEX IF NOT EXISTS idx_admin_staff_role ON admin.staff(role);
CREATE INDEX IF NOT EXISTS idx_admin_staff_roles_staff_id ON admin.staff_roles(staff_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_roles_role_id ON admin.staff_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_integration_banks_code ON integration.banks(bank_code);
CREATE INDEX IF NOT EXISTS idx_integration_merchants_id ON integration.merchants(merchant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit.logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit.logs(created_at);

CREATE INDEX IF NOT EXISTS idx_reporting_reports_type ON reporting.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reporting_reports_status ON reporting.reports(status);
CREATE INDEX IF NOT EXISTS idx_reporting_reports_created_at ON reporting.reports(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_identity_users_updated_at BEFORE UPDATE ON identity.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_pii_records_updated_at BEFORE UPDATE ON kyc.pii_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_staff_updated_at BEFORE UPDATE ON admin.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_banks_updated_at BEFORE UPDATE ON integration.banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_merchants_updated_at BEFORE UPDATE ON integration.merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
