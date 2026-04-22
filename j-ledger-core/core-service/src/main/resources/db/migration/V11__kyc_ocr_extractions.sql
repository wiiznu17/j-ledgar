CREATE TABLE kyc_ocr_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_data_id UUID NOT NULL,
  id_number_hash VARCHAR(64),
  first_name_hash VARCHAR(64),
  last_name_hash VARCHAR(64),
  birth_date_hash VARCHAR(64),
  address_hash VARCHAR(64),
  extraction_confidence FLOAT,
  provider VARCHAR(50),
  extracted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
