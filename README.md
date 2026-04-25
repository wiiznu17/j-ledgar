# J-Ledger Ecosystem 🏦

J-Ledger is a high-performance, production-ready financial ledger system designed for consistency and scalability. The ecosystem is divided into two primary domains: **Core Ledger** (Java/Spring Boot) and **Portal Backend** (Node.js/NestJS).

---

## 🏗️ System Architecture

```text
.
├── j-ledger-core/                # 🛡️ Financial Core (Java 21)
│   ├── core-service/             # Ledger Engine & Double-Entry Logic
│   ├── wallet-service/           # Business Rules & Wallet Management
│   ├── api-gateway/              # Spring Cloud Gateway
│   ├── eureka-server/            # Service Discovery Registry
│   └── notification-service/     # Kafka Consumer for Alerts
├── j-ledger-portal/              # 🌐 Portal & Public APIs (NestJS)
│   ├── apps/
│   │   ├── wallet-api/           # Customer Wallet API (Id: 3002)
│   │   ├── admin-api/            # Back-office API (Id: 3001)
│   │   ├── auth-service/         # Customer IAM (Id: 3003)
│   │   ├── admin-auth-service/   # Staff IAM & RBAC (Id: 3005)
│   │   ├── user-kyc-service/     # PII/KYC Verification (Id: 3004)
│   │   └── admin-web/            # Admin Management Dashboard
├── docker/
│   └── nginx/
│       ├── default.conf          # Production (HTTPS with SSL, potayyr.site) - Public NGINX
│       ├── default.conf.example  # Local development (HTTP only, localhost) - สำหรับ Local Test
│       ├── default.conf.prod     # Template/example file (deprecated)
│       └── internal.conf         # Production (HTTP/HTTPS with VPN access) - Internal NGINX for Admin
├── docker-compose.yml            # 🚀 Production Orchestration
├── docker-compose.dev.yml        # 🛠️ Development Infrastructure (Dev Mode)
└── docker-compose.test.yml       # 🧪 Local Test Infrastructure (Local Test Mode)
```

---

## 🚀 Deployment Modes

J-Ledger supports 3 deployment modes:

### Mode 1: Local Development (Hybrid)

- **Infrastructure**: Docker (postgres, redis, kafka, zookeeper, eureka-server, api-gateway, pgadmin)
- **Services**: Run locally on your machine
- **Nginx**: Not used (access services directly via localhost:port)
- **Database**: Single database (jledger_db) with schemas for each service
- **Command**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway pgadmin`

### Mode 2: Local Test (Full Docker)

- **Infrastructure**: Full Docker stack
- **Services**: All services in Docker
- **Nginx**: HTTP only (default.conf.example) for testing
- **Database**: Single database (jledger_db) with schemas
- **Command**: `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build`

### Mode 3: Production (AWS EC2)

- **Infrastructure**: Full Docker stack on AWS EC2
- **Services**: All services in Docker
- **Nginx**: HTTPS with SSL (default.conf) for public, internal.conf for admin (VPN access)
- **Database**: Single database (jledger_db) with schemas
- **Command**: `docker compose up -d --build`

See [network.md](./network.md) for detailed network architecture and configuration.

---

## �️ Database Management

### Reset Database (Start Fresh)

To completely reset the database and start from scratch:

```bash
# Stop all containers and remove volumes
docker compose down -v

# For Mode 1 (Dev Mode)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# For Mode 2 (Local Test)
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

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
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway pgadmin
```

### 2. Initialize Databases (First Time Only)

**Note:** Only services with direct database access and migration files need to be initialized. BFFs (wallet-api, admin-api) do not have their own schemas.

```bash
# Core Service (Flyway - Java)
cd j-ledger-core/core-service
# Flyway migrations run automatically via Spring Boot on startup
# Or manually: ./mvnw flyway:migrate

# Wallet Service (Flyway - Java)
cd j-ledger-core/wallet-service
# Flyway migrations run automatically via Spring Boot on startup
# Or manually: ./mvnw flyway:migrate

# Auth Service (Prisma - NestJS)
cd j-ledger-portal/apps/auth-service
npx prisma migrate dev --name init_auth_schema

# Admin Auth Service (Prisma - NestJS)
cd ../admin-auth-service
npx prisma migrate dev --name init_admin_auth_schema

