# J-Ledger Ecosystem 🏦

J-Ledger is a high-performance, production-ready financial ledger system designed for consistency and scalability. The ecosystem is divided into two primary domains: **Core Ledger** (Java/Spring Boot) and **Portal Backend** (Node.js/NestJS).

---

## 🏗️ System Architecture

```text
.
├── j-ledger-core/                # 🛡️ Financial Core (Java 21)
│   ├── core-service/             # Ledger Engine & Double-Entry Logic
│   ├── api-gateway/              # Spring Cloud Gateway
│   ├── eureka-server/            # Service Discovery Registry
│   └── notification-service/     # Kafka Consumer for Alerts
├── j-ledger-portal/              # 🌐 Portal & Public APIs (NestJS)
│   ├── apps/
│   │   ├── wallet-api/           # Customer Wallet API (Id: 3002)
│   │   ├── admin-api/            # Back-office API (Id: 3001)
│   │   └── admin-web/            # Admin Management Dashboard
├── docker-compose.yml            # 🚀 Production Orchestration
└── docker-compose.dev.yml        # 🛠️ Development Infrastructure
```

---

## 🛠️ Local Development (Hybrid Workflow)

This is the recommended workflow for active development. It uses Docker for infrastructure (DB, Redis, Kafka) and runs the application code directly on your machine for fast feedback.

### 1. Start Infrastructure

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway
```

### 2. Initialize Databases (First Time Only)

Prisma requires a baseline when working with an existing shared database.

```bash
# Wallet API
cd j-ledger-portal/apps/wallet-api && npx prisma migrate dev --name init_foundation

# Admin API
cd ../admin-api && npx prisma migrate dev --name init_foundation
```

### 2.5 Database Migration (เมื่อมีการแก้ Database)

เมื่อต้องการแก้ database schema ในโหมด Hybrid Development:

**Core Service (Flyway):**

```bash
# สร้าง SQL migration file ใหม่
# ไฟล์: j-ledger-core/core-service/src/main/resources/db/migration/V13__your_change.sql

# Run migration
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm core-migration
```

**Admin API / Wallet API (Prisma):**

```bash
# แก้ prisma/schema.prisma
cd j-ledger-portal/apps/admin-api  # หรือ wallet-api

# สร้างและ apply migration
npx prisma migrate dev --name your_change
```

> **หมายเหตุ**: Step 2 (Initialize Databases) เป็นการทำครั้งแรกเท่านั้น หลังจากนั้นเมื่อแก้ database ให้ใช้ขั้นตอนใน step 2.5

---

### 3. Run Services Locally

Run each service in its own terminal:

**Portal APIs (NestJS):**

```bash
cd j-ledger-portal/apps/wallet-api && npm run dev
cd j-ledger-portal/apps/admin-api && npm run dev
```

**Core Service (Java):**

```bash
cd j-ledger-core/core-service && ./mvnw spring-boot:run
```

---

## 🚀 Production Deployment (Full Docker)

To run the entire system exactly as it would be in production:

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the secrets.

### 2. Launch Everything

```bash
docker compose up -d --build
```

**Note:** This uses the production nginx configuration with SSL. Requires SSL certificates at `/etc/letsencrypt/live/potayyr.site/` on the host machine.

_The system will automatically handle health checks, ensuring the DB and Kafka are ready before starting the APIs._

---

## 🩺 Monitoring & Access

- **Service Registry**: [http://localhost:8761](http://localhost:8761) (Eureka)
- **Object Storage**: [http://localhost:9001](http://localhost:9001) (MinIO Console)
- **Wallet API**: [http://localhost:3002/health](http://localhost:3002/health)
- **Admin API**: [http://localhost:3001/api/admin/health](http://localhost:3001/api/admin/health)

---

## 🔒 Security Best Practices

- **Internal Network**: All services communicate via the `jledger-network`.
- **Secret Management**: Never commit your `.env` file. Change all default passwords before deploying to AWS.
- **Port Exposure**: In production, only the `nginx` (80/443) and `api-gateway` (8080) should be exposed. Use `docker-compose.dev.yml` only for local debugging.
