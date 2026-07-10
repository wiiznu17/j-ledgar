package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.Wallet;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class WalletCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CACHE_PREFIX = "wallet:";

    public void cacheWallet(Wallet wallet) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    doCacheWallet(wallet);
                }
            });
        } else {
            doCacheWallet(wallet);
        }
    }

    public void doCacheWallet(Wallet wallet) {
        String cacheKey = CACHE_PREFIX + wallet.getUserId();
        redisTemplate.opsForValue().set(cacheKey, Objects.requireNonNull(wallet), 5, TimeUnit.MINUTES);
    }
}
