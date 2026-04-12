-- V3__create_admin_user_table.sql
CREATE TABLE admin_user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Index for authentication speed
CREATE INDEX idx_admin_user_email ON admin_user(email);