# User KYC Service (Prisma - NestJS)
cd ../user-kyc-service
npx prisma migrate dev --name init_user_kyc_schema
```

### 2.5 Database Migration (เมื่อมีการแก้ Database)

เมื่อต้องการแก้ database schema ในโหมด Hybrid Development:

**Core Service (Flyway - Java):**

```bash
# สร้าง SQL migration file ใหม่
# ไฟล์: j-ledger-core/core-service/src/main/resources/db/migration/V2__your_change.sql
# ระบุ schema ใน SQL: SET search_path TO core_schema, public;
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm core-migration
```

**Wallet Service (Flyway - Java):**

```bash
# สร้าง SQL migration file ใหม่
# ไฟล์: j-ledger-core/wallet-service/src/main/resources/db/migration/V2__your_change.sql
# ใช้ jledger_db โดยตรง (ไม่มี schema แยก)
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm wallet-service-migration
```

**Prisma Services (Auth, Admin Auth, User KYC):**

```bash
# แก้ prisma/schema.prisma
cd j-ledger-portal/apps/auth-service  # หรือ admin-auth-service, user-kyc-service

# สร้างและ apply migration
npx prisma migrate dev --name your_change
```

> **หมายเหตุสำหรับ Mode 2 (Local Test) และ Mode 3 (Production)**:
>
> - Migrations รันอัตโนมัติผ่าน Docker Compose containers
> - ไม่ต้องรัน migration แยก
> - Migration containers: core-migration, wallet-service-migration, admin-auth-migration, user-kyc-migration
> - Dependency chain: wallet-service-migration → core-migration (เพราะมี foreign keys)

> **หมายเหตุ**: BFFs (wallet-api, admin-api) ไม่มี database schema ของตัวเอง ไม่ต้องทำ migration

> **หมายเหตุ**: Step 2 (Initialize Databases) เป็นการทำครั้งแรกเท่านั้น หลังจากนั้นเมื่อแก้ database ให้ใช้ขั้นตอนใน step 2.5

---

### 3. Run Services Locally

Run each service in its own terminal:

**Portal APIs (NestJS):**

```bash
cd j-ledger-portal/apps/wallet-api && npm run dev
cd j-ledger-portal/apps/admin-api && npm run dev
cd j-ledger-portal/apps/auth-service && npm run dev
cd j-ledger-portal/apps/admin-auth-service && npm run dev
cd j-ledger-portal/apps/user-kyc-service && npm run dev
cd j-ledger-portal/apps/admin-web && npm run dev
```

**Core Services (Java):**

```bash
cd j-ledger-core/core-service && ./mvnw spring-boot:run
cd j-ledger-core/wallet-service && ./mvnw spring-boot:run
```

### Cleanup (When Needed)

To reset infrastructure and start fresh:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway pgadmin
```

---

## 🧪 Mode 2: Local Test (Full Docker)

To run the entire system in Docker locally for testing before production deployment:

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the secrets.

### 2. First Time Setup (Database Initialization)

Migrations run automatically on first startup. No manual steps required.

Migration containers will run in this order:

1. core-migration (creates core_schema)
2. wallet-service-migration (creates wallet tables, depends on core)
3. admin-auth-migration (creates admin_auth_schema)
4. user-kyc-migration (creates user_kyc_schema)
5. wallet-api-migration (seeds wallet-api data)

### 3. Database Migration (When Changing Schema)

When you need to modify database schema:

**Step 1: Create Migration File Locally**

```bash
# For Core Service (Flyway)
# Create: j-ledger-core/core-service/src/main/resources/db/migration/V2__your_change.sql
# Remember to include: SET search_path TO core_schema, public;

# For Wallet Service (Flyway)
# Create: j-ledger-core/wallet-service/src/main/resources/db/migration/V2__your_change.sql
# Uses jledger_db directly (no schema)

# For Prisma Services (Auth, Admin Auth, User KYC)
cd j-ledger-portal/apps/auth-service  # or admin-auth-service, user-kyc-service
npx prisma migrate dev --name your_change
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

1. core-migration (creates core_schema)
2. wallet-service-migration (creates wallet tables, depends on core)
3. admin-auth-migration (creates admin_auth_schema)
4. user-kyc-migration (creates user_kyc_schema)
5. wallet-api-migration (seeds wallet-api data)

### 3. Database Migration (When Changing Schema)

When you need to modify database schema in production:

**Step 1: Create Migration File Locally**

```bash
# For Core Service (Flyway)
# Create: j-ledger-core/core-service/src/main/resources/db/migration/V2__your_change.sql
# Remember to include: SET search_path TO core_schema, public;

