# การตั้งค่าเครือข่าย J-Ledger 🌐

เอกสารนี้แสดงภาพการเชื่อมต่อ (Network Communication) ระหว่างส่วนประกอบต่างๆ ในแต่ละสภาพแวดล้อม

## 📝 Nginx Configuration

- `docker/nginx/default.conf` - Local development (HTTP only, localhost)
- `docker/nginx/default.conf.example` - Template/example file
- `docker/nginx/default.conf.prod` - Production (HTTPS with SSL, potayyr.site)

**Usage:**

- Local/Hybrid: `docker compose -f docker-compose.yml -f docker-compose.dev.yml` (uses default.conf)
- Production: `docker compose up -d` (uses default.conf.prod with SSL)

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
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper eureka-server api-gateway

# 2. รัน Services บนเครื่อง Local
cd j-ledger-portal/apps/wallet-api && npm run dev
cd j-ledger-portal/apps/admin-api && npm run dev
cd j-ledger-core/core-service && ./mvnw spring-boot:run

# 3. รัน Mobile App (Expo)
cd j-ledger-portal/apps/wallet-app && npx expo start
```

```mermaid
graph TD
    subgraph "Local Machine (เครื่อง Host macOS)"
        direction TB
        subgraph "Frontend Layer"
            WEB["[admin-web]<br/>พอร์ต 3000<br/>Next.js"]
            MOB["[wallet-app]<br/>Expo React Native<br/>Mobile App"]
        end

        subgraph "BFF Layer (Backend for Frontend)"
            WAPI["[wallet-api]<br/>พอร์ต 3002<br/>NestJS<br/>BFF"]
            AAPI["[admin-api]<br/>พอร์ต 3001<br/>NestJS<br/>BFF"]
        end

        subgraph "Core Layer"
            CORE["[core-service]<br/>พอร์ต 8081<br/>Spring Boot"]
        end
    end

    subgraph "Docker Network (jledger-network)<br/>Infrastructure Only"
        direction TB
        PG["[postgres]<br/>พอร์ต 5432:5432<br/>Database"]
        REDIS["[redis]<br/>พอร์ต 6379:6379<br/>Cache"]
        ZK["[zookeeper]<br/>พอร์ต 2181:2181<br/>Kafka Coord"]
        KAFKA["[kafka]<br/>พอร์ต 9092:9092<br/>Message Broker"]
        EURE["[eureka-server]<br/>พอร์ต 8761:8761<br/>Service Registry"]
        GATE["[api-gateway]<br/>พอร์ต 8080:8080<br/>Spring Gateway"]
        PGA["[pgadmin]<br/>พอร์ต 5050:80<br/>DB Management"]
    end

    %% ทราฟฟิกจากผู้ใช้
    User((👤 User Browser)) -->|http://localhost:3000| WEB

    %% Frontend เชื่อมต่อกับ BFF
    WEB -->|http://localhost:3001| AAPI
    MOB -.->|http://localhost:3002| WAPI

    %% BFF เชื่อมต่อกับ API Gateway
    WAPI -->|http://localhost:8080| GATE
    AAPI -->|http://localhost:8080| GATE

    %% API Gateway เชื่อมต่อกับ Core Service
    GATE -.->|http://localhost:8081| CORE

    %% Service Discovery
    GATE -.->|http://localhost:8761| EURE
    CORE -.->|http://localhost:8761| EURE

    %% BFF เชื่อมต่อกับ Docker Infra
    WAPI -.->|localhost:5432| PG
    WAPI -.->|localhost:6379| REDIS
    WAPI -.->|localhost:9092| KAFKA

    AAPI -.->|localhost:5432| PG

    %% Core Service เชื่อมต่อกับ Docker Infra
    CORE -.->|localhost:5432| PG
    CORE -.->|localhost:6379| REDIS
    CORE -.->|localhost:9092| KAFKA

    %% Kafka ติดต่อกับ Zookeeper
    KAFKA -->|zookeeper:2181| ZK

    %% PGAdmin เชื่อมต่อกับ Postgres
    PGA -.->|postgres:5432| PG

    style WEB fill:#fff4e1,stroke:#f57c00
    style MOB fill:#fce4ec,stroke:#c2185b
    style WAPI fill:#e1f5ff,stroke:#0288d1
    style AAPI fill:#e1f5ff,stroke:#0288d1
    style CORE fill:#e8f5e9,stroke:#388e3c
    style PG fill:#f3e5f5,stroke:#7b1fa2
    style REDIS fill:#f3e5f5,stroke:#7b1fa2
    style KAFKA fill:#f3e5f5,stroke:#7b1fa2
    style ZK fill:#f3e5f5,stroke:#7b1fa2
    style EURE fill:#e8f5e9,stroke:#388e3c
    style GATE fill:#e8f5e9,stroke:#388e3c
    style PGA fill:#f3e5f5,stroke:#7b1fa2
