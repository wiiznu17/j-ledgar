# 📋 J-Ledger Core — Architecture Review & Improvement Roadmap

> **วันที่วิเคราะห์:** 10 กรกฎาคม 2026  
> **ขอบเขต:** `j-ledger-core/finance-service` (Java Spring Boot)  
> **จุดประสงค์:** วิเคราะห์โค้ดและสถาปัตยกรรมปัจจุบัน เทียบกับมาตรฐาน Enterprise-grade แล้วสร้าง Roadmap สำหรับการปรับปรุง

---

## 🏆 สรุประดับปัจจุบัน

| หมวด | ระดับปัจจุบัน | ระดับเป้าหมาย |
|------|:---:|:---:|
| **Architecture & Domain Design** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Code Quality & Patterns** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Concurrency & Safety** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testing** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Observability & Logging** | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Security** | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **DevOps & Infrastructure** | ⭐⭐ | ⭐⭐⭐⭐ |

### ✅ สิ่งที่ทำได้ดีแล้ว (จุดแข็ง)
- **Facade Pattern & God Object Decomposition** — แยก `WalletService` ขนาด 1,634 บรรทัดออกเป็น 7 Domain Services ย่อย ทำงานอิสระจากกัน ทำให้อ่านง่าย ปรับแต่งง่าย ไม่ชนกัน
- **Constructor Injection** — ใช้ `@RequiredArgsConstructor` (Lombok) ในทุก Wallet Services เพื่อลด Hidden dependency และทำ Unit Test ได้ง่ายขึ้น
- **Consistent Entity Lombok Style** — ปรับปรุง Entities ทั้งหมดให้ใช้ Lombok `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` สม่ำเสมอกันทั้งโปรเจกต์
- **Service Interface Separation & Package Restructuring** — แยก Interface และ Implementation สำหรับทุกบริการหลักและบริการย่อยในระบบ (12 บริการหลัก) พร้อมจัดโครงสร้างไดเรกทอรีให้อยู่ภายใต้ `.impl` อย่างเป็นระบบระเบียบ ป้องกัน Package Clutter และช่วยให้การทำ Mock/Unit Testing สะดวกขึ้นมาก
- **Distributed Locking** ด้วย Redisson (deadlock prevention ทำ Account ID sorting)
- **Idempotency** ด้วย Redis (`RedisIdempotencyService`)
- **Transactional Outbox Pattern** พร้อม Dead Letter Queue, Max Retries
- **Double-entry Bookkeeping** (Debit/Credit + `LedgerEntry`)
- **Nightly Reconciliation** พร้อม Distributed Lock ป้องกันรัน Multi-pod
- **AML Monitoring** (Large Transaction, High Frequency, Round Number, Multiple Recipients)
- **TraceId Filter** สำหรับ Distributed Tracing
- **Flyway Migration** สำหรับ Database Versioning
- **Multi-stage Dockerfile** (build + runtime)

---

## 🔴 Priority 1 — Critical (แก้ก่อน เพราะกระทบ Quality ทั้งระบบ)

### 1.1 `WalletService.java` เป็น God Object — ต้อง Refactor
- [x] **ปัญหา:** ไฟล์เดียว 1,634 บรรทัด รวมทุกอย่าง (Top-up, Transfer, QR, Bank Account, Balance, Cache, Outbox) เป็น Anti-pattern ที่เรียกว่า "God Object"
- [x] **แนวทาง:** แตกออกตาม Domain Responsibility
  - `TopUpService` — ดูแล `topUpBank()`, `topUpCash()`, `topUpCounter()`, `creditTopUpFromExternal()`
  - `P2PTransferService` — ดูแล `transferByPhone()`, `transferByWalletId()`, `previewTransfer()`
  - `WalletQueryService` — ดูแล `getWallet()`, `getTransactions()`, `getTopUpHistory()`
  - `LinkedBankAccountService` — ดูแล CRUD ของ `LinkedBankAccount`
  - `WalletAdminService` — ดูแล `freeze`, `unfreeze`, `adjustBalance`, `activate`, `deactivate`
  - `WalletCacheService` — ดูแลเรื่อง Redis Cache (Cache Invalidation Strategy)
- [x] **ประโยชน์:** อ่านง่าย, ทดสอบง่าย, ทุกคนแก้โค้ดไม่ชนกัน

### 1.2 ใช้ `@Autowired` แบบ Field Injection — ต้องเปลี่ยนเป็น Constructor Injection
- [x] **ปัญหา:** ใน `WalletService` ใช้ `@Autowired` ที่ Field ทั้งหมด (9 dependencies) ซึ่งทำให้ Unit Test ต้องใช้ Reflection และมี Hidden dependencies
- [x] **แนวทาง:** เปลี่ยนเป็น Constructor Injection ด้วย `@RequiredArgsConstructor` (Lombok) เหมือนที่ทำใน `TransferService` ซึ่งเป็นตัวอย่างที่ดีมากอยู่แล้ว

