package com.jledger.finance.service.wallet.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletQueryService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final WalletCommonService walletCommonService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "wallet:";
    private static final BigDecimal DAILY_LIMIT = new BigDecimal("1000000");
    private static final BigDecimal TRANSACTION_LIMIT = new BigDecimal("50000");

    public Optional<Wallet> getWallet(String userId) {
        String cacheKey = CACHE_PREFIX + userId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof Wallet wallet) {
            Account account = walletCommonService.getOrCreateLedgerAccount(wallet.getUserId(), wallet.getCurrency());
            wallet.setAccountId(account.getId());
            return Optional.of(wallet);
        }
        if (cached instanceof Map<?, ?> cachedMap) {
            try {
                Wallet wallet = objectMapper.convertValue(cachedMap, Wallet.class);
                Account account = walletCommonService.getOrCreateLedgerAccount(wallet.getUserId(), wallet.getCurrency());
                wallet.setAccountId(account.getId());
                return Optional.of(wallet);
            } catch (IllegalArgumentException ignored) {
                redisTemplate.delete(cacheKey);
            }
        }

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        wallet.ifPresent(w -> {
            Account account = walletCommonService.getOrCreateLedgerAccount(w.getUserId(), w.getCurrency());
            w.setAccountId(account.getId());
            redisTemplate.opsForValue().set(cacheKey, Objects.requireNonNull(w), 5, TimeUnit.MINUTES);
        });
        return wallet;
    }

    public Wallet getWalletById(Long id) {
        return walletRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
    }

    public boolean validateTransaction(String userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId).orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (amount.compareTo(TRANSACTION_LIMIT) > 0) {
            throw new IllegalArgumentException("Transaction amount exceeds limit");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        return true;
    }

    public Map<String, BigDecimal> getTransactionLimits(String userId) {
        return Map.of(
            "dailyLimit", DAILY_LIMIT,
            "transactionLimit", TRANSACTION_LIMIT
        );
    }

    public List<Transaction> getTopUpHistory(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        return transactionRepository.findByAccountIdAndType(userAccount.getId(), TransactionType.TOPUP, PageRequest.of(0, 50));
    }

    public List<Transaction> getTransactions(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        return transactionRepository.findByAccountId(userAccount.getId(), PageRequest.of(0, 50));
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
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        java.util.UUID accountId = userAccount.getId();

        int resolvedPage = Math.max(page == null ? 0 : page, 0);
        int resolvedSize = Math.min(Math.max(size == null ? 20 : size, 1), 100);
        Pageable pageable = PageRequest.of(resolvedPage, resolvedSize);

        boolean hasType = type != null;
        boolean hasDate = from != null || to != null;
        LocalDateTime resolvedFrom = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime resolvedTo = to != null ? to : LocalDateTime.of(9999, 12, 31, 23, 59);

        if (hasType && hasDate) {
            return transactionRepository.findByAccountIdAndTypeAndDateRange(accountId, type, resolvedFrom, resolvedTo, pageable);
        }
        if (hasType) {
            return transactionRepository.findByAccountIdAndType(accountId, type, pageable);
        }
        if (hasDate) {
            return transactionRepository.findByAccountIdAndDateRange(accountId, resolvedFrom, resolvedTo, pageable);
        }
        return transactionRepository.findByAccountId(accountId, pageable);
    }

    public List<Transaction> getQRHistory(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        Account userAccount = walletCommonService.getOrCreateLedgerAccount(userId, wallet.getCurrency());
        return transactionRepository.findByAccountIdAndType(userAccount.getId(), TransactionType.PAYMENT, PageRequest.of(0, 50));
    }

    public Page<Wallet> getAllWallets(Pageable pageable) {
        return walletRepository.findAll(Objects.requireNonNull(pageable));
    }

    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    public List<Wallet> searchWallets(String query) {
        return walletRepository.findAll().stream()
                .filter(w -> w.getUserId().contains(query))
                .collect(Collectors.toList());
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Optional<Transaction> getTransactionById(String id) {
        try {
            try {
                Long longId = Long.valueOf(id);
                Optional<Transaction> txn = transactionRepository.findById(longId);
                if (txn.isPresent()) return txn;
            } catch (NumberFormatException e) {
                // Not a long
            }
            return transactionRepository.findByTransactionId(id);
        } catch (Exception e) {
            log.error("Error fetching transaction by ID: {}", id, e);
            return Optional.empty();
        }
    }
}
