package com.jledger.finance.service.system;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RedisIdempotencyService Unit Tests")
class RedisIdempotencyServiceTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private RBucket<String> bucket;

    private RedisIdempotencyService redisIdempotencyService;

    private static final String IDEMPOTENCY_KEY = "idempotency-test-key";
    private static final String REDIS_KEY = "transfer:idempotency:idempotency-test-key";

    @BeforeEach
    void setUp() {
        // Explicit constructor instantiation to avoid dependency injection discrepancies
        redisIdempotencyService = new RedisIdempotencyService(redissonClient, objectMapper, 24L);
    }

    @Nested
    @DisplayName("getIfProcessed Method Tests")
    class GetIfProcessedTests {

        @Test
        @DisplayName("Should return empty Optional when Redis has no record (Cache Miss)")
        void shouldReturnEmptyWhenCacheMiss() {
            // Arrange
            doReturn(bucket).when(redissonClient).getBucket(REDIS_KEY);
            when(bucket.get()).thenReturn(null);

            // Act
            Optional<Transaction> result = redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY);

            // Assert
            assertThat(result).isEmpty();
            verify(redissonClient).getBucket(REDIS_KEY);
            verify(bucket).get();
        }

        @Test
        @DisplayName("Should successfully deserialize and return transaction from JSON payload (Cache Hit)")
        void shouldReturnTransactionWhenCacheHit() throws JsonProcessingException {
            // Arrange
            String mockJson = "{\"transactionId\":\"TXN001\"}";
            Transaction mockTransaction = new Transaction();
            mockTransaction.setTransactionId("TXN001");

            doReturn(bucket).when(redissonClient).getBucket(REDIS_KEY);
            when(bucket.get()).thenReturn(mockJson);
            when(objectMapper.readValue(mockJson, Transaction.class)).thenReturn(mockTransaction);

            // Act
            Optional<Transaction> result = redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY);

            // Assert
            assertThat(result).isPresent().contains(mockTransaction);
            verify(redissonClient).getBucket(REDIS_KEY);
            verify(bucket).get();
            verify(objectMapper).readValue(mockJson, Transaction.class);
        }

        @Test
        @DisplayName("Should throw IllegalStateException if JSON deserialization fails")
        void shouldThrowExceptionWhenDeserializationFails() throws JsonProcessingException {
            // Arrange
            String malformedJson = "{malformed}";
            doReturn(bucket).when(redissonClient).getBucket(REDIS_KEY);
            when(bucket.get()).thenReturn(malformedJson);
            when(objectMapper.readValue(malformedJson, Transaction.class))
                    .thenThrow(new JsonProcessingException("Mapping error") {});

            // Act & Assert
            assertThatThrownBy(() -> redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Failed to deserialize cached transaction response");

            verify(redissonClient).getBucket(REDIS_KEY);
            verify(bucket).get();
        }
    }

    @Nested
    @DisplayName("cacheResponse Method Tests")
    class CacheResponseTests {

        @Test
        @DisplayName("Should successfully serialize and store transaction response in Redis with correct TTL")
        void shouldSuccessfullyCacheResponse() throws JsonProcessingException {
            // Arrange
            Transaction mockTransaction = new Transaction();
            mockTransaction.setTransactionId("TXN001");
            String mockJson = "{\"transactionId\":\"TXN001\"}";

            doReturn(bucket).when(redissonClient).getBucket(REDIS_KEY);
            when(objectMapper.writeValueAsString(mockTransaction)).thenReturn(mockJson);

            // Act
            redisIdempotencyService.cacheResponse(IDEMPOTENCY_KEY, mockTransaction);

            // Assert
            verify(redissonClient).getBucket(REDIS_KEY);
            verify(objectMapper).writeValueAsString(mockTransaction);
            verify(bucket).set(mockJson, 24L, TimeUnit.HOURS);
        }

        @Test
        @DisplayName("Should throw IllegalStateException if JSON serialization fails")
        void shouldThrowExceptionWhenSerializationFails() throws JsonProcessingException {
            // Arrange
            Transaction mockTransaction = new Transaction();
            when(objectMapper.writeValueAsString(mockTransaction))
                    .thenThrow(new JsonProcessingException("Serialization error") {});

            // Act & Assert
            assertThatThrownBy(() -> redisIdempotencyService.cacheResponse(IDEMPOTENCY_KEY, mockTransaction))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Failed to serialize transaction response for Redis cache");

            verify(bucket, never()).set(any(), anyLong(), any());
        }
    }
}
