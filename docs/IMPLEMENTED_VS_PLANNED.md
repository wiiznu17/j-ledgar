# 📊 J-Ledger Capabilities: Implemented vs. Planned 🏦

> **เอกสารวิเคราะห์สถานะปัจจุบันระบบ J-Ledger (Implemented vs. Planned) สำหรับใช้พัฒนาต่อ**
> เอกสารฉบับนี้วิเคราะห์ลงลึกถึงโค้ดจริงในโครงการ เพื่อแยกแยะว่าโมดูลใดสามารถใช้งานได้จริงแล้ว (Implemented) และโมดูลใดที่โค้ดพร้อมทำหน้าที่แล้วแต่ยังไม่ได้เชื่อมต่อเข้ากับระบบการทำธุรกรรมหลัก (Planned) พร้อมแนะแนวทางและโครงสร้างโค้ด (Template) สำหรับนักพัฒนาเพื่อนำไปพัฒนาและเชื่อมต่อระบบต่อยอดได้ทันที

---

## 📌 1. แดชบอร์ดสรุปสถานะการทำงานปัจจุบัน (Overview Dashboard)

| Component | Sub-Component / Feature | Target File | Status | Notes / How to Wire Up |
| :--- | :--- | :--- | :--- | :--- |
| **Transaction Engine** | Idempotency Key (Redis) | `TransferService.java` | **✅ Implemented** | ตรวจสอบและบันทึก Idempotency key ใน Redis เรียบร้อยแล้ว |
| **Transaction Engine** | Lexicographical Locking | `TransferService.java` | **✅ Implemented** | เรียงลำดับ ID ป้องกัน Circular Wait Deadlock ที่ Redis Layer |
| **Transaction Engine** | Row Locking (PostgreSQL) | `WalletService.java` | **✅ Implemented** | ทำ `SELECT ... FOR UPDATE` ตามลำดับ ID ในฐานข้อมูล |
| **Transaction Engine** | Double-Entry Bookkeeping | `WalletService.java` | **✅ Implemented** | บันทึกขาสรุปการบัญชี DEBIT & CREDIT เสมอ |
| **Transaction Engine** | Integration Outbox Pattern | `WalletService.java` / `OutboxProcessor.java` | **✅ Implemented** | บันทึก Event ลง Outbox Table และใช้ Poller ดึงส่งไป Kafka |
| **Compliance System** | KYC Compliance Pre-check | `KycComplianceService.java` | **⚠️ Planned / Code Ready** | โค้ดเสร็จแล้ว (ตรวจ KYC status & review expiry) แต่**ยังไม่ได้เรียกใช้**จาก Transfer Flow |
| **Compliance System** | Transaction Limits | `TransactionLimitService.java` | **⚠️ Planned / Code Ready** | โค้ดเสร็จแล้ว (ตรวจและบันทึก Daily/Monthly Limit) แต่**ยังไม่ได้เรียกใช้** |
| **Compliance System** | Rate Limiting (Redis) | `TransactionRateLimitService.java` | **⚠️ Planned / Code Ready** | โค้ดเสร็จแล้ว (Rate Limit: Minute, Hour, Day) แต่**ยังไม่ได้เรียกใช้** |
| **Compliance System** | Account Freezing | `AccountFreezeService.java` | **⚠️ Planned / Code Ready** | มีโค้ดสำหรับการ Freeze / Unfreeze กระเป๋าเงินผู้ใช้ แต่ยังไม่ได้ต่อกับระบบตรวจสอบ AML อัตโนมัติ |
| **AML & Fraud Detection**| Real-Time AML Monitoring | `AmlMonitoringService.java` | **⚠️ Planned / Code Ready** | โค้ดเสร็จแล้ว (ตรวจขนาดธุรกรรม ความถี่ พฤติกรรมต้องสงสัย) แต่ยังไม่มีตัวสตรีม Event จาก Kafka มาตรวจจับ |
| **AML & Fraud Detection**| Fraud Pattern Detection | `FraudPatternDetectionService.java` | **⚠️ Planned / Code Ready** | โค้ดเสร็จแล้ว (ตรวจ Structuring, Layering, Integration, Cash-out) แต่ยังไม่ได้ต่อเข้ากับ Worker |
| **Treasury & Solvency** | System Balance Reconciliation | `ReconciliationService.java` | **✅ Implemented** | ระบบตรวจสอบดุลบัญชี (Assets - Liabilities = 0) รันผ่าน Scheduled Job ทุกเที่ยงคืน |

