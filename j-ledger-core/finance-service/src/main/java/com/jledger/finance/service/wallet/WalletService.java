package com.jledger.finance.service.wallet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.IntegrationOutbox;
import com.jledger.finance.domain.entity.LinkedBankAccount;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.NotificationEventType;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.repository.system.IntegrationOutboxRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.LinkedBankAccountRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import com.jledger.finance.domain.entity.LedgerEntry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.dao.DataIntegrityViolationException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class WalletService {
    private static final Logger logger = LoggerFactory.getLogger(WalletService.class);
    private static final String SYSTEM_ACCOUNT_ID = "00000000-0000-0000-0000-000000000000";

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LinkedBankAccountRepository linkedBankAccountRepository;

    @Autowired
    private IntegrationOutboxRepository integrationOutboxRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String CACHE_PREFIX = "wallet:";
    private static final BigDecimal DAILY_LIMIT = new BigDecimal("1000000");
    private static final BigDecimal TRANSACTION_LIMIT = new BigDecimal("50000");

    public Wallet createWallet(String userId, String currency) {
        if (walletRepository.existsByUserId(userId)) {
            throw new RuntimeException("Wallet already exists for user");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setCurrency(currency);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setIsActive(true);

        Wallet createdWallet = walletRepository.save(wallet);
        ensureDefaultLinkedBankAccountExists(userId);
        return createdWallet;
    }

    public Optional<Wallet> getWallet(String userId) {
        String cacheKey = CACHE_PREFIX + userId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof Wallet wallet) {
            return Optional.of(wallet);
        }
        if (cached instanceof Map<?, ?> cachedMap) {
            try {
                Wallet wallet = objectMapper.convertValue(cachedMap, Wallet.class);
                return Optional.of(wallet);
            } catch (IllegalArgumentException ignored) {
                redisTemplate.delete(cacheKey);
            }
        }

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        wallet.ifPresent(w -> redisTemplate.opsForValue().set(cacheKey, Objects.requireNonNull(w), 5, TimeUnit.MINUTES));
        return wallet;
    }

    @Transactional
    public Wallet updateBalance(String userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        BigDecimal newBalance = wallet.getBalance().add(amount);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        cacheWallet(saved);
        return saved;
    }

    public boolean validateTransaction(String userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId).orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (amount.compareTo(TRANSACTION_LIMIT) > 0) {
            throw new RuntimeException("Transaction amount exceeds limit");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        return true;
    }

    public Wallet deactivateWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(false);
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public Map<String, BigDecimal> getTransactionLimits(String userId) {
        return Map.of(
            "dailyLimit", DAILY_LIMIT,
            "transactionLimit", TRANSACTION_LIMIT
        );
    }

    public Wallet activateWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(true);
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public Wallet freezeWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus("FROZEN");
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public Wallet unfreezeWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus("ACTIVE");
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public List<Transaction> getTopUpHistory(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByToWalletIdAndTypeOrderByCreatedAtDesc(wallet.getId(), TransactionType.TOPUP);
    }

    public String generateStaticQR(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return "jledger|static|" + wallet.getId();
    }

    public List<Transaction> getTransactions(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByFromWalletIdOrToWalletIdOrderByCreatedAtDesc(wallet.getId(), wallet.getId());
    }

    public List<Transaction> getTransactions(
            String userId,
            Integer page,
            Integer size,
            TransactionType type,
            LocalDateTime from,
            LocalDateTime to
    ) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        int resolvedPage = Math.max(page == null ? 0 : page, 0);
        int resolvedSize = Math.min(Math.max(size == null ? 20 : size, 1), 100);
        Pageable pageable = PageRequest.of(resolvedPage, resolvedSize);

        boolean hasType = type != null;
        LocalDateTime resolvedFrom = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime resolvedTo = to != null ? to : LocalDateTime.of(9999, 12, 31, 23, 59);
        boolean hasDate = from != null || to != null;

        if (hasType && hasDate) {
            return transactionRepository.findByFromWalletIdOrToWalletIdAndTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    wallet.getId(), wallet.getId(), type, resolvedFrom, resolvedTo, pageable
            );
        }
        if (hasType) {
            return transactionRepository.findByFromWalletIdOrToWalletIdAndTypeOrderByCreatedAtDesc(
                    wallet.getId(), wallet.getId(), type, pageable
            );
        }
        if (hasDate) {
            return transactionRepository.findByFromWalletIdOrToWalletIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    wallet.getId(), wallet.getId(), resolvedFrom, resolvedTo, pageable
            );
        }
        return transactionRepository.findByFromWalletIdOrToWalletIdOrderByCreatedAtDesc(
                wallet.getId(), wallet.getId(), pageable
        );
    }

    public List<Transaction> getQRHistory(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByFromWalletIdOrToWalletIdOrderByCreatedAtDesc(wallet.getId(), wallet.getId());
    }

    public Wallet getWalletById(Long id) {
        return walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    @Transactional
    public Wallet adjustBalanceById(Long id, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(Objects.requireNonNull(wallet));

        // Update Ledger Account
        Account userAccount = getOrCreateLedgerAccount(wallet.getUserId(), wallet.getCurrency());
        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        // Record adjustment transaction
        String txId = UUID.randomUUID().toString();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Record Ledger Entry
        LedgerEntry adjustmentEntry = LedgerEntry.builder()
                .account(userAccount)
                .entryType(amount.compareTo(BigDecimal.ZERO) > 0 ? "CREDIT" : "DEBIT")
                .amount(amount.abs())
                .transactionId(txId)
                .description("Admin Adjustment: " + reason)
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(adjustmentEntry));

        publishTransactionEvent(wallet.getUserId(), savedTransaction, true);

        return updated;
    }

    public Wallet deactivateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(false);
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public Wallet activateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(true);
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    public Wallet updateLimits(Long id, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setDailyLimit(dailyLimit);
        wallet.setMonthlyLimit(monthlyLimit);
        return walletRepository.save(Objects.requireNonNull(wallet));
    }

    @Transactional
    public Transaction topUpBank(String userId, BigDecimal amount, Long bankAccountId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        LinkedBankAccount bankAccount = findOwnedLinkedBankAccount(userId, bankAccountId);
        if (!Boolean.TRUE.equals(bankAccount.getIsVerified())) {
            throw new RuntimeException("Bank account is not verified");
        }

        // 2. Lock System Account & User Wallet
        Account systemAccount = accountRepository.findByIdForUpdate(UUID.fromString(SYSTEM_ACCOUNT_ID))
                .orElseThrow(() -> new RuntimeException("System account not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updatedWallet = walletRepository.save(Objects.requireNonNull(wallet));
        cacheWallet(updatedWallet);

        // 3. Update System Account Balance (Debit)
        systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
        accountRepository.save(systemAccount);

        // Record Ledger Entry for System Account (Debit)
        String txId = UUID.randomUUID().toString();
        LedgerEntry systemEntry = LedgerEntry.builder()
                .account(systemAccount)
                .entryType("DEBIT")
                .amount(amount)
                .transactionId(txId)
                .description(String.format("Bank top-up from %s for user %s", bankAccount.getBankName(), userId))
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(systemEntry));

        // 5. Record Ledger Entry for User Account (Credit)
        Account userAccount = getOrCreateLedgerAccount(userId, wallet.getCurrency());
        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        LedgerEntry userEntry = LedgerEntry.builder()
                .account(userAccount)
                .entryType("CREDIT")
                .amount(amount)
                .transactionId(txId)
                .description(String.format("Bank top-up from %s", bankAccount.getBankName()))
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(userEntry));

        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription(
                String.format("Bank top-up from %s %s", bankAccount.getBankName(), bankAccount.getAccountNumber())
        );
        transaction.setMetadata(buildTopUpBankMetadata(bankAccount));

        Transaction savedTransaction = transactionRepository.save(transaction);
        publishTransactionEvent(userId, savedTransaction, true);
        return savedTransaction;
    }

    @Transactional
    public Transaction creditTopUpFromExternal(
            String userId,
            BigDecimal amount,
            String currency,
            String externalRef,
            String provider,
            String metadataJson
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero");
        }
        if (externalRef == null || externalRef.isBlank()) {
            throw new IllegalArgumentException("externalRef is required");
        }

        // 1. Idempotency Check (Soft check first)
        Optional<Transaction> existing = transactionRepository.findByTransactionId(externalRef);
        if (existing.isPresent()) {
            return existing.get();
        }

        try {
            // 2. Lock System Account & User Wallet
            Account systemAccount = accountRepository.findByIdForUpdate(UUID.fromString(SYSTEM_ACCOUNT_ID))
                    .orElseThrow(() -> new RuntimeException("System account not found"));

            Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            if (!wallet.getIsActive()) {
                throw new RuntimeException("Wallet is inactive");
            }

            if (currency != null && !currency.isBlank() && wallet.getCurrency() != null
                    && !wallet.getCurrency().equalsIgnoreCase(currency)) {
                throw new IllegalArgumentException("Currency mismatch");
            }

            // 3. Update Balances (Double-Entry)
            systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
            wallet.setBalance(wallet.getBalance().add(amount));

            accountRepository.save(systemAccount);
            
            // Record Ledger Entry for System Account (Debit)
            LedgerEntry ledgerEntry = LedgerEntry.builder()
                    .account(systemAccount)
                    .entryType("DEBIT")
                    .amount(amount)
                    .transactionId(externalRef)
                    .description(String.format("%s Top-up credit for user %s", provider, userId))
                    .build();
            ledgerEntryRepository.save(Objects.requireNonNull(ledgerEntry));

            Wallet updatedWallet = walletRepository.save(Objects.requireNonNull(wallet));
            cacheWallet(updatedWallet);

            // 4. Create Transaction Record
            Transaction transaction = new Transaction();
            transaction.setTransactionId(externalRef);
            transaction.setType(TransactionType.TOPUP);
            transaction.setAmount(amount);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setFromWalletId(null);
            transaction.setToWalletId(wallet.getId());
            transaction.setDescription(String.format("%s top-up credit", provider == null ? "EXTERNAL" : provider));
            transaction.setMetadata(metadataJson);

            Transaction savedTransaction = transactionRepository.save(transaction);
            publishTransactionEvent(userId, savedTransaction, true);
            return savedTransaction;

        } catch (DataIntegrityViolationException e) {
            // 5. Hard Idempotency Check (DB level conflict handling)
            return transactionRepository.findByTransactionId(externalRef)
                    .orElseThrow(() -> new RuntimeException("Transaction conflict detected but record not found", e));
        }
    }

    public List<LinkedBankAccount> listLinkedBankAccounts(String userId) {
        ensureDefaultLinkedBankAccountExists(userId);
        return linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
    }

    @Transactional
    public LinkedBankAccount createLinkedBankAccount(
            String userId,
            String bankCode,
            String bankName,
            String accountNumber,
            String accountName,
            String accountType,
            boolean isDefault,
            boolean isVerified
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (bankCode == null || bankCode.isBlank()) {
            throw new IllegalArgumentException("bankCode is required");
        }
        if (bankName == null || bankName.isBlank()) {
            throw new IllegalArgumentException("bankName is required");
        }
        if (accountNumber == null || accountNumber.isBlank()) {
            throw new IllegalArgumentException("accountNumber is required");
        }
        if (accountName == null || accountName.isBlank()) {
            throw new IllegalArgumentException("accountName is required");
        }

        LinkedBankAccount linkedBankAccount = new LinkedBankAccount();
        linkedBankAccount.setUserId(userId);
        linkedBankAccount.setBankCode(bankCode);
        linkedBankAccount.setBankName(bankName);
        linkedBankAccount.setAccountNumber(accountNumber);
        linkedBankAccount.setAccountName(accountName);
        linkedBankAccount.setAccountType((accountType == null || accountType.isBlank()) ? "SAVINGS" : accountType);
        linkedBankAccount.setIsDefault(isDefault);
        linkedBankAccount.setIsVerified(isVerified);

        LinkedBankAccount saved = linkedBankAccountRepository.save(linkedBankAccount);
        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            normalizeDefaultAccount(userId, saved.getId());
        }
        return saved;
    }

    public LinkedBankAccount findOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        if (bankAccountId == null) {
            throw new IllegalArgumentException("bankAccountId is required");
        }
        return linkedBankAccountRepository.findByIdAndUserId(Objects.requireNonNull(bankAccountId), userId)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));
    }

    @Transactional
    public LinkedBankAccount setDefaultLinkedBankAccount(String userId, Long bankAccountId) {
        LinkedBankAccount target = findOwnedLinkedBankAccount(userId, bankAccountId);
        normalizeDefaultAccount(userId, Objects.requireNonNull(target.getId()));
        return linkedBankAccountRepository.findById(Objects.requireNonNull(target.getId()))
                .orElseThrow(() -> new RuntimeException("Bank account not found"));
    }

    @Transactional
    public void deleteOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        LinkedBankAccount account = findOwnedLinkedBankAccount(userId, bankAccountId);
        boolean wasDefault = Boolean.TRUE.equals(account.getIsDefault());
        linkedBankAccountRepository.delete(account);

        if (!wasDefault) {
            return;
        }

        List<LinkedBankAccount> remaining = linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
        if (!remaining.isEmpty()) {
            normalizeDefaultAccount(userId, remaining.get(0).getId());
        }
    }

    private void cacheWallet(Wallet wallet) {
        String cacheKey = CACHE_PREFIX + wallet.getUserId();
        redisTemplate.opsForValue().set(cacheKey, Objects.requireNonNull(wallet), 5, TimeUnit.MINUTES);
    }

    @Transactional
    protected void ensureDefaultLinkedBankAccountExists(String userId) {
        if (linkedBankAccountRepository.existsByUserId(userId)) {
            return;
        }

        LinkedBankAccount defaultBank = new LinkedBankAccount();
        defaultBank.setUserId(userId);
        defaultBank.setBankCode("SCB");
        defaultBank.setBankName("ธนาคารไทยพาณิชย์");
        defaultBank.setAccountNumber("*** *** 4567");
        defaultBank.setAccountName("Mock Account");
        defaultBank.setAccountType("SAVINGS");
        defaultBank.setIsDefault(true);
        defaultBank.setIsVerified(true);
        linkedBankAccountRepository.save(defaultBank);
    }

    @Transactional
    protected void normalizeDefaultAccount(String userId, Long targetId) {
        List<LinkedBankAccount> accounts = new ArrayList<>(
                linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId)
        );
        boolean changed = false;
        for (LinkedBankAccount account : accounts) {
            boolean shouldBeDefault = account.getId().equals(targetId);
            if (!Boolean.valueOf(shouldBeDefault).equals(account.getIsDefault())) {
                account.setIsDefault(shouldBeDefault);
                changed = true;
            }
        }
        if (changed) {
            linkedBankAccountRepository.saveAll(accounts);
        }
    }

    private String buildTopUpBankMetadata(LinkedBankAccount bankAccount) {
        return String.format(
                "{\"bankAccountId\":%d,\"bankCode\":\"%s\",\"accountNumberMasked\":\"%s\"}",
                bankAccount.getId(),
                escapeJson(bankAccount.getBankCode()),
                escapeJson(bankAccount.getAccountNumber())
        );
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Transactional
    public Transaction topUpCounter(String userId, BigDecimal amount, String counterCode) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        // Lock System Account & User Wallet
        Account systemAccount = accountRepository.findByIdForUpdate(UUID.fromString(SYSTEM_ACCOUNT_ID))
                .orElseThrow(() -> new RuntimeException("System account not found"));

        // Mock counter top-up
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        // Update System Account Balance (Debit)
        systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
        accountRepository.save(systemAccount);

        String txId = UUID.randomUUID().toString();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Counter top-up at " + counterCode);
        transaction.setMetadata("{\"counterCode\":\"" + counterCode + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Record Ledger Entries
        // Debit Treasury
        LedgerEntry treasuryEntry = LedgerEntry.builder()
                .account(systemAccount)
                .entryType("DEBIT")
                .amount(amount)
                .transactionId(txId)
                .description("Counter Top-up at " + counterCode)
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(treasuryEntry));

        // Credit User
        Account userAccount = getOrCreateLedgerAccount(userId, wallet.getCurrency());
        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        LedgerEntry userEntry = LedgerEntry.builder()
                .account(userAccount)
                .entryType("CREDIT")
                .amount(amount)
                .transactionId(txId)
                .description("Counter Top-up")
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(userEntry));

        return savedTransaction;
    }

    @Transactional
    public Transaction topUpCash(String userId, BigDecimal amount, String agentId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        // Lock System Account & User Wallet
        Account systemAccount = accountRepository.findByIdForUpdate(UUID.fromString(SYSTEM_ACCOUNT_ID))
                .orElseThrow(() -> new RuntimeException("System account not found"));

        // Mock cash top-up
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        // Update System Account Balance (Debit)
        systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
        accountRepository.save(systemAccount);

        String txId = UUID.randomUUID().toString();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Cash top-up at agent " + agentId);
        transaction.setMetadata("{\"agentId\":\"" + agentId + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Record Ledger Entries
        // Debit Treasury
        LedgerEntry treasuryEntry = LedgerEntry.builder()
                .account(systemAccount)
                .entryType("DEBIT")
                .amount(amount)
                .transactionId(txId)
                .description("Agent Cash Top-up by " + agentId)
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(treasuryEntry));

        // Credit User
        Account userAccount = getOrCreateLedgerAccount(userId, wallet.getCurrency());
        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        LedgerEntry userEntry = LedgerEntry.builder()
                .account(userAccount)
                .entryType("CREDIT")
                .amount(amount)
                .transactionId(txId)
                .description("Cash Top-up")
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(userEntry));

        return savedTransaction;
    }

    @Transactional
    public Transaction transferByPhone(String fromUserId, String toPhone, BigDecimal amount) {
        logger.info("transferByPhone called: fromUserId={}, toPhone={}, amount={}", fromUserId, toPhone, amount);
        String recipientUserId = findUserIdByPhone(toPhone);
        logger.info("Found recipientUserId: {}", recipientUserId);
        return transferByPhoneInternal(fromUserId, toPhone, recipientUserId, amount, null, null);
    }

    public Map<String, Object> previewTransferByPhone(String fromUserId, String recipientPhone, BigDecimal amount) {
        logger.info("previewTransferByPhone called: fromUserId={}, recipientPhone={}", fromUserId, recipientPhone);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }

        Wallet fromWallet = walletRepository.findByUserId(fromUserId)
                .orElseThrow(() -> new RuntimeException("Source wallet not found"));
        if (!fromWallet.getIsActive()) {
            throw new RuntimeException("Source wallet is inactive");
        }

        String recipientUserId = findUserIdByPhone(recipientPhone);
        logger.info("Found recipientUserId: {}", recipientUserId);
        if (fromUserId.equals(recipientUserId)) {
            throw new IllegalArgumentException("Cannot transfer to your own account");
        }

        Wallet toWallet = walletRepository.findByUserId(recipientUserId)
                .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));
        if (!toWallet.getIsActive()) {
            throw new RuntimeException("Recipient wallet is inactive");
        }
        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        BigDecimal fee = BigDecimal.ZERO.setScale(4);
        BigDecimal totalDebit = amount.add(fee);
        Map<String, Object> recipient = new HashMap<>();
        recipient.put("userId", recipientUserId);
        recipient.put("phoneMasked", maskPhone(recipientPhone));

        Map<String, Object> response = new HashMap<>();
        response.put("recipient", recipient);
        response.put("amount", amount.setScale(4));
        response.put("fee", fee);
        response.put("totalDebit", totalDebit.setScale(4));
        response.put("currency", fromWallet.getCurrency() == null ? "THB" : fromWallet.getCurrency());
        return response;
    }

    @Transactional
    public Transaction transferByPhoneV1(
            String fromUserId,
            String recipientPhone,
            BigDecimal amount,
            String note,
            String idempotencyKey
    ) {
        logger.info("transferByPhoneV1 called: fromUserId={}, recipientPhone={}, amount={}, idempotencyKey={}", fromUserId, recipientPhone, amount, idempotencyKey);
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("idempotencyKey is required");
        }
        Optional<Transaction> existing = transactionRepository.findByTransactionId(idempotencyKey);
        if (existing.isPresent()) {
            logger.info("Transaction already exists with idempotencyKey: {}", idempotencyKey);
            return existing.get();
        }
        String recipientUserId = findUserIdByPhone(recipientPhone);
        logger.info("Found recipientUserId: {}", recipientUserId);
        return transferByPhoneInternal(fromUserId, recipientPhone, recipientUserId, amount, note, idempotencyKey);
    }

    @Transactional
    protected Transaction transferByPhoneInternal(
            String fromUserId,
            String normalizedPhone,
            String recipientUserId,
            BigDecimal amount,
            String note,
            String idempotencyKey
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }
        if (fromUserId.equals(recipientUserId)) {
            throw new IllegalArgumentException("Cannot transfer to your own account");
        }

        try {
            // 1. Lock Wallets in consistent order to prevent Deadlocks
            Wallet fromWallet, toWallet;
            if (fromUserId.compareTo(recipientUserId) < 0) {
                fromWallet = walletRepository.findByUserIdForUpdate(fromUserId)
                        .orElseThrow(() -> new RuntimeException("Source wallet not found"));
                toWallet = walletRepository.findByUserIdForUpdate(recipientUserId)
                        .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));
            } else {
                toWallet = walletRepository.findByUserIdForUpdate(recipientUserId)
                        .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));
                fromWallet = walletRepository.findByUserIdForUpdate(fromUserId)
                        .orElseThrow(() -> new RuntimeException("Source wallet not found"));
            }

            // 2. Validations
            if (!fromWallet.getIsActive()) {
                throw new RuntimeException("Source wallet is inactive");
            }
            if (!toWallet.getIsActive()) {
                throw new RuntimeException("Recipient wallet is inactive");
            }
            if (fromWallet.getBalance().compareTo(amount) < 0) {
                throw new RuntimeException("Insufficient balance");
            }

            // 3. Update Balances
            fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
            toWallet.setBalance(toWallet.getBalance().add(amount));
            
            // 4. Update Ledger Accounts (Double-Entry)
            Account senderAccount = getOrCreateLedgerAccount(fromUserId, fromWallet.getCurrency());
            Account receiverAccount = getOrCreateLedgerAccount(recipientUserId, toWallet.getCurrency());
            
            senderAccount.setBalance(senderAccount.getBalance().subtract(amount));
            receiverAccount.setBalance(receiverAccount.getBalance().add(amount));
            
            accountRepository.save(senderAccount);
            accountRepository.save(receiverAccount);
            
            // 5. Record Ledger Entries
            String txId = idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString();
            
            // Debit Sender
            LedgerEntry senderEntry = LedgerEntry.builder()
                    .account(senderAccount)
                    .entryType("DEBIT")
                    .amount(amount)
                    .transactionId(txId)
                    .description(String.format("Transfer to %s", normalizedPhone))
                    .build();
            ledgerEntryRepository.save(Objects.requireNonNull(senderEntry));
            
            // Credit Receiver
            LedgerEntry receiverEntry = LedgerEntry.builder()
                    .account(receiverAccount)
                    .entryType("CREDIT")
                    .amount(amount)
                    .transactionId(txId)
                    .description(String.format("Transfer from %s", fromUserId))
                    .build();
            ledgerEntryRepository.save(Objects.requireNonNull(receiverEntry));

            Wallet updatedFrom = walletRepository.save(Objects.requireNonNull(fromWallet));
            Wallet updatedTo = walletRepository.save(Objects.requireNonNull(toWallet));
            cacheWallet(updatedFrom);
            cacheWallet(updatedTo);

            // 6. Create Transaction Record
            Transaction transaction = new Transaction();
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                transaction.setTransactionId(idempotencyKey);
            }
            transaction.setType(TransactionType.TRANSFER);
            transaction.setAmount(amount);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setFromWalletId(fromWallet.getId());
            transaction.setToWalletId(toWallet.getId());
            transaction.setDescription("Transfer to phone " + normalizedPhone);
            transaction.setMetadata(buildTransferMetadata(normalizedPhone, recipientUserId, note, idempotencyKey));
            
            Transaction savedTransaction = transactionRepository.save(transaction);

            // 7. Notify
            // Notify Sender
            publishTransactionEvent(fromUserId, savedTransaction, false, recipientUserId);
            
            // Notify Receiver
            publishTransactionEvent(recipientUserId, savedTransaction, true, fromUserId);

            return savedTransaction;

        } catch (DataIntegrityViolationException e) {
            // 8. Handle DB level conflict
            if (idempotencyKey != null) {
                return transactionRepository.findByTransactionId(idempotencyKey)
                        .orElseThrow(() -> new RuntimeException("Transaction conflict detected but record not found", e));
            }
            throw e;
        }
    }

    private Account getOrCreateLedgerAccount(String userId, String currency) {
        UUID userUuid = UUID.fromString(userId);
        return accountRepository.findByUserId(userUuid).stream().findFirst()
                .orElseGet(() -> {
                    Account newAcc = Account.builder()
                            .userId(userUuid)
                            .accountName("User Wallet Account")
                            .balance(BigDecimal.ZERO)
                            .currency(currency != null ? currency : "THB")
                            .status("ACTIVE")
                            .kycStatus(com.jledger.finance.domain.enums.KycStatus.APPROVED)
                            .version(1)
                            .build();
                    return accountRepository.save(Objects.requireNonNull(newAcc));
                });
    }

    @Transactional
    public Transaction transferByWalletId(String fromUserId, String toWalletId, BigDecimal amount) {
        Long toWalletIdLong = Long.parseLong(toWalletId);
        
        // 1. Fetch source wallet ID to determine lock order
        Wallet fromWalletInfo = walletRepository.findByUserId(fromUserId)
                .orElseThrow(() -> new RuntimeException("Source wallet not found"));
        Long fromWalletId = fromWalletInfo.getId();

        // 2. Acquire locks in consistent order (ID ascending) to prevent deadlocks
        Wallet fromWallet;
        Wallet toWallet;
        if (fromWalletId < toWalletIdLong) {
            fromWallet = walletRepository.findByIdForUpdate(fromWalletId)
                    .orElseThrow(() -> new RuntimeException("Source wallet not found"));
            toWallet = walletRepository.findByIdForUpdate(toWalletIdLong)
                    .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));
        } else if (fromWalletId > toWalletIdLong) {
            toWallet = walletRepository.findByIdForUpdate(toWalletIdLong)
                    .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));
            fromWallet = walletRepository.findByIdForUpdate(fromWalletId)
                    .orElseThrow(() -> new RuntimeException("Source wallet not found"));
        } else {
            throw new IllegalArgumentException("Cannot transfer to the same wallet");
        }

        if (!fromWallet.getIsActive()) {
            throw new RuntimeException("Source wallet is inactive");
        }

        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        if (!toWallet.getIsActive()) {
            throw new RuntimeException("Recipient wallet is inactive");
        }

        // 3. Acquire Ledger Account locks in consistent order
        Account senderAccountInfo = getOrCreateLedgerAccount(fromUserId, fromWallet.getCurrency());
        Account receiverAccountInfo = getOrCreateLedgerAccount(toWallet.getUserId(), toWallet.getCurrency());
        
        Account senderAccount;
        Account receiverAccount;
        
        if (senderAccountInfo.getId().compareTo(receiverAccountInfo.getId()) < 0) {
            senderAccount = accountRepository.findByIdForUpdate(senderAccountInfo.getId()).get();
            receiverAccount = accountRepository.findByIdForUpdate(receiverAccountInfo.getId()).get();
        } else if (senderAccountInfo.getId().compareTo(receiverAccountInfo.getId()) > 0) {
            receiverAccount = accountRepository.findByIdForUpdate(receiverAccountInfo.getId()).get();
            senderAccount = accountRepository.findByIdForUpdate(senderAccountInfo.getId()).get();
        } else {
            // Same account (different wallets for same user? Possible but unlikely in this flow)
            senderAccount = receiverAccount = accountRepository.findByIdForUpdate(senderAccountInfo.getId()).get();
        }

        // 4. Update Balances
        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        toWallet.setBalance(toWallet.getBalance().add(amount));
        
        senderAccount.setBalance(senderAccount.getBalance().subtract(amount));
        receiverAccount.setBalance(receiverAccount.getBalance().add(amount));
        
        accountRepository.save(senderAccount);
        accountRepository.save(receiverAccount);

        walletRepository.save(Objects.requireNonNull(fromWallet));
        walletRepository.save(Objects.requireNonNull(toWallet));

        String txId = UUID.randomUUID().toString();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TRANSFER);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(fromWallet.getId());
        transaction.setToWalletId(toWallet.getId());
        transaction.setDescription("Transfer to wallet " + toWalletId);
        transaction.setMetadata("{\"toWalletId\":\"" + toWalletId + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Record Ledger Entries
        LedgerEntry senderEntry = LedgerEntry.builder()
                .account(senderAccount)
                .entryType("DEBIT")
                .amount(amount)
                .transactionId(txId)
                .description("Transfer to wallet " + toWalletId)
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(senderEntry));
        
        LedgerEntry receiverEntry = LedgerEntry.builder()
                .account(receiverAccount)
                .entryType("CREDIT")
                .amount(amount)
                .transactionId(txId)
                .description("Transfer from wallet " + fromWallet.getId())
                .build();
        ledgerEntryRepository.save(Objects.requireNonNull(receiverEntry));

        // Notify Sender
        publishTransactionEvent(fromUserId, savedTransaction, false);
        // Notify Receiver
        publishTransactionEvent(toWallet.getUserId(), savedTransaction, true);

        return savedTransaction;
    }

    @Transactional
    public Transaction transferByQR(String fromUserId, String qrData, BigDecimal amount) {
        // Mock: Parse QR data to get wallet ID
        String toWalletId = qrData; // Simplified for mock

        return transferByWalletId(fromUserId, toWalletId, amount);
    }

    public String generateQR(String userId, BigDecimal amount) {
        // Mock: Generate QR code data
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return "jledger|qr|" + wallet.getId() + "|" + amount.toString();
    }

    @Transactional
    public Transaction payQR(String fromUserId, String qrData, BigDecimal amount) {
        // Mock: Parse QR and pay
        return transferByQR(fromUserId, qrData, amount);
    }

    @Transactional
    public Transaction payUtilityBill(String userId, String billerCode, String accountNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Mock bill payment
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.BILL_PAYMENT);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Utility bill payment to " + billerCode);
        transaction.setMetadata("{\"billersCode\":\"" + billerCode + "\",\"accountNumber\":\"" + accountNumber + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);
        publishTransactionEvent(userId, savedTransaction, false);

        return savedTransaction;
    }

    @Transactional
    public Transaction payCreditCardBill(String userId, String cardNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.BILL_PAYMENT);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Credit card payment for " + cardNumber);
        transaction.setMetadata("{\"cardNumber\":\"" + cardNumber + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);
        publishTransactionEvent(userId, savedTransaction, false);

        return savedTransaction;
    }

    @Transactional
    public Transaction payMobileTopup(String userId, String phoneNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.MOBILE_TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Mobile top-up for " + phoneNumber);
        transaction.setMetadata("{\"phoneNumber\":\"" + phoneNumber + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);
        publishTransactionEvent(userId, savedTransaction, false);

        return savedTransaction;
    }

    // Admin methods
    public org.springframework.data.domain.Page<Wallet> getAllWallets(org.springframework.data.domain.Pageable pageable) {
        return walletRepository.findAll(Objects.requireNonNull(pageable));
    }

    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    public List<Wallet> searchWallets(String query) {
        // Simplified search - in real system would search by userId, phone, etc.
        return walletRepository.findAll().stream()
                .filter(w -> w.getUserId().contains(query))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional
    public Wallet adjustBalance(String userId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(Objects.requireNonNull(wallet));

        // Record adjustment transaction
        Transaction transaction = new Transaction();
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");

        transactionRepository.save(transaction);

        return updated;
    }

    private String findUserIdByPhone(String phone) {
        logger.info("=== findUserIdByPhone START ===");
        logger.info("Input phone: '{}'", phone);
        
        String e164Phone = normalizePhoneToE164(phone);
        logger.info("Normalized to E.164: '{}'", e164Phone);
        
        List<String> phoneVariations = getPhoneCandidates(e164Phone);
        logger.info("Generated {} phone variations: {}", phoneVariations.size(), phoneVariations);
        
        for (String variation : phoneVariations) {
            logger.info("Trying variation: '{}'", variation);
            String sql = "SELECT id FROM identity.users WHERE \"phoneNumber\" = ? LIMIT 1";
            List<String> ids = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("id"), variation);
            logger.info("Query returned {} results for variation: '{}'", ids.size(), variation);
            
            if (!ids.isEmpty()) {
                logger.info("=== findUserIdByPhone END (SUCCESS) ===");
                return ids.get(0);
            }
        }
        
        // Debug: show sample users in database
        try {
            String debugSql = "SELECT id, \"phoneNumber\" FROM identity.users LIMIT 5";
            List<Map<String, Object>> samples = jdbcTemplate.queryForList(debugSql);
            logger.warn("Sample users in database: {}", samples);
        } catch (Exception e) {
            logger.error("Failed to query sample users", e);
        }
        
        logger.error("=== findUserIdByPhone END (NOT FOUND) ===");
        throw new RuntimeException("Recipient not found");
    }

    private List<String> getPhoneCandidates(String e164Phone) {
        List<String> candidates = new ArrayList<>();
        String digits = e164Phone.replaceAll("\\D", "");
        
        // Try E.164 format (+66...)
        candidates.add(e164Phone);
        
        // Try local format (0...)
        if (digits.startsWith("66") && digits.length() == 11) {
            candidates.add("0" + digits.substring(2));
        }
        
        logger.debug("Phone candidates generated: {}", candidates);
        return candidates;
    }

    private String normalizePhoneToE164(String phone) {
        logger.info("normalizePhoneToE164 input: '{}'", phone);
        if (phone == null) {
            throw new IllegalArgumentException("recipientPhone is required");
        }
        String digits = phone.replaceAll("\\D", "");
        logger.info("Digits after removing non-digits: '{}'", digits);
        
        // Convert to +66 format (E.164)
        if (digits.startsWith("66") && digits.length() == 11) {
            String result = "+66" + digits.substring(2);
            logger.info("Case: starts with 66, length 11 -> '{}'", result);
            return result;
        }
        if (digits.startsWith("0") && digits.length() == 10) {
            String result = "+66" + digits.substring(1);
            logger.info("Case: starts with 0, length 10 -> '{}'", result);
            return result;
        }
        if (digits.length() == 9) {
            String result = "+66" + digits;
            logger.info("Case: length 9 -> '{}'", result);
            return result;
        }
        // If already has + prefix, keep it
        if (phone.startsWith("+")) {
            logger.info("Case: already has + prefix -> '{}'", phone);
            return phone;
        }
        // Default: assume Thai number and add +66
        String result = "+66" + digits;
        logger.info("Case: default -> '{}'", result);
        return result;
    }

    private String maskPhone(String phone) {
        return phone.substring(0, 3) + "-***-" + phone.substring(phone.length() - 3);
    }

    private String buildTransferMetadata(String phone, String recipientUserId, String note, String idempotencyKey) {
        String escapedNote = note == null ? "" : escapeJson(note);
        return String.format(
                "{\"recipientPhone\":\"%s\",\"recipientUserId\":\"%s\",\"note\":\"%s\",\"idempotencyKey\":\"%s\"}",
                escapeJson(phone),
                escapeJson(recipientUserId),
                escapedNote,
                idempotencyKey == null ? "" : escapeJson(idempotencyKey)
        );
    }

    private void publishTransactionEvent(String userId, Transaction transaction, boolean isReceiver) {
        publishTransactionEvent(userId, transaction, isReceiver, null);
    }

    private void publishTransactionEvent(String userId, Transaction transaction, boolean isReceiver, String otherPartyUserId) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", userId);
            
            // Map TransactionType to NotificationEventType for the worker
            NotificationEventType notificationType = switch (transaction.getType()) {
                case TOPUP -> NotificationEventType.TOPUP;
                case TRANSFER -> NotificationEventType.TRANSFER;
                case WITHDRAWAL -> NotificationEventType.WITHDRAW;
                case BILL_PAYMENT -> NotificationEventType.BILL_PAYMENT;
                default -> NotificationEventType.FINANCE;
            };
            event.put("eventType", notificationType.name());
            
            event.put("amount", transaction.getAmount());
            event.put("referenceId", transaction.getTransactionId() != null ? transaction.getTransactionId() : transaction.getId().toString());
            event.put("status", transaction.getStatus().name());
            event.put("description", transaction.getDescription());
            event.put("timestamp", LocalDateTime.now().toString());

            // Add metadata for worker to use in notification body and deep linking
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("transactionId", transaction.getId());
            metadata.put("amount", transaction.getAmount());
            metadata.put("description", transaction.getDescription());
            metadata.put("isReceiver", isReceiver);

            // Add other party info if available
            if (otherPartyUserId != null) {
                if (isReceiver) {
                    metadata.put("senderUserId", otherPartyUserId);
                } else {
                    metadata.put("recipientUserId", otherPartyUserId);
                }
            }
            
            // Extract info from existing metadata if available
            if (transaction.getMetadata() != null && !transaction.getMetadata().isBlank()) {
                try {
                    Map<String, Object> txMetadata = objectMapper.readValue(transaction.getMetadata(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    metadata.putAll(txMetadata);
                    
                    // Standardize source field
                    if (txMetadata.containsKey("bankName")) {
                        metadata.put("source", txMetadata.get("bankName"));
                    } else if (transaction.getDescription().contains("Stripe")) {
                        metadata.put("source", "Credit Card (Stripe)");
                    }
                } catch (Exception e) {
                    logger.warn("Failed to parse transaction metadata for outbox: {}", e.getMessage());
                }
            }
            
            event.put("metadata", metadata);

            IntegrationOutbox outbox = IntegrationOutbox.builder()
                    .eventType("FINANCE")
                    .payload(objectMapper.valueToTree(event))
                    .status("PENDING")
                    .build();

            integrationOutboxRepository.save(Objects.requireNonNull(outbox));
            logger.info("[Outbox] Saved transaction event for user {}: {}", userId, transaction.getType());
        } catch (Exception e) {
            logger.error("Failed to save transaction event to outbox", e);
        }
    }

    public Optional<Transaction> getTransactionById(String id) {
        try {
            // Try as Long first (Primary Key)
            try {
                Long longId = Long.parseLong(id);
                Optional<Transaction> txn = transactionRepository.findById(longId);
                if (txn.isPresent()) return txn;
            } catch (NumberFormatException e) {
                // Not a long, move to next check
            }

            // Try as string-based transactionId (e.g., p2p_...)
            return transactionRepository.findByTransactionId(id);
        } catch (Exception e) {
            logger.error("Error fetching transaction by ID: {}", id, e);
            return Optional.empty();
        }
    }
}
