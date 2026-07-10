# 📋 J-Ledger Core — Architecture Review & Improvement Roadmap (Remaining Tasks)

> **วันที่อัปเดตล่าสุด:** 10 กรกฎาคม 2026  
> **ขอบเขต:** `j-ledger-core/finance-service` (Java Spring Boot)  
> **จุดประสงค์:** รายการงานที่ยังต้องดำเนินการต่อเพื่อเพิ่มเสถียรภาพ ประสิทธิภาพ และสถาปัตยกรรมระดับ Production-grade

---

## 📊 สรุปจำนวนงานคงเหลือ

| Priority | จำนวนงานคงเหลือ | สถานะ |
|----------|:-----:|:-----:|
| 🔴 Critical (Priority 1) | 0 | ✅ สำเร็จทั้งหมด |
| 🟡 High (Priority 2) | 0 | ✅ สำเร็จทั้งหมด |
| 🟢 Medium (Priority 3) | 1 | `[ ]` รอทำ |
| 🔵 Nice-to-Have (Priority 4) | 6 | `[ ]` รอทำ |
| **รวมคงเหลือ** | **7** | |

---

## 🟢 Priority 3 — Medium (ความถูกต้องและการทดสอบระดับระบบ)

### 3.2 เพิ่ม Integration Test ด้วย Testcontainers
- [ ] **ปัญหา:** ตอนนี้มี dependency `testcontainers` อยู่ใน `pom.xml` แล้ว แต่ยังไม่มี Integration Test จริงๆ มีแค่ Unit Tests
- [ ] **แนวทาง:** เขียน Integration Test สำหรับ Flow สำคัญ
  - `TransferIntegrationTest` — ทดสอบ Lock → Transfer → Outbox → Kafka ครบ Loop
  - `IdempotencyIntegrationTest` — ทดสอบ Duplicate Request ถูก Reject จริง
  - `ReconciliationIntegrationTest` — ทดสอบ Nightly Reconciliation ได้ผลลัพธ์ MATCHED

---

## 🔵 Priority 4 — Nice-to-Have (ทำให้เทียบเท่าระบบใหญ่ได้)

### 4.1 ปรับ Architecture เป็น Hexagonal (Ports & Adapters)
- [ ] **ปัญหา:** ปัจจุบันเป็น Layered Architecture แบบคลาสสิก (Controller → Service → Repository) ซึ่งทำให้ Business logic ผูกติด Framework
- [ ] **แนวทาง:** แยกเป็น Hexagonal Architecture
```text
src/main/java/com/jledger/finance/
├── domain/              ← Business Logic ล้วนๆ (ไม่ import Spring เลย)
│   ├── model/           ← Entity, Value Objects
│   ├── port/            ← Interface (Use Cases, Repository Ports)
│   └── service/         ← Domain Services (Pure Java)
├── application/         ← Use Case Orchestration
│   └── usecase/         ← TransferUseCase, TopUpUseCase
├── adapter/
│   ├── in/web/          ← Controllers (REST adapters)
│   ├── out/persistence/ ← JPA Repositories (DB adapters)
│   ├── out/messaging/   ← Kafka adapters
│   └── out/cache/       ← Redis adapters
└── config/              ← Spring Configuration
```

### 4.2 เพิ่ม Event Sourcing สำหรับ Audit Trail
- [ ] **ปัญหา:** ตอนนี้ใช้ `AuditLogService` เก็บ Log แต่ไม่สามารถ "Replay" เหตุการณ์ย้อนหลังได้
- [ ] **แนวทาง:** เก็บ Domain Events (TransferInitiated, TransferCompleted, BalanceChanged) เป็น Immutable Event Stream

### 4.3 เพิ่ม Prometheus Metrics + Grafana Dashboard
- [ ] **ปัญหา:** มี Actuator แล้ว แต่ยังไม่มี Custom Metrics
- [ ] **แนวทาง:** เพิ่ม `micrometer-registry-prometheus` แล้วสร้าง Custom Metrics:
  - `transfer_total` (Counter) — จำนวนการโอนเงินทั้งหมด
  - `transfer_duration_seconds` (Histogram) — เวลาที่ใช้ในการโอน
  - `lock_acquisition_failures_total` — จำนวนครั้งที่ขอ Lock ไม่ได้
  - `outbox_pending_events` (Gauge) — จำนวน Events ที่ค้างอยู่ใน Outbox

### 4.4 เพิ่ม Circuit Breaker สำหรับ External Dependencies
- [ ] **ปัญหา:** ป้องกันกรณี Redis/Kafka ล่มแล้วทำให้ทั้งระบบค้าง (Cascading Failure)
- [ ] **แนวทาง:** ใช้ Resilience4j เพื่อทำ Circuit Breaker ระหว่าง Core ↔ Redis, Core ↔ Kafka (ต้องคำนึงถึง Consistency ความถูกต้องของบัญชีเป็นหลัก)

### 4.5 Dockerfile Optimization
- [ ] **ปัญหา:** ปัจจุบัน Multi-stage แต่ไม่มี Layer caching และรัน App ด้วย Root user
- [ ] **แนวทาง:**
  - แยก `COPY pom.xml` → `RUN mvn dependency:go-offline` ก่อน COPY src (เพิ่ม Cache layer)
  - เพิ่ม Non-root user สำหรับ Runtime
  - ใส่ JVM Tuning flags (`-XX:+UseContainerSupport`, `-XX:MaxRAMPercentage=75`)
```dockerfile
# ✅ ปรับ Dockerfile ตัวอย่าง
FROM eclipse-temurin:21-jre AS runtime
RUN addgroup --system app && adduser --system --ingroup app app
USER app
COPY --from=build /app/target/finance-service-*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

### 4.6 เพิ่ม OpenAPI Documentation
- [x] **ปัญหา:** มี `springdoc-openapi` แต่ Controller ไม่มี `@Operation`, `@ApiResponse` annotations
- [x] **แนวทาง:** เพิ่ม Swagger annotations เพื่อให้ API Docs สมบูรณ์