# For Wallet Service (Flyway)
# Create: j-ledger-core/wallet-service/src/main/resources/db/migration/V2__your_change.sql
# Uses jledger_db directly (no schema)

# For Prisma Services (Auth, Admin Auth, User KYC)
cd j-ledger-portal/apps/auth-service  # or admin-auth-service, user-kyc-service
npx prisma migrate dev --name your_change
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

**Admin Access:** For admin-web access, use internal-nginx (port 8081/8443) which requires VPN connection. See [Admin Access](#-admin-access) section below.

_The system will automatically handle health checks, ensuring the DB and Kafka are ready before starting the APIs._

---

## 🩺 Monitoring & Access

- **Service Registry**: [http://localhost:8761](http://localhost:8761) (Eureka)
- **Object Storage**: [http://localhost:9001](http://localhost:9001) (MinIO Console)
- **Auth Service**: [http://localhost:3003/health](http://localhost:3003/health)
- **Admin Auth Service**: [http://localhost:3005/health](http://localhost:3005/health)
- **User KYC Service**: [http://localhost:3004/health](http://localhost:3004/health)
- **Wallet Service**: [http://localhost:8082/health](http://localhost:8082/health)
- **Wallet API**: [http://localhost:3002/health](http://localhost:3002/health)
- **Admin API**: [http://localhost:3001/api/admin/health](http://localhost:3001/api/admin/health)
- **Admin Web**: [http://localhost:3000](http://localhost:3000) (Local only)
- **Internal NGINX**: [http://localhost:8081/health](http://localhost:8081/health) (Production admin access)

---

## 🔒 Security Best Practices

- **Internal Network**: All services communicate via the `jledger-network`.
- **Secret Management**: Never commit your `.env` file. Change all default passwords before deploying to AWS.
- **Port Exposure**: In production, only the `nginx` (80/443), `internal-nginx` (8081/8443), and `api-gateway` (8080) should be exposed. Use `docker-compose.dev.yml` only for local debugging.
- **Admin Access**: Admin-web must be accessed through internal-nginx with VPN connection and IP allow-list (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
- **PII Encryption**: User KYC Service uses AES-256-GCM encryption for PII data. Never log or expose PII in plain text.
- **RBAC**: Admin Auth Service implements Role-Based Access Control. Staff accounts have specific roles and permissions.
- **JWT Secrets**: Use strong, unique secrets for JWT tokens in production. Rotate regularly.

---

## 🔐 Admin Access

Admin-web provides the management dashboard for staff operations. Access methods vary by deployment mode.

### Local Development

```bash
# Run admin-web locally
cd j-ledger-portal/apps/admin-web && npm run dev

# Access via browser
# URL: http://localhost:3000
```

### Production (VPN Required)

Admin-web in production must be accessed through internal-nginx with VPN connection for security.

```bash
# Step 1: Connect to VPN (WireGuard/OpenVPN)
# Example: wg-quick up jledger-vpn
# You should get an IP in the allowed ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16

# Step 2: Access admin-web
# HTTP:
http://<server-ip>:8081

# HTTPS (if SSL configured):
https://<server-ip>:8443

# Step 3: Authenticate
# - VPN IP allow-list (automatic if connected)
# - Basic Auth fallback (if VPN fails)
#   Username: admin
#   Password: (from /etc/nginx/.htpasswd)
```

### Testing Admin Endpoints

```bash
# Test health endpoint (no auth required)
curl http://<server-ip>:8081/health

# Test admin-web (VPN + Basic Auth)
curl -u admin:password http://<server-ip>:8081/

# Test admin-api
curl -u admin:password http://<server-ip>:8081/api/admin/health
```

### Security Layers

1. **VPN IP Allow-list**: Only allows connections from private IP ranges
2. **Basic Auth**: Fallback authentication if VPN fails
3. **SSL/TLS**: Optional HTTPS on port 8443 for encrypted traffic
4. **RBAC**: Admin Auth Service enforces role-based permissions

> **⚠️ Important**: Never expose admin-web through public nginx (port 80/443) in production. Always use internal-nginx with VPN.