---

## 🕵️ 2. เจาะลึกระบบตรวจสอบความปลอดภัย (Compliance Services) และวิธีพัฒนาต่อ

ทุกระบบใน Compliance Layer มี Class Java ที่รองรับการทำงานไว้ครบถ้วนสมบูรณ์แล้วในโฟลเดอร์ `j-ledger-core/finance-service/src/main/java/com/jledger/finance/service/compliance/` แต่ **ยังไม่ได้ถูก Inject หรือเรียกใช้** ในการโอนเงินจริงที่ `TransferService.java`

นี่คือวิธีและตำแหน่งในการเชื่อมต่อบริการเหล่านี้เข้ากับระบบทำธุรกรรม:

### 2.1 KYC Compliance (`KycComplianceService.java`)
*   **สถานะปัจจุบัน:** ตรวจสอบได้ว่าผู้ใช้ได้รับการอนุมัติ KYC หรือไม่ และใบอนุญาตหมดอายุรอบปีหรือยัง
*   **วิธีเชื่อมต่อ:** ควรตรวจสอบเป็นลำดับแรกสุดใน `TransferService` (ก่อนการจอง Lock ใน Redis เพื่อไม่ให้ระบบเสียทรัพยากรไปกับการจอง Lock ของผู้ใช้ที่โอนไม่ได้)

### 2.2 Transaction Limits (`TransactionLimitService.java`)
*   **สถานะปัจจุบัน:** ตรวจสอบได้ว่าเงินที่โอนในครั้งนี้ หรือยอดรวมรายวัน/รายเดือน เกินขีดจำกัดหรือไม่ พร้อมอัปเดตยอดสะสม
*   **วิธีเชื่อมต่อ:** 
    1.  เรียกใช้ฟังก์ชันตรวจข้อจำกัด (Pre-check) ก่อนกระบวนการโอน
    2.  อัปเดตยอดโอนสะสมจริงหลังธุรกรรมผ่านพ้นจุด COMMIT สำเร็จแล้ว

### 2.3 Transaction Rate Limiting (`TransactionRateLimitService.java`)
*   **สถานะปัจจุบัน:** ตรวจสอบและบันทึกความถี่การส่งคำขอโอนเงินของผู้ใช้ผ่าน Redis (จำกัดจำนวนครั้งต่อนาที/ชั่วโมง/วัน เพื่อป้องกัน API Abuse และ Double Spending)
*   **วิธีเชื่อมต่อ:** ตรวจก่อนทำกระบวนการโอนทั้งหมด และหากผ่านให้ไปรันกระบวนการจองล็อก

---

## 🛠️ 3. แผนการแก้ไขโค้ด `TransferService.java` เพื่อเชื่อมต่อ Compliance (Wiring Roadmap)

นี่คือพิมพ์เขียวการแก้ไขคลาส `TransferService.java` เพื่อให้ **KYC, Limits และ Rate Limit** ทำงานร่วมกับการโอนเงินจริง:

```java
package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.TransferRequest;
import com.jledger.finance.exception.ConcurrentOperationException;
import com.jledger.finance.service.system.RedisIdempotencyService;
// Inject Compliance Services เพิ่มเติม
import com.jledger.finance.service.compliance.KycComplianceService;
import com.jledger.finance.service.compliance.TransactionLimitService;
import com.jledger.finance.service.compliance.TransactionRateLimitService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final RedissonClient redissonClient;
    private final RedisIdempotencyService redisIdempotencyService;
    private final WalletService walletService;
    
    // 1. เพิ่มการ Inject Compliance Services
    private final KycComplianceService kycComplianceService;
    private final TransactionLimitService transactionLimitService;
    private final TransactionRateLimitService transactionRateLimitService;

    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        validateIdempotencyKey(idempotencyKey);
        validateTransferRequest(request);

        // A. ตรวจสอบ Idempotency
        return redisIdempotencyService.getIfProcessed(idempotencyKey)
                .orElseGet(() -> {
                    BigDecimal normalizedAmount = normalizeAmount(request.amount());
                    
                    // แปลง String เป็น UUID สำหรับตรวจสอบบัญชีฝั่ง Ledger
                    UUID senderAccountId = UUID.fromString(request.fromAccountId());

                    // 2. [PLANNED] ขั้นตอนตรวจสอบ Compliance (ก่อนทำ Lock)
                    // B. ตรวจสอบ Rate Limiting ป้องกันการกระหน่ำกดโอนซ้ำซ้อน
                    transactionRateLimitService.checkRateLimit(senderAccountId);

                    // C. ตรวจสอบ KYC ของผู้โอนเงิน
                    kycComplianceService.checkKycCompliance(senderAccountId);

                    // D. ตรวจสอบข้อจำกัดยอดเงินโอนรายวัน/รายเดือน
                    transactionLimitService.checkTransactionLimits(senderAccountId, normalizedAmount);

                    // E. กระบวนการจองล็อกล็อกตามลำดับ (Lexicographical Locking)
                    String firstAccountId = request.fromAccountId().compareTo(request.toAccountId()) <= 0 
                            ? request.fromAccountId() : request.toAccountId();
                    String secondAccountId = request.fromAccountId().compareTo(request.toAccountId()) <= 0 
                            ? request.toAccountId() : request.fromAccountId();

                    RLock firstLock = redissonClient.getLock("account_lock:" + firstAccountId);
                    RLock secondLock = redissonClient.getLock("account_lock:" + secondAccountId);

                    boolean firstLocked = false;
                    boolean secondLocked = false;
                    try {
                        firstLocked = firstLock.tryLock(3, 10, TimeUnit.SECONDS);
                        if (!firstLocked) throw new ConcurrentOperationException("System busy, please try again.");

                        secondLocked = secondLock.tryLock(3, 10, TimeUnit.SECONDS);
                        if (!secondLocked) throw new ConcurrentOperationException("System busy, please try again.");

                        // F. ทำการหักเงินระดับ Database และจดบัญชีคู่ (Double-entry)
                        Transaction transaction = walletService.transferByWalletId(
                            request.fromAccountId(),
                            request.toAccountId(),
                            normalizedAmount,
                            request.metadata()
                        );

                        // G. [PLANNED] บันทึกยอดเงินสะสมสำหรับการใช้ตรวจสอบ Limit ในครั้งถัดไป
                        transactionLimitService.recordTransaction(senderAccountId, normalizedAmount);

                        // H. บันทึกผลลัพธ์ลง Redis Idempotency Cache
                        redisIdempotencyService.cacheResponse(idempotencyKey, transaction);
                        
                        return transaction;
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                        throw new ConcurrentOperationException("Transfer interrupted while waiting for lock", exception);
                    } finally {
                        if (secondLocked && secondLock.isHeldByCurrentThread()) secondLock.unlock();
                        if (firstLocked && firstLock.isHeldByCurrentThread()) firstLock.unlock();
                    }
                });
    }
    // ... ฟังก์ชัน validate และ normalize คงเดิม
}
```

---

## ⚡ 4. แผนพัฒนาระบบตรวจสอบกิจกรรมทางการเงินต้องสงสัย (AML & Fraud Asynchronous Consumer)

ในสถาปัตยกรรมระดับ Production การรัน AML และ Fraud Detection ไม่ควรเอาไปขวางทางธุรกรรมโอนเงินสดโดยตรง (เนื่องจากต้องดึงข้อมูลย้อนหลังเยอะ และใช้ความเร็วค่อนข้างสูง) 

ระบบปัจจุบันมี **Integration Outbox Pattern** และ **OutboxProcessor** ทำงานโดยส่งข้อมูลธุรกรรมไปที่ Kafka Topic `financial-events-v1` เรียบร้อยแล้ว! 