```

**คำอธิบายเส้น:**

- `───▶` (เส้นทึง): การเชื่อมต่อ HTTP/REST API ระหว่าง Services (รวมถึง BFF → Gateway)
- `- - -▶` (เส้นประ): การเชื่อมต่อกับ Infrastructure (Database, Cache, Message Broker) หรือ Service Discovery ใน Docker

| ต้นทาง               | ปลายทาง (โหมด Hybrid)  | ที่อยู่ (Address)       | หมายเหตุ                      |
| :------------------- | :--------------------- | :---------------------- | :---------------------------- |
| เบราว์เซอร์          | admin-web (Local)      | `http://localhost:3000` | Development mode              |
| admin-web (Local)    | admin-api (BFF)        | `http://localhost:3001` | Frontend → BFF                |
| wallet-app (Mobile)  | wallet-api (BFF)       | `http://<host-ip>:3002` | Mobile → BFF                  |
| wallet-api (BFF)     | api-gateway (Docker)   | `http://localhost:8080` | BFF → API Gateway             |
| admin-api (BFF)      | api-gateway (Docker)   | `http://localhost:8080` | BFF → API Gateway             |
| api-gateway (Docker) | core-service (Local)   | `http://localhost:8081` | Gateway → Core Service        |
| api-gateway (Docker) | eureka-server (Docker) | `http://localhost:8761` | Service Discovery             |
| core-service (Local) | eureka-server (Docker) | `http://localhost:8761` | Service Discovery             |
| wallet-api (BFF)     | postgres (Docker)      | `localhost:5432`        | BFF เชื่อมต่อ Database        |
| wallet-api (BFF)     | redis (Docker)         | `localhost:6379`        | BFF เชื่อมต่อ Cache           |
| wallet-api (BFF)     | kafka (Docker)         | `localhost:9092`        | BFF เชื่อมต่อ Message Broker  |
| admin-api (BFF)      | postgres (Docker)      | `localhost:5432`        | BFF เชื่อมต่อ Database        |
| core-service (Local) | postgres (Docker)      | `localhost:5432`        | Core เชื่อมต่อ Database       |
| core-service (Local) | redis (Docker)         | `localhost:6379`        | Core เชื่อมต่อ Cache          |
| core-service (Local) | kafka (Docker)         | `localhost:9092`        | Core เชื่อมต่อ Message Broker |
| pgadmin (Browser)    | postgres (Docker)      | `http://localhost:5050` | เข้าจัดการ Database           |

> [!NOTE]
> **โหมด Hybrid รองรับ Service Discovery:**
>
> - Eureka Server และ API Gateway รวมอยู่ใน docker-compose.dev.yml
> - BFF services (wallet-api, admin-api) สามารถใช้ Service Discovery ผ่าน API Gateway
> - Core service ลงทะเบียนกับ Eureka Server และสามารถถูกเรียกผ่าน Gateway

---

## 2. 🚀 โหมด Production (Full Docker)

**รูปแบบ**: **ทุกอย่าง** รันอยู่ภายใน Docker บนเครือข่ายเดียวกัน (`jledger-network`)

