# การตั้งค่าเครือข่าย J-Ledger 🌐

เอกสารนี้แสดงภาพการเชื่อมต่อ (Network Communication) ระหว่างส่วนประกอบต่างๆ ในแต่ละสภาพแวดล้อม

## 📝 Nginx Configuration

- `docker/nginx/default.conf` - Production (HTTPS with SSL, potayyr.site) - Public NGINX
- `docker/nginx/default.conf.example` - Local development (HTTP only, localhost) - สำหรับ Local Test
- `docker/nginx/default.conf.prod` - Template/example file (deprecated)
- `docker/nginx/internal.conf` - Production (HTTP/HTTPS with VPN access) - Internal NGINX for Admin

**Usage:**

- **Mode 1 (Dev/Hybrid)**: ไม่ใช้ nginx - เข้า services โดยตรงผ่าน localhost:port
- **Mode 2 (Local Test)**: `docker compose -f docker-compose.yml -f docker-compose.test.yml up -d` (uses default.conf.example for HTTP only)
- **Mode 3 (Production)**: `docker compose up -d` (uses default.conf with SSL for public traffic, internal.conf for admin access)

## 1. 🛠️ โหมด Hybrid Development (แนะนำสำหรับการพัฒนา)

**รูปแบบ**: โครงสร้างพื้นฐาน (Infra) รันใน **Docker**, ส่วนบริการแอปพลิเคชัน (Services) รันใน **เครื่อง Local** (macOS)

> [!NOTE]
> **ทำไม Dev Mode ไม่ใช้ Nginx?**
>
> - Dev mode เข้าถึง Services โดยตรงผ่าน `localhost:port` เพื่อความสะดวกในการ Debug
> - ไม่ต้องการ SSL termination (HTTPS) ในการพัฒนา
> - ไม่ต้องการ Reverse proxy routing
> - Nginx ใช้ใน Production เพื่อ:
>   - SSL/TLS termination
>   - Load balancing
>   - Security (ซ่อน internal ports)
>   - Centralized routing

> [!IMPORTANT]
> **แผนภาพนี้แสดงสถานะที่ควรจะเป็นหลังจาก implement** การแก้ไข docker-compose.dev.yml

**คำสั่งเริ่มใช้งาน:**

```bash
# 1. เริ่ม Infrastructure ใน Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway pgadmin

# 2. รัน Services บนเครื่อง Local
cd j-ledger-portal/apps/wallet-api && npm run dev
cd j-ledger-portal/apps/admin-api && npm run dev
cd j-ledger-portal/apps/auth-service && npm run dev
cd j-ledger-portal/apps/admin-auth-service && npm run dev
cd j-ledger-portal/apps/user-kyc-service && npm run dev
cd j-ledger-core/core-service && ./mvnw spring-boot:run
cd j-ledger-core/wallet-service && ./mvnw spring-boot:run

# 3. รัน Mobile App (Expo)
cd j-ledger-portal/apps/wallet-app && npx expo start
```

```mermaid
graph TD
    subgraph "Local Machine (Host)"
        direction TB
        WEB["[admin-web]<br/>:3000"]
        WAPI["[wallet-api]<br/>:3002"]
        AAPI["[admin-api]<br/>:3001"]
        AUTH["[auth-service]<br/>:3003"]
        A_AUTH["[admin-auth-service]<br/>:3005"]
        KYC["[user-kyc-service]<br/>:3004"]
        CORE["[core-service]<br/>:8081"]
        WALL["[wallet-service]<br/>:8082"]
    end

    subgraph "Docker (Infrastructure)"
        direction TB
        PG["[postgres]<br/>:5432<br/>jledger_db"]
        REDIS["[redis]<br/>:6379"]
        KAFKA["[kafka]<br/>:9092"]
        EURE["[eureka-server]<br/>:8761"]
        GATE["[api-gateway]<br/>:8080"]
        PGADMIN["[pgadmin]<br/>:5050<br/>DB UI"]
    end

    %% Service Connections
    WEB --> AAPI
    WAPI --> GATE
    WAPI --> AUTH
    WAPI --> KYC
    WAPI --> WALL
    AAPI --> CORE
    AAPI --> A_AUTH
    AAPI --> KYC
    AAPI --> WALL
    AAPI --> AUTH
    GATE --> CORE
    PGADMIN --> PG

    %% Service Discovery
    CORE --> EURE
    WALL --> EURE
    GATE --> EURE

    %% Database Connections
    AUTH -->|auth_schema| PG
    A_AUTH -->|admin_auth_schema| PG
    KYC -->|user_kyc_schema| PG
    CORE -->|core_schema| PG
    WALL -->|core_schema| PG

    %% Cache Connections
    AUTH --> REDIS
    A_AUTH --> REDIS
    CORE --> REDIS
    WALL --> REDIS

    %% Kafka Connections
    CORE --> KAFKA
    WALL --> KAFKA

    style WEB fill:#fff4e1,stroke:#f57c00
    style WAPI fill:#e1f5ff,stroke:#0288d1
    style AAPI fill:#e1f5ff,stroke:#0288d1
    style AUTH fill:#e8f5e9,stroke:#388e3c
    style A_AUTH fill:#e8f5e9,stroke:#388e3c
    style KYC fill:#e8f5e9,stroke:#388e3c
    style CORE fill:#e8f5e9,stroke:#388e3c
    style WALL fill:#e8f5e9,stroke:#388e3c
    style PG fill:#f3e5f5,stroke:#7b1fa2
    style REDIS fill:#f3e5f5,stroke:#7b1fa2
    style KAFKA fill:#f3e5f5,stroke:#7b1fa2
    style EURE fill:#e8f5e9,stroke:#388e3c
    style GATE fill:#e8f5e9,stroke:#388e3c
    style PGADMIN fill:#fff3e0,stroke:#f57c00
```

