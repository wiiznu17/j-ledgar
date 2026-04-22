package com.jledger.core.service;

import com.jledger.core.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Transaction-level rate limiting service.
 * Prevents rapid-fire transactions from a single account to protect against:
 * - Automated attacks
 * - Accidental double-spending attempts
 * - API abuse
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionRateLimitService {

    private final RedissonClient redissonClient;

    // Rate limit: 10 transactions per minute per account
    private static final int MAX_TRANSACTIONS_PER_MINUTE = 10;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 1;

    // Rate limit: 30 transactions per hour per account
    private static final int MAX_TRANSACTIONS_PER_HOUR = 30;
    private static final int RATE_LIMIT_WINDOW_HOURS = 1;

    // Rate limit: 100 transactions per day per account
    private static final int MAX_TRANSACTIONS_PER_DAY = 100;
    private static final int RATE_LIMIT_WINDOW_DAYS = 1;

    private static final String RATE_LIMIT_PREFIX = "tx_rate_limit:";
    private static final String MINUTE_BUCKET = ":minute";
    private static final String HOUR_BUCKET = ":hour";
    private static final String DAY_BUCKET = ":day";

    /**
     * Checks if the account is within rate limits for transactions.
     * Throws ConflictException if rate limit is exceeded.
     *
     * @param accountId the account ID
     * @throws ConflictException if rate limit is exceeded
     */
    public void checkRateLimit(UUID accountId) {
        // Check minute-level rate limit
        checkMinuteRateLimit(accountId);

        // Check hour-level rate limit
        checkHourRateLimit(accountId);

        // Check day-level rate limit
        checkDayRateLimit(accountId);

        // If all checks pass, increment the counters
        incrementRateLimitCounters(accountId);
    }

    private void checkMinuteRateLimit(UUID accountId) {
        String key = RATE_LIMIT_PREFIX + accountId + MINUTE_BUCKET;
        RBucket<Integer> bucket = redissonClient.getBucket(key);
        Integer count = bucket.get();

        if (count != null && count >= MAX_TRANSACTIONS_PER_MINUTE) {
            log.warn("Rate limit exceeded for account {} at minute level: {} transactions", accountId, count);
            throw new ConflictException("Transaction rate limit exceeded: maximum " + MAX_TRANSACTIONS_PER_MINUTE + " transactions per minute");
        }
    }

    private void checkHourRateLimit(UUID accountId) {
        String key = RATE_LIMIT_PREFIX + accountId + HOUR_BUCKET;
        RBucket<Integer> bucket = redissonClient.getBucket(key);
        Integer count = bucket.get();

        if (count != null && count >= MAX_TRANSACTIONS_PER_HOUR) {
            log.warn("Rate limit exceeded for account {} at hour level: {} transactions", accountId, count);
            throw new ConflictException("Transaction rate limit exceeded: maximum " + MAX_TRANSACTIONS_PER_HOUR + " transactions per hour");
        }
    }

    private void checkDayRateLimit(UUID accountId) {
        String key = RATE_LIMIT_PREFIX + accountId + DAY_BUCKET;
        RBucket<Integer> bucket = redissonClient.getBucket(key);
        Integer count = bucket.get();

        if (count != null && count >= MAX_TRANSACTIONS_PER_DAY) {
            log.warn("Rate limit exceeded for account {} at day level: {} transactions", accountId, count);
            throw new ConflictException("Transaction rate limit exceeded: maximum " + MAX_TRANSACTIONS_PER_DAY + " transactions per day");
        }
    }

    private void incrementRateLimitCounters(UUID accountId) {
        // Increment minute counter with 1 minute TTL
        String minuteKey = RATE_LIMIT_PREFIX + accountId + MINUTE_BUCKET;
        RBucket<Integer> minuteBucket = redissonClient.getBucket(minuteKey);
        minuteBucket.setAsync(minuteBucket.get() == null ? 1 : minuteBucket.get() + 1);
        minuteBucket.expireAsync(Duration.ofMinutes(RATE_LIMIT_WINDOW_MINUTES));

        // Increment hour counter with 1 hour TTL
        String hourKey = RATE_LIMIT_PREFIX + accountId + HOUR_BUCKET;
        RBucket<Integer> hourBucket = redissonClient.getBucket(hourKey);
        hourBucket.setAsync(hourBucket.get() == null ? 1 : hourBucket.get() + 1);
        hourBucket.expireAsync(Duration.ofHours(RATE_LIMIT_WINDOW_HOURS));

        // Increment day counter with 1 day TTL
        String dayKey = RATE_LIMIT_PREFIX + accountId + DAY_BUCKET;
        RBucket<Integer> dayBucket = redissonClient.getBucket(dayKey);
        dayBucket.setAsync(dayBucket.get() == null ? 1 : dayBucket.get() + 1);
        dayBucket.expireAsync(Duration.ofDays(RATE_LIMIT_WINDOW_DAYS));
    }

    /**
     * Gets the current transaction count for an account within the specified time window.
     *
     * @param accountId the account ID
     * @param window the time window ("minute", "hour", or "day")
     * @return the current transaction count
     */
    public int getCurrentTransactionCount(UUID accountId, String window) {
        String key = RATE_LIMIT_PREFIX + accountId + ":" + window;
        RBucket<Integer> bucket = redissonClient.getBucket(key);
        return bucket.get() == null ? 0 : bucket.get();
    }

    /**
     * Resets the rate limit counters for an account.
     * This should typically only be used for testing or administrative purposes.
     *
     * @param accountId the account ID
     */
    public void resetRateLimitCounters(UUID accountId) {
        redissonClient.getBucket(RATE_LIMIT_PREFIX + accountId + MINUTE_BUCKET).delete();
        redissonClient.getBucket(RATE_LIMIT_PREFIX + accountId + HOUR_BUCKET).delete();
        redissonClient.getBucket(RATE_LIMIT_PREFIX + accountId + DAY_BUCKET).delete();
        log.info("Rate limit counters reset for account {}", accountId);
    }
}
