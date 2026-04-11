# J-Ledger Ecosystem 🏦

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9-7F52FF.svg?style=for-the-badge&logo=kotlin)](https://kotlinlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F.svg?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-3.6-231F20.svg?style=for-the-badge&logo=apachekafka)](https://kafka.apache.org/)

**J-Ledger** is a high-performance, cloud-native financial ledger system built for strict consistency, atomicity, and high availability. It implements a double-entry accounting engine with distributed locking and idempotent processing.

---

## 🏗️ System Architecture

The project has evolved into a distributed microservices architecture (Phase 6), centralized within the `ascend-ledger-workspace`.

```text
.
├── ascend-ledger-workspace/      # 🚀 Primary Cloud-Native Workspace
│   ├── api-gateway/              # Spring Cloud Gateway (Port 8080)
│   ├── core-service/             # Java Financial Engine (Port 8081)
│   ├── notification-service/     # Kotlin Kafka Consumer (Port 8082)
│   ├── eureka-server/            # Service Registry (Port 8761)
│   ├── admin-web/                # Next.js Admin Dashboard (Port 3000)
│   └── k8s/                      # Kubernetes Manifests
└── j-ledger-legacy/              # 🏛️ Original Monolithic Core
```

### Key Technical Blocks
- **Atomic Transfers**: Transactional double-entry logic with Redisson distributed locking.
- **Service Discovery**: Netflix Eureka for seamless microservice registration.
- **Resilient Routing**: Spring Cloud Gateway with Resilience4j Circuit Breakers.
- **Event-Driven**: Transaction events are persisted via the **Outbox Pattern** and streamed through **Kafka**.
- **Admin GUI**: Modern Next.js dashboard with React Server Components (RSC) and Shadcn/UI.

---

## 🚀 Quick Start (Local Development)

The entire ecosystem is orchestrated via Docker Compose.

### 1. Start all Services
Ensure Docker is running, then execute from the root:
```bash
cd ascend-ledger-workspace
docker-compose up -d --build
```

### 2. Verify System Health
Check the service registration status on the **Eureka Dashboard**:
👉 [http://localhost:8761](http://localhost:8761) (Wait until `CORE-SERVICE`, `API-GATEWAY`, and `NOTIFICATION-SERVICE` appear as **UP**)

### 3. Access Dashboards
- **Admin Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Gateway Entry**: [http://localhost:8080/api/v1/...](http://localhost:8080/api/v1/...)

---

## 🧪 Testing & Verification

Comprehensive test suites are available for every layer:

- **Integration Tests (JVM)**: Includes `Testcontainers` for Postgres, Redis, and Kafka.
  ```bash
  mvn clean test # Run in respective service directories
  ```
- **Frontend Tests (Jest)**: 
  ```bash
  npm test # Run in admin-web/
  ```
- **Postman**: Import `j-ledger-integration-tests.postman_collection.json` from the workspace root for system-wide verification.

---

## ☸️ Production Deployment
Production-ready Kubernetes manifests are located in `ascend-ledger-workspace/k8s/`.
Standard ports:
- **Gateway**: 8080
- **Core**: 8081
- **Notification**: 8082
- **Eureka**: 8761
- **Web**: 3000

---

> [!IMPORTANT]
> For detailed instructions on Database management, Flyway migrations, and Kubernetes scaling, please refer to the [Workspace README](ascend-ledger-workspace/README.md).
