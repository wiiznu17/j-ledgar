package com.jledger.finance.service.wallet.impl;

import com.jledger.finance.config.JLedgerProperties;
import com.jledger.finance.service.wallet.WalletService;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.domain.entity.LinkedBankAccount;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.exception.ConflictException;
import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TopUpService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LinkedBankAccountService linkedBankAccountService;
    private final WalletCacheService walletCacheService;
    private final WalletCommonService walletCommonService;
    private final JLedgerProperties jLedgerProperties;

    @Transactional
    public Transaction topUpBank(String userId, BigDecimal amount, Long bankAccountId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new IllegalArgumentException("Wallet is inactive");
        }

        LinkedBankAccount bankAccount = linkedBankAccountService.findOwnedLinkedBankAccount(userId, bankAccountId);
        if (!Boolean.TRUE.equals(bankAccount.getIsVerified())) {
            throw new IllegalArgumentException("Bank account is not verified");
        }

        Account systemAccount = accountRepository.findByIdForUpdate(jLedgerProperties.getSystem().getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("System account not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updatedWallet = walletRepository.save(Objects.requireNonNull(wallet));
        walletCacheService.cacheWallet(updatedWallet);

        systemAccount.setBalance(systemAccount.getBalance().add(amount));
        accountRepository.save(systemAccount);

        String txId = walletCommonService.generateReadableTransactionId();
        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        walletCommonService.recordLedgerEntries(systemAccount, userAccount, amount, txId, String.format("Bank top-up from %s", bankAccount.getBankName()));

        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setFromAccountId(jLedgerProperties.getSystem().getAccountId());
        transaction.setToAccountId(userAccount.getId());
        transaction.setDescription(
                String.format("Bank top-up from %s %s", bankAccount.getBankName(), bankAccount.getAccountNumber())
        );
        transaction.setMetadata(buildTopUpBankMetadata(bankAccount));

        Transaction savedTransaction = transactionRepository.save(transaction);
        walletCommonService.publishTransactionEvent(userId, savedTransaction, true);
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

        Optional<Transaction> existing = transactionRepository.findByReferenceId(externalRef);
        if (existing.isPresent()) {
            return existing.get();
        }

        try {
            Account systemAccount = accountRepository.findByIdForUpdate(jLedgerProperties.getSystem().getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("System account not found"));

            Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

            if (!wallet.getIsActive()) {
                throw new IllegalArgumentException("Wallet is inactive");
            }

            if (currency != null && !currency.isBlank() && wallet.getCurrency() != null
                    && !wallet.getCurrency().equalsIgnoreCase(currency)) {
                throw new IllegalArgumentException("Currency mismatch");
            }

            systemAccount.setBalance(systemAccount.getBalance().add(amount));
            wallet.setBalance(wallet.getBalance().add(amount));

            accountRepository.save(systemAccount);

            Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
            userAccount.setBalance(userAccount.getBalance().add(amount));
            accountRepository.save(userAccount);
            
            String txId = walletCommonService.generateReadableTransactionId();

            LedgerEntry systemEntry = LedgerEntry.builder()
                    .account(systemAccount)
                    .entryType("DEBIT")
                    .amount(amount)
                    .transactionId(txId)
                    .description(String.format("%s Top-up credit for user %s", provider, userId))
                    .build();
            ledgerEntryRepository.save(Objects.requireNonNull(systemEntry));

            LedgerEntry userEntry = LedgerEntry.builder()
                    .account(userAccount)
                    .entryType("CREDIT")
                    .amount(amount)
                    .transactionId(txId)
                    .description(String.format("%s Top-up credit", provider == null ? "EXTERNAL" : provider))
                    .build();
            ledgerEntryRepository.save(Objects.requireNonNull(userEntry));

            Wallet updatedWallet = walletRepository.save(Objects.requireNonNull(wallet));
            walletCacheService.cacheWallet(updatedWallet);

            Transaction transaction = new Transaction();
            transaction.setTransactionId(txId);
            transaction.setReferenceId(externalRef);
            transaction.setType(TransactionType.TOPUP);
            transaction.setAmount(amount);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setFromWalletId(null);
            transaction.setToWalletId(wallet.getId());
            transaction.setFromAccountId(jLedgerProperties.getSystem().getAccountId());
            transaction.setToAccountId(userAccount.getId());
            transaction.setDescription(String.format("%s top-up credit", provider == null ? "EXTERNAL" : provider));
            transaction.setMetadata(metadataJson);

            Transaction savedTransaction = transactionRepository.save(transaction);
            walletCommonService.publishTransactionEvent(userId, savedTransaction, true);
            return savedTransaction;

        } catch (DataIntegrityViolationException e) {
            return transactionRepository.findByReferenceId(externalRef)
                    .orElseThrow(() -> new ConflictException("Transaction conflict detected but record not found", e));
        }
    }

    @Transactional
    public Transaction topUpCounter(String userId, BigDecimal amount, String counterCode) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new IllegalArgumentException("Wallet is inactive");
        }

        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        Account systemAccount = accountRepository.findByIdForUpdate(jLedgerProperties.getSystem().getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("System account not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
        accountRepository.save(systemAccount);

        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        String txId = walletCommonService.generateReadableTransactionId();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setFromAccountId(jLedgerProperties.getSystem().getAccountId());
        transaction.setToAccountId(userAccount.getId());
        transaction.setDescription("Counter top-up at " + counterCode);
        transaction.setMetadata("{\"counterCode\":\"" + counterCode + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);

        walletCommonService.recordLedgerEntries(systemAccount, userAccount, amount, savedTransaction.getTransactionId(), "Top-up");

        return savedTransaction;
    }

    @Transactional
    public Transaction topUpCash(String userId, BigDecimal amount, String agentId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new IllegalArgumentException("Wallet is inactive");
        }

        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        Account systemAccount = accountRepository.findByIdForUpdate(jLedgerProperties.getSystem().getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("System account not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(Objects.requireNonNull(wallet));

        systemAccount.setBalance(systemAccount.getBalance().subtract(amount));
        accountRepository.save(systemAccount);

        userAccount.setBalance(userAccount.getBalance().add(amount));
        accountRepository.save(userAccount);

        String txId = walletCommonService.generateReadableTransactionId();
        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setFromAccountId(jLedgerProperties.getSystem().getAccountId());
        transaction.setToAccountId(userAccount.getId());
        transaction.setDescription("Cash top-up at agent " + agentId);
        transaction.setMetadata("{\"agentId\":\"" + agentId + "\"}");

        Transaction savedTransaction = transactionRepository.save(transaction);

        walletCommonService.recordLedgerEntries(systemAccount, userAccount, amount, savedTransaction.getTransactionId(), "Top-up");

        return savedTransaction;
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
}
