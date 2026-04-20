CREATE TABLE kyc_face_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_data_id UUID NOT NULL,
  selfie_image_sha256 VARCHAR(64),
  id_image_sha256 VARCHAR(64),
  similarity_score FLOAT,
  match_status VARCHAR(20),
  provider_reference VARCHAR(255),
  performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
