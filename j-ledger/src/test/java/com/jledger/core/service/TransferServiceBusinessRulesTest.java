package com.jledger.core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.exception.ResourceNotFoundException;
import com.jledger.core.repository.AccountRepository;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration tests for {@link TransferService} — business rules, validation,
 * double-entry correctness, and account state enforcement.
 *
 * <p>Each test category is clearly separated. The database is wiped between
 * each test via {@link #cleanDatabase()}.
 */
@SpringBootTest
@Testcontainers
class TransferServiceBusinessRulesTest {

    // ─── Infrastructure ────────────────────────────────────────────────────────

    @Container
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Autowired private TransferService transferService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;

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

    private Account createActiveAccount(String name, String balance) {
        return createAccount(name, balance, "THB", "ACTIVE");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1: Happy Path — Successful Transfer
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void successfulTransfer_updatesBalancesCorrectly() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "500.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("300.0000"), "THB")
        );

        assertEquals(new BigDecimal("700.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("800.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    @Test
    void successfulTransfer_returnsTransactionWithSuccessStatus() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

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
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        Transaction tx = transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("400.0000"), "THB")
        );

        List<LedgerEntry> entries = ledgerEntryRepository.findAll();
        assertEquals(2, entries.size(), "Double-entry bookkeeping requires exactly 2 ledger entries");
    }

    @Test
    void successfulTransfer_senderEntryIsDebitReceiverEntryIsCredit() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        Transaction tx = transferService.executeTransfer(
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
    void successfulTransfer_exactlyOnTransactionRecord() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("50.0000"), "THB")
        );

        assertEquals(1L, transactionRepository.count());
    }

    @Test
    void successfulTransfer_withMaximumFourDecimalPlaces() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("0.0001"), "THB")
        );

        assertEquals(new BigDecimal("999.9999"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("0.0001"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    @Test
    void successfulTransfer_withExactBalanceAmount() {
        Account sender = createActiveAccount("Sender", "500.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        transferService.executeTransfer(
                UUID.randomUUID().toString(),
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("500.0000"), "THB")
        );

        assertEquals(new BigDecimal("0.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("500.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2: Input Validation — Request-Level Guards
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void nullIdempotencyKey_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        null,
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Idempotency-Key header is required", ex.getMessage());
    }

    @Test
    void blankIdempotencyKey_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        "   ",
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
    }

    @Test
    void zeroAmount_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), BigDecimal.ZERO, "THB")
                ));
        assertEquals("Transfer amount must be greater than zero", ex.getMessage());
    }

    @Test
    void negativeAmount_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("-100.0000"), "THB")
                ));
    }

    @Test
    void amountWithMoreThanFourDecimalPlaces_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.00001"), "THB")
                ));
        assertEquals("Transfer amount must have up to 4 decimal places", ex.getMessage());
    }

    @Test
    void invalidCurrencyFormat_lowercase_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "thb")
                ));
        assertEquals("Currency must be a 3-letter uppercase code", ex.getMessage());
    }

    @Test
    void invalidCurrencyFormat_tooShort_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "TH")
                ));
    }

    @Test
    void sameFromAndToAccountId_throwsIllegalArgumentException() {
        Account account = createActiveAccount("Account", "1000.0000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(account.getId(), account.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Sender and receiver accounts must be different", ex.getMessage());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3: Business Rules — Account State
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void senderAccountNotFound_throwsResourceNotFoundException() {
        Account receiver = createActiveAccount("Receiver", "0.0000");

        assertThrows(ResourceNotFoundException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(UUID.randomUUID(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
    }

    @Test
    void receiverAccountNotFound_throwsResourceNotFoundException() {
        Account sender = createActiveAccount("Sender", "1000.0000");

        assertThrows(ResourceNotFoundException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), UUID.randomUUID(), new BigDecimal("100.0000"), "THB")
                ));
    }

    @Test
    void senderAccountFrozen_throwsConflictException() {
        Account sender = createAccount("Sender", "1000.0000", "THB", "FROZEN");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Sender account is frozen", ex.getMessage());
    }

    @Test
    void receiverAccountFrozen_throwsConflictException() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createAccount("Receiver", "0.0000", "THB", "FROZEN");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Receiver account is frozen", ex.getMessage());
    }

    @Test
    void insufficientBalance_throwsConflictException() {
        Account sender = createActiveAccount("Sender", "50.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Insufficient balance", ex.getMessage());
    }

    @Test
    void insufficientBalance_doesNotMutateAnyBalance() {
        Account sender = createActiveAccount("Sender", "50.0000");
        Account receiver = createActiveAccount("Receiver", "200.0000");

        assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));

        // DB must be untouched — full rollback
        assertEquals(new BigDecimal("50.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("200.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
        assertEquals(0L, ledgerEntryRepository.count());
    }

    @Test
    void currencyMismatch_senderDifferentCurrency_throwsIllegalArgumentException() {
        Account sender = createAccount("Sender", "1000.0000", "USD", "ACTIVE");
        Account receiver = createActiveAccount("Receiver", "0.0000");   // THB

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
        assertEquals("Currency mismatch", ex.getMessage());
    }

    @Test
    void currencyMismatch_receiverDifferentCurrency_throwsIllegalArgumentException() {
        Account sender = createActiveAccount("Sender", "1000.0000");    // THB
        Account receiver = createAccount("Receiver", "0.0000", "USD", "ACTIVE");

        assertThrows(IllegalArgumentException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));
    }

    @Test
    void failedValidation_doesNotCreateAnyTransactionRecord() {
        Account sender = createActiveAccount("Sender", "50.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        assertThrows(ConflictException.class, () ->
                transferService.executeTransfer(
                        UUID.randomUUID().toString(),
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB")
                ));

        // ON CONFLICT DO NOTHING insert happens first, but full rollback undoes it
        assertEquals(0L, transactionRepository.count(),
                "No transaction record should persist after a failed transfer");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4: Double-Entry Integrity — Accounting Correctness
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void multipleSequentialTransfers_sumOfDebitsEqualsCredits() {
        Account alice = createActiveAccount("Alice", "1000.0000");
        Account bob = createActiveAccount("Bob", "500.0000");
        Account charlie = createActiveAccount("Charlie", "0.0000");

        // Alice → Bob: 200
        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(alice.getId(), bob.getId(), new BigDecimal("200.0000"), "THB"));

        // Bob → Charlie: 300
        transferService.executeTransfer(UUID.randomUUID().toString(),
                new TransferRequest(bob.getId(), charlie.getId(), new BigDecimal("300.0000"), "THB"));

        // Verify final balances
        assertEquals(new BigDecimal("800.0000"), accountRepository.findById(alice.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("400.0000"), accountRepository.findById(bob.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("300.0000"), accountRepository.findById(charlie.getId()).orElseThrow().getBalance());

        // Sum of all DEBITs == Sum of all CREDITs (fundamental ledger invariant)
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
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

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
    // SECTION 5: Idempotency Edge Cases
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void idempotencyKeyReplay_withDifferentAmount_isRejected() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        transferService.executeTransfer("key-1",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer("key-1",
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("999.0000"), "THB")));

        assertEquals("Idempotency-Key cannot be reused with a different transfer request", ex.getMessage());
    }

    @Test
    void idempotencyKeyReplay_withDifferentCurrency_isRejected() {
        Account sender = createAccount("Sender", "1000.0000", "THB", "ACTIVE");
        Account receiver = createAccount("Receiver", "0.0000", "THB", "ACTIVE");

        transferService.executeTransfer("key-curr",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));

        // Try to use same key with different currency in request header
        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer("key-curr",
                        new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "USD")));

        assertEquals("Idempotency-Key cannot be reused with a different transfer request", ex.getMessage());
    }

    @Test
    void idempotencyKeyReplay_withSwappedFromTo_isRejected() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "1000.0000");

        transferService.executeTransfer("key-swap",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transferService.executeTransfer("key-swap",
                        new TransferRequest(receiver.getId(), sender.getId(), new BigDecimal("100.0000"), "THB")));

        assertEquals("Idempotency-Key cannot be reused with a different transfer request", ex.getMessage());
    }

    @Test
    void multipleUniqueIdempotencyKeys_allProcessedIndependently() {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        transferService.executeTransfer("key-a",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("100.0000"), "THB"));
        transferService.executeTransfer("key-b",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("200.0000"), "THB"));
        transferService.executeTransfer("key-c",
                new TransferRequest(sender.getId(), receiver.getId(), new BigDecimal("50.0000"), "THB"));

        assertEquals(3L, transactionRepository.count());
        assertEquals(6L, ledgerEntryRepository.count());
        assertEquals(new BigDecimal("650.0000"), accountRepository.findById(sender.getId()).orElseThrow().getBalance());
        assertEquals(new BigDecimal("350.0000"), accountRepository.findById(receiver.getId()).orElseThrow().getBalance());
    }
}