> [!NOTE]
> **โหมด Hybrid รองรับ Service Discovery:**
>
> - Eureka Server และ API Gateway รวมอยู่ใน docker-compose.dev.yml
> - BFF services (wallet-api, admin-api) สามารถใช้ Service Discovery ผ่าน API Gateway
> - Core service ลงทะเบียนกับ Eureka Server และสามารถถูกเรียกผ่าน Gateway
>
> **pgadmin (Database Management UI):**
>
> - Access: http://localhost:5050
> - Email: admin@jledger.com
> - Password: admin_password
> - Purpose: PostgreSQL database management through web interface

---

## 2. 🧪 โหมด Local Test (Full Docker)

**รูปแบบ**: **ทุกอย่าง** รันอยู่ภายใน Docker บนเครือข่ายเดียวกัน (`jledger-network`)

**คำสั่งเริ่มใช้งาน:**

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
```

```mermaid
graph TD
    subgraph "Docker Network (jledger-network)"
        direction TB
        subgraph "Application Services"
            WEB["[admin-web]<br/>:3000"]
            WAPI["[wallet-api]<br/>:3002"]
            AAPI["[admin-api]<br/>:3001"]
            AUTH["[auth-service]<br/>:3003"]
            A_AUTH["[admin-auth-service]<br/>:3005"]
            KYC["[user-kyc-service]<br/>:3004"]
            CORE["[core-service]<br/>:8081"]
            WALL["[wallet-service]<br/>:8082"]
        end

        subgraph "Infrastructure"
            PG["[postgres]<br/>:5432<br/>jledger_db"]
            REDIS["[redis]<br/>:6379"]
            KAFKA["[kafka]<br/>:29092"]
            EURE["[eureka-server]<br/>:8761"]
            GATE["[api-gateway]<br/>:8080"]
            NGINX["[nginx]<br/>:80<br/>HTTP only"]
        end
    end

    %% Service Connections
    WEB --> AAPI
    WAPI --> GATE
    WAPI --> AUTH
    WAPI --> KYC
    WAPI --> WALL
    AAPI --> CORE
    AAPI --> AUTH
    AAPI --> A_AUTH
    AAPI --> KYC
    AAPI --> WALL
    GATE --> CORE

    %% Service Discovery
    CORE --> EURE
    WALL --> EURE
    GATE --> EURE

    %% Database Connections
    AUTH -->|auth_schema| PG
    A_AUTH -->|admin_auth_schema| PG
    KYC -->|user_kyc_schema| PG
    CORE -->|core_schema| PG
    WALL --> PG

    %% Cache Connections
    AUTH --> REDIS
    A_AUTH --> REDIS
    CORE --> REDIS
    WALL --> REDIS

    %% Kafka Connections
    CORE --> KAFKA
    WALL --> KAFKA

    %% Nginx Gateway
    NGINX --> WAPI
    NGINX --> AAPI
    NGINX --> WEB

    style WEB fill:#fff4e1,stroke:#f57c00
    style WAPI fill:#e1f5ff,stroke:#0288d1
    style AAPI fill:#e1f5ff,stroke:#0288d1
    style AUTH fill:#e8f5e9,stroke:#388e3c
    style A_AUTH fill:#e8f5e9,stroke:#388e3c
    style KYC fill:#e8f5e9,stroke:#388e3c
    style CORE fill:#e8f5e9,stroke:#388e3c
    style WALL fill:#e8f5e9,stroke:#388e3c
    style PG fill:#f3e5f5,stroke:#7b1fa2
    style REDIS fill:#f3e5f5,stroke:#7b1fa2
    style KAFKA fill:#f3e5f5,stroke:#7b1fa2
    style EURE fill:#e8f5e9,stroke:#388e3c
    style GATE fill:#e8f5e9,stroke:#388e3c
    style NGINX fill:#ffebee,stroke:#c62828
