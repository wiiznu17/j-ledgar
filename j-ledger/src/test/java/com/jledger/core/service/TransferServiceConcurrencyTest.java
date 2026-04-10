package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jledger.core.domain.Account;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.AccountRepository;
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
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class TransferServiceConcurrencyTest {

    @Container
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
    void concurrentTransfersCatchOptimisticLockingFailure() throws InterruptedException {
        boolean optimisticLockObserved = false;

        for (int attempt = 0; attempt < 15 && !optimisticLockObserved; attempt++) {
            cleanDatabase();

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
            AtomicInteger optimisticFailureCount = new AtomicInteger(0);
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
                } catch (ObjectOptimisticLockingFailureException exception) {
                    optimisticFailureCount.incrementAndGet();
                } catch (IllegalStateException exception) {
                    // Some threads may read the committed balance after the winner completes.
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
            executorService.awaitTermination(5, TimeUnit.SECONDS);

            assertNull(unexpectedFailure.get(), "Unexpected failure during concurrent transfer execution");

            if (optimisticFailureCount.get() > 0) {
                optimisticLockObserved = true;
                assertEquals(1, successCount.get());

                Account updatedSender = accountRepository.findById(sender.getId()).orElseThrow();
                Account updatedReceiver = accountRepository.findById(receiver.getId()).orElseThrow();

                assertEquals(new BigDecimal("0.0000"), updatedSender.getBalance());
                assertEquals(new BigDecimal("1000.0000"), updatedReceiver.getBalance());
            }
        }

        assertTrue(
                optimisticLockObserved,
                "Expected at least one ObjectOptimisticLockingFailureException under concurrent transfer load"
        );
    }
}