**คำสั่งเริ่มใช้งาน:**

```bash
docker compose up -d --build
```

```mermaid
graph TD
    subgraph "Docker Network (jledger-network)"
        direction TB

        subgraph "Entry Point"
            NGINX["[nginx]<br/>พอร์ต 80:80<br/>443:443<br/>Reverse Proxy<br/>Domain: potayyr.site"]
        end

        subgraph "Frontend Layer"
            WEB["[admin-web]<br/>พอร์ต 3000<br/>Dashboard"]
        end

        subgraph "BFF Layer (Backend for Frontend)"
            WAPI["[wallet-api]<br/>พอร์ต 3002<br/>NestJS<br/>BFF"]
            AAPI["[admin-api]<br/>พอร์ต 3001<br/>NestJS<br/>BFF"]
        end

        subgraph "Core Layer (Java)"
            CORE["[core-service]<br/>Ledger Engine"]
            GATE["[api-gateway]<br/>พอร์ต 8080<br/>Spring Gateway"]
            EURE["[eureka-server]<br/>พอร์ต 8761<br/>Service Registry"]
            NOTIF["[notification-service]<br/>Kafka Consumer"]
        end

        subgraph "Infrastructure"
            PG["[postgres]<br/>พอร์ต 5432<br/>Database"]
            REDIS["[redis]<br/>พอร์ต 6379<br/>Cache"]
            ZK["[zookeeper]<br/>พอร์ต 2181<br/>Kafka Coord"]
            KAFKA["[kafka]<br/>พอร์ต 29092<br/>Message Broker"]
        end
    end

    subgraph "External"
        MOB["[wallet-app]<br/>Mobile App<br/>React Native"]
    end

    %% ทราฟฟิกจากภายนอก
    Internet((🌐 Internet)) -->|https://potayyr.site| NGINX

    %% Mobile App เชื่อมต่อผ่าน Internet
    MOB -->|https://potayyr.site/api/*| NGINX

    %% Nginx ส่งต่อให้ Frontend และ BFF
    NGINX -->|/api/wallet/*| WAPI
    NGINX -->|/api/admin/*| AAPI
    NGINX -->|/*| WEB

    %% Frontend เชื่อมต่อกับ BFF
    WEB -->|http://admin-api:3001| AAPI

    %% BFF เชื่อมต่อกับ API Gateway
    WAPI -->|http://api-gateway:8080| GATE
    AAPI -->|http://api-gateway:8080| GATE

    %% API Gateway เชื่อมต่อกับ Core Service
    GATE -->|http://core-service:8081| CORE

    %% BFF เชื่อมต่อกับ Infrastructure
    WAPI -->|postgres:5432| PG
    WAPI -->|redis:6379| REDIS
    WAPI -->|kafka:29092| KAFKA
    AAPI -->|postgres:5432| PG

    %% Core Layer เชื่อมต่อกับ Infrastructure
    CORE -->|postgres:5432| PG
    CORE -->|redis:6379| REDIS
    CORE -->|kafka:29092| KAFKA
    NOTIF -->|kafka:29092| KAFKA

    %% Service Discovery
    GATE -->|http://eureka-server:8761| EURE
    CORE -->|http://eureka-server:8761| EURE
    NOTIF -->|http://eureka-server:8761| EURE

    %% Kafka ติดต่อกับ Zookeeper
    KAFKA -->|zookeeper:2181| ZK

    style NGINX fill:#ffebee,stroke:#c62828
    style WEB fill:#fff4e1,stroke:#f57c00
    style WAPI fill:#e1f5ff,stroke:#0288d1
    style AAPI fill:#e1f5ff,stroke:#0288d1
    style CORE fill:#e8f5e9,stroke:#388e3c
    style GATE fill:#e8f5e9,stroke:#388e3c
    style EURE fill:#e8f5e9,stroke:#388e3c
    style NOTIF fill:#e8f5e9,stroke:#388e3c
    style PG fill:#f3e5f5,stroke:#7b1fa2
    style REDIS fill:#f3e5f5,stroke:#7b1fa2
    style KAFKA fill:#f3e5f5,stroke:#7b1fa2
    style ZK fill:#f3e5f5,stroke:#7b1fa2
    style MOB fill:#fce4ec,stroke:#c2185b
```

