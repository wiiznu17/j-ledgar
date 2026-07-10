package com.jledger.finance.service.wallet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.domain.enums.WalletStatus;
import com.jledger.finance.exception.ConflictException;
import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletAdminService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final WalletCacheService walletCacheService;
    private final WalletCommonService walletCommonService;
    private final LinkedBankAccountService linkedBankAccountService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_ACCOUNT_ID = "00000000-0000-0000-0000-000000000000";

    @Transactional
    public Wallet createWallet(String userId, String currency) {
        if (walletRepository.existsByUserId(userId)) {
            throw new ConflictException("Wallet already exists for user");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setCurrency(currency);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setIsActive(true);

        Wallet createdWallet = walletRepository.save(wallet);
        linkedBankAccountService.ensureDefaultLinkedBankAccountExists(userId);
        return createdWallet;
    }

    @Transactional
    public Wallet updateBalance(String userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new IllegalArgumentException("Wallet is inactive");
        }

        BigDecimal newBalance = wallet.getBalance().add(amount);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet deactivateWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setIsActive(false);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet activateWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setIsActive(true);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet freezeWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setStatus(WalletStatus.FROZEN);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet unfreezeWallet(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setStatus(WalletStatus.ACTIVE);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet deactivateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setIsActive(false);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet activateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setIsActive(true);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    public Wallet updateLimits(Long id, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setDailyLimit(dailyLimit);
        wallet.setMonthlyLimit(monthlyLimit);
        Wallet saved = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(saved);
        return saved;
    }

    @Transactional
    public Wallet adjustBalanceById(Long id, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(updated);

        // Update Ledger Account
        Account userAccount = walletCommonService.getOrCreateLedgerAccount(wallet.getUserId(), wallet.getCurrency());
        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        // Update System Account (for reconciliation)
        Account systemAccount = accountRepository.findByIdForUpdate(UUID.fromString(SYSTEM_ACCOUNT_ID))
                .orElseThrow(() -> new ResourceNotFoundException("System account not found"));
        systemAccount.setBalance(systemAccount.getBalance().add(amount));
        accountRepository.save(systemAccount);

        // Record adjustment transaction
        String txId = walletCommonService.generateReadableTransactionId();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setFromAccountId(UUID.fromString(SYSTEM_ACCOUNT_ID));
        transaction.setToAccountId(userAccount.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        
        try {
            Map<String, Object> metaMap = Map.of("reason", reason, "adminAdjustment", true);
            transaction.setMetadata(objectMapper.writeValueAsString(metaMap));
        } catch (Exception e) {
            log.warn("Failed to serialize metadata for balance adjustment: {}", e.getMessage());
            transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");
        }

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

        walletCommonService.publishTransactionEvent(wallet.getUserId(), savedTransaction, true);

        return updated;
    }

    @Transactional
    public Wallet adjustBalance(String userId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(updated);

        // Record adjustment transaction
        Transaction transaction = new Transaction();
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        
        try {
            Map<String, Object> metaMap = Map.of("reason", reason, "adminAdjustment", true);
            transaction.setMetadata(objectMapper.writeValueAsString(metaMap));
        } catch (Exception e) {
            log.warn("Failed to serialize metadata for adjustBalance: {}", e.getMessage());
            transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");
        }

        transactionRepository.save(transaction);

        return updated;
    }
}
