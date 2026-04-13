package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConcurrentOperationException;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = "jledger.outbox.initial-delay-ms=600000")
@Testcontainers
class TransferServiceConcurrencyTest {

    @Container
    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Container
    @SuppressWarnings("resource")
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @Autowired
    private TransferService transferService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private IntegrationOutboxRepository integrationOutboxRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
        registry.add("spring.flyway.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRESQL::getUsername);
        registry.add("spring.flyway.password", POSTGRESQL::getPassword);
        registry.add("jledger.redis.address", () -> "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379));
        registry.add("jledger.redis.password", () -> "");
    }

    @BeforeEach
    void cleanDatabase() {
        integrationOutboxRepository.deleteAllInBatch();
        ledgerEntryRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();
    }

    private Account createAccount(String name, String balance) {
        return accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName(name)
                .balance(new BigDecimal(balance))
                .currency("THB")
                .status("ACTIVE")
                .build());
    }

    // -----------------------------------------------------------------------------------------------------------------
    // 1. DISTRIBUTED LOCK TEST
    // -----------------------------------------------------------------------------------------------------------------
    @Test
    void testDistributedLock_10ConcurrentRequests_OnlyOneSucceeds() throws InterruptedException {
        Account sender = createAccount("Sender", "1000.0000");
        Account receiver = createAccount("Receiver", "0.0000");

        int threadCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);
        AtomicReference<Throwable> unexpectedFailure = new AtomicReference<>();

        Runnable transferTask = () -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                TransferRequest request = new TransferRequest(
                        sender.getId(),
                        receiver.getId(),
                        new BigDecimal("1000.0000"),
                        "THB"
                );
                // Each request acts as a separate idempotent call to force full lock contention simulation
                transferService.executeTransfer(UUID.randomUUID().toString(), request);
                successCount.incrementAndGet();
            } catch (ConflictException | ConcurrentOperationException exception) {
                rejectedCount.incrementAndGet();
            } catch (Exception exception) {
                unexpectedFailure.compareAndSet(null, exception);
            } finally {
                doneLatch.countDown();
            }
        };

        for (int index = 0; index < threadCount; index++) {
            executorService.submit(transferTask);
        }

        readyLatch.await();
        startLatch.countDown();
        assertTrue(doneLatch.await(15, TimeUnit.SECONDS));
        executorService.shutdown();
        assertTrue(executorService.awaitTermination(5, TimeUnit.SECONDS));

        assertNull(unexpectedFailure.get(), "Unexpected failure during concurrent transfer execution");
        
        // Assert exactly 1 succeeds and 9 fail
        assertEquals(1, successCount.get());
        assertEquals(9, rejectedCount.get());
        
        assertEquals(1L, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count());
        assertEquals(1L, integrationOutboxRepository.count());

        Account updatedSender = accountRepository.findById(sender.getId()).orElseThrow();
        Account updatedReceiver = accountRepository.findById(receiver.getId()).orElseThrow();

        assertEquals(0, new BigDecimal("0.0000").compareTo(updatedSender.getBalance()));
        assertEquals(0, new BigDecimal("1000.0000").compareTo(updatedReceiver.getBalance()));
    }

    // -----------------------------------------------------------------------------------------------------------------
    // 2. IDEMPOTENCY CACHE TEST
    // -----------------------------------------------------------------------------------------------------------------
    @Test
    void testIdempotencyCache_ReturnsFromRedisWithoutHittingDb() {
        Account sender = createAccount("Sender", "1000.0000");
        Account receiver = createAccount("Receiver", "0.0000");
        
        String idempotencyKey = UUID.randomUUID().toString();
        TransferRequest request = new TransferRequest(
                sender.getId(),
                receiver.getId(),
                new BigDecimal("300.0000"),
                "THB"
        );

        // First Execution (hits DB & Locks)
        Transaction firstResponse = transferService.executeTransfer(idempotencyKey, request);
        long initialDbTransactionCount = transactionRepository.count();
        assertEquals(1L, initialDbTransactionCount);

        // Second Execution (Should hit Redis ONLY)
        Transaction cachedResponse = transferService.executeTransfer(idempotencyKey, request);

        // Assert values perfectly align using the cached retrieval logic
        assertEquals(firstResponse.getId(), cachedResponse.getId());
        assertEquals(firstResponse.getStatus(), cachedResponse.getStatus());
        assertEquals(0, firstResponse.getAmount().compareTo(cachedResponse.getAmount()));
        
        // Ensure Database load count did not increase (Bypassed the Database logic entirely!)
        assertEquals(initialDbTransactionCount, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count()); // Still only 2 entries (one debit, one credit)
    }

    // -----------------------------------------------------------------------------------------------------------------
    // 3. OUTBOX INTEGRATION TEST
    // -----------------------------------------------------------------------------------------------------------------
    @Test
    void testOutboxIntegration_CreatesOutboxRecordInSameDbTransaction() {
        Account sender = createAccount("Sender", "500.0000");
        Account receiver = createAccount("Receiver", "250.0000");
        
        String idempotencyKey = UUID.randomUUID().toString();
        TransferRequest request = new TransferRequest(
                sender.getId(),
                receiver.getId(),
                new BigDecimal("100.0000"),
                "THB"
        );

        // Execute Transfer
        Transaction transaction = transferService.executeTransfer(idempotencyKey, request);

        // Outbox event should be generated within the same precise boundary context
        assertEquals(1L, integrationOutboxRepository.count());
        
        IntegrationOutbox outboxRecord = integrationOutboxRepository.findAll().get(0);
        
        assertNotNull(outboxRecord.getId());
        assertNotNull(outboxRecord.getEventType());
        assertTrue(outboxRecord.getPayload().toString().contains(transaction.getId().toString()), "Outbox payload must contain the transaction ID.");
    }
}
