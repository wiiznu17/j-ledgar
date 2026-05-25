package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.repository.transaction.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FraudPatternDetectionService Unit Tests")
class FraudPatternDetectionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AmlMonitoringService amlMonitoringService;

    @InjectMocks
    private FraudPatternDetectionService fraudPatternDetectionService;

    private static final Long WALLET_ID = 5005L;

    private Transaction createTransaction(Long fromWalletId, Long toWalletId, BigDecimal amount) {
        Transaction tx = new Transaction();
        tx.setFromWalletId(fromWalletId);
        tx.setToWalletId(toWalletId);
        tx.setAmount(amount);
        tx.setCreatedAt(LocalDateTime.now());
        return tx;
    }

    @Nested
    @DisplayName("detectStructuring Method Tests")
    class DetectStructuringTests {

        @Test
        @DisplayName("Should detect STRUCTURING pattern if there are 5 transactions near the 100,000 THB threshold (between 94,000 and 99,000 THB)")
        void shouldDetectStructuringWhenThresholdBreached() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            // Add 5 transactions near the 100k threshold (e.g. 95k each)
            for (int i = 0; i < 5; i++) {
                transactions.add(createTransaction(WALLET_ID, 2000L + i, new BigDecimal("95000.00")));
            }

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectStructuring(WALLET_ID);

            // Assert
            assertThat(result).hasSize(1);
            FraudPatternDetectionService.FraudPattern pattern = result.get(0);
            assertThat(pattern.type()).isEqualTo("STRUCTURING");
            assertThat(pattern.riskScore()).isEqualTo(70);
            assertThat(pattern.description()).contains("Potential structuring: 5 transactions near 100,000 THB threshold");
            assertThat(pattern.metadata().get("transactionCount")).isEqualTo(5);
            assertThat(pattern.metadata().get("totalAmount")).isEqualTo("475000.00");
        }

        @Test
        @DisplayName("Should NOT detect STRUCTURING pattern if transactions are outside of the smurfing amount boundaries")
        void shouldNotDetectStructuringWhenAmountsAreTooLowOrTooHigh() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(createTransaction(WALLET_ID, 2001L, new BigDecimal("90000.00"))); // too low
            transactions.add(createTransaction(WALLET_ID, 2002L, new BigDecimal("100000.00"))); // too high
            transactions.add(createTransaction(WALLET_ID, 2003L, new BigDecimal("95000.00"))); // in range
            transactions.add(createTransaction(WALLET_ID, 2004L, new BigDecimal("96000.00"))); // in range

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectStructuring(WALLET_ID);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("detectLayering Method Tests")
    class DetectLayeringTests {

        @Test
        @DisplayName("Should detect LAYERING pattern if transfers are dispatched to 3 or more unique recipient wallets")
        void shouldDetectLayeringWhenRecipientCountExceedsThreshold() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(createTransaction(WALLET_ID, 3001L, new BigDecimal("100.00")));
            transactions.add(createTransaction(WALLET_ID, 3002L, new BigDecimal("200.00")));
            transactions.add(createTransaction(WALLET_ID, 3003L, new BigDecimal("300.00"))); // 3 unique recipients

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectLayering(WALLET_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).type()).isEqualTo("LAYERING");
            assertThat(result.get(0).riskScore()).isEqualTo(60);
            assertThat(result.get(0).description()).contains("Potential layering: Transfers to 3 different accounts");
        }

        @Test
        @DisplayName("Should NOT detect LAYERING if recipient count is less than 3")
        void shouldNotDetectLayeringWhenRecipientCountIsLow() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(createTransaction(WALLET_ID, 3001L, new BigDecimal("100.00")));
            transactions.add(createTransaction(WALLET_ID, 3001L, new BigDecimal("200.00"))); // Same recipient
            transactions.add(createTransaction(WALLET_ID, 3002L, new BigDecimal("300.00"))); // Only 2 unique recipients

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectLayering(WALLET_ID);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("detectIntegration Method Tests")
    class DetectIntegrationTests {

        @Test
        @DisplayName("Should detect INTEGRATION pattern when transaction count is at least 2 in the weekly history")
        void shouldDetectIntegrationWhenTransactionsExist() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(createTransaction(WALLET_ID, 4001L, new BigDecimal("50000.00")));
            transactions.add(createTransaction(WALLET_ID, 4002L, new BigDecimal("10000.00")));

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectIntegration(WALLET_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).type()).isEqualTo("INTEGRATION");
            assertThat(result.get(0).riskScore()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("detectCashOut Method Tests")
    class DetectCashOutTests {

        @Test
        @DisplayName("Should detect CASH_OUT pattern when rapid outflows match or exceed count threshold")
        void shouldDetectCashOutWhenOutflowFrequencyHigh() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(createTransaction(WALLET_ID, 4001L, new BigDecimal("5000.00")));
            transactions.add(createTransaction(WALLET_ID, 4002L, new BigDecimal("8000.00")));
            transactions.add(createTransaction(WALLET_ID, 4003L, new BigDecimal("2000.00"))); // 3 transactions

            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectCashOut(WALLET_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).type()).isEqualTo("CASH_OUT");
            assertThat(result.get(0).riskScore()).isEqualTo(55);
            assertThat(result.get(0).metadata().get("totalOutflow")).isEqualTo("15000.00");
        }
    }

    @Nested
    @DisplayName("detectAllPatterns Method Tests")
    class DetectAllPatternsTests {

        @Test
        @DisplayName("Should check all fraud models and report any model with a risk score >= 60 to AML monitoring")
        void shouldCheckAllAndReportHighRiskToAml() {
            // Arrange
            List<Transaction> transactions = new ArrayList<>();
            // Setup transactions that will trigger STRUCTURING (Risk 70) and LAYERING (Risk 60)
            // But we will just mock findByFromWalletIdAndCreatedAtAfter to return them
            for (int i = 0; i < 5; i++) {
                transactions.add(createTransaction(WALLET_ID, 9000L + i, new BigDecimal("95000.00")));
            }

            // We mock it for any LocalDateTime.class, since detectAllPatterns calls findByFromWalletIdAndCreatedAtAfter
            // multiple times with different time windows.
            when(transactionRepository.findByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any(LocalDateTime.class)))
                    .thenReturn(transactions);

            // Act
            List<FraudPatternDetectionService.FraudPattern> result = fraudPatternDetectionService.detectAllPatterns(WALLET_ID);

            // Assert
            assertThat(result).isNotEmpty();
            
            // Verify AML system gets reported for STRUCTURING (70) and LAYERING (60)
            // But NOT INTEGRATION (50) or CASH_OUT (55)
            verify(amlMonitoringService, times(2)).recordSuspiciousActivity(
                    any(),
                    argThat(type -> "STRUCTURING".equals(type) || "LAYERING".equals(type)),
                    anyString(),
                    isNull()
            );

            // Verify AML does not get reported for other lower risk activities
            verify(amlMonitoringService, never()).recordSuspiciousActivity(
                    any(),
                    eq("INTEGRATION"),
                    anyString(),
                    isNull()
            );
        }
    }
}
