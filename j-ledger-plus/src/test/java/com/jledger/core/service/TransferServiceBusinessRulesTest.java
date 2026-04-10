package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.exception.ResourceNotFoundException;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
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

/**
 * Integration tests for Phase 5 {@link TransferService} — business rules, validation,
 * double-entry correctness, account state, and outbox event creation.
 *
 * <p>Unlike Phase 4, these tests also verify:
 * <ul>
 *   <li>Outbox event is created on successful transfer (Phase 5 Outbox pattern)</li>
 *   <li>Redis idempotency cache is populated (verified via second call)</li>
 *   <li>Outbox remains empty on rejected transfers (atomicity)</li>
 * </ul>
 *
 * <p>Outbox scheduler is disabled (initial-delay=600000ms) to prevent background
 * Kafka publishing from interfering with assertions.
 */
@SpringBootTest(properties = {
    "jledger.outbox.initial-delay-ms=600000",
    "jledger.outbox.fixed-delay-ms=600000"
})
@Testcontainers
class TransferServiceBusinessRulesTest {

    // ─── Infrastructure ────────────────────────────────────────────────────────

    @Container
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_plus_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @Autowired private TransferService transferService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;
    @Autowired private IntegrationOutboxRepository integrationOutboxRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
        registry.add("spring.flyway.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRESQL::getUsername);
        registry.add("spring.flyway.password", POSTGRESQL::getPassword);
        registry.add("jledger.redis.address",
                () -> "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379));
        registry.add("jledger.redis.password", () -> "");
    }

    @BeforeEach
    void cleanDatabase() {
        integrationOutboxRepository.deleteAllInBatch();
        ledgerEntryRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Account createAccount(String name, String balance, String currency, String status) {
        return accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName(name)
                .balance(new BigDecimal(balance))
                .currency(currency)
                .status(status)
                .build());
    }

    private Account createActiveThbAccount(String name, String balance) {
        return createAccount(name, balance, "THB", "ACTIVE");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1: Happy Path — Successful Transfer
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void successfulTransfer_updatesBalancesCorrectly() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "500.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("300.0000"), "THB")
        );

        assertEquals(new BigDecimal("700.0000"),
                accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("800.0000"),
                accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    @Test
    void successfulTransfer_returnsTransactionWithSuccessStatus() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        Transaction result = transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
        );

        assertNotNull(result.getId());
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("TRANSFER", result.getTransactionType());
        assertEquals(new BigDecimal("100.0000"), result.getAmount());
        assertEquals("THB", result.getCurrency());
    }

