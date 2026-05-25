package com.jledger.finance.service.compliance;

import com.jledger.finance.exception.ConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionRateLimitService Unit Tests")
class TransactionRateLimitServiceTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RBucket<Integer> minuteBucket;

    @Mock
    private RBucket<Integer> hourBucket;

    @Mock
    private RBucket<Integer> dayBucket;

    @InjectMocks
    private TransactionRateLimitService transactionRateLimitService;

    private static final UUID ACCOUNT_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Nested
    @DisplayName("checkRateLimit Method Tests")
    class CheckRateLimitTests {

        @Test
        @DisplayName("Should successfully pass rate limit check and increment counters on happy path")
        void shouldPassRateLimitCheckAndIncrement() {
            // Arrange
            String minuteKey = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            String hourKey = "tx_rate_limit:" + ACCOUNT_ID + ":hour";
            String dayKey = "tx_rate_limit:" + ACCOUNT_ID + ":day";

            // Stub getBucket for each level
            doReturn(minuteBucket).when(redissonClient).getBucket(minuteKey);
            doReturn(hourBucket).when(redissonClient).getBucket(hourKey);
            doReturn(dayBucket).when(redissonClient).getBucket(dayKey);

            // Stub count retrievals (below thresholds: 10, 30, 100)
            when(minuteBucket.get()).thenReturn(2);
            when(hourBucket.get()).thenReturn(15);
            when(dayBucket.get()).thenReturn(40);

            // Act
            transactionRateLimitService.checkRateLimit(ACCOUNT_ID);

            // Assert
            verify(minuteBucket, times(3)).get();
            verify(hourBucket, times(3)).get();
            verify(dayBucket, times(3)).get();

            // Verifies increment counters is executed
            verify(minuteBucket).setAsync(3);
            verify(minuteBucket).expireAsync(any(java.time.Duration.class));
            verify(hourBucket).setAsync(16);
            verify(hourBucket).expireAsync(any(java.time.Duration.class));
            verify(dayBucket).setAsync(41);
            verify(dayBucket).expireAsync(any(java.time.Duration.class));
        }

        @Test
        @DisplayName("Should throw ConflictException if minute rate limit is exceeded")
        void shouldThrowConflictWhenMinuteLimitExceeded() {
            // Arrange
            String minuteKey = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            doReturn(minuteBucket).when(redissonClient).getBucket(minuteKey);
            
            // Exceed minute threshold (10)
            when(minuteBucket.get()).thenReturn(10);

            // Act & Assert
            assertThatThrownBy(() -> transactionRateLimitService.checkRateLimit(ACCOUNT_ID))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Transaction rate limit exceeded: maximum 10 transactions per minute");

            verify(hourBucket, never()).get();
        }

        @Test
        @DisplayName("Should throw ConflictException if hourly rate limit is exceeded")
        void shouldThrowConflictWhenHourLimitExceeded() {
            // Arrange
            String minuteKey = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            String hourKey = "tx_rate_limit:" + ACCOUNT_ID + ":hour";

            doReturn(minuteBucket).when(redissonClient).getBucket(minuteKey);
            doReturn(hourBucket).when(redissonClient).getBucket(hourKey);
            
            when(minuteBucket.get()).thenReturn(2);
            // Exceed hour threshold (30)
            when(hourBucket.get()).thenReturn(30);

            // Act & Assert
            assertThatThrownBy(() -> transactionRateLimitService.checkRateLimit(ACCOUNT_ID))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Transaction rate limit exceeded: maximum 30 transactions per hour");

            verify(dayBucket, never()).get();
        }

        @Test
        @DisplayName("Should throw ConflictException if daily rate limit is exceeded")
        void shouldThrowConflictWhenDayLimitExceeded() {
            // Arrange
            String minuteKey = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            String hourKey = "tx_rate_limit:" + ACCOUNT_ID + ":hour";
            String dayKey = "tx_rate_limit:" + ACCOUNT_ID + ":day";

            doReturn(minuteBucket).when(redissonClient).getBucket(minuteKey);
            doReturn(hourBucket).when(redissonClient).getBucket(hourKey);
            doReturn(dayBucket).when(redissonClient).getBucket(dayKey);
            
            when(minuteBucket.get()).thenReturn(2);
            when(hourBucket.get()).thenReturn(15);
            // Exceed day threshold (100)
            when(dayBucket.get()).thenReturn(100);

            // Act & Assert
            assertThatThrownBy(() -> transactionRateLimitService.checkRateLimit(ACCOUNT_ID))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Transaction rate limit exceeded: maximum 100 transactions per day");
        }
    }

    @Nested
    @DisplayName("getCurrentTransactionCount Method Tests")
    class GetCurrentTransactionCountTests {

        @Test
        @DisplayName("Should return count from Redis or default to 0 if null")
        void shouldReturnTransactionCount() {
            // Arrange
            String key = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            doReturn(minuteBucket).when(redissonClient).getBucket(key);
            
            when(minuteBucket.get()).thenReturn(5);

            // Act
            int count = transactionRateLimitService.getCurrentTransactionCount(ACCOUNT_ID, "minute");

            // Assert
            assertThat(count).isEqualTo(5);
        }

        @Test
        @DisplayName("Should return 0 if Redis bucket has no value")
        void shouldReturnZeroOnRedisMiss() {
            // Arrange
            String key = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            doReturn(minuteBucket).when(redissonClient).getBucket(key);
            
            when(minuteBucket.get()).thenReturn(null);

            // Act
            int count = transactionRateLimitService.getCurrentTransactionCount(ACCOUNT_ID, "minute");

            // Assert
            assertThat(count).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("resetRateLimitCounters Method Tests")
    class ResetRateLimitCountersTests {

        @Test
        @DisplayName("Should delete Redis keys for minute, hour, and day buckets")
        void shouldResetAllCounters() {
            // Arrange
            String minuteKey = "tx_rate_limit:" + ACCOUNT_ID + ":minute";
            String hourKey = "tx_rate_limit:" + ACCOUNT_ID + ":hour";
            String dayKey = "tx_rate_limit:" + ACCOUNT_ID + ":day";

            doReturn(minuteBucket).when(redissonClient).getBucket(minuteKey);
            doReturn(hourBucket).when(redissonClient).getBucket(hourKey);
            doReturn(dayBucket).when(redissonClient).getBucket(dayKey);

            // Act
            transactionRateLimitService.resetRateLimitCounters(ACCOUNT_ID);

            // Assert
            verify(minuteBucket).delete();
            verify(hourBucket).delete();
            verify(dayBucket).delete();
        }
    }
}
