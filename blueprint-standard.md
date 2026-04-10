# J-Ledger: High-Performance Financial Core
**Project Blueprint & Implementation Guide for Agentic AI**

---

## 1. Project Overview
**J-Ledger** คือระบบ Core Ledger Service และ Payment Engine เบื้องหลังที่ทำหน้าที่จัดการบัญชีกระเป๋าเงินอิเล็กทรอนิกส์ (e-Wallet) และบันทึกธุรกรรมทางการเงิน ระบบนี้ออกแบบมาเพื่อแก้ปัญหาความถูกต้องของข้อมูล (Data Integrity) การทำงานพร้อมกัน (Concurrency) และความปลอดภัยระดับสูงตามมาตรฐานของสถาบันการเงิน

**เป้าหมายหลัก:**
* รับประกันความถูกต้องของยอดเงินทุกสตางค์ด้วยระบบบัญชีคู่ (Double-Entry Bookkeeping)
* รองรับการทำธุรกรรมที่มีความพร้อมใช้งานสูงและไม่เกิดข้อผิดพลาดเมื่อเกิดปัญหาเครือข่าย
* มีระบบตรวจสอบย้อนกลับ (Auditability) ที่โปร่งใส 100%

---

## 2. Tech Stack & Infrastructure

| Component | Technology | Reason for Production |
| :--- | :--- | :--- |
| **Language** | Java 21 | มี Virtual Threads ช่วยจัดการ Concurrency ได้มหาศาล และมีความเข้มงวดเรื่อง Type |
| **Framework** | Spring Boot 3.x | มาตรฐานอุตสาหกรรม (Enterprise Standard) มี Ecosystem ที่พร้อมที่สุด |
| **Primary Database** | PostgreSQL | รองรับ ACID Transactions แข็งแกร่งที่สุด เหมาะกับข้อมูลการเงิน |
| **In-Memory Cache** | Redis | จัดการ Idempotency Key และทำ Distributed Lock |
| **Data Access** | Spring Data JPA / Hibernate | จัดการ Entity และ Optimistic Locking (`@Version`) |
| **Testing** | JUnit 5 + Testcontainers | จำลอง Database จริงขณะรัน Test เพื่อให้มั่นใจใน Data Integrity |
| **API Docs** | Springdoc OpenAPI (Swagger) | สร้าง Document อัตโนมัติจาก Code |
| **Build Tool** | Maven หรือ Gradle | จัดการ Dependencies อย่างเป็นระบบ |

---

## 3. Core Features

1. **Wallet & Account Management:** สร้างบัญชี, กำหนดสกุลเงิน, และเรียกดูยอดคงเหลือแบบ Real-time
2. **Double-Entry Transaction Engine:** ระบบโอนเงิน เติมเงิน ถอนเงิน ที่บันทึกขาเข้า-ขาออกของเงินเสมอ (Debit = Credit)
3. **Idempotent API:** ระบบป้องกันการตัดเงินซ้ำซ้อน หากมีการส่ง Request เดิมเข้ามาซ้ำ (เช่น Network timeout หรือผู้ใช้กดเบิ้ล)
4. **Concurrency Control:** ป้องกัน Race Condition เมื่อมีการโอนเงินเข้า-ออกบัญชีเดียวกันในเสี้ยววินาทีเดียวกัน
5. **Audit Trail & Logs:** บันทึกประวัติการเปลี่ยนสถานะทุกขั้นตอน เพื่อใช้ในการกระทบยอด (Reconciliation)

---

## 4. Database Schema Requirements

ระบบจะประกอบด้วย 5 ตารางหลักใน PostgreSQL:

* **`accounts`**: เก็บข้อมูลกระเป๋าเงิน
  * `id` (UUID), `user_id` (UUID), `balance` (DECIMAL(20,4)), `currency` (VARCHAR), `status` (VARCHAR), `version` (INTEGER - สำหรับ Locking)
* **`transactions`**: เก็บหัวรายการทำธุรกรรม
  * `id` (UUID), `idempotency_key` (VARCHAR - UNIQUE), `type` (VARCHAR - transfer/deposit), `amount` (DECIMAL), `status` (VARCHAR)
* **`ledger_entries`**: เก็บรายละเอียดสมุดบัญชีแยกประเภท (ต้องเกิดเป็นคู่เสมอ)
  * `id` (UUID), `transaction_id` (UUID), `account_id` (UUID), `entry_type` (VARCHAR - debit/credit), `amount` (DECIMAL)
* **`transaction_logs`**: เก็บประวัติการเปลี่ยนสถานะ
  * `id` (UUID), `transaction_id` (UUID), `from_status` (VARCHAR), `to_status` (VARCHAR)