    @Test
    void successfulTransfer_createsExactlyTwoLedgerEntries() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("400.0000"), "THB")
        );

        assertEquals(2L, ledgerEntryRepository.count(),
                "Double-entry bookkeeping requires exactly 2 ledger entries");
    }

    @Test
    void successfulTransfer_senderEntryIsDebitReceiverEntryIsCredit() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("200.0000"), "THB")
        );

        List<LedgerEntry> entries = ledgerEntryRepository.findAll();

        LedgerEntry senderEntry = entries.stream()
                .filter(e -> e.getAccount().getId().equals(sender.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Sender ledger entry not found"));

        LedgerEntry receiverEntry = entries.stream()
                .filter(e -> e.getAccount().getId().equals(receiver.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Receiver ledger entry not found"));

        assertEquals("DEBIT", senderEntry.getEntryType(),
                "Sender entry must be DEBIT — money leaves the sender");
        assertEquals("CREDIT", receiverEntry.getEntryType(),
                "Receiver entry must be CREDIT — money enters the receiver");
        assertEquals(new BigDecimal("200.0000"), senderEntry.getAmount());
        assertEquals(new BigDecimal("200.0000"), receiverEntry.getAmount());
    }

    @Test
    void successfulTransfer_withExactBalance_drainsSenderToZero() {
        Account sender = createActiveThbAccount("Sender", "500.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("500.0000"), "THB")
        );

        assertEquals(new BigDecimal("0.0000"),
                accountRepository.findById(sender.getId()).orElseThrow().getBalance());
    }

    @Test
    void successfulTransfer_withMaxFourDecimalPlaces() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("0.0001"), "THB")
        );

        assertEquals(new BigDecimal("999.9999"),
                accountRepository.findById(sender.getId()).orElseThrow().getBalance());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2: Phase 5 — Outbox Event Verification
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void successfulTransfer_createsExactlyOneOutboxEventInPendingStatus() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("250.0000"), "THB")
        );

        List<IntegrationOutbox> events = integrationOutboxRepository.findAll();
        assertEquals(1, events.size(), "Exactly one outbox event must be created per successful transfer");

        IntegrationOutbox event = events.get(0);
        assertEquals("PENDING", event.getStatus());
        assertEquals("TRANSFER_COMPLETED", event.getEventType());
        assertNotNull(event.getPayload());
    }

    @Test
    void successfulTransfer_outboxPayloadContainsCorrectFields() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        Transaction tx = transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
        );

        IntegrationOutbox event = integrationOutboxRepository.findAll().get(0);
        // Verify key fields in JSON payload
        assertEquals(tx.getId().toString(), event.getPayload().get("transactionId").asText());
        assertEquals("SUCCESS", event.getPayload().get("status").asText());
        assertEquals("THB", event.getPayload().get("currency").asText());
    }

    @Test
    void failedTransfer_insufficientBalance_doesNotCreateOutboxEvent() {
        Account sender = createActiveThbAccount("Sender", "50.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));

        assertEquals(0L, integrationOutboxRepository.count(),
                "No outbox event should be created when transfer fails");
    }

    @Test
    void multipleTransfers_eachCreatesOneOutboxEvent() {
        Account alice = createActiveThbAccount("Alice", "1000.0000");
        Account bob = createActiveThbAccount("Bob", "1000.0000");
        Account charlie = createActiveThbAccount("Charlie", "0.0000");

        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(alice.getId(), charlie.getId(), new BigDecimal("100.0000"), "THB"));
        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(bob.getId(), charlie.getId(), new BigDecimal("200.0000"), "THB"));

        assertEquals(2L, integrationOutboxRepository.count());
        assertEquals(2L, transactionRepository.count());
    }

    @Test
    void idempotentReplay_doesNotCreateDuplicateOutboxEvent() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");
        TransferRequest request = new TransferRequest(
                sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB");

        transferService.executeTransfer("idem-outbox-key", request);
        transferService.executeTransfer("idem-outbox-key", request);  // replay

        assertEquals(1L, integrationOutboxRepository.count(),
                "Idempotent replay must NOT create a second outbox event");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3: Input Validation
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void nullIdempotencyKey_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(null,
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Idempotency-Key header is required", ex.getMessage());
    }

    @Test
    void blankIdempotencyKey_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer("   ",
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
    }

    @Test
    void zeroAmount_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), BigDecimal.ZERO, "THB")));
        assertEquals("Transfer amount must be greater than zero", ex.getMessage());
    }

    @Test
    void negativeAmount_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("-1.0000"), "THB")));
    }

    @Test
    void amountWithMoreThanFourDecimalPlaces_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.00001"), "THB")));
        assertEquals("Transfer amount must have up to 4 decimal places", ex.getMessage());
    }

    @Test
    void invalidCurrencyLowercase_throwsIllegalArgumentException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "thb")));
    }

    @Test
    void sameFromAndToAccountId_throwsIllegalArgumentException() {
        Account account = createActiveThbAccount("Self", "1000.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(account.getId(), account.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Sender and receiver accounts must be different", ex.getMessage());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4: Business Rules — Account State
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void senderAccountNotFound_throwsResourceNotFoundException() {
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        assertThrows(ResourceNotFoundException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(UUID.randomUUID(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
    }

    @Test
    void receiverAccountNotFound_throwsResourceNotFoundException() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");

        assertThrows(ResourceNotFoundException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), UUID.randomUUID(), new BigDecimal("100.0000"), "THB")));
    }

    @Test
    void frozenAccount_throwsConflictException() {
        Account sender = createAccount("Frozen Sender", "1000.0000", "THB", "FROZEN");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Account is frozen", ex.getMessage());
    }

    @Test
    void insufficientBalance_throwsConflictException() {
        Account sender = createActiveThbAccount("Sender", "50.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Insufficient balance", ex.getMessage());
    }

    @Test
    void insufficientBalance_doesNotMutateAnyBalanceOrOutbox() {
        Account sender = createActiveThbAccount("Sender", "50.0000");
        Account receiver = createActiveThbAccount("Receiver", "200.0000");

        assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));

        assertEquals(new BigDecimal("50.0000"),
                accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("200.0000"),
                accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
        assertEquals(0L, ledgerEntryRepository.count());
        assertEquals(0L, integrationOutboxRepository.count());
    }

    @Test
    void currencyMismatch_throwsIllegalArgumentException() {
        Account sender = createAccount("Sender", "1000.0000", "USD", "ACTIVE");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Currency mismatch", ex.getMessage());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Double-Entry Integrity
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void multipleSequentialTransfers_sumOfDebitsEqualsCredits() {
        Account alice = createActiveThbAccount("Alice", "1000.0000");
        Account bob = createActiveThbAccount("Bob", "500.0000");
        Account charlie = createActiveThbAccount("Charlie", "0.0000");

        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(alice.getId(), bob.getId(), new BigDecimal("200.0000"), "THB"));
        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(bob.getId(), charlie.getId(), new BigDecimal("300.0000"), "THB"));

        assertEquals(new BigDecimal("800.0000"),
                accountRepository.findById(alice.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("400.0000"),
                accountRepository.findById(bob.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("300.0000"),
                accountRepository.findById(charlie.getId()).orElseThrow().getBalance());

        List<LedgerEntry> all = ledgerEntryRepository.findAll();
        BigDecimal totalDebits = all.stream()
                .filter(e -> "DEBIT".equals(e.getEntryType()))
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredits = all.stream()
                .filter(e -> "CREDIT".equals(e.getEntryType()))
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, totalDebits.compareTo(totalCredits),
                "Sum of all DEBITs must equal sum of all CREDITs (double-entry invariant)");
    }

    @Test
    void ledgerEntriesHaveCorrectTransactionReference() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        Transaction tx = transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
        );

        List<LedgerEntry> entries = ledgerEntryRepository.findAll();
        for (LedgerEntry entry : entries) {
            assertEquals(tx.getId(), entry.getTransaction().getId(),
                    "Every ledger entry must reference the parent transaction");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 6: Idempotency Edge Cases (Phase 5 — Redis + DB dual-layer)
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void idempotentReplay_withDifferentAmount_isRejected() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer("key-amt",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer("key-amt",
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("999.0000"), "THB")));
        assertEquals("Idempotency-Key cannot be reused with a different transfer request", ex.getMessage());
    }

    @Test
    void idempotentReplay_withSwappedFromTo_isRejected() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "1000.0000");

        transferService.executeTransfer("key-swap",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer("key-swap",
                        new TransferRequest(receiver.getId(), sender.getId(), new BigDecimal("100.0000"), "THB")));
        assertEquals("Idempotency-Key cannot be reused with a different transfer request", ex.getMessage());
    }

    @Test
    void multipleUniqueIdempotencyKeys_allProcessedIndependently_withSeparateOutboxEvents() {
        Account sender = createActiveThbAccount("Sender", "1000.0000");
        Account receiver = createActiveThbAccount("Receiver", "0.0000");

        transferService.executeTransfer("key-a",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));
        transferService.executeTransfer("key-b",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("200.0000"), "THB"));
        transferService.executeTransfer("key-c",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("50.0000"), "THB"));

        assertEquals(3L, transactionRepository.count());
        assertEquals(6L, ledgerEntryRepository.count());
        assertEquals(3L, integrationOutboxRepository.count());
        assertEquals(new BigDecimal("650.0000"),
                accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("350.0000"),
                accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }
}
