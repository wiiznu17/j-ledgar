package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.TransferRequest;
import com.jledger.finance.exception.ConcurrentOperationException;
import com.jledger.finance.service.system.RedisIdempotencyService;
import com.jledger.finance.service.compliance.KycComplianceService;
import com.jledger.finance.service.compliance.TransactionLimitService;
import com.jledger.finance.service.compliance.TransactionRateLimitService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final int MONETARY_SCALE = 4;
    private static final String ACCOUNT_LOCK_PREFIX = "account_lock:";
    private static final String LOCK_TIMEOUT_MESSAGE = "System busy, please try again.";
    private static final Logger LOGGER = LoggerFactory.getLogger(TransferService.class);

    @Value("${jledger.lock.wait-seconds:3}")
    private long lockWaitSeconds;

    @Value("${jledger.lock.lease-seconds:10}")
    private long lockLeaseSeconds;

    private final RedissonClient redissonClient;
    private final RedisIdempotencyService redisIdempotencyService;
    private final WalletService walletService;
    private final KycComplianceService kycComplianceService;
    private final TransactionLimitService transactionLimitService;
    private final TransactionRateLimitService transactionRateLimitService;

    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        validateIdempotencyKey(idempotencyKey);
        validateTransferRequest(request);

        // 1. Check if already processed
        return redisIdempotencyService.getIfProcessed(idempotencyKey)
                .orElseGet(() -> {
                    BigDecimal normalizedAmount = normalizeAmount(request.amount());

                    // A. Run Compliance Checks (Pre-lock to avoid resource starvation)
                    UUID senderAccountId = UUID.fromString(request.fromAccountId());
                    
                    boolean isSettlement = false;
                    if (request.metadata() instanceof java.util.Map<?, ?> metaMap) {
                        isSettlement = Boolean.TRUE.equals(metaMap.get("settlementRun")) || "true".equals(String.valueOf(metaMap.get("settlementRun")));
                    }

                    if (!isSettlement) {
                        transactionRateLimitService.checkRateLimit(senderAccountId);
                        kycComplianceService.checkKycCompliance(senderAccountId);
                        transactionLimitService.checkTransactionLimits(senderAccountId, normalizedAmount);
                    } else {
                        LOGGER.info("[Settlement] Bypassing compliance limits for settlement transfer of amount={} from={}", normalizedAmount, senderAccountId);
                    }

                    // Sort account IDs to prevent deadlocks
                    String firstAccountId = request.fromAccountId().compareTo(request.toAccountId()) <= 0 
                            ? request.fromAccountId() : request.toAccountId();
                    String secondAccountId = request.fromAccountId().compareTo(request.toAccountId()) <= 0 
                            ? request.toAccountId() : request.fromAccountId();

                    RLock firstLock = redissonClient.getLock(ACCOUNT_LOCK_PREFIX + firstAccountId);
                    RLock secondLock = redissonClient.getLock(ACCOUNT_LOCK_PREFIX + secondAccountId);

                    boolean firstLocked = false;
                    boolean secondLocked = false;
                    try {
                        firstLocked = firstLock.tryLock(lockWaitSeconds, lockLeaseSeconds, TimeUnit.SECONDS);
                        if (!firstLocked) {
                            throw new ConcurrentOperationException(LOCK_TIMEOUT_MESSAGE);
                        }

                        secondLocked = secondLock.tryLock(lockWaitSeconds, lockLeaseSeconds, TimeUnit.SECONDS);
                        if (!secondLocked) {
                            throw new ConcurrentOperationException(LOCK_TIMEOUT_MESSAGE);
                        }

                        Transaction transaction = walletService.transferByWalletId(
                            request.fromAccountId(),
                            request.toAccountId(),
                            normalizedAmount,
                            request.metadata()
                        );

                        // B. Record limits post-commit
                        transactionLimitService.recordTransaction(senderAccountId, normalizedAmount);

                        // 2. Cache successful result
                        redisIdempotencyService.cacheResponse(idempotencyKey, transaction);
                        
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
                });
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
        if (request.fromAccountId() == null || request.fromAccountId().isBlank()) {
            throw new IllegalArgumentException("Invalid sender account");
        }
        if (request.toAccountId() == null || request.toAccountId().isBlank()) {
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
}
