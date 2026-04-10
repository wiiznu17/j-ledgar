# J-Ledger Plus: Enterprise Scale & Event-Driven Architecture
**Advanced Implementation Guide for Agentic AI (Phase 5)**

---

## 1. วิสัยทัศน์และการขยายระบบ (The 4 Pillars)
เพื่อให้ระบบนี้เป็น "Enterprise-Grade" อย่างแท้จริง นี่คือ 4 เสาหลักที่ต้องต่อยอดจาก J-Ledger รุ่นมาตรฐาน:

### 🚀 1. Redis Distributed Lock & Fast Idempotency
*   **ปัญหา:** การเช็ค Idempotency ใน Database สิ้นเปลือง Connection Pool และ Latency สูง
*   **โซลูชัน:** ใช้ Redis เป็น Fast Cache สำหรับ Idempotency และใช้ **Redisson** ทำ Distributed Lock เพื่อป้องกัน Race Condition ในระดับ Application ก่อนถึง Database (Fail-fast mechanism)

### 📡 2. Event-Driven Architecture
*   **ปัญหา:** ตาราง `integration_outbox` มีข้อมูลแต่ไม่มีกระบวนการส่งออกที่เป็นระบบ
*   **โซลูชัน:** ติดตั้ง **Apache Kafka** และสร้าง Background Worker เพื่อดึงข้อมูลจาก Outbox ไปกระจายให้ Service อื่นๆ (เช่น Notification, Reporting) อย่างเป็นทางการ

### ⚖️ 3. End-of-Day (EOD) Reconciliation
*   **ปัญหา:** แม้โค้ดจะถูกต้อง แต่ระบบบัญชีต้องมีการตรวจสอบซ้ำ (Double-check) เพื่อความโปร่งใส 100%
*   **โซลูชัน:** พัฒนา Automated Cron Job เพื่อตรวจสอบความถูกต้องระหว่างยอดคงเหลือใน `accounts` กับยอดรวมใน `ledger_entries` ทุกวัน หากพบความผิดปกติจะแจ้งเตือนทันที

### 📊 4. Observability & Distributed Tracing
*   **ปัญหา:** เมื่อระบบใหญ่ขึ้น การไล่ Log ในไฟล์ทำได้ยากและเสียเวลา
*   **โซลูชัน:** ติดตั้ง **Micrometer & Jaeger** เพื่อแทร็ก Request ตั้งแต่ต้นจนจบ เห็นคอขวดของประสิทธิภาพ (Database vs Cache) ได้ทันที

---

## 2. Phase Objective
ระบบเดิม (Phase 1-4) ทำงานได้ถูกต้องตามหลัก ACID แต่พึ่งพา PostgreSQL เพียงอย่างเดียว ใน Phase นี้เราจะอัปเกรดเพื่อรองรับการทำงานแบบ **Scale-Out** (รันหลาย Instance พร้อมกัน) โดยนำโครงสร้างพื้นฐานเหล่านี้เข้ามาเสริมแรง

---

## 3. Advanced Tech Stack Additions
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Distributed Lock** | Redisson (Redis Client) | ทำ Global Lock ข้าม Instance เพื่อป้องกันการแก้ไขข้อมูลบัญชีพร้อมกัน |
| **Message Broker** | Apache Kafka | กระจายข้อมูลธุรกรรมไปยัง Microservices อื่นๆ |
| **Scheduling** | Spring `@Scheduled` | จัดการงานเบื้องหลัง (Outbox Poller / EOD Job) |

---

## 4. Strict Implementation Rules (For AI Agent)

> [!IMPORTANT]
> **Rule 1: Redisson Distributed Lock**
> - ต้องทำการ Lock ทั้ง `fromAccountId` และ `toAccountId` ก่อนเริ่ม Transaction
> - **Anti-Deadlock:** ต้องเรียงลำดับ UUID (Sorting) ก่อนสั่ง Lock เสมอ
> - **Timeout:** หาก Lock ไม่สำเร็จภายใน 3 วินาที ให้โยน `ConcurrentOperationException` (HTTP 429 Too Many Requests)