**คำอธิบายเส้น:**

- `───▶` (เส้นทึง): การเชื่อมต่อ HTTP/REST API ระหว่าง Services
- `- - -▶` (เส้นประ): การเชื่อมต่อกับ Infrastructure (Database, Cache, Message Broker) ใน Docker

| ต้นทาง              | ปลายทาง (โหมด Prod) | ที่อยู่ (Address)            | หมายเหตุ                      |
| :------------------ | :------------------ | :--------------------------- | :---------------------------- |
| Internet            | nginx               | `https://potayyr.site`       | เข้าผ่าน Domain จริง          |
| wallet-app (Mobile) | nginx               | `https://potayyr.site/api/*` | Mobile เข้าผ่าน Domain        |
| nginx               | wallet-api (BFF)    | `http://wallet-api:3002`     | ใช้ชื่อ Container (DNS)       |
| nginx               | admin-api (BFF)     | `http://admin-api:3001`      | ใช้ชื่อ Container (DNS)       |
| nginx               | admin-web           | `http://admin-web:3000`      | ใช้ชื่อ Container (DNS)       |
| admin-web           | admin-api (BFF)     | `http://admin-api:3001`      | Frontend → BFF                |
| wallet-api (BFF)    | api-gateway         | `http://api-gateway:8080`    | BFF → API Gateway             |
| admin-api (BFF)     | api-gateway         | `http://api-gateway:8080`    | BFF → API Gateway             |
| api-gateway         | core-service        | `http://core-service:8081`   | Gateway → Core Service        |
| api-gateway         | eureka-server       | `http://eureka-server:8761`  | Service Discovery             |
| core-service        | eureka-server       | `http://eureka-server:8761`  | Service Discovery             |
| wallet-api (BFF)    | postgres            | `postgres:5432`              | BFF เชื่อมต่อ Database        |
| wallet-api (BFF)    | redis               | `redis:6379`                 | BFF เชื่อมต่อ Cache           |
| wallet-api (BFF)    | kafka               | `kafka:29092`                | BFF เชื่อมต่อ Message Broker  |
| admin-api (BFF)     | postgres            | `postgres:5432`              | BFF เชื่อมต่อ Database        |
| core-service        | postgres            | `postgres:5432`              | Core เชื่อมต่อ Database       |
| core-service        | redis               | `redis:6379`                 | Core เชื่อมต่อ Cache          |
| core-service        | kafka               | `kafka:29092`                | Core เชื่อมต่อ Message Broker |
| kafka               | zookeeper           | `zookeeper:2181`             | Kafka Coordination            |

> [!NOTE]
> ใน **Production**: เราจะใช้พอร์ต `29092` สำหรับ Kafka เพื่อคุยกันภายใน Docker
> ใน **Development**: เราจะใช้พอร์ต `9092` เพื่อให้เครื่องเรา (Host) คุยกับ Kafka ใน Docker ได้

---

## 3. 📊 สรุปความแตกต่างระหว่างโหมด

### Port Mapping Comparison

| Service       | Dev Mode (Exposed) | Prod Mode (Internal) | หมายเหตุ                             |
| :------------ | :----------------- | :------------------- | :----------------------------------- |
| postgres      | `5432:5432` ✅     | `5432` (internal)    | Dev: เข้าถึงจาก Host ได้             |
| redis         | `6379:6379` ✅     | `6379` (internal)    | Dev: เข้าถึงจาก Host ได้             |
| kafka         | `9092:9092` ✅     | `29092` (internal)   | Dev: มี port mapping แล้ว            |
| zookeeper     | `2181:2181` ✅     | `2181` (internal)    | Dev: มี port mapping แล้ว            |
| eureka-server | `8761:8761` ✅     | `8761` (internal)    | Dev: มี port mapping แล้ว            |
| api-gateway   | `8080:8080` ✅     | `8080` (internal)    | Dev: มี port mapping แล้ว            |
| nginx         | `80:80` ❌         | `80:80` ✅           | Dev: ไม่จำเป็น (เข้า Service โดยตรง) |
| pgadmin       | `5050:80` ✅       | -                    | Dev: เฉพาะสำหรับจัดการ DB            |

