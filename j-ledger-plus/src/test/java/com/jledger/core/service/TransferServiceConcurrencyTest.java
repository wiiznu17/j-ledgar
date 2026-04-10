package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jledger.core.domain.Account;
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
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Container
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

    @Test
    void concurrentTransfersAreSerializedByDistributedLocks() throws InterruptedException {
        Account sender = accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName("Sender")
                .balance(new BigDecimal("1000.0000"))
                .currency("THB")
                .status("ACTIVE")
                .build());

        Account receiver = accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName("Receiver")
                .balance(new BigDecimal("0.0000"))
                .currency("THB")
                .status("ACTIVE")
                .build());

        int threadCount = 8;
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
        assertEquals(1, successCount.get());
        assertEquals(threadCount - 1, rejectedCount.get());
        assertEquals(1L, transactionRepository.count());
        assertEquals(2L, ledgerEntryRepository.count());
        assertEquals(1L, integrationOutboxRepository.count());

        Account updatedSender = accountRepository.findById(sender.getId()).orElseThrow();
        Account updatedReceiver = accountRepository.findById(receiver.getId()).orElseThrow();

        assertEquals(new BigDecimal("0.0000"), updatedSender.getBalance());
        assertEquals(new BigDecimal("1000.0000"), updatedReceiver.getBalance());
    }
}
