# J-Ledger Ecosystem 🏦

J-Ledger is a high-performance, production-ready financial ledger system designed for consistency and scalability. The ecosystem uses a pragmatic monolithic architecture with **2 core services** for simplified deployment and faster development.

---

## 🏗️ System Architecture

```text
.
├── j-ledger-core/                # 🛡️ Financial Core (Java 21)
│   └── finance-service/          # All financial logic (ledger, wallet, transfer, limits, settlement, fraud, fees)
├── j-ledger-portal/              # 🌐 Portal Service (NestJS Monolith)
│   ├── apps/
│   │   ├── portal-service/       # Monolithic API (identity, kyc, admin, integration, audit, reporting modules)
│   │   ├── notification-worker/  # Async Notifications (Kafka consumer, push, email, SMS)
│   │   ├── admin-web/            # Admin Management Dashboard (React)
│   │   └── wallet-app/           # Customer Mobile App (React Native/Expo)
│   └── packages/                 # Shared packages
├── docker/
│   └── nginx/
│       ├── default.conf          # Production (HTTPS with SSL, potayyr.site) - Public NGINX
│       └── default.conf.example  # Local development (HTTP only, localhost) - สำหรับ Local Test
├── docker-compose.yml            # 🚀 Production Orchestration
├── docker-compose.dev.yml        # 🛠️ Development Infrastructure (Dev Mode)
└── docker-compose.test.yml       # 🧪 Local Test Infrastructure (Local Test Mode)
```

### Core Services

| Service                 | Port | Technology            | Responsibilities                                                                          |
| ----------------------- | ---- | --------------------- | ----------------------------------------------------------------------------------------- |
| **finance-service**     | 8081 | Java 21 / Spring Boot | Ledger, wallet, transfers, transactions, limits, settlement, fraud rules, fees, reporting |
| **portal-service**      | 3000 | NestJS                | Identity, KYC, Admin, Integration, Audit, Reporting APIs (monolithic)                     |
| **notification-worker** | 3001 | NestJS                | Kafka consumer, push notifications, email, SMS                                            |
| **admin-web**           | 3002 | React / Next.js       | Admin Management Dashboard                                                                |

### Portal Service Modules

| Module          | Purpose                                                              |
| --------------- | -------------------------------------------------------------------- |
| **identity**    | User authentication, registration, PIN, biometric, device management |
| **kyc**         | KYC document upload, OCR, face verification, PII encryption          |
| **admin**       | Staff management, roles, permissions, audit logging                  |
| **integration** | Transaction history, bank integrations, webhooks, ledger proxy       |
| **audit**       | Audit logging, sensitive data masking, compliance tracking           |
| **reporting**   | Daily/monthly reports, reconciliation, user statistics               |

### Database Schemas

| Schema          | Owner           | Purpose                                                                                             |
| --------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| **finance**     | finance-service | Money domain (wallets, accounts, ledger entries, transactions, transfers, holds, fees, settlements) |
| **identity**    | portal-service  | User authentication, devices, sessions, OTP, consents, security events                              |
| **kyc**         | portal-service  | KYC documents, PII data, verification status                                                        |
| **admin**       | portal-service  | Staff, roles, permissions, audit logs                                                               |
| **integration** | portal-service  | Bank integrations, webhooks, API logs                                                               |

---

## 🚀 Deployment Modes

J-Ledger supports 4 deployment modes:

### Mode 1: Local Development (Hybrid)