```

---

## 3. 🚀 โหมด Production (Full Docker)

**รูปแบบ**: **ทุกอย่าง** รันอยู่ภายใน Docker บนเครือข่ายเดียวกัน (`jledger-network`)

**คำสั่งเริ่มใช้งาน:**

```bash
docker compose up -d --build
```

```mermaid
graph TD
    subgraph "Docker Network (jledger-network)"
        direction TB
        subgraph "Application Services"
            WEB["[admin-web]<br/>:3000"]
            WAPI["[wallet-api]<br/>:3002"]
            AAPI["[admin-api]<br/>:3001"]
            AUTH["[auth-service]<br/>:3003"]
            A_AUTH["[admin-auth-service]<br/>:3005"]
            KYC["[user-kyc-service]<br/>:3004"]
            CORE["[core-service]<br/>:8081"]
            WALL["[wallet-service]<br/>:8082"]
        end

        subgraph "Infrastructure"
            PG["[postgres]<br/>:5432<br/>jledger_db"]
            REDIS["[redis]<br/>:6379"]
            KAFKA["[kafka]<br/>:29092"]
            EURE["[eureka-server]<br/>:8761"]
            GATE["[api-gateway]<br/>:8080"]
            NGINX["[nginx]<br/>:80/443<br/>HTTPS with SSL"]
            INT_NGINX["[internal-nginx]<br/>:8081/8443<br/>VPN access"]
        end
    end

    %% Service Connections
    WEB --> AAPI
    WAPI --> GATE
    WAPI --> AUTH
    WAPI --> KYC
    WAPI --> WALL
    AAPI --> CORE
    AAPI --> AUTH
    AAPI --> A_AUTH
    AAPI --> KYC
    AAPI --> WALL
    GATE --> CORE

    %% Service Discovery
    CORE --> EURE
    WALL --> EURE
    GATE --> EURE

    %% Database Connections
    AUTH -->|auth_schema| PG
    A_AUTH -->|admin_auth_schema| PG
    KYC -->|user_kyc_schema| PG
    CORE -->|core_schema| PG
    WALL --> PG

    %% Cache Connections
    AUTH --> REDIS
    A_AUTH --> REDIS
    CORE --> REDIS
    WALL --> REDIS

    %% Kafka Connections
    CORE --> KAFKA
    WALL --> KAFKA

    %% Nginx Gateways
    NGINX --> WAPI
    NGINX --> AAPI
    INT_NGINX --> WEB
    INT_NGINX --> AAPI

    style WEB fill:#fff4e1,stroke:#f57c00
    style WAPI fill:#e1f5ff,stroke:#0288d1
    style AAPI fill:#e1f5ff,stroke:#0288d1
    style AUTH fill:#e8f5e9,stroke:#388e3c
    style A_AUTH fill:#e8f5e9,stroke:#388e3c
    style KYC fill:#e8f5e9,stroke:#388e3c
    style CORE fill:#e8f5e9,stroke:#388e3c
    style WALL fill:#e8f5e9,stroke:#388e3c
    style PG fill:#f3e5f5,stroke:#7b1fa2
    style REDIS fill:#f3e5f5,stroke:#7b1fa2
    style KAFKA fill:#f3e5f5,stroke:#7b1fa2
    style EURE fill:#e8f5e9,stroke:#388e3c
    style GATE fill:#e8f5e9,stroke:#388e3c
    style NGINX fill:#ffebee,stroke:#c62828
    style INT_NGINX fill:#e8f5e9,stroke:#1565c0
```

> [!NOTE]
> ใน **Production**: เราจะใช้พอร์ต `29092` สำหรับ Kafka เพื่อคุยกันภายใน Docker
> ใน **Development**: เราจะใช้พอร์ต `9092` เพื่อให้เครื่องเรา (Host) คุยกับ Kafka ใน Docker ได้

---
