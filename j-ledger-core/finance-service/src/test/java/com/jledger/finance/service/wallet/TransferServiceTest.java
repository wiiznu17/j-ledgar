package com.jledger.finance.service.wallet;

import com.jledger.finance.service.wallet.impl.TransferServiceImpl;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.TransferRequest;
import com.jledger.finance.exception.ConcurrentOperationException;
import com.jledger.finance.service.system.RedisIdempotencyService;
import com.jledger.finance.service.compliance.KycComplianceService;
import com.jledger.finance.service.compliance.TransactionLimitService;
import com.jledger.finance.service.compliance.TransactionRateLimitService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransferService Unit Tests")
class TransferServiceTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RedisIdempotencyService redisIdempotencyService;

    @Mock
    private WalletService walletService;

    @Mock
    private KycComplianceService kycComplianceService;

    @Mock
    private TransactionLimitService transactionLimitService;

    @Mock
    private TransactionRateLimitService transactionRateLimitService;

    @InjectMocks
    private TransferServiceImpl transferService;

    @Mock
    private RLock firstLock;

    @Mock
    private RLock secondLock;

    private static final String SENDER_WALLET_ID = "11111111-1111-1111-1111-111111111111";
    private static final String RECEIVER_WALLET_ID = "22222222-2222-2222-2222-222222222222";
    private static final String IDEMPOTENCY_KEY = "test-idempotency-key-12345";

    @BeforeEach
    void setUp() {
        // Set reflection @Value fields
        ReflectionTestUtils.setField(transferService, "lockWaitSeconds", 3L);
        ReflectionTestUtils.setField(transferService, "lockLeaseSeconds", 10L);
    }

    @Nested
    @DisplayName("executeTransfer Method Tests")
    class ExecuteTransferTests {

        @Test
        @DisplayName("Should successfully transfer funds when accounts are active, locks are acquired, and no idempotency cache exists")
        void shouldSuccessfullyTransferFunds() throws InterruptedException {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("250.5000"),
                    "THB",
                    null
            );

            Transaction expectedTransaction = new Transaction();
            expectedTransaction.setTransactionId("TXN9999");
            expectedTransaction.setAmount(new BigDecimal("250.5000"));

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            // Mock redisson lock acquisition
            when(redissonClient.getLock(anyString())).thenReturn(firstLock).thenReturn(secondLock);
            when(firstLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
            when(secondLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);

            when(firstLock.isHeldByCurrentThread()).thenReturn(true);
            when(secondLock.isHeldByCurrentThread()).thenReturn(true);

            // Mock wallet service transfer
            when(walletService.transferByWalletId(
                    eq(SENDER_WALLET_ID),
                    eq(RECEIVER_WALLET_ID),
                    eq(new BigDecimal("250.5000")),
                    isNull()
            )).thenReturn(expectedTransaction);

            // Act
            Transaction result = transferService.executeTransfer(IDEMPOTENCY_KEY, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTransactionId()).isEqualTo("TXN9999");
            assertThat(result.getAmount()).isEqualByComparingTo("250.50");

            // Verify
            verify(redisIdempotencyService).getIfProcessed(IDEMPOTENCY_KEY);
            verify(transactionRateLimitService).checkRateLimit(UUID.fromString(SENDER_WALLET_ID));
            verify(kycComplianceService).checkKycCompliance(UUID.fromString(SENDER_WALLET_ID));
            verify(transactionLimitService).checkTransactionLimits(UUID.fromString(SENDER_WALLET_ID), new BigDecimal("250.5000"));
            verify(redissonClient).getLock("account_lock:" + SENDER_WALLET_ID);
            verify(redissonClient).getLock("account_lock:" + RECEIVER_WALLET_ID);
            verify(firstLock).tryLock(3L, 10L, TimeUnit.SECONDS);
            verify(secondLock).tryLock(3L, 10L, TimeUnit.SECONDS);
            verify(walletService).transferByWalletId(SENDER_WALLET_ID, RECEIVER_WALLET_ID, new BigDecimal("250.5000"), null);
            verify(transactionLimitService).recordTransaction(UUID.fromString(SENDER_WALLET_ID), new BigDecimal("250.5000"));
            verify(redisIdempotencyService).cacheResponse(IDEMPOTENCY_KEY, expectedTransaction);
            
            // Verify lock release in finally block
            verify(firstLock).unlock();
            verify(secondLock).unlock();
        }

        @Test
        @DisplayName("Should skip processing and return cached transaction if idempotency key is already processed")
        void shouldReturnCachedTransactionWhenIdempotencyKeyExists() {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            Transaction cachedTransaction = new Transaction();
            cachedTransaction.setTransactionId("TXN-ALREADY-DONE");
            cachedTransaction.setAmount(new BigDecimal("100.0000"));

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.of(cachedTransaction));

            // Act
            Transaction result = transferService.executeTransfer(IDEMPOTENCY_KEY, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTransactionId()).isEqualTo("TXN-ALREADY-DONE");

            // Verify no locking or core transfer service interaction occurs
            verifyNoInteractions(redissonClient);
            verifyNoInteractions(walletService);
        }

        @Test
        @DisplayName("Should throw ConcurrentOperationException and unlock acquired locks if first lock is acquired but second lock times out")
        void shouldRollbackFirstLockIfSecondLockFails() throws InterruptedException {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            when(redissonClient.getLock(anyString())).thenReturn(firstLock).thenReturn(secondLock);
            when(firstLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
            when(secondLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(false); // Second lock fails to acquire

            when(firstLock.isHeldByCurrentThread()).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(ConcurrentOperationException.class)
                    .hasMessageContaining("System busy, please try again.");

            // Verify first lock is unlocked and second lock is never unlocked since it wasn't held
            verify(firstLock).unlock();
            verify(secondLock, never()).unlock();
            verifyNoInteractions(walletService);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when idempotency key is null or blank")
        void shouldThrowExceptionWhenIdempotencyKeyIsInvalid() {
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            assertThatThrownBy(() -> transferService.executeTransfer(null, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Idempotency-Key header is required");

            assertThatThrownBy(() -> transferService.executeTransfer("   ", request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Idempotency-Key header is required");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when transfer amount has more than 4 decimal places")
        void shouldThrowExceptionWhenDecimalScaleExceedsLimit() {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.12345"), // 5 decimals
                    "THB",
                    null
            );

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Transfer amount must have up to 4 decimal places");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when fromAccountId is same as toAccountId")
        void shouldThrowExceptionWhenSenderAndReceiverAreIdentical() {
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    SENDER_WALLET_ID, // Self-transfer
                    new BigDecimal("10.0000"),
                    "THB",
                    null
            );

            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Sender and receiver accounts must be different");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when transfer amount is zero or negative")
        void shouldThrowExceptionWhenAmountIsZeroOrNegative() {
            TransferRequest zeroRequest = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    BigDecimal.ZERO,
                    "THB",
                    null
            );

            TransferRequest negativeRequest = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("-50.00"),
                    "THB",
                    null
            );

            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, zeroRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Transfer amount must be greater than zero");

            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, negativeRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Transfer amount must be greater than zero");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when currency is not exactly a 3-letter uppercase code")
        void shouldThrowExceptionWhenCurrencyCodeIsMalformed() {
            TransferRequest lowercaseCurrency = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("10.00"),
                    "thb",
                    null
            );

            TransferRequest longCurrency = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("10.00"),
                    "USDT",
                    null
            );

            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, lowercaseCurrency))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Currency must be a 3-letter uppercase code");

            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, longCurrency))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Currency must be a 3-letter uppercase code");
        }

        @Test
        @DisplayName("Should throw ConflictException when KYC compliance check fails")
        void shouldThrowExceptionWhenKycCheckFails() {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            doThrow(new com.jledger.finance.exception.ConflictException("KYC verification required"))
                    .when(kycComplianceService).checkKycCompliance(UUID.fromString(SENDER_WALLET_ID));

            // Act & Assert
            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(com.jledger.finance.exception.ConflictException.class)
                    .hasMessageContaining("KYC verification required");

            // Verify
            verify(transactionRateLimitService).checkRateLimit(UUID.fromString(SENDER_WALLET_ID));
            verify(kycComplianceService).checkKycCompliance(UUID.fromString(SENDER_WALLET_ID));
            verifyNoInteractions(redissonClient);
            verifyNoInteractions(walletService);
        }

        @Test
        @DisplayName("Should throw ConflictException when transaction rate limit is exceeded")
        void shouldThrowExceptionWhenRateLimitExceeded() {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            doThrow(new com.jledger.finance.exception.ConflictException("Transaction rate limit exceeded"))
                    .when(transactionRateLimitService).checkRateLimit(UUID.fromString(SENDER_WALLET_ID));

            // Act & Assert
            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(com.jledger.finance.exception.ConflictException.class)
                    .hasMessageContaining("Transaction rate limit exceeded");

            // Verify
            verify(transactionRateLimitService).checkRateLimit(UUID.fromString(SENDER_WALLET_ID));
            verifyNoInteractions(kycComplianceService);
            verifyNoInteractions(redissonClient);
            verifyNoInteractions(walletService);
        }

        @Test
        @DisplayName("Should throw ConflictException when daily/monthly transaction limit is exceeded")
        void shouldThrowExceptionWhenDailyMonthlyLimitExceeded() {
            // Arrange
            TransferRequest request = new TransferRequest(
                    SENDER_WALLET_ID,
                    RECEIVER_WALLET_ID,
                    new BigDecimal("100.0000"),
                    "THB",
                    null
            );

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY))
                    .thenReturn(Optional.empty());

            doThrow(new com.jledger.finance.exception.ConflictException("Transaction would exceed daily limit"))
                    .when(transactionLimitService).checkTransactionLimits(UUID.fromString(SENDER_WALLET_ID), new BigDecimal("100.0000"));

            // Act & Assert
            assertThatThrownBy(() -> transferService.executeTransfer(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(com.jledger.finance.exception.ConflictException.class)
                    .hasMessageContaining("Transaction would exceed daily limit");

            // Verify
            verify(transactionRateLimitService).checkRateLimit(UUID.fromString(SENDER_WALLET_ID));
            verify(kycComplianceService).checkKycCompliance(UUID.fromString(SENDER_WALLET_ID));
            verify(transactionLimitService).checkTransactionLimits(UUID.fromString(SENDER_WALLET_ID), new BigDecimal("100.0000"));
            verifyNoInteractions(redissonClient);
            verifyNoInteractions(walletService);
        }
    }
}