- **Infrastructure**: Docker (postgres, redis, kafka, zookeeper, pgadmin)
- **Services**: Run locally on your machine
- **Nginx**: Not used (access services directly via localhost:port)
- **Database**: Single database (jledger_db) with schemas for each service
- **Command**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper pgadmin`

### Mode 2: Local Test (Full Docker)

- **Infrastructure**: Full Docker stack
- **Services**: All services in Docker
- **Nginx**: HTTP only (default.conf.example) for testing
- **Database**: Single database (jledger_db) with schemas
- **Command**: `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build`

### Mode 3: Production (AWS EC2)

- **Infrastructure**: Full Docker stack on AWS EC2
- **Services**: All services in Docker
- **Nginx**: HTTPS with SSL (default.conf) for public
- **Database**: Single database (jledger_db) with schemas
- **Command**: `docker compose up -d --build`

### Mode 4: Development with Ports Open (Full Docker + External Access)

- **Infrastructure**: Full Docker stack with exposed ports
- **Services**: All services in Docker
- **Nginx**: HTTP only (default.conf.example) for testing with external access (ngrok, Vercel, etc.)
- **Database**: Single database (jledger_db) with schemas
- **Exposed Ports**: postgres(5432), redis(6379), kafka(9092), zookeeper(2181), pgadmin(5050)
- **Command**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.test.yml up -d --build`
- **Use Case**: Development with external frontend (Vercel), ngrok tunneling, or when you need direct DB access

See [network.md](./network.md) for detailed network architecture and configuration.

---

## �️ Database Management

### Reset Database (Start Fresh)

To completely reset the database and start from scratch:

````bash
# Stop all containers and remove volumes
docker compose down -v

# For Mode 1 (Dev Mode)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# For Mode 2 (Local Test)
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v

### 🔄 Unified System Reset (Recommended for Dev)

To completely wipe both **Finance Service (Java)** and **Portal Service (Node)** and start from a clean state (0 balance, core accounts, and treasury seeds):

```bash
# 1. Run the reset script (Wipes DBs and runs migrations)
cd j-ledger-portal && npm run system:reset

# 2. Start Finance Service (Java)
cd j-ledger-core/finance-service && ./mvnw spring-boot:run

# 3. Run the Smart Seeder (Run after Java is UP)
cd j-ledger-portal/apps/portal-service && npx prisma db seed
````

**This process ensures:**

1. Both databases are completely fresh.
2. Core system settings (MDR, VAT, Limits) are initialized in Java.
3. Treasury bank accounts (SCB, KBank) are seeded for the dashboard.
4. Portal accounts are linked to Finance accounts correctly.

---

### Manual Finance Schema Reset (Start Ledger Fresh)

If you only want to wipe the **finance** ledger data manually:

**Warning:** This deletes all data including:

- PostgreSQL data
- Redis data
- Kafka data
- All application data

---

## �️ Mode 1: Local Development (Hybrid Workflow)

This is the recommended workflow for active development. It uses Docker for infrastructure (DB, Redis, Kafka) and runs the application code directly on your machine for fast feedback.

### 1. Start Infrastructure

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper pgadmin
```

### 2. Initialize Databases (First Time Only)

**Note:** Only services with direct database access and migration files need to be initialized.

```bash
# Finance Service (Flyway - Java)
cd j-ledger-core/finance-service
# Flyway migrations run automatically via Spring Boot on startup
# Or manually: ./mvnw flyway:migrate
```

### 2.5 Database Migration (เมื่อมีการแก้ Database)

เมื่อต้องการแก้ database schema ในโหมด Hybrid Development:

**Finance Service (Flyway - Java):**

```bash
# สร้าง SQL migration file ใหม่
# ไฟล์: j-ledger-core/finance-service/src/main/resources/db/migration/V2__your_change.sql
# ระบุ schema ใน SQL: SET search_path TO finance, public;
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm finance-migration
```

**Portal Service (Prisma - Node):**

```bash
# 1. เมื่อมีการแก้ไขไฟล์ schema.prisma และต้องการสร้าง Migration
cd j-ledger-portal/apps/portal-service
npx prisma migrate dev --name <migration_name>

# 2. เมื่อต้องการ Reset Database และลงข้อมูลเริ่มต้นใหม่ (ล้างตารางทั้งหมด)
npx prisma migrate reset

# 3. เมื่อต้องการลงข้อมูลเริ่มต้น (Seed) อย่างเดียว (ไม่ล้างตาราง)
node prisma/seed.js
# หรือ
npx prisma db seed
```

> **หมายเหตุสำหรับ Mode 2 (Local Test) และ Mode 3 (Production)**:
>
> - Migrations รันอัตโนมัติผ่าน Docker Compose containers
> - ไม่ต้องรัน migration แยก
> - Migration container: finance-migration

