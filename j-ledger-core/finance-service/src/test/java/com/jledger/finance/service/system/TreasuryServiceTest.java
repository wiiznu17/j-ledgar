package com.jledger.finance.service.system;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.TreasuryBankAccount;
import com.jledger.finance.domain.entity.TreasuryPayout;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.dto.TreasurySummaryResponse;
import com.jledger.finance.repository.system.TreasuryBankAccountRepository;
import com.jledger.finance.repository.system.TreasuryPayoutRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TreasuryService Unit Tests")
class TreasuryServiceTest {

    @Mock
    private TreasuryBankAccountRepository bankAccountRepository;

    @Mock
    private TreasuryPayoutRepository payoutRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private WalletRepository walletRepository;

    @InjectMocks
    private TreasuryService treasuryService;

    @Nested
    @DisplayName("getSummary Method Tests")
    class GetSummaryTests {

        @Test
        @DisplayName("Should successfully calculate Stripe balance, aggregate bank accounts, customer liability, and compute the reserve ratio")
        void shouldCalculateCorrectTreasurySummary() {
            // Arrange
            // 1. Stripe balance setup
            BigDecimal totalTopups = new BigDecimal("5000000.0000"); // 5M THB
            when(transactionRepository.sumAmountByTypeAndStatus(TransactionType.TOPUP, TransactionStatus.COMPLETED))
                    .thenReturn(totalTopups);

            TreasuryPayout payout1 = new TreasuryPayout();
            payout1.setStatus("COMPLETED");
            payout1.setAmount(new BigDecimal("1000000.0000"));

            TreasuryPayout payout2 = new TreasuryPayout();
            payout2.setStatus("PENDING"); // should be ignored
            payout2.setAmount(new BigDecimal("200000.0000"));

            when(payoutRepository.findAll()).thenReturn(Arrays.asList(payout1, payout2));
            // stripeBalance = 5M - 1M = 4M

            // 2. Bank accounts setup
            TreasuryBankAccount scb = new TreasuryBankAccount();
            scb.setName("SCB Main Account");
            scb.setBankName("Siam Commercial Bank");
            scb.setAccountNumber("111-222-333");
            scb.setBalance(new BigDecimal("2000000.0000")); // 2M
            scb.setProvider("SCB");

            when(bankAccountRepository.findAll()).thenReturn(Collections.singletonList(scb));
            // totalBankBalance = 2M
            // totalAssets = stripeBalance (4M) + bankBalance (2M) = 6M

            // 3. User liabilities setup
            BigDecimal totalCustomerLiability = new BigDecimal("4000000.0000"); // 4M
            when(walletRepository.sumAllBalances()).thenReturn(totalCustomerLiability);

            // reserveRatio = 6M * 100 / 4M = 150.00 %

            // Act
            TreasurySummaryResponse summary = treasuryService.getSummary();

            // Assert
            assertThat(summary).isNotNull();
            assertThat(summary.getStripeBalance()).isEqualByComparingTo("4000000.0000");
            assertThat(summary.getTotalBankBalance()).isEqualByComparingTo("2000000.0000");
            assertThat(summary.getTotalCustomerLiability()).isEqualByComparingTo("4000000.0000");
            assertThat(summary.getReserveRatio()).isEqualByComparingTo("150.00"); // 150% liquidity reserve

            assertThat(summary.getBankAccounts()).hasSize(1);
            assertThat(summary.getBankAccounts().get(0).getBankName()).isEqualTo("Siam Commercial Bank");
        }

        @Test
        @DisplayName("Should handle null values gracefully and compute 0% reserve ratio if no customer liability exists")
        void shouldHandleNullValuesGracefully() {
            // Arrange
            when(transactionRepository.sumAmountByTypeAndStatus(any(), any())).thenReturn(null);
            when(payoutRepository.findAll()).thenReturn(Collections.emptyList());
            when(bankAccountRepository.findAll()).thenReturn(Collections.emptyList());
            when(walletRepository.sumAllBalances()).thenReturn(null);

            // Act
            TreasurySummaryResponse summary = treasuryService.getSummary();

            // Assert
            assertThat(summary).isNotNull();
            assertThat(summary.getStripeBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(summary.getTotalBankBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(summary.getTotalCustomerLiability()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(summary.getReserveRatio()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("recordStripePayoutConfirmed Method Tests")
    class PayoutConfirmationTests {

        @Test
        @DisplayName("Should successfully record payout, credit destination account, and write double-entry sweeps")
        void shouldConfirmStripePayoutSuccessfully() {
            // Arrange
            String stripePayoutId = "po_stripe_12345";
            BigDecimal amount = new BigDecimal("850000.0000");
            LocalDateTime arrivalDate = LocalDateTime.now();

            // Idempotency: not yet processed
            when(payoutRepository.findByStripePayoutId(stripePayoutId)).thenReturn(Optional.empty());

            TreasuryBankAccount destAccount = new TreasuryBankAccount();
            destAccount.setAccountNumber("999-999-999");
            destAccount.setBalance(new BigDecimal("500000.0000"));
            destAccount.setProvider("SCB");

            when(bankAccountRepository.findByProvider("SCB")).thenReturn(Optional.of(destAccount));

            // Act
            treasuryService.recordStripePayoutConfirmed(stripePayoutId, amount, arrivalDate);

            // Assert
            // 1. Verify payout recorded
            verify(payoutRepository).save(argThat(payout ->
                    stripePayoutId.equals(payout.getStripePayoutId()) &&
                    amount.equals(payout.getAmount()) &&
                    "COMPLETED".equals(payout.getStatus()) &&
                    destAccount.equals(payout.getDestinationAccount())
            ));

            // 2. Verify SCB account credited (500k + 850k = 1.35M)
            assertThat(destAccount.getBalance()).isEqualByComparingTo("1350000.0000");
            verify(bankAccountRepository).save(destAccount);

            // 3. Verify double-entry Transaction is created and saved
            verify(transactionRepository).save(argThat(tx ->
                    stripePayoutId.equals(tx.getReferenceId()) &&
                    amount.equals(tx.getAmount()) &&
                    TransactionType.WITHDRAWAL == tx.getType() &&
                    TransactionStatus.COMPLETED == tx.getStatus() &&
                    tx.getDescription().contains("SCB")
            ));
        }

        @Test
        @DisplayName("Should skip processing immediately if stripePayoutId is already recorded (Idempotency Sweep Protection)")
        void shouldSkipProcessingIfAlreadyRecorded() {
            // Arrange
            String stripePayoutId = "po_stripe_already_exists";
            when(payoutRepository.findByStripePayoutId(stripePayoutId))
                    .thenReturn(Optional.of(new TreasuryPayout()));

            // Act
            treasuryService.recordStripePayoutConfirmed(stripePayoutId, new BigDecimal("100.00"), LocalDateTime.now());

            // Assert
            verify(payoutRepository, never()).save(any());
            verifyNoInteractions(bankAccountRepository);
            verifyNoInteractions(transactionRepository);
        }

        @Test
        @DisplayName("Should throw RuntimeException if SCB corporate bank account is missing from database configurations")
        void shouldThrowExceptionIfDestinationAccountNotFound() {
            // Arrange
            String stripePayoutId = "po_stripe_no_bank";
            when(payoutRepository.findByStripePayoutId(stripePayoutId)).thenReturn(Optional.empty());
            when(bankAccountRepository.findByProvider("SCB")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> treasuryService.recordStripePayoutConfirmed(stripePayoutId, new BigDecimal("100.00"), LocalDateTime.now()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Destination bank account not found");

            verify(payoutRepository, never()).save(any());
        }
    }
}
