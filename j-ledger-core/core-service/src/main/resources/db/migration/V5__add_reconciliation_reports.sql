CREATE TABLE reconciliation_reports (
    id UUID PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_system_assets DECIMAL(20, 4) NOT NULL,
    total_user_liabilities DECIMAL(20, 4) NOT NULL,
    discrepancy DECIMAL(20, 4) NOT NULL,
    status VARCHAR(20) NOT NULL, -- MATCHED, DISCREPANCY
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