> **หมายเหตุ**: Step 2 (Initialize Databases) เป็นการทำครั้งแรกเท่านั้น หลังจากนั้นเมื่อแก้ database ให้ใช้ขั้นตอนใน step 2.5

---

### 3. Run Services Locally

Run each service in its own terminal:

**Portal Service (NestJS):**

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:8081 | xargs kill -9
lsof -ti:19000 | xargs kill -9
```

```bash
cd j-ledger-portal/apps/portal-service && npm run dev
```

**Finance Service (Java):**

Ensure your `.env` variables are exported in your terminal, as the service requires them to start.

```bash
cd j-ledger-core/finance-service && export $(grep -v '^#' ../../.env | xargs) && ./mvnw spring-boot:run
```

**Notification Worker (NestJS):**

```bash
cd j-ledger-portal/apps/notification-worker && npm run start:dev
```

**Frontend Applications (Optional):**

```bash
cd j-ledger-portal/apps/admin-web && npm run dev
cd j-ledger-portal/apps/wallet-app && npx expo start
```

### Cleanup (When Needed)

To reset infrastructure and start fresh:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper pgadmin
```

---

## 🧪 Mode 2: Local Test (Full Docker)

To run the entire system in Docker locally for testing before production deployment:

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the secrets.

### 2. First Time Setup (Database Initialization)

Migrations run automatically on first startup. No manual steps required.

Migration containers will run in this order:

1. finance-migration (creates finance schema and tables)
2. portal-migration (runs Prisma migrate deploy)

### 2.5 Seed Database (After Migrations Complete)

After migrations complete, seed the database with initial data:

```bash
# Run portal seed (creates permissions, roles, admin user, test data)
docker compose -f docker-compose.yml -f docker-compose.test.yml up portal-seed

# Run finance seed (creates system accounts, treasury accounts)
docker exec -i jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < j-ledger-core/finance-service/src/main/resources/db/seed/dev_seed.sql
```

**What gets seeded:**

- Permissions and Roles (RBAC)
- Admin user (username: admin, password: from JLEDGER_ADMIN_PASSWORD env var)
- Loyalty rules
- System partner and accounts
- Finance service settings
- Test merchant and terminal data (Coffee Master)
- Treasury bank accounts (SCB: 5M THB, KBank: 2M THB)

### 3. Database Migration (When Changing Schema)

When you need to modify database schema:

**Step 1: Create Migration File Locally**

```bash
# For Finance Service (Flyway)
# Create: j-ledger-core/finance-service/src/main/resources/db/migration/V2__your_change.sql
# Remember to include: SET search_path TO finance, public;
```

**Step 2: Rebuild and Restart**

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

Migration containers will automatically apply the new migrations.

### 4. Launch Everything

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

**Note:** This uses the HTTP-only nginx configuration (default.conf.example) for local testing. No SSL required.

_The system will automatically handle health checks, ensuring the DB and Kafka are ready before starting the APIs._

---

## 🚀 Mode 3: Production Deployment (AWS EC2)

To run the entire system exactly as it would be in production on AWS EC2:

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the secrets.

### 2. First Time Setup (Database Initialization)

Migrations run automatically on first startup. No manual steps required.

Migration containers will run in this order:

1. finance-migration (creates finance schema and tables)
2. portal-migration (runs Prisma migrate deploy)

### 2.5 Seed Database (Production)

After migrations complete, seed the database with production-safe data:

```bash
# Run portal seed (NODE_ENV=production skips admin creation and test data)
NODE_ENV=production docker compose up portal-seed

# Run finance seed (creates system accounts with zero balance)
docker exec -i jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < j-ledger-core/finance-service/src/main/resources/db/seed/prod_seed.sql
```

**What gets seeded in production:**

- Permissions and Roles (RBAC)
- Loyalty rules
- System partner and accounts
- SYSTEM_BANK_ACCOUNT (balance: 0)

**What is NOT seeded in production:**

