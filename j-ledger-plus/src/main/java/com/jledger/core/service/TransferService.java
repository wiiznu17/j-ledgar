package com.jledger.core.service;

import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConcurrentOperationException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final int MONETARY_SCALE = 4;
    private static final long LOCK_WAIT_SECONDS = 3;
    private static final long LOCK_LEASE_SECONDS = 10;
    private static final String ACCOUNT_LOCK_PREFIX = "account_lock:";
    private static final String LOCK_TIMEOUT_MESSAGE = "System busy, please try again.";
    private static final Logger LOGGER = LoggerFactory.getLogger(TransferService.class);

    private final RedissonClient redissonClient;
    private final RedisIdempotencyService redisIdempotencyService;
    private final TransferExecutionService transferExecutionService;

    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        validateIdempotencyKey(idempotencyKey);
        validateTransferRequest(request);
        BigDecimal normalizedAmount = normalizeAmount(request.amount());

        Transaction cachedTransaction = getCachedResponseIfAvailable(idempotencyKey, request, normalizedAmount);
        if (cachedTransaction != null) {
            return cachedTransaction;
        }

        RLock firstLock = redissonClient.getLock(ACCOUNT_LOCK_PREFIX + smallerUuidString(
                request.fromAccountId(),
                request.toAccountId()
        ));
        RLock secondLock = redissonClient.getLock(ACCOUNT_LOCK_PREFIX + largerUuidString(
                request.fromAccountId(),
                request.toAccountId()
        ));

        boolean firstLocked = false;
        boolean secondLocked = false;
        try {
            firstLocked = firstLock.tryLock(LOCK_WAIT_SECONDS, LOCK_LEASE_SECONDS, TimeUnit.SECONDS);
            if (!firstLocked) {
                throw new ConcurrentOperationException(LOCK_TIMEOUT_MESSAGE);
            }

            secondLocked = secondLock.tryLock(LOCK_WAIT_SECONDS, LOCK_LEASE_SECONDS, TimeUnit.SECONDS);
            if (!secondLocked) {
                throw new ConcurrentOperationException(LOCK_TIMEOUT_MESSAGE);
            }

            Transaction cachedAfterLock = getCachedResponseIfAvailable(idempotencyKey, request, normalizedAmount);
            if (cachedAfterLock != null) {
                return cachedAfterLock;
            }

            Transaction transaction = transferExecutionService.performTransferInDb(
                    idempotencyKey,
                    request,
                    normalizedAmount
            );
            cacheResponseSafely(idempotencyKey, transaction);
            return transaction;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ConcurrentOperationException("Transfer interrupted while waiting for account lock", exception);
        } finally {
            if (secondLocked && secondLock.isHeldByCurrentThread()) {
                secondLock.unlock();
            }
            if (firstLocked && firstLock.isHeldByCurrentThread()) {
                firstLock.unlock();
            }
        }
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key header is required");
        }
    }

    private void validateTransferRequest(TransferRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Transfer request is required");
        }
        if (request.fromAccountId() == null) {
            throw new IllegalArgumentException("Invalid sender account");
        }
        if (request.toAccountId() == null) {
            throw new IllegalArgumentException("Invalid receiver account");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }
        if (request.currency() == null || !request.currency().matches("^[A-Z]{3}$")) {
            throw new IllegalArgumentException("Currency must be a 3-letter uppercase code");
        }
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new IllegalArgumentException("Sender and receiver accounts must be different");
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        try {
            return amount.setScale(MONETARY_SCALE, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Transfer amount must have up to 4 decimal places", exception);
        }
    }

    private Transaction getCachedResponseIfAvailable(
            String idempotencyKey,
            TransferRequest request,
            BigDecimal normalizedAmount
    ) {
        if (!redisIdempotencyService.isProcessed(idempotencyKey)) {
            return null;
        }

        return redisIdempotencyService.getCachedResponse(idempotencyKey)
                .map(transaction -> {
                    transferExecutionService.validateIdempotentReplay(transaction, request, normalizedAmount);
                    return transaction;
                })
                .orElse(null);
    }

    private void cacheResponseSafely(String idempotencyKey, Transaction transaction) {
        try {
            redisIdempotencyService.cacheResponse(idempotencyKey, transaction);
        } catch (RuntimeException exception) {
            LOGGER.warn("Transfer completed but failed to cache idempotency response for key {}", idempotencyKey, exception);
        }
    }

    private String smallerUuidString(UUID firstAccountId, UUID secondAccountId) {
        return firstAccountId.toString().compareTo(secondAccountId.toString()) <= 0
                ? firstAccountId.toString()
                : secondAccountId.toString();
    }

    private String largerUuidString(UUID firstAccountId, UUID secondAccountId) {
        return firstAccountId.toString().compareTo(secondAccountId.toString()) <= 0
                ? secondAccountId.toString()
                : firstAccountId.toString();
    }
}
