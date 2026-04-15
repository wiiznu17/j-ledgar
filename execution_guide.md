# Execution Guide: Phase 6 — Full Local System Spin-up

This guide provides the exact terminal commands required to launch the complete J-Ledger ecosystem on your local machine.

## Prerequisites
- **Docker & Docker Compose** installed and running.
- **Java 21** and **Maven** installed and in your PATH.
- **Node.js 20+** and **npm** installed.
- **Postman** installed (to use the refactored collection).

---

## 1. Environment Preparation
Open your terminal and set the internal ecosystem secret. This must be consistent across all services.

```bash
export JLEDGER_INTERNAL_SECRET="jledger_ecosystem_secret_2024"
export JWT_SECRET="jledger-local-dev-jwt-secret"
```

---

## 2. Infrastructure Layer (Docker)
Start the foundational services (Database, Messaging, Discovery).

```bash
cd j-ledger-core
# Spin up Postgres, Redis, Kafka, and Eureka Server
docker-compose up -d postgres redis zookeeper kafka eureka-server

# Verify health (Wait ~30s until all report 'healthy' or 'running')
docker ps
```

---

## 3. Database Sync & Migrations
The Java core uses Flyway and will migrate automatically on startup. For the NestJS BFFs, you must sync the logical schemas manually.

```bash
# Sync Wallet BFF Schema
cd ../j-ledger-portal/apps/wallet-api
npx prisma db push --schema=./prisma/schema.prisma

# Sync & Seed Admin BFF Schema
cd ../admin-api
npx prisma db push --schema=./prisma/schema.prisma
npm run seed  # Creates admin@jledger.com / Admin@123
```

---

## 4. Core Application Layer (Java on Host)
Open **two new terminal windows/tabs** to run the Java services independently.

### Tab A: Core Ledger Service
```bash
cd j-ledger-core/core-service
mvn clean spring-boot:run
```

### Tab B: API Gateway
```bash
cd j-ledger-core/api-gateway
mvn clean spring-boot:run
```

---

## 5. Portal & BFF Layer (Turborepo)
Launch the Backend-for-Frontend APIs and the Admin Dashboard simultaneously.

```bash
cd j-ledger-portal
# Install and generate all isolated Prisma clients
npm install

# Start all three portal applications (Forcing Webpack for Next.js 16 stability)
npx turbo run dev --filter=admin-api --filter=wallet-api --filter=admin-web
```

---

## 6. System Verification Checklist

Ensure all components are responsive at the following URLs:

| Component | URL / Port | Verification Method |
| :--- | :--- | :--- |
| **Eureka Discovery** | `http://localhost:8761` | All services (CORE-SERVICE, API-GATEWAY) should appear as **UP**. |
| **API Gateway** | `http://localhost:8080/actuator/health` | Should return `{"status":"UP"}`. |
| **Admin Web (Dashboard)** | `http://localhost:3000` | Should show the login page. |
| **Admin API (BFF)** | `http://localhost:3001` | Core logic for staff operations. |
| **Wallet API (BFF)** | `http://localhost:3002` | Core logic for customer operations. |

---

## 7. Integration Testing
Once everything is "UP", open **Postman** and import the updated collection:
`j-ledger-core/j-ledger-integration-tests.postman_collection.json`

1.  Run **1.1 Register Customer** in the "Wallet API (External)" folder.
2.  Run **1.2 Customer Login** to obtain a JWT token.
3.  Run **1.3 Execute Transfer (BFF)** to test the full flow through the BFF → Gateway → Core Ledger.

> [!TIP]
> **Debugging Logs**: If a transaction fails, check the terminal running `core-service` for ledger errors, and the `wallet-api` terminal for BFF/PIN validation issues.
