package com.jledger.finance.service.ledger;

import com.jledger.finance.service.ledger.impl.ReconciliationServiceImpl;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.ReconciliationReport;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.ReconciliationReportRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReconciliationService Unit Tests")
class ReconciliationServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private ReconciliationReportRepository reconciliationReportRepository;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RLock lock;

    @InjectMocks
    private ReconciliationServiceImpl reconciliationService;

    private static final UUID SYSTEM_BANK_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String RECONCILIATION_LOCK_KEY = "reconciliation:nightly_lock";

    @Nested
    @DisplayName("executeReconciliation Method Tests")
    class ExecuteReconciliationTests {

        @Test
        @DisplayName("Should successfully match double-entry ledger (Matched) when Assets equal Liabilities")
        void shouldSucceedReconciliationWhenBalanced() {
            // Arrange
            LocalDate date = LocalDate.now();
            BigDecimal balancedAmount = new BigDecimal("10000000.0000");

            Account systemBankAccount = Account.builder()
                    .id(SYSTEM_BANK_ACCOUNT_ID)
                    .balance(balancedAmount)
                    .build();

            when(accountRepository.findById(SYSTEM_BANK_ACCOUNT_ID)).thenReturn(Optional.of(systemBankAccount));
            when(accountRepository.getSumOfBalancesExcluding(SYSTEM_BANK_ACCOUNT_ID)).thenReturn(balancedAmount);

            when(reconciliationReportRepository.findByReportDate(date)).thenReturn(Optional.empty());
            when(reconciliationReportRepository.save(any(ReconciliationReport.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            ReconciliationReport report = reconciliationService.executeReconciliation(date);

            // Assert
            assertThat(report).isNotNull();
            assertThat(report.getTotalSystemAssets()).isEqualTo(balancedAmount);
            assertThat(report.getTotalUserLiabilities()).isEqualTo(balancedAmount);
            assertThat(report.getDiscrepancy()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(report.getStatus()).isEqualTo("MATCHED");

            verify(accountRepository).findById(SYSTEM_BANK_ACCOUNT_ID);
            verify(accountRepository).getSumOfBalancesExcluding(SYSTEM_BANK_ACCOUNT_ID);
            verify(reconciliationReportRepository).save(any(ReconciliationReport.class));
        }

        @Test
        @DisplayName("Should record a DISCREPANCY and report error when Assets do not equal Liabilities")
        void shouldRecordDiscrepancyWhenUnbalanced() {
            // Arrange
            LocalDate date = LocalDate.now();
            BigDecimal systemAssets = new BigDecimal("10000000.00");
            BigDecimal userLiabilities = new BigDecimal("9950000.00"); // 50,000 discrepancy

            Account systemBankAccount = Account.builder()
                    .id(SYSTEM_BANK_ACCOUNT_ID)
                    .balance(systemAssets)
                    .build();

            when(accountRepository.findById(SYSTEM_BANK_ACCOUNT_ID)).thenReturn(Optional.of(systemBankAccount));
            when(accountRepository.getSumOfBalancesExcluding(SYSTEM_BANK_ACCOUNT_ID)).thenReturn(userLiabilities);

            when(reconciliationReportRepository.findByReportDate(date)).thenReturn(Optional.empty());
            when(reconciliationReportRepository.save(any(ReconciliationReport.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            ReconciliationReport report = reconciliationService.executeReconciliation(date);

            // Assert
            assertThat(report).isNotNull();
            assertThat(report.getTotalSystemAssets()).isEqualTo(systemAssets);
            assertThat(report.getTotalUserLiabilities()).isEqualTo(userLiabilities);
            assertThat(report.getDiscrepancy()).isEqualByComparingTo("50000.00");
            assertThat(report.getStatus()).isEqualTo("DISCREPANCY");
        }
    }

    @Nested
    @DisplayName("runManualReconciliation Method Tests")
    class RunManualReconciliationTests {

        @Test
        @DisplayName("Should execute manual reconciliation successfully when lock is acquired and release lock properly")
        void shouldSuccessfullyRunLockedManualReconciliation() throws InterruptedException {
            // Arrange
            LocalDate date = LocalDate.now();
            when(redissonClient.getLock(RECONCILIATION_LOCK_KEY)).thenReturn(lock);
            when(lock.tryLock(eq(0L), eq(60L), eq(TimeUnit.SECONDS))).thenReturn(true);
            when(lock.isHeldByCurrentThread()).thenReturn(true);

            // Mock calculations
            Account bank = Account.builder().balance(BigDecimal.ZERO).build();
            when(accountRepository.findById(any())).thenReturn(Optional.of(bank));
            when(accountRepository.getSumOfBalancesExcluding(any())).thenReturn(BigDecimal.ZERO);
            when(reconciliationReportRepository.findByReportDate(any())).thenReturn(Optional.empty());
            when(reconciliationReportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ReconciliationReport report = reconciliationService.runManualReconciliation(date);

            // Assert
            assertThat(report).isNotNull();
            verify(lock).tryLock(0L, 60L, TimeUnit.SECONDS);
            verify(lock).unlock();
        }

        @Test
        @DisplayName("Should throw IllegalStateException if lock cannot be acquired during manual trigger")
        void shouldThrowExceptionWhenManualTriggerLockFails() throws InterruptedException {
            // Arrange
            LocalDate date = LocalDate.now();
            when(redissonClient.getLock(RECONCILIATION_LOCK_KEY)).thenReturn(lock);
            when(lock.tryLock(eq(0L), eq(60L), eq(TimeUnit.SECONDS))).thenReturn(false); // lock is already held

            // Act & Assert
            assertThatThrownBy(() -> reconciliationService.runManualReconciliation(date))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("A reconciliation process is already in progress.");

            verify(lock, never()).unlock();
        }
    }

    @Nested
    @DisplayName("runNightlyReconciliation Method Tests")
    class RunNightlyReconciliationTests {

        @Test
        @DisplayName("Should run reconciliation but gracefully skip execution without throwing exception if lock is busy")
        void shouldSkipNightlyReconciliationWhenLockBusy() throws InterruptedException {
            // Arrange
            when(redissonClient.getLock(RECONCILIATION_LOCK_KEY)).thenReturn(lock);
            when(lock.tryLock(eq(0L), eq(60L), eq(TimeUnit.SECONDS))).thenReturn(false); // Lock conflict

            // Act & Assert
            // Should not throw any exception
            reconciliationService.runNightlyReconciliation();

            verify(lock, never()).unlock();
            verifyNoInteractions(accountRepository);
        }
    }

    @Nested
    @DisplayName("getAllReports Method Tests")
    class GetAllReportsTests {

        @Test
        @DisplayName("Should retrieve all reports sorted by date in descending order")
        void shouldRetrieveAllReports() {
            // Arrange
            List<ReconciliationReport> reports = Collections.singletonList(new ReconciliationReport());
            when(reconciliationReportRepository.findAllOrderByDateDesc()).thenReturn(reports);

            // Act
            List<ReconciliationReport> result = reconciliationService.getAllReports();

            // Assert
            assertThat(result).hasSize(1);
            verify(reconciliationReportRepository).findAllOrderByDateDesc();
        }
    }
}