> [!WARNING]
> **Rule 2: Redis-First Idempotency**
> - ห้ามเช็ค Idempotency ใน PostgreSQL ก่อนในจังหวะ Hot Path
> - ให้เช็คใน Redis ก่อนเสมอ หากเจอให้ Return ค่าเดิมทันทีเพื่อประสิทธิภาพสูงสุด

> [!TIP]
> **Rule 3: Transactional Outbox Pattern**
> - ข้อมูลใน Outbox ต้องถูกพ่นลง Kafka โดยมีสถานะกำกับ (`PENDING` -> `PROCESSED`)
> - ต้องรองรับ At-least-once delivery

---

## 5. Execution Roadmap

### Step 1: Maven Dependencies
เพิ่ม Library ที่จำเป็นลงใน `pom.xml`:

```xml
<dependencies>
    <!-- Redis & Distributed Locking -->
    <dependency>
        <groupId>org.redisson</groupId>
        <artifactId>redisson-spring-boot-starter</artifactId>
        <version>3.27.2</version>
    </dependency>
    <!-- Messaging -->
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
</dependencies>
```

### Step 2: Redis Infrastructure
สร้าง `RedisConfig.java` เพื่อตั้งค่าการเชื่อมต่อ `RedissonClient` (Default: `redis://localhost:6379`)

### Step 3: Upgrade TransferService (The Core Logic)
ปรับปรุง `TransferService.executeTransfer` เพื่อผสานพลังของ Redis Lock

#### Logic Flow Spec:
```java
public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
    // 1. Redis Idempotency Check (Fast fail)
    if (redisIdempotencyService.isProcessed(idempotencyKey)) {
        return redisIdempotencyService.getCachedResponse(idempotencyKey);
    }

    // 2. Prevent Deadlocks: Always lock the smaller UUID first
    String lock1 = getSmallerUUID(request.fromAccountId(), request.toAccountId());
    String lock2 = getLargerUUID(request.fromAccountId(), request.toAccountId());
    
    RLock firstLock = redissonClient.getLock("account_lock:" + lock1);
    RLock secondLock = redissonClient.getLock("account_lock:" + lock2);

    try {
        // Try to acquire locks (Wait up to 3 seconds)
        boolean isFirstLocked = firstLock.tryLock(3, 10, TimeUnit.SECONDS);
        boolean isSecondLocked = secondLock.tryLock(3, 10, TimeUnit.SECONDS);

        if (!isFirstLocked || !isSecondLocked) {
            throw new ConcurrentOperationException("System busy, please try again.");
        }

        // 3. EXECUTE CORE TRANSACTION (Existing @Transactional logic)
        Transaction tx = databaseTransactionService.performTransferInDB(request);

        // 4. Cache successful idempotency key in Redis (TTL: 24 Hours)
        redisIdempotencyService.cacheResponse(idempotencyKey, tx);
        
        return tx;

    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("Transfer interrupted", e);
    } finally {
        if (firstLock.isHeldByCurrentThread()) firstLock.unlock();
        if (secondLock.isHeldByCurrentThread()) secondLock.unlock();
    }
}
```

### Step 4: Outbox Processor
สร้าง `OutboxProcessor.java` โดยใช้ `@Scheduled(fixedDelay = 2000)` เพื่อ:
1. ดึงข้อมูล `PENDING` จาก `integration_outbox`
2. ส่งข้อมูลผ่าน `KafkaTemplate`
3. อัปเดตสถานะเป็น `PROCESSED`

### Step 5: Verification & Deployment
- อัปเดต `docker-compose.yml` ให้รองรับ Kafka & Zookeeper
- ตรวจสอบความถูกต้องของ Message Flow ใน Kafka และการทำงานของ Redis Locks