### แผนงานพัฒนาส่วนนี้ต่อ (How to implement AML Event Consumer)
นักพัฒนาสามารถสร้างคลาสตรวจรับ Event (Kafka Listener) ดังกล่าวในระบบเพื่อไปทริกเกอร์ `AmlMonitoringService` และ `FraudPatternDetectionService` แบบ Asynchronous ได้ดังนี้:

```java
package com.jledger.finance.service.compliance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.dto.TransactionEventPayload; // สร้าง DTO เพิ่มเติมสำหรับแมปข้อมูล
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmlEventConsumer {

    private final AmlMonitoringService amlMonitoringService;
    private final FraudPatternDetectionService fraudPatternDetectionService;
    private final AccountFreezeService accountFreezeService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "${jledger.outbox.topic:financial-events-v1}",
        groupId = "aml-monitoring-group"
    )
    public void consumeTransactionEvent(String message) {
        try {
            log.info("Received event for AML scanning: {}", message);
            TransactionEventPayload payload = objectMapper.readValue(message, TransactionEventPayload.class);
            
            if (!"TRANSFER".equals(payload.getEventType())) {
                return; // สแกนเฉพาะรายการที่เป็นการโอน
            }

            // 1. รันการตรวจสอบ AML พื้นฐาน (ยอดใหญ่, ความถี่, โอนกระจาย)
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                payload.getFromWalletId(),
                payload.getAmount(),
                payload.getTransactionId(),
                payload.getToWalletId()
            );

            // 2. รันการสแกนรูปแบบฟรอดแบบซับซ้อน (Structuring/Layering/Integration)
            fraudPatternDetectionService.detectAllPatterns(payload.getFromWalletId());
            
            // 💡 แผนต่อยอด: หากมีพฤติกรรมเสี่ยงสูง (Risk Score >= 90) สามารถทริกเกอร์ออโต้ฟรีสได้
            // if (riskScore >= 90) {
            //     accountFreezeService.freezeAccountDueToSuspiciousActivity(payload.getFromWalletId(), activityId);
            // }

        } catch (Exception exception) {
            log.error("Failed to scan transaction for AML", exception);
        }
    }
}
```

---

## 🛡️ 5. ขั้นตอนสำหรับทดสอบ (Testing Verification Plan)

หลังจากนักพัฒนาเชื่อมต่อสายบริการต่าง ๆ แล้ว ควรทดสอบกลไกป้องกันแต่ละแบบดังนี้:

1.  **ทดสอบ KYC Failure:**
    *   สร้างบัญชีใหม่ที่ไม่ได้ส่งเอกสาร KYC หรือแก้ไขสถานะในฐานข้อมูลเป็น `PENDING`
    *   ยิงคำขอโอนเงิน → ผลลัพธ์ต้องโดนบล็อกและโยน `ConflictException` ทันทีตั้งแต่ด่านแรก
2.  **ทดสอบ Rate Limiting:**
    *   เขียน Script ด้วย Python หรือยิง JMeter ถี่ ๆ ใส่ API `/api/v1/transfers` ติดต่อกัน 15 ครั้งในเวลาต่ำกว่า 10 วินาที
    *   ธุรกรรมที่ 11 ขึ้นไปต้องถูกบล็อกด้วยสถานะ `Transaction rate limit exceeded`
3.  **ทดสอบ Over Limit:**
    *   โอนเงินจำนวน 100,000 THB ถี่ ๆ ติดต่อกัน 6 ครั้งจนมียอดรวมสะสมเกิน Daily Limit ของกระเป๋าเงิน
    *   ธุรกรรมถัดไปต้องล้มเหลวและแจ้งปัญหาเรื่อง Daily Limit ชัดเจน
4.  **ทดสอบการแจ้งเตือนพฤติกรรมต้องสงสัย (AML Check):**
    *   โอนเงินจำนวน 150,000 THB (เกินขีดจำกัด 100,000 THB ของ AML)
    *   ไปตรวจสอบในตารางฐานข้อมูล `suspicious_activity` → ต้องพบคอร์ดถูกบันทึกด้วยชนิด `LARGE_TRANSACTION` และมี Risk Score ทันที