### Environment Variable Differences

| Variable                          | Dev Mode (Host)                 | Prod Mode (Docker)                  | ตัวอย่าง             |
| :-------------------------------- | :------------------------------ | :---------------------------------- | :------------------- |
| `DATABASE_URL`                    | `localhost:5432`                | `postgres:5432`                     | ใช้ hostname ต่างกัน |
| `JLEDGER_REDIS_ADDRESS`           | `redis://localhost:6379`        | `redis://redis:6379`                | ใช้ hostname ต่างกัน |
| `JLEDGER_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092`                | `kafka:29092`                       | พอร์ตต่างกัน!        |
| `JLEDGER_EUREKA_ZONE`             | `http://localhost:8761/eureka/` | `http://eureka-server:8761/eureka/` | ใช้ hostname ต่างกัน |
| `API_GATEWAY_URL`                 | `http://localhost:8080`         | `http://api-gateway:8080`           | ใช้ hostname ต่างกัน |

---

## 4. 🔧 การตั้งค่าที่ต้องแก้ไขสำหรับ Hybrid Mode

### สิ่งที่ได้เพิ่มใน `docker-compose.dev.yml` แล้ว:

```yaml
services:
  kafka:
    ports:
      - "9092:9092" # Port mapping สำหรับ Host access
    environment:
      KAFKA_LISTENERS: PLAINTEXT_INTERNAL://0.0.0.0:29092,PLAINTEXT_EXTERNAL://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT_INTERNAL://kafka:29092,PLAINTEXT_EXTERNAL://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT_INTERNAL:PLAINTEXT,PLAINTEXT_EXTERNAL:PLAINTEXT

  zookeeper:
    ports:
      - "2181:2181" # Port mapping

  eureka-server:
    ports:
      - "8761:8761" # Port mapping

  api-gateway:
    ports:
      - "8080:8080" # Port mapping

  nginx:
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro # Local config
```

### สิ่งที่ต้องตั้งค่าใน `.env` ของ Local Services:

```bash
# สำหรับ wallet-api, admin-api
DATABASE_URL="postgresql://ledger_admin:ledger_password@localhost:5432/jledger_db?schema=wallet_schema"
JLEDGER_REDIS_ADDRESS="redis://localhost:6379"
JLEDGER_KAFKA_BOOTSTRAP_SERVERS="localhost:9092"  # ใช้พอร์ต 9092 ไม่ใช่ 29092
JLEDGER_EUREKA_ZONE="http://localhost:8761/eureka/"  # Eureka รันใน Docker
API_GATEWAY_URL="http://localhost:8080"  # API Gateway รันใน Docker
```

---

## 5. ❓ คำถามที่พบบ่อย

**Q: ทำไม Kafka ต้องมี 2 listeners?**
A: เพราะใน Hybrid mode เราต้องการให้:

- Services ใน Docker (ถ้ามี) คุยกับ Kafka ผ่าน `kafka:29092` (internal)
- Services บน Host คุยกับ Kafka ผ่าน `localhost:9092` (external)

**Q: ทำไมใน Production ใช้ port 29092?**
A: เพราะทุกอย่างอยู่ใน Docker เดียวกัน ไม่ต้อง expose พอร์ตออกมาภายนอก ใช้พอร์ตภายในเพื่อความปลอดภัย

---

## 6. 🚀 ตัวอย่างการยิง API (API Call Examples)

### 6.1 โหมด Hybrid Development

