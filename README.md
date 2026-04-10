# J-Ledger

## Tech Stack

- Java 21
- Spring Boot 3.2
- Spring Data JPA / Hibernate
- PostgreSQL 15
- Flyway
- Testcontainers + JUnit 5
- Docker Compose

## Project Structure

```text
.
├── README.md
├── detail.md
└── j-ledger
    ├── docker-compose.yml
    ├── pom.xml
    └── src
```

## Prerequisites

- JDK 21
- Maven 3.9+
- Docker Desktop หรือ Docker Engine

## Setup

1. เปิด PostgreSQL ด้วย Docker Compose

```bash
cd j-ledger
docker compose up -d postgres
```

ถ้าต้องการเปิด service ทั้งหมดใน compose:

```bash
cd j-ledger
docker compose up -d
```

2. ตรวจสอบว่า Java เป็นเวอร์ชัน 21

```bash
java -version
```

ถ้าใช้ macOS และมีหลาย JDK แนะนำ:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

3. ติดตั้งและรัน test

```bash
cd j-ledger
mvn clean test
```

หมายเหตุ:
- โปรเจกต์นี้บังคับ compile และ test ด้วย JDK 21 ใน `pom.xml`
- ถ้าใช้ Homebrew Maven บน macOS ที่ default ไป Java 25 โปรเจกต์นี้ถูกตั้งค่าไว้ให้ fork ไปใช้ `javac`/`java` ของ JDK 21 แล้ว
- การรัน test ต้องมี Docker เปิดอยู่ เพราะใช้ Testcontainers

## Run Application

จาก root ของ repo:

```bash
cd j-ledger
mvn spring-boot:run
```

เมื่อแอปรันแล้ว:

- API base URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Default Database Config

ค่าปกติของแอป:

- Host: `localhost`
- Port: `5432`
- Database: `jledger_db`
- Username: `ledger_admin`
- Password: `ledger_password`

Config เหล่านี้ override ได้ผ่าน environment variables:

```bash
export JLEDGER_DATASOURCE_URL=jdbc:postgresql://localhost:5432/jledger_db
export JLEDGER_DATASOURCE_USERNAME=ledger_admin
export JLEDGER_DATASOURCE_PASSWORD=ledger_password
export JLEDGER_SHOW_SQL=false
export JLEDGER_JPA_LOG_LEVEL=INFO
export JLEDGER_TX_LOG_LEVEL=INFO
```

## Flyway Migration

Flyway จะรันอัตโนมัติเมื่อแอป start โดยใช้ไฟล์ migration:

- [V1__init_schema.sql](/Users/wiiznu/project/j-ledgar/j-ledger/src/main/resources/db/migration/V1__init_schema.sql)

ดังนั้นถ้า PostgreSQL พร้อม แอปจะสร้าง schema ให้เองตอนเริ่มทำงาน

## Run Tests

รันทุก test:

```bash
cd j-ledger
mvn clean test
```

รันเฉพาะ test class:

```bash
cd j-ledger
mvn -Dtest=TransferServiceConcurrencyTest test
mvn -Dtest=TransferServiceIdempotencyTest test
```

สิ่งที่ test ครอบตอนนี้:

- optimistic locking ของ account update
- idempotent replay ด้วย `Idempotency-Key`
- concurrent duplicate request ต้องไม่ลงบัญชีซ้ำ

## Example API Call

```bash
curl -X POST http://localhost:8080/api/v1/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: transfer-001" \
  -d '{
    "fromAccountId": "00000000-0000-0000-0000-000000000001",
    "toAccountId": "00000000-0000-0000-0000-000000000002",
    "amount": 100.0000,
    "currency": "THB"
  }'
```

## Notes

- Redis มีอยู่ใน `docker-compose.yml` แต่ปัจจุบัน flow ในแอปยังไม่ได้ใช้งานโดยตรง
- แอปนี้เน้น correctness ของ ledger, optimistic locking และ idempotency เป็นหลัก
- ถ้าเพิ่ง clone โปรเจกต์ แนะนำเริ่มจาก `mvn clean test` ก่อน เพื่อเช็ค environment ให้ครบ
