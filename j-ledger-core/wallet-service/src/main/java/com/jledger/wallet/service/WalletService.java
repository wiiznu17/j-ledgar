package com.jledger.wallet.service;

import com.jledger.wallet.model.Wallet;
import com.jledger.wallet.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

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

        return walletRepository.save(wallet);
    }

    public Optional<Wallet> getWallet(String userId) {
        String cacheKey = CACHE_PREFIX + userId;
        Wallet cached = (Wallet) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        wallet.ifPresent(w -> redisTemplate.opsForValue().set(cacheKey, w, 5, TimeUnit.MINUTES));
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
        Wallet updated = walletRepository.save(wallet);

        // Update cache
        String cacheKey = CACHE_PREFIX + userId;
        redisTemplate.opsForValue().set(cacheKey, updated, 5, TimeUnit.MINUTES);

        return updated;
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
        return walletRepository.save(wallet);
    }
}