#### Wallet API Examples

**ตรวจสอบยอดเงิน (Check Balance)**

```bash
# Request
curl http://localhost:3002/balance \
  -H "Authorization: Bearer <token>"

# Flow: Browser/Mobile → wallet-api:3002 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: /balance
# - wallet-api: /balance (same)
# - api-gateway: /api/v1/balance (adds /api/v1 prefix)
# - core-service: /api/v1/balance (same)
```

**โอนเงิน (Transfer Money)**

```bash
# Request
curl -X POST http://localhost:3002/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "toAccountId": "acc_123",
    "amount": 100.00,
    "currency": "THB"
  }'

# Flow: wallet-app → wallet-api:3002 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: /transactions/transfer
# - wallet-api: /transactions/transfer (same)
# - api-gateway: /api/v1/transactions/transfer (adds /api/v1 prefix)
# - core-service: /api/v1/transactions/transfer (same)
# Note: This route has rate limiting (1 req/sec, burst 3) and circuit breaker
```

#### Admin API Examples

**จัดการผู้ใช้ (User Management)**

```bash
# Get all users
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <admin-token>"

# Flow: admin-web → admin-api:3001 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: /api/admin/users
# - admin-api: /api/admin/users (same)
# - api-gateway: /api/v1/users (removes /api/admin, adds /api/v1)
# - core-service: /api/v1/users (same)
```

#### Direct Core Service Calls

**Swagger UI**

```bash
# Access core-service Swagger directly (for debugging)
curl http://localhost:8081/swagger-ui.html

# Flow: Browser → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: /swagger-ui.html
# - api-gateway: /swagger-ui.html (same)
# - core-service: /swagger-ui.html (same)
```

---

### 6.2 โหมด Production

#### Wallet API Examples

**ตรวจสอบยอดเงิน (Check Balance)**

```bash
# Request
curl https://potayyr.site/api/wallet/balance \
  -H "Authorization: Bearer <token>"

# Flow: Internet → NGINX:443 → wallet-api:3002 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: https://potayyr.site/api/wallet/balance
# - NGINX: /balance (strips /api/wallet prefix)
# - wallet-api: /balance (same)
# - api-gateway: /api/v1/balance (adds /api/v1 prefix)
# - core-service: /api/v1/balance (same)
```

**โอนเงิน (Transfer Money)**

```bash
# Request
curl -X POST https://potayyr.site/api/wallet/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "toAccountId": "acc_123",
    "amount": 100.00,
    "currency": "THB"
  }'

# Flow: wallet-app → NGINX:443 → wallet-api:3002 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: https://potayyr.site/api/wallet/transactions/transfer
# - NGINX: /transactions/transfer (strips /api/wallet prefix)
# - wallet-api: /transactions/transfer (same)
# - api-gateway: /api/v1/transactions/transfer (adds /api/v1 prefix)
# - core-service: /api/v1/transactions/transfer (same)
```

#### Admin API Examples

**จัดการผู้ใช้ (User Management)**

```bash
# Get all users
curl https://potayyr.site/api/admin/users \
  -H "Authorization: Bearer <admin-token>"

# Flow: admin-web → NGINX:443 → admin-api:3001 → api-gateway:8080 → core-service:8081
# Path transformations:
# - Client: https://potayyr.site/api/admin/users
# - NGINX: /users (strips /api/admin prefix)
# - admin-api: /users (same)
# - api-gateway: /api/v1/users (adds /api/v1 prefix)
# - core-service: /api/v1/users (same)
```

#### Admin Web Access

**Dashboard**

```bash
# Access admin dashboard
curl https://potayyr.site/

# Flow: Browser → NGINX:443 → admin-web:3000
# Path transformations:
# - Client: https://potayyr.site/
# - NGINX: / (same)
# - admin-web: / (same)
```

---

## 7. 🏗️ คำอธิบาย Infrastructure Components

### 7.1 Eureka Server (Service Registry)

**หน้าที่:**