* **`integration_outbox`**: เก็บ Event ที่รอส่งออกไปแจ้งเตือน
  * `id` (UUID), `event_type` (VARCHAR), `payload` (JSONB), `status` (VARCHAR)

---

## 5. API Design (RESTful Endpoints)

### Account API
* `POST /api/v1/accounts` - สร้างบัญชีใหม่
* `GET /api/v1/accounts/{accountId}/balance` - เช็คยอดเงินปัจจุบัน
* `GET /api/v1/accounts/{accountId}/statements` - ดูประวัติการเดินบัญชี (Ledger entries)

### Transaction API
* `POST /api/v1/transactions/transfer` - โอนเงินระหว่างบัญชี
  * **Headers:** `Idempotency-Key` (Required)
  * **Body:** `{ "fromAccountId": "...", "toAccountId": "...", "amount": 500.00, "currency": "THB" }`

### System API
* `GET /api/v1/admin/reconcile` - ตรวจสอบความสมดุลของบัญชีทั้งหมด (Sum Debit == Sum Credit)

---

## 6. The "Must-Know" Concepts (Strict Rules for AI Agent)

Agentic AI MUST strictly follow these rules when generating or modifying code:

1. **NO Float or Double:** * **Rule:** NEVER use `float` or `double` for monetary values.
   * **Implementation:** Use `BigDecimal` in Java and `DECIMAL(20, 4)` in PostgreSQL.
2. **Idempotency Rule:**
   * **Rule:** API must return the cached/previous successful response if the same `Idempotency-Key` is received. NEVER process the exact same transaction twice.
3. **Concurrency Control (Optimistic Locking):**
   * **Rule:** Prevent Race Conditions.
   * **Implementation:** The `accounts` table must have a `@Version Integer version` column. JPA will throw `ObjectOptimisticLockingFailureException` on conflict.
4. **Atomic Transactions:**
   * **Rule:** Database changes (`transactions`, `ledger_entries`, `accounts`) must be fully committed or fully rolled back.
   * **Implementation:** Wrap the core business logic in `@Transactional`.

---

## 7. Implementation Roadmap

* **Phase 1: Foundation:** Setup Spring Boot + PostgreSQL + Flyway/Liquibase. Create Entities with `BigDecimal`.
* **Phase 2: The Engine:** Implement `TransferService` with `@Transactional` and Double-entry Ledger records.
* **Phase 3: Resiliency:** Implement Idempotency check, Optimistic Locking exception handling, and concurrent testing (100 threads).
* **Phase 4: Polish:** Implement Transactional Outbox Pattern, OpenAPI Swagger docs, and Controller layer.

---

## 8. Source Code Blueprints

### 8.1 Domain Entities

**Account.java**
```java
package com.jledger.core.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    // Strict Rule: Use BigDecimal for precision
    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal balance;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 20)
    private String status;

    // Strict Rule: Optimistic Locking
    @Version
    @Column(nullable = false)
    private Integer version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
```

**Transaction.java**
```java
package com.jledger.core.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Strict Rule: Idempotency Key to prevent duplicate processing
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType; // TRANSFER, DEPOSIT, WITHDRAW

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, SUCCESS, FAILED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
```

**LedgerEntry.java**
```java
package com.jledger.core.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "entry_type", nullable = false, length = 10)
    private String entryType; // DEBIT or CREDIT

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal amount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
```

### 8.2 Data Transfer Object (DTO)

**TransferRequest.java**
```java
package com.jledger.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record TransferRequest(
    @NotNull(message = "From Account ID is required")
    UUID fromAccountId,
    
    @NotNull(message = "To Account ID is required")
    UUID toAccountId,
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be greater than zero")
    BigDecimal amount,
    
    @NotBlank(message = "Currency is required")
    String currency
) {}
```

### 8.3 Repository Interfaces

**AccountRepository.java**
```java
package com.jledger.core.repository;

import com.jledger.core.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
}
```

**TransactionRepository.java**
```java
package com.jledger.core.repository;

import com.jledger.core.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
}
```

**LedgerEntryRepository.java**
```java
package com.jledger.core.repository;

import com.jledger.core.domain.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
}
```

### 8.4 Business Logic Service

