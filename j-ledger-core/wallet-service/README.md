# Wallet Service

Business rules and wallet management service for J-Ledger.

## Features

- Wallet creation and management
- Balance updates with Redis caching
- Transaction validation
- Daily and transaction limits
- Eureka service discovery

## Tech Stack

- Spring Boot 3.2
- Spring Data JPA
- PostgreSQL
- Redis
- Kafka
- Eureka

## Database Schema

- `Wallet` - Wallet accounts

## API Endpoints

- `POST /wallets/create` - Create wallet
- `GET /wallets/{userId}` - Get wallet by user ID
- `POST /wallets/{userId}/balance` - Update balance
- `POST /wallets/{userId}/validate` - Validate transaction
- `POST /wallets/{userId}/deactivate` - Deactivate wallet
- `GET /wallets/health` - Health check

## Environment Variables

- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name

## Development

```bash
./mvnw spring-boot:run
```

## Docker

```bash
docker build -t j-ledger/wallet-service .
docker run -p 8082:8082 j-ledger/wallet-service
```

## Configuration

The service connects to:
- PostgreSQL for wallet data
- Redis for caching
- Eureka for service discovery
- Kafka for event publishing