- Service Discovery - ค้นหา services โดยใช้ชื่อแทน IP
- Load Balancing - กระจาย request ไปยัง instances ต่างๆ
- Health Checking - ตรวจสอบว่า services ทำงานได้

**วิธีทำงาน:**

1. Services (core-service, api-gateway, notification-service) register ตัวเองกับ Eureka
2. Eureka เก็บข้อมูล instance แต่ละตัว (IP, port, health status)
3. Services อื่นๆ ใช้ Eureka เพื่อค้นหา services ที่ต้องการ
4. API Gateway ใช้ `lb://service-name` สำหรับ load balancing

**ใน Hybrid Mode:**

```
core-service (localhost:8081) → registers to → eureka-server (localhost:8761)
api-gateway (localhost:8080) → discovers → core-service via Eureka
```

**ใน Production Mode:**

```
core-service (Docker) → registers to → eureka-server (Docker)
api-gateway (Docker) → discovers → core-service via Eureka (using lb://core-service)
```

**ตัวอย่าง Configuration:**

```yaml
# api-gateway application.yml
eureka:
  client:
    serviceUrl:
      defaultZone: ${JLEDGER_EUREKA_ZONE:http://eureka-server:8761/eureka/}

# Route with load balancing
spring:
  cloud:
    gateway:
      routes:
        - id: core-service-route
          uri: lb://core-service # lb = Load Balancer via Eureka
```

---

### 7.2 Zookeeper (Kafka Coordination)

**หน้าที่:**

- Kafka Broker Coordination - จัดการ Kafka brokers
- Topic Configuration - เก็บ metadata ของ topics
- Leader Election - เลือก leader สำหรับ partitions
- Configuration Management - เก็บ config ของ Kafka cluster

**วิธีทำงาน:**

1. Kafka brokers connect ไปยัง Zookeeper
2. Zookeeper เก็บ broker information และ metadata
3. เมื่อมีการสร้าง topic → Zookeeper เก็บ partition info
4. เมื่อ broker ล้ม → Zookeeper ช่วย elect leader ใหม่

**ในทั้ง 2 โหมด:**

```
kafka → connects to → zookeeper:2181
```

**ตัวอย่าง Configuration:**

```yaml
# docker-compose.yml
kafka:
  environment:
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

zookeeper:
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
```

**ทำไมต้อง Zookeeper?**

- Kafka ต้องการ centralized coordination
- Zookeeper จัดการ distributed state
- ใช้ ZAB protocol (Zookeeper Atomic Broadcast) เพื่อ consistency

---

### 7.3 API Gateway (Spring Cloud Gateway)

**หน้าที่:**

- Centralized Routing - route requests ไปยัง services ต่างๆ
- Rate Limiting - จำกัด request rate ต่อ endpoint
- Circuit Breaker - ป้องกัน cascade failures
- Authentication - เพิ่ม internal secret headers
- Service Discovery - ใช้ Eureka สำหรับ load balancing

**วิธีทำงาน:**

1. รับ request จาก BFFs
2. Check rate limits (ถ้ามี configure)
3. Route ไปยัง target service (ใช้ Eureka)
4. เพิ่ม headers (X-Internal-Secret)
5. ถ้า service ล้ม → fallback ทำงาน

**ใน Hybrid Mode:**

```
wallet-api (localhost:3002) → api-gateway (localhost:8080) → core-service (localhost:8081)
admin-api (localhost:3001) → api-gateway (localhost:8080) → core-service (localhost:8081)
```

**ใน Production Mode:**

```
wallet-api (Docker) → api-gateway (Docker) → core-service (Docker)
admin-api (Docker) → api-gateway (Docker) → core-service (Docker)
```

**ตัวอย่าง Configuration:**

```yaml
# api-gateway application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: core-service-transfer
          uri: lb://core-service
          predicates:
            - Path=/api/v1/transactions/transfer/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 1
                redis-rate-limiter.burstCapacity: 3
            - name: CircuitBreaker
              args:
                name: coreTransferCircuitBreaker
                fallbackUri: forward:/fallback/core-service
            - AddRequestHeader=X-Internal-Secret, ${JLEDGER_INTERNAL_SECRET}
```

