package com.jledger.core.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.core.domain.Transaction;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RedisIdempotencyService {

    private static final String IDEMPOTENCY_KEY_PREFIX = "transfer:idempotency:";

    private final RedissonClient redissonClient;
    private final ObjectMapper objectMapper;
    private final long idempotencyTtlHours;

    public RedisIdempotencyService(
            RedissonClient redissonClient,
            ObjectMapper objectMapper,
            @Value("${jledger.redis.idempotency-ttl-hours:24}") long idempotencyTtlHours
    ) {
        this.redissonClient = redissonClient;
        this.objectMapper = objectMapper;
        this.idempotencyTtlHours = idempotencyTtlHours;
    }

    public boolean isProcessed(String idempotencyKey) {
        return getBucket(idempotencyKey).isExists();
    }

    public Optional<Transaction> getCachedResponse(String idempotencyKey) {
        String payload = getBucket(idempotencyKey).get();
        if (payload == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(payload, Transaction.class));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize cached transaction response", exception);
        }
    }

    public void cacheResponse(String idempotencyKey, Transaction transaction) {
        try {
            getBucket(idempotencyKey).set(
                    objectMapper.writeValueAsString(transaction),
                    idempotencyTtlHours,
                    TimeUnit.HOURS
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize transaction response for Redis cache", exception);
        }
    }

    private RBucket<String> getBucket(String idempotencyKey) {
        return redissonClient.getBucket(IDEMPOTENCY_KEY_PREFIX + idempotencyKey);
    }
}
