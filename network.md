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
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper

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
        PGA["[pgadmin]<br/>พอร์ต 5050:80<br/>DB Management"]
    end

    %% ทราฟฟิกจากผู้ใช้
    User((👤 User Browser)) -->|http://localhost:3000| WEB

    %% Frontend เชื่อมต่อกับ BFF
    WEB -->|http://localhost:3001| AAPI
    MOB -.->|http://localhost:3002| WAPI

    %% BFF เชื่อมต่อกับ Core Service
    WAPI -->|http://localhost:8081| CORE
    AAPI -->|http://localhost:8081| CORE

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
    style PGA fill:#f3e5f5,stroke:#7b1fa2
```

**คำอธิบายเส้น:**

- `───▶` (เส้นทึง): การเชื่อมต่อ HTTP/REST API ระหว่าง Services
- `- - -▶` (เส้นประ): การเชื่อมต่อกับ Infrastructure (Database, Cache, Message Broker) ใน Docker

| ต้นทาง               | ปลายทาง (โหมด Hybrid) | ที่อยู่ (Address)       | หมายเหตุ                      |
| :------------------- | :-------------------- | :---------------------- | :---------------------------- |
| เบราว์เซอร์          | admin-web (Local)     | `http://localhost:3000` | Development mode              |
| admin-web (Local)    | admin-api (BFF)       | `http://localhost:3001` | Frontend → BFF                |
| wallet-app (Mobile)  | wallet-api (BFF)      | `http://<host-ip>:3002` | Mobile → BFF                  |
| wallet-api (BFF)     | core-service (Local)  | `http://localhost:8081` | BFF → Core Service            |
| admin-api (BFF)      | core-service (Local)  | `http://localhost:8081` | BFF → Core Service            |
| wallet-api (BFF)     | postgres (Docker)     | `localhost:5432`        | BFF เชื่อมต่อ Database        |
| wallet-api (BFF)     | redis (Docker)        | `localhost:6379`        | BFF เชื่อมต่อ Cache           |
| wallet-api (BFF)     | kafka (Docker)        | `localhost:9092`        | BFF เชื่อมต่อ Message Broker  |
| admin-api (BFF)      | postgres (Docker)     | `localhost:5432`        | BFF เชื่อมต่อ Database        |
| core-service (Local) | postgres (Docker)     | `localhost:5432`        | Core เชื่อมต่อ Database       |
| core-service (Local) | redis (Docker)        | `localhost:6379`        | Core เชื่อมต่อ Cache          |
| core-service (Local) | kafka (Docker)        | `localhost:9092`        | Core เชื่อมต่อ Message Broker |
| pgadmin (Browser)    | postgres (Docker)     | `http://localhost:5050` | เข้าจัดการ Database           |

> [!WARNING]
> **ข้อจำกัดของโหมด Hybrid ปัจจุบัน:**
>
> - Eureka Server และ API Gateway ยังไม่ถูกรวมใน docker-compose.dev.yml
> - หากต้องการใช้ Service Discovery ต้องรัน Eureka และ Gateway บนเครื่อง Local หรือเพิ่มเข้าไปใน docker-compose.dev.yml

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

    %% BFF เชื่อมต่อกับ Core Layer
    WAPI -->|http://core-service:8081| CORE
    AAPI -->|http://core-service:8081| CORE

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
| wallet-api (BFF)    | core-service        | `http://core-service:8081`   | BFF → Core Service            |
| admin-api (BFF)     | core-service        | `http://core-service:8081`   | BFF → Core Service            |
| wallet-api (BFF)    | postgres            | `postgres:5432`              | BFF เชื่อมต่อ Database        |
| wallet-api (BFF)    | redis               | `redis:6379`                 | BFF เชื่อมต่อ Cache           |
| wallet-api (BFF)    | kafka               | `kafka:29092`                | BFF เชื่อมต่อ Message Broker  |
| admin-api (BFF)     | postgres            | `postgres:5432`              | BFF เชื่อมต่อ Database        |
| core-service        | postgres            | `postgres:5432`              | Core เชื่อมต่อ Database       |
| core-service        | redis               | `redis:6379`                 | Core เชื่อมต่อ Cache          |
| core-service        | kafka               | `kafka:29092`                | Core เชื่อมต่อ Message Broker |
| api-gateway         | eureka-server       | `http://eureka-server:8761`  | Service Discovery             |
| kafka               | zookeeper           | `zookeeper:2181`             | Kafka Coordination            |

