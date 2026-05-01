CREATE TABLE IF NOT EXISTS integration_outbox (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE INDEX idx_integration_outbox_status ON integration_outbox(status);