---

## 🗄️ Database Migration Architecture

### Service → Schema → Tool Mapping

| Service          | Schema          | Migration Tool | Migration Files Location                                           |
| ---------------- | --------------- | -------------- | ------------------------------------------------------------------ |
| **core-service** | `public`        | Flyway (SQL)   | `j-ledger-core/core-service/src/main/resources/db/migration/*.sql` |
| **admin-api**    | `admin_schema`  | Prisma (ORM)   | `j-ledger-portal/apps/admin-api/prisma/schema.prisma`              |
| **wallet-api**   | `wallet_schema` | Prisma (ORM)   | `j-ledger-portal/apps/wallet-api/prisma/schema.prisma`             |

### Migration Containers in docker-compose.yml

```yaml
core-migration:
  image: flyway/flyway:10-alpine
  command: -url=jdbc:postgresql://postgres:5432/${POSTGRES_DB} -user=${POSTGRES_USER} -password=${POSTGRES_PASSWORD} -connectRetries=60 migrate
  volumes:
    - ./j-ledger-core/core-service/src/main/resources/db/migration:/flyway/sql

admin-migration:
  command: sh -c "npx prisma migrate deploy && node dist/prisma/seed.js"
  environment:
    - DATABASE_URL=postgresql://...?schema=admin_schema

wallet-migration:
  command: sh -c "npx prisma migrate deploy && node dist/prisma/seed.js"
  environment:
    - DATABASE_URL=postgresql://...?schema=wallet_schema
```

### Migration Workflow

**Core Principle: Generate migration file first, then run migration container**

```
แก้ Database Schema
        ↓
Generate Migration File
        ↓
Run Migration Container
        ↓
Start Main Service
```

### Production vs Hybrid Development

| Scenario       | Core Service (Flyway)                                   | Admin/Wallet API (Prisma)                                                         |
| -------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Production** | Add SQL file → `docker compose up -d core-migration`    | `npx prisma migrate dev` → rebuild image → `docker compose up -d admin-migration` |
| **Hybrid Dev** | Add SQL file → `docker compose run --rm core-migration` | `npx prisma migrate dev` (direct on host)                                         |

### Key Points

- **Schema Isolation**: แต่ละ service ใช้ schema ต่างกัน → ไม่ conflict กัน
- **Migration Order**: Migration containers ทำงานก่อน services หลัก (depends_on: service_completed_successfully)
- **Seed Data**: admin-migration และ wallet-migration รัน seed.js หลัง migrate เสร็จ
- **Flyway**: ไม่ support rollback โดย default (ต้องสร้าง migration ใหม่เพื่อ revert)
- **Prisma**: `npx prisma migrate resolve` เพื่อ mark migration ว่า resolved ถ้ามีปัญหา

---

## 8. 📝 Summary

### Architecture Pattern

- **BFF Pattern**: wallet-api, admin-api เป็น Backend for Frontend
- **API Gateway**: Centralized routing, rate limiting, circuit breaker
- **Service Discovery**: Eureka สำหรับ dynamic service lookup
- **Message Broker**: Kafka + Zookeeper สำหรับ async communication

### Key Differences

| Aspect               | Hybrid Mode      | Production Mode  |
| :------------------- | :--------------- | :--------------- |
| Infrastructure       | Docker (partial) | Docker (full)    |
| Application Services | Local host       | Docker           |
| Access Method        | localhost:port   | potayyr.site     |
| SSL                  | None             | Let's Encrypt    |
| API Gateway          | localhost:8080   | api-gateway:8080 |
| Kafka Port           | 9092 (external)  | 29092 (internal) |

### Request Flow (Both Modes)

```
Client → BFF → API Gateway → Core Service
         ↓
      Infrastructure (PostgreSQL, Redis, Kafka)
```
