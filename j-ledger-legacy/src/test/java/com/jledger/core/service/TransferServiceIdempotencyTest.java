package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class TransferServiceIdempotencyTest {

    @Container
    @SuppressWarnings("resource")  // Lifecycle managed by @Testcontainers JUnit extension
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Autowired
    private TransferService transferService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
        registry.add("spring.flyway.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRESQL::getUsername);
        registry.add("spring.flyway.password", POSTGRESQL::getPassword);
    }

    @BeforeEach
    void cleanDatabase() {
        ledgerEntryRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();
    }

    @Test
    void sameIdempotencyKeyReturnsExistingTransactionWithoutDoublePosting() {
        Account sender = createAccount("Sender", "1000.0000");
        Account receiver = createAccount("Receiver", "0.0000");
        TransferRequest request = new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB");

        Transaction firstTransaction = transferService.executeTransfer("same-key", request);
        Transaction replayedTransaction = transferService.executeTransfer("same-key", request);

        assertEquals(firstTransaction.getId(), replayedTransaction.getId());
        assertEquals(1L, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count());
        assertEquals(new BigDecimal("900.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("100.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    @Test
    void sameIdempotencyKeyWithDifferentPayloadIsRejected() {
        Account sender = createAccount("Sender", "1000.0000");
        Account firstReceiver = createAccount("Receiver-A", "0.0000");
        Account secondReceiver = createAccount("Receiver-B", "0.0000");

        transferService.executeTransfer(
                "same-key",
                new TransferRequest(sender.getId(), firstReceiver.getId(), new BigDecimal("100.0000"), "THB")
        );

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> transferService.executeTransfer(
                        "same-key",
                        new TransferRequest(sender.getId(), secondReceiver.getId(), new BigDecimal("100.0000"), "THB")
                )
        );

        assertEquals("Idempotency-Key cannot be reused with a different transfer request", exception.getMessage());
        assertEquals(1L, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count());
    }

    @Test
    void concurrentRequestsWithSameIdempotencyKeyOnlyPostOnce() throws InterruptedException {
        Account sender = createAccount("Sender", "1000.0000");
        Account receiver = createAccount("Receiver", "0.0000");
        TransferRequest request = new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("250.0000"), "THB");

        ExecutorService executorService = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(2);
        AtomicReference<Throwable> unexpectedFailure = new AtomicReference<>();
        List<UUID> transactionIds = Collections.synchronizedList(new ArrayList<>());

        Runnable transferTask = () -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                Transaction transaction = transferService.executeTransfer("shared-key", request);
                transactionIds.add(transaction.getId());
            } catch (Throwable throwable) {
                unexpectedFailure.compareAndSet(null, throwable);
            } finally {
                doneLatch.countDown();
            }
        };

        executorService.submit(transferTask);
        executorService.submit(transferTask);

        readyLatch.await();
        startLatch.countDown();

        assertTrue(doneLatch.await(15, TimeUnit.SECONDS));
        executorService.shutdown();
        assertTrue(executorService.awaitTermination(5, TimeUnit.SECONDS));

        assertNull(unexpectedFailure.get(), "Concurrent duplicate request should not fail");
        assertEquals(2, transactionIds.size());
        assertNotNull(transactionIds.get(0));
        assertEquals(transactionIds.get(0), transactionIds.get(1));
        assertEquals(1L, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count());
        assertEquals(new BigDecimal("750.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("250.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    private Account createAccount(String accountName, String openingBalance) {
        return accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName(accountName)
                .balance(new BigDecimal(openingBalance))
                .currency("THB")
                .status("ACTIVE")
                .build());
    }
}
