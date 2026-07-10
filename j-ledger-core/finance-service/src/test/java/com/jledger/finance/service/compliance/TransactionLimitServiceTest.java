package com.jledger.finance.service.compliance;

import com.jledger.finance.config.JLedgerProperties;
import com.jledger.finance.service.compliance.impl.TransactionLimitServiceImpl;

import com.jledger.finance.domain.entity.TransactionLimit;
import com.jledger.finance.domain.enums.TransactionLimitType;
import com.jledger.finance.exception.ConflictException;
import com.jledger.finance.repository.compliance.TransactionLimitRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionLimitService Unit Tests")
class TransactionLimitServiceTest {

    @Mock
    private TransactionLimitRepository transactionLimitRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @org.mockito.Spy
    private JLedgerProperties jLedgerProperties = new JLedgerProperties();

    @InjectMocks
    private TransactionLimitServiceImpl transactionLimitService;

    private static final UUID ACCOUNT_ID = UUID.randomUUID();
    private static final BigDecimal DEFAULT_PER_TX_LIMIT = new BigDecimal("500000");
    private static final BigDecimal DEFAULT_DAILY_LIMIT = new BigDecimal("1000000");
    private static final BigDecimal DEFAULT_MONTHLY_LIMIT = new BigDecimal("5000000");

    @Nested
    @DisplayName("checkTransactionLimits Method Tests")
    class CheckTransactionLimitsTests {

        @Test
        @DisplayName("Should pass limit checks when amount is within all thresholds and no reset is needed")
        void shouldPassWhenWithinLimits() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("1000.00");

            // Setup mock limits that do not need resets
            TransactionLimit perTxLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.PER_TRANSACTION)
                    .limitAmount(DEFAULT_PER_TX_LIMIT)
                    .build();

            TransactionLimit dailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .limitAmount(DEFAULT_DAILY_LIMIT)
                    .currentAmount(new BigDecimal("5000.00"))
                    .resetDate(ZonedDateTime.now().plusDays(1)) // future reset date
                    .build();