```java
// ❌ ปัจจุบัน (WalletService)
@Autowired
private WalletRepository walletRepository;
@Autowired
private TransactionRepository transactionRepository;
// ... 9 fields ...

// ✅ ควรเป็น
@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
}
```

### 1.3 Entity ใช้ Manual Getters/Setters — ทำให้ไม่ Immutable
- [x] **ปัญหา:** `Transaction.java` มี manual getters/setters 50+ บรรทัด ขณะที่ Entity อื่นใช้ Lombok `@Builder` แล้ว ทำให้โค้ดไม่สม่ำเสมอ (Inconsistent style)
- [x] **แนวทาง:** ทุก Entity ควรใช้ Lombok `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` เหมือนกันหมด

---

## 🟡 Priority 2 — High (ปรับแล้ว Architecture จะแข็งแรงขึ้นมาก)

### 2.1 ไม่มี Service Interface — ควรแยก Interface + Implementation
- [x] **ปัญหา:** ตอนนี้ Controller เรียก Service (Concrete class) ตรงๆ ทำให้ Mock ยาก และไม่สามารถ Swap implementation ได้
- [x] **แนวทาง:** สร้าง Interface สำหรับ Service สำคัญ

```java
// ✅ สร้าง Interface
public interface TransferService {
    Transaction executeTransfer(String idempotencyKey, TransferRequest request);
}

// ✅ Implementation
@Service
@RequiredArgsConstructor
public class TransferServiceImpl implements TransferService {
    // ... existing code ...
}
```

### 2.2 Transaction ID Generation มีความเสี่ยง Collision สูง
- [x] **ปัญหา:** `generateReadableTransactionId()` ใช้ `Math.random()` เพื่อสร้าง 6 หลัก → โอกาสชนกันสูงมากในระบบ Production (Birthday Problem)
- [x] **แนวทาง:** ใช้ Snowflake ID, ULID, หรือ UUID v7 (ที่เรียงตามเวลาได้) แทน `Math.random()`

```java
// ❌ ปัจจุบัน — มีโอกาสซ้ำกัน
int randomNum = (int) (Math.random() * 900000) + 100000;
return "TXN" + dateStr + randomNum;

// ✅ ควรเปลี่ยนเป็น — ULID ที่เรียงตามเวลาได้ + ไม่ซ้ำกัน
return "TXN" + Ulid.fast().toString();
```

### 2.3 Hardcoded Values กระจายอยู่ทั่ว — ควรย้ายเข้า Config
- [x] **ปัญหา:** ค่าสำคัญๆ เช่น `DAILY_LIMIT = 1_000_000`, `TRANSACTION_LIMIT = 50_000`, `SYSTEM_ACCOUNT_ID` ถูก Hardcode ไว้ในโค้ด
- [x] **แนวทาง:** ย้ายเข้า `application.yml` แล้วใช้ `@Value` หรือ `@ConfigurationProperties`

```yaml
# application.yml
jledger:
  limits:
    daily: 1000000
    per-transaction: 50000
  system:
    account-id: "00000000-0000-0000-0000-000000000000"
```

### 2.4 JSON ถูกสร้างด้วย String Concatenation — เสี่ยง Injection
- [x] **ปัญหา:** ใน `WalletService` มีการสร้าง JSON metadata ด้วย String concatenation ตรงๆ (เช่น `"{\"reason\":\"" + reason + "\"}"`) ซึ่งเสี่ยง JSON Injection
- [x] **แนวทาง:** ใช้ `ObjectMapper` ที่มีอยู่แล้ว Inject เข้ามา เพื่อสร้าง JSON อย่างปลอดภัย

```java
// ❌ ปัจจุบัน — เสี่ยง JSON Injection
transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");

// ✅ ควรเป็น
Map<String, Object> meta = Map.of("reason", reason, "adminAdjustment", true);
transaction.setMetadata(objectMapper.writeValueAsString(meta));
```

---

## 🟢 Priority 3 — Medium (ทำให้ระบบเหมือน Production-grade จริงๆ)

### 3.1 เพิ่ม Bean Validation (`@Valid`) ที่ Request DTOs
- [ ] **ปัญหา:** DTO เช่น `TransferRequest` ใช้ `record` แต่ไม่มี `@NotNull`, `@Positive`, `@Pattern` validation → ต้อง validate มือเองใน Service
- [ ] **แนวทาง:** ใส่ Bean Validation Annotations ที่ DTO แล้วใช้ `@Valid` ที่ Controller

```java
// ✅ เพิ่ม Validation ที่ DTO
public record TransferRequest(
    @NotBlank String fromAccountId,
    @NotBlank String toAccountId,
    @NotNull @Positive BigDecimal amount,
    @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currency,
    Object metadata
) {}
```

