# 🛠️ J-Ledger Core Service: Hybrid Dev Mode Guide

This guide explains how to run J-Ledger in "Hybrid Mode": **Infrastructure in Docker** and **Applications on Localhost**.

## 1. Start Infrastructure (Docker)

Run the following command to start the database, message broker, and cache:

```bash
docker compose -f docker-compose.infra.yml up -d
```

| Service | Host Port | Internal Name |
|---------|-----------|---------------|
| Postgres| 5432      | postgres      |
| Redis   | 6379      | redis         |
| Kafka   | 9092      | kafka         |
| Zookeeper| 2181     | zookeeper     |
| pgAdmin | 5050      | pgadmin       |

## 2. Setup Environment Variables

In every new terminal window where you plan to run a service, source the setup script:

```bash
source ./scripts/setup-dev.sh
```

## 3. Run Services (Local)

You can now run any service using Maven. Since `spring-boot-devtools` is included, the app will automatically restart when you recompile in your IDE.

### Order of Startup (Recommended):

1.  **Eureka Server**
    ```bash
    cd eureka-server && ./mvnw spring-boot:run
    ```
2.  **API Gateway**
    ```bash
    cd api-gateway && ./mvnw spring-boot:run
    ```
3.  **Core Service**
    ```bash
    cd core-service && ./mvnw spring-boot:run
    ```
4.  **Notification Service**
    ```bash
    cd notification-service && ./mvnw spring-boot:run
    ```
5.  **Admin Web (Next.js)**
    ```bash
    cd admin-web && npm run dev
    ```

## 4. Debugging & Development

- **Hot Reload**: Just save your Java files and the service will restart instantly.
- **IDE Debugger**: Attach your IDE's debugger to the process directly on `localhost`.
- **Eureka Dashboard**: Visit [http://localhost:8761](http://localhost:8761) to see all services registered from your Mac.
- **pgAdmin**: Visit [http://localhost:5050](http://localhost:5050) to manage the database.

---
> [!IMPORTANT]
> Ensure you have **Java 21** installed on your Mac before running services natively.
