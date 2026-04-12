#!/bin/bash

# ==============================================================================
# J-Ledger Local Development Environment Setup
# ==============================================================================
# Usage: source ./scripts/setup-dev.sh
# ------------------------------------------------------------------------------

echo "🚀 Setting up Environment Variables for Hybrid Dev Mode..."

# 1. Eureka Configuration
export JLEDGER_EUREKA_ZONE=http://localhost:8761/eureka/

# 2. Database Configuration
export JLEDGER_DATASOURCE_URL=jdbc:postgresql://localhost:5432/jledger_db
export JLEDGER_DATASOURCE_USERNAME=ledger_admin
export JLEDGER_DATASOURCE_PASSWORD=ledger_password

# 3. Message Broker (Kafka)
export JLEDGER_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# 4. Redis Cache
export JLEDGER_REDIS_ADDRESS=redis://localhost:6379
export JLEDGER_REDIS_PASSWORD=redis_password

# 5. Core Service Admin Credentials (Optional overrides)
export JLEDGER_ADMIN_EMAIL=admin@jledger.io
export JLEDGER_ADMIN_PASSWORD=password123

echo "✅ Environment variables exported successfully!"
echo "💡 You can now run your services using: ./mvnw spring-boot:run"