**TransferService.java**
```java
package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional
    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        
        // 1. Idempotency Check
        var existingTransaction = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existingTransaction.isPresent()) {
            return existingTransaction.get();
        }

        // 2. Fetch Accounts
        Account sender = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid sender account"));
        
        Account receiver = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid receiver account"));

        // 3. Business Validation
        validateTransfer(request, sender, receiver);

        // 4. Update Balances (Relies on JPA Dirty Checking & @Version)
        sender.setBalance(sender.getBalance().subtract(request.amount()));
        receiver.setBalance(receiver.getBalance().add(request.amount()));

        // 5. Create Transaction Record
        Transaction transaction = Transaction.builder()
                .idempotencyKey(idempotencyKey)
                .transactionType("TRANSFER")
                .amount(request.amount())
                .currency(request.currency())
                .status("SUCCESS")
                .build();
        transaction = transactionRepository.save(transaction);

        // 6. Create Ledger Entries (Double-Entry)
        LedgerEntry senderEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(sender)
                .entryType("CREDIT")
                .amount(request.amount())
                .build();

        LedgerEntry receiverEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(receiver)
                .entryType("DEBIT")
                .amount(request.amount())
                .build();

        ledgerEntryRepository.saveAll(List.of(senderEntry, receiverEntry));

        return transaction;
    }

    private void validateTransfer(TransferRequest request, Account sender, Account receiver) {
        if (!sender.getCurrency().equals(request.currency()) || !receiver.getCurrency().equals(request.currency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        if (sender.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalStateException("Insufficient balance");
        }
        if (sender.getStatus().equals("FROZEN") || receiver.getStatus().equals("FROZEN")) {
            throw new IllegalStateException("Account is frozen");
        }
    }
}
```

### 8.5 API Controller & OpenAPI Specs (Swagger)

**TransactionController.java**
```java
package com.jledger.core.controller;

import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction API", description = "Endpoints for managing financial transactions")
public class TransactionController {

    private final TransferService transferService;

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money", description = "Executes a double-entry money transfer between two accounts. Requires an Idempotency-Key header to prevent duplicate charges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transfer successful or idempotency key matched"),
            @ApiResponse(responseCode = "400", description = "Invalid request or insufficient balance"),
            @ApiResponse(responseCode = "409", description = "Conflict due to concurrent update (Optimistic Locking failure). Client should retry.")
    })
    public ResponseEntity<Transaction> transfer(
            @RequestHeader(value = "Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {
        
        Transaction transaction = transferService.executeTransfer(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }
}
```

### 8.6 Integration Testing (Concurrency & Optimistic Locking)

**TransferServiceConcurrencyTest.java**
```java
package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class TransferServiceConcurrencyTest {

    @Autowired
    private TransferService transferService;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    public void testConcurrentTransfersThrowsOptimisticLockingException() throws InterruptedException {
        // Setup: Create two accounts
        Account sender = accountRepository.save(Account.builder()
                .accountName("Sender")
                .balance(new BigDecimal("1000.0000"))
                .currency("THB")
                .status("ACTIVE")
                .version(0)
                .build());

        Account receiver = accountRepository.save(Account.builder()
                .accountName("Receiver")
                .balance(new BigDecimal("0.0000"))
                .currency("THB")
                .status("ACTIVE")
                .version(0)
                .build());

        // Prepare concurrent requests
        int threadCount = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1); // Start all threads at exactly the same time
        CountDownLatch doneLatch = new CountDownLatch(threadCount); // Wait for all threads to finish

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        Runnable transferTask = () -> {
            try {
                latch.await(); // Wait for the green light
                TransferRequest req = new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB");
                // Generating a unique idempotency key for each thread to force concurrent balance update
                transferService.executeTransfer(UUID.randomUUID().toString(), req);
                successCount.incrementAndGet();
            } catch (ObjectOptimisticLockingFailureException e) {
                failCount.incrementAndGet(); // This is the EXPECTED exception for the slower thread
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                doneLatch.countDown();
            }
        };

        // Submit tasks
        for (int i = 0; i < threadCount; i++) {
            executorService.submit(transferTask);
        }

        // Action: Start threads simultaneously
        latch.countDown();
        doneLatch.await(); // Wait until all are done

        // Assertions
        // 1. Only ONE thread should succeed in updating the version first.
        assertEquals(1, successCount.get());
        
        // 2. The other thread MUST fail with OptimisticLocking failure.
        assertEquals(1, failCount.get());

        // 3. Sender balance must be exactly 900, not 800 (prevented double spending).
        Account updatedSender = accountRepository.findById(sender.getId()).get();
        assertEquals(new BigDecimal("900.0000"), updatedSender.getBalance());
    }
}
```

---

## 9. Core Mechanisms Explained (For Agent Context)

* **JPA Dirty Checking:** In `TransferService.java`, the explicit call to `accountRepository.save()` is omitted for balance updates. Because the method is annotated with `@Transactional`, Spring Data JPA tracks changes to the `Account` entities. Upon successful execution, it automatically generates the UPDATE SQL statements before committing.

* **Optimistic Locking Execution:** If Thread A and Thread B attempt to process a transfer from the same account simultaneously, both read `version = 1`. When Thread A completes, the database updates to `version = 2`. When Thread B attempts its update, the version mismatch triggers `ObjectOptimisticLockingFailureException`, preventing a race condition and ensuring balance integrity. The test suite in `TransferServiceConcurrencyTest` is designed specifically to enforce and verify this behavior.