> [!NOTE]
> ใน **Production**: เราจะใช้พอร์ต `29092` สำหรับ Kafka เพื่อคุยกันภายใน Docker
> ใน **Development**: เราจะใช้พอร์ต `9092` เพื่อให้เครื่องเรา (Host) คุยกับ Kafka ใน Docker ได้

---

## 3. 📊 สรุปความแตกต่างระหว่างโหมด

### Port Mapping Comparison

| Service       | Dev Mode (Exposed) | Prod Mode (Internal) | หมายเหตุ                              |
| :------------ | :----------------- | :------------------- | :------------------------------------ |
| postgres      | `5432:5432` ✅     | `5432` (internal)    | Dev: เข้าถึงจาก Host ได้              |
| redis         | `6379:6379` ✅     | `6379` (internal)    | Dev: เข้าถึงจาก Host ได้              |
| kafka         | `9092:9092` ❌     | `29092` (internal)   | Dev: ต้องเพิ่ม port mapping           |
| zookeeper     | `2181:2181` ❌     | `2181` (internal)    | Dev: ต้องเพิ่ม port mapping           |
| eureka-server | ❌                 | `8761` (internal)    | Dev: ต้องรันบน Host หรือเพิ่ม mapping |
| api-gateway   | ❌                 | `8080` (internal)    | Dev: ต้องรันบน Host หรือเพิ่ม mapping |
| nginx         | `80:80` ❌         | `80:80` ✅           | Dev: ไม่จำเป็น (เข้า Service โดยตรง)  |
| pgadmin       | `5050:80` ✅       | -                    | Dev: เฉพาะสำหรับจัดการ DB             |

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

### สิ่งที่ต้องเพิ่มใน `docker-compose.dev.yml`:

```yaml
services:
  kafka:
    ports:
      - "9092:9092" # เพิ่ม port mapping สำหรับ Host access
    environment:
      KAFKA_LISTENERS: PLAINTEXT_INTERNAL://0.0.0.0:29092,PLAINTEXT_EXTERNAL://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT_INTERNAL://kafka:29092,PLAINTEXT_EXTERNAL://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT_INTERNAL:PLAINTEXT,PLAINTEXT_EXTERNAL:PLAINTEXT

  zookeeper:
    ports:
      - "2181:2181" # เพิ่ม port mapping (optional)

  eureka-server:
    ports:
      - "8761:8761" # เพิ่มถ้าต้องการรันใน Docker

  api-gateway:
    ports:
      - "8080:8080" # เพิ่มถ้าต้องการรันใน Docker
```

### สิ่งที่ต้องตั้งค่าใน `.env` ของ Local Services:

```bash
# สำหรับ wallet-api, admin-api, core-service
DATABASE_URL="postgresql://ledger_admin:ledger_password@localhost:5432/jledger_db?schema=wallet_schema"
JLEDGER_REDIS_ADDRESS="redis://localhost:6379"
JLEDGER_KAFKA_BOOTSTRAP_SERVERS="localhost:9092"  # ใช้พอร์ต 9092 ไม่ใช่ 29092
JLEDGER_EUREKA_ZONE="http://localhost:8761/eureka/"  # ถ้ารัน Eureka บน Host
```

---

## 5. ❓ คำถามที่พบบ่อย

**Q: ทำไม Kafka ต้องมี 2 listeners?**
A: เพราะใน Hybrid mode เราต้องการให้:

- Services ใน Docker (ถ้ามี) คุยกับ Kafka ผ่าน `kafka:29092` (internal)
- Services บน Host คุยกับ Kafka ผ่าน `localhost:9092` (external)

**Q: ทำไมใน Production ใช้ port 29092?**
A: เพราะทุกอย่างอยู่ใน Docker เดียวกัน ไม่ต้อง expose พอร์ตออกมาภายนอก ใช้พอร์ตภายในเพื่อความปลอดภัย

**Q: สามารถรัน Eureka/Gateway ใน Docker ได้ไหม?**
A: ได้ แต่ต้องเพิ่ม port mapping ใน docker-compose.dev.yml และตั้งค่า environment variables ของ services บน Host ให้ชี้ไปที่ `localhost:8761` และ `localhost:8080`