### 3.2 เพิ่ม Integration Test ด้วย Testcontainers
- [ ] **ปัญหา:** ตอนนี้มี dependency `testcontainers` อยู่ใน `pom.xml` แล้ว แต่ยังไม่มี Integration Test จริงๆ มีแค่ Unit Tests (14 ไฟล์)
- [ ] **แนวทาง:** เขียน Integration Test สำหรับ Flow สำคัญ
  - `TransferIntegrationTest` — ทดสอบ Lock → Transfer → Outbox → Kafka ครบ Loop
  - `IdempotencyIntegrationTest` — ทดสอบ Duplicate Request ถูก Reject จริง
  - `ReconciliationIntegrationTest` — ทดสอบ Nightly Reconciliation ได้ผลลัพธ์ MATCHED

### 3.3 ตรวจสอบ API Versioning (ได้รับการจัดการผ่าน Nginx)
- [x] **สถานะ:** ปัจจุบันระบบได้รับการแมปผ่าน Nginx Reverse Proxy (แมป `/api/v1/finance` -> `/api/finance`) ทำให้ Client สามารถเรียกใช้งานแบบ Versioned API ได้สำเร็จแล้ว โดยไม่จำเป็นต้องแก้ไข Routing ที่ฝั่ง Java code ในขณะนี้

### 3.4 Outbox Processor ควรมี Cleanup Job
- [ ] **ปัญหา:** Event ที่สถานะ `PROCESSED` จะสะสมอยู่ใน DB ไม่มีวันถูกลบ
- [ ] **แนวทาง:** เพิ่ม `@Scheduled` Cleanup Job ลบ `PROCESSED` events ที่อายุเกิน 30 วัน

### 3.5 เพิ่ม Retry Mechanism สำหรับ Kafka Consumer
- [ ] **ปัญหา:** `AmlEventConsumer` และ `TransactionEventConsumer` ไม่มีการทำ Retry + Error handling ที่ชัดเจน
- [ ] **แนวทาง:** ใช้ `@RetryableTopic` หรือ `DefaultErrorHandler` ของ Spring Kafka

---

## 🔵 Priority 4 — Nice-to-Have (ทำให้เทียบเท่าระบบใหญ่ได้)

### 4.1 ปรับ Architecture เป็น Hexagonal (Ports & Adapters)
- [ ] **ปัญหา:** ปัจจุบันเป็น Layered Architecture แบบคลาสสิก (Controller → Service → Repository) ซึ่งทำให้ Business logic ผูกติด Framework
- [ ] **แนวทาง:** แยกเป็น Hexagonal Architecture

```
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
- [ ] **แนวทาง:** ใช้ Resilience4j เพื่อทำ Circuit Breaker ระหว่าง Core ↔ Redis, Core ↔ Kafka
- [ ] ป้องกันกรณี Redis ล่มแล้วทำให้ทั้งระบบค้าง (Cascading Failure)

### 4.5 Dockerfile Optimization
- [ ] **ปัญหา:** ปัจจุบัน Multi-stage แต่ไม่มี Layer caching และรัน App ด้วย Root user
- [ ] **แนวทาง:**
  - แยก `COPY pom.xml` → `RUN mvn dependency:go-offline` ก่อน COPY src (เพิ่ม Cache layer)
  - เพิ่ม Non-root user สำหรับ Runtime
  - ใส่ JVM Tuning flags (`-XX:+UseContainerSupport`, `-XX:MaxRAMPercentage=75`)

```dockerfile
# ✅ ปรับ Dockerfile
FROM eclipse-temurin:21-jre AS runtime
RUN addgroup --system app && adduser --system --ingroup app app
USER app
COPY --from=build /app/target/finance-service-*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

### 4.6 เพิ่ม OpenAPI Documentation
- [ ] **ปัญหา:** มี `springdoc-openapi` แต่ Controller ไม่มี `@Operation`, `@ApiResponse` annotations
- [ ] **แนวทาง:** เพิ่ม Swagger annotations เพื่อให้ API Docs สมบูรณ์

---

## 📊 สรุปจำนวนงาน

| Priority | จำนวน | สถานะ |
|----------|:-----:|:-----:|
| 🔴 Critical | 0 | `[ ]` รอทำ |
| 🟡 High | 3 | `[ ]` รอทำ |
| 🟢 Medium | 4 | `[ ]` รอทำ |
| 🔵 Nice-to-Have | 6 | `[ ]` รอทำ |
| **รวม** | **13** | |

---

## 💡 แนะนำลำดับการทำงาน

```
Phase 1 (สัปดาห์ 1-2)  → Priority 1 ทั้งหมด (Refactor WalletService, Constructor Injection, Entity Lombok)
Phase 2 (สัปดาห์ 3-4)  → Priority 2.2, 2.3, 2.4 (Fix Transaction ID, Config, JSON Safety)
Phase 3 (สัปดาห์ 5-6)  → Priority 2.1, 3.1, 3.2 (Interface, Validation, Integration Tests)
Phase 4 (สัปดาห์ 7-8)  → Priority 3.4-3.5 (Outbox Cleanup, Kafka Retry)
Phase 5 (สัปดาห์ 9+)   → Priority 4 (Hexagonal, Event Sourcing, Metrics, Circuit Breaker)
```