- ❌ Admin user (use manual setup - see docs/ADMIN_SETUP.md)
- ❌ Test merchant and terminal data
- ❌ Finance service settings (configure manually through admin interface)
- ❌ Treasury bank accounts with money (configure manually)

### 3. Database Migration (When Changing Schema)

When you need to modify database schema in production:

**Step 1: Create Migration File Locally**

```bash
# For Finance Service (Flyway)
# Create: j-ledger-core/finance-service/src/main/resources/db/migration/V2__your_change.sql
# Remember to include: SET search_path TO finance, public;
```

**Step 2: Test in Mode 2 (Local Test) First**

Always test migrations in Mode 2 before deploying to production:

```bash
# Reset Mode 2 database
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v

# Run with new migrations
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

**Step 3: Deploy to Production**

```bash
# SSH into production server
ssh user@your-server

# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

> **⚠️ Important:** Always backup database before running migrations in production

### 4. Launch Everything

```bash
docker compose up -d --build
```

**Note:** This uses the production nginx configuration with SSL (default.conf). Requires SSL certificates at `/etc/letsencrypt/live/potayyr.site/` on the host machine.

_The system will automatically handle health checks, ensuring the DB and Kafka are ready before starting the APIs._

---

## 🛠️ Mode 4: Development with Ports Open (Full Docker + External Access)

To run the entire system in Docker with exposed ports for external access (ngrok, Vercel, etc.):

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the secrets.

### 2. First Time Setup (Database Initialization)

Migrations run automatically on first startup. No manual steps required.

Migration containers will run in this order:

1. finance-migration (creates finance schema and tables)
2. portal-migration (runs Prisma migrate deploy)

### 2.5 Seed Database (Development)

After migrations complete, seed the database with development data:

```bash
# Run portal seed (creates permissions, roles, admin user, test data)
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.test.yml up portal-seed

# Run finance seed (creates system accounts, treasury accounts with test money)
docker exec -i jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < j-ledger-core/finance-service/src/main/resources/db/seed/dev_seed.sql
```

**What gets seeded:**

- Permissions and Roles (RBAC)
- Admin user (username: admin, password: from JLEDGER_ADMIN_PASSWORD env var)
- Loyalty rules
- System partner and accounts
- Finance service settings
- Test merchant and terminal data (Coffee Master)
- Treasury bank accounts (SCB: 5M THB, KBank: 2M THB)

### 3. Database Migration (When Changing Schema)

When you need to modify database schema:

**Step 1: Create Migration File Locally**

```bash
# For Finance Service (Flyway)
# Create: j-ledger-core/finance-service/src/main/resources/db/migration/V2__your_change.sql
# Remember to include: SET search_path TO finance, public;
```

**Step 2: Rebuild and Restart**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.test.yml up -d --build
```

Migration containers will automatically apply the new migrations.

### 4. Launch Everything

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.test.yml up -d --build
```

**Note:** This combines docker-compose.dev.yml (exposes ports) with docker-compose.test.yml (HTTP nginx config). Use this when you need:

- External frontend access (Vercel, ngrok)
- Direct database access from your machine
- pgadmin for database management
- Kafka access from external tools

**Exposed Ports:**

- postgres: 5432
- redis: 6379
- kafka: 9092
- zookeeper: 2181
- pgadmin: 5050

_The system will automatically handle health checks, ensuring the DB and Kafka are ready before starting the APIs._

---

## 🩺 Monitoring & Access

- **Finance Service**: [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- **Portal Service**: [http://localhost:3000/](http://localhost:3000/)
- **Notification Worker**: [http://localhost:3001/](http://localhost:3001/)
- **Admin Web**: [http://localhost:3002/](http://localhost:3002/)

---

## 🔒 Security Best Practices

- **Internal Network**: All services communicate via the `jledger-network`.
- **Secret Management**: Never commit your `.env` file. Change all default passwords before deploying to AWS.
- **Port Exposure**: In production, only the `nginx` (80/443) should be exposed. Use `docker-compose.dev.yml` only for local debugging.
- **Finance Service Isolation**: Only finance-service can mutate money state. Portal-service calls finance-service via HTTP REST API for all financial operations.