            TransactionLimit monthlyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.MONTHLY)
                    .limitAmount(DEFAULT_MONTHLY_LIMIT)
                    .currentAmount(new BigDecimal("20000.00"))
                    .resetDate(ZonedDateTime.now().plusMonths(1)) // future reset date
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.PER_TRANSACTION))
                    .thenReturn(Optional.of(perTxLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(dailyLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.MONTHLY))
                    .thenReturn(Optional.of(monthlyLimit));

            // Act & Assert
            // No exception should be thrown
            transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount);

            verify(transactionLimitRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw ConflictException when transaction amount exceeds per-transaction limit")
        void shouldThrowExceptionWhenAmountExceedsPerTxLimit() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("600000.00"); // greater than 500,000

            TransactionLimit perTxLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.PER_TRANSACTION)
                    .limitAmount(DEFAULT_PER_TX_LIMIT)
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.PER_TRANSACTION))
                    .thenReturn(Optional.of(perTxLimit));

            // Act & Assert
            assertThatThrownBy(() -> transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("exceeds per-transaction limit");

            verify(transactionLimitRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw ConflictException when cumulative daily amount exceeds daily limit")
        void shouldThrowExceptionWhenDailyLimitBreached() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("200000.00");

            TransactionLimit perTxLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.PER_TRANSACTION)
                    .limitAmount(DEFAULT_PER_TX_LIMIT)
                    .build();

            TransactionLimit dailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .limitAmount(DEFAULT_DAILY_LIMIT)
                    .currentAmount(new BigDecimal("900000.00")) // 900,000 + 200,000 > 1,000,000
                    .resetDate(ZonedDateTime.now().plusDays(1))
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.PER_TRANSACTION))
                    .thenReturn(Optional.of(perTxLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(dailyLimit));

            // Act & Assert
            assertThatThrownBy(() -> transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("would exceed daily limit");

            verify(transactionLimitRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should reset daily limit to zero and recalculate reset date when daily reset window has elapsed")
        void shouldResetDailyLimitWhenResetDateHasPassed() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("5000.00");

            TransactionLimit perTxLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.PER_TRANSACTION)
                    .limitAmount(DEFAULT_PER_TX_LIMIT)
                    .build();

            TransactionLimit expiredDailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .limitAmount(DEFAULT_DAILY_LIMIT)
                    .currentAmount(new BigDecimal("950000.00"))
                    .resetDate(ZonedDateTime.now().minusHours(1)) // Expired 1 hour ago
                    .build();

            TransactionLimit monthlyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.MONTHLY)
                    .limitAmount(DEFAULT_MONTHLY_LIMIT)
                    .currentAmount(new BigDecimal("20000.00"))
                    .resetDate(ZonedDateTime.now().plusMonths(1))
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.PER_TRANSACTION))
                    .thenReturn(Optional.of(perTxLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(expiredDailyLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.MONTHLY))
                    .thenReturn(Optional.of(monthlyLimit));

            // Act
            transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount);

            // Assert
            // Expired daily limit should be reset to zero and saved
            assertThat(expiredDailyLimit.getCurrentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(expiredDailyLimit.getResetDate()).isAfter(ZonedDateTime.now());
            verify(transactionLimitRepository).save(expiredDailyLimit);
        }

        @Test
        @DisplayName("Should throw ConflictException when cumulative monthly amount exceeds monthly limit")
        void shouldThrowExceptionWhenMonthlyLimitBreached() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("100000.00");

            TransactionLimit perTxLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.PER_TRANSACTION)
                    .limitAmount(DEFAULT_PER_TX_LIMIT)
                    .build();

            TransactionLimit dailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .limitAmount(DEFAULT_DAILY_LIMIT)
                    .currentAmount(BigDecimal.ZERO)
                    .resetDate(ZonedDateTime.now().plusDays(1))
                    .build();

            TransactionLimit monthlyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.MONTHLY)
                    .limitAmount(DEFAULT_MONTHLY_LIMIT)
                    .currentAmount(new BigDecimal("4950000.00")) // 4,950,000 + 100,000 > 5,000,000
                    .resetDate(ZonedDateTime.now().plusMonths(1))
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.PER_TRANSACTION))
                    .thenReturn(Optional.of(perTxLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(dailyLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.MONTHLY))
                    .thenReturn(Optional.of(monthlyLimit));

            // Act & Assert
            assertThatThrownBy(() -> transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("would exceed monthly limit");
        }

        @Test
        @DisplayName("Should automatically create and persist default limits if none exist for the account ID")
        void shouldCreateDefaultLimitsWhenNoneExist() {
            // Arrange
            BigDecimal txAmount = new BigDecimal("50.00");

            when(transactionLimitRepository.findByAccountIdAndLimitType(eq(ACCOUNT_ID), any()))
                    .thenReturn(Optional.empty()); // No limits in database

            // We mock the save call to simply return the passed argument
            when(transactionLimitRepository.save(any(TransactionLimit.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            transactionLimitService.checkTransactionLimits(ACCOUNT_ID, txAmount);

            // Assert
            // Verify that default limits for PER_TRANSACTION, DAILY, and MONTHLY were created and saved
            verify(transactionLimitRepository, times(3)).save(any(TransactionLimit.class));
        }
    }

    @Nested
    @DisplayName("recordTransaction Method Tests")
    class RecordTransactionTests {

        @Test
        @DisplayName("Should successfully accumulate and record transaction amount in daily and monthly totals")
        void shouldRecordAndAccumulateTransactionAmount() {
            // Arrange
            BigDecimal amountToRecord = new BigDecimal("250.00");

            TransactionLimit dailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .currentAmount(new BigDecimal("1000.00"))
                    .build();

            TransactionLimit monthlyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.MONTHLY)
                    .currentAmount(new BigDecimal("5000.00"))
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(dailyLimit));
            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.MONTHLY))
                    .thenReturn(Optional.of(monthlyLimit));

            // Act
            transactionLimitService.recordTransaction(ACCOUNT_ID, amountToRecord);

            // Assert
            assertThat(dailyLimit.getCurrentAmount()).isEqualByComparingTo("1250.00");
            assertThat(monthlyLimit.getCurrentAmount()).isEqualByComparingTo("5250.00");
            verify(transactionLimitRepository).save(dailyLimit);
            verify(transactionLimitRepository).save(monthlyLimit);
        }
    }

    @Nested
    @DisplayName("updateLimit Method Tests")
    class UpdateLimitTests {

        @Test
        @DisplayName("Should successfully update limitAmount to the new specified value")
        void shouldUpdateLimitAmountSuccessfully() {
            // Arrange
            BigDecimal newLimitValue = new BigDecimal("2000000.00");

            TransactionLimit dailyLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .limitType(TransactionLimitType.DAILY)
                    .limitAmount(DEFAULT_DAILY_LIMIT)
                    .build();

            when(transactionLimitRepository.findByAccountIdAndLimitType(ACCOUNT_ID, TransactionLimitType.DAILY))
                    .thenReturn(Optional.of(dailyLimit));
            when(transactionLimitRepository.save(dailyLimit)).thenReturn(dailyLimit);

            // Act
            TransactionLimit result = transactionLimitService.updateLimit(ACCOUNT_ID, TransactionLimitType.DAILY, newLimitValue);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getLimitAmount()).isEqualTo(newLimitValue);
            verify(transactionLimitRepository).save(dailyLimit);
        }
    }

    @Nested
    @DisplayName("getAccountLimits Method Tests")
    class GetAccountLimitsTests {

        @Test
        @DisplayName("Should return list of active limits retrieved from repository")
        void shouldReturnActiveLimits() {
            // Arrange
            TransactionLimit activeLimit = TransactionLimit.builder()
                    .accountId(ACCOUNT_ID)
                    .isActive(true)
                    .build();

            when(transactionLimitRepository.findActiveLimitsByAccountId(ACCOUNT_ID))
                    .thenReturn(Collections.singletonList(activeLimit));

            // Act
            List<TransactionLimit> result = transactionLimitService.getAccountLimits(ACCOUNT_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAccountId()).isEqualTo(ACCOUNT_ID);
            verify(transactionLimitRepository).findActiveLimitsByAccountId(ACCOUNT_ID);
        }
    }
}
