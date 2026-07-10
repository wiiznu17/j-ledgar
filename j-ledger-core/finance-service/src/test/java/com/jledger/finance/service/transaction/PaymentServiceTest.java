package com.jledger.finance.service.transaction;

import com.jledger.finance.service.transaction.impl.PaymentServiceImpl;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.PaymentTransaction;
import com.jledger.finance.dto.PaymentCreateRequest;
import com.jledger.finance.dto.PaymentWebhookRequest;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.transaction.PaymentTransactionRepository;
import com.jledger.finance.service.wallet.WalletService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private WalletService walletService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private static final UUID ACCOUNT_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final String REFERENCE_ID = "PAY-999-STRIPE";

    @Nested
    @DisplayName("createPayment Method Tests")
    class CreatePaymentTests {

        @Test
        @DisplayName("Should successfully persist a new payment transaction with PENDING status")
        void shouldSuccessfullyCreatePendingPayment() {
            // Arrange
            PaymentCreateRequest request = new PaymentCreateRequest(
                    ACCOUNT_ID,
                    REFERENCE_ID,
                    new BigDecimal("500.00"),
                    PaymentTransaction.Type.TOPUP
            );

            when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Act
            PaymentTransaction result = paymentService.createPayment(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getAccountId()).isEqualTo(ACCOUNT_ID);
            assertThat(result.getReferenceId()).isEqualTo(REFERENCE_ID);
            assertThat(result.getAmount()).isEqualTo(new BigDecimal("500.00"));
            assertThat(result.getType()).isEqualTo(PaymentTransaction.Type.TOPUP);
            assertThat(result.getStatus()).isEqualTo(PaymentTransaction.Status.PENDING);

            verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
        }
    }

    @Nested
    @DisplayName("processWebhook Method Tests")
    class ProcessWebhookTests {

        @Test
        @DisplayName("Should throw IllegalArgumentException if webhook signature is missing or blank")
        void shouldThrowExceptionWhenSignatureIsInvalid() {
            // Arrange
            PaymentWebhookRequest requestWithNullSig = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", BigDecimal.ZERO, null);
            PaymentWebhookRequest requestWithBlankSig = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", BigDecimal.ZERO, "   ");

            // Act & Assert
            assertThatThrownBy(() -> paymentService.processWebhook(requestWithNullSig))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid signature");

            assertThatThrownBy(() -> paymentService.processWebhook(requestWithBlankSig))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid signature");

            verifyNoInteractions(paymentTransactionRepository);
        }

        @Test
        @DisplayName("Should skip processing if payment cannot be atomically claimed (already processed by another thread)")
        void shouldSkipProcessingWhenClaimFails() {
            // Arrange
            PaymentWebhookRequest webhook = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", new BigDecimal("150.00"), "valid-signature");
            
            // claimIfPending returns 0 (already claimed/processed)
            when(paymentTransactionRepository.claimIfPending(REFERENCE_ID)).thenReturn(0);

            PaymentTransaction existingPayment = PaymentTransaction.builder()
                    .referenceId(REFERENCE_ID)
                    .status(PaymentTransaction.Status.SUCCESS)
                    .build();

            when(paymentTransactionRepository.findByReferenceId(REFERENCE_ID))
                    .thenReturn(Optional.of(existingPayment));

            // Act
            paymentService.processWebhook(webhook);

            // Assert
            verify(paymentTransactionRepository).claimIfPending(REFERENCE_ID);
            verify(paymentTransactionRepository).findByReferenceId(REFERENCE_ID);
            verify(paymentTransactionRepository, never()).save(any());
            verifyNoInteractions(walletService);
        }

        @Test
        @DisplayName("Should successfully settle and mark TOPUP payment as SUCCESS when webhook reports SUCCESS")
        void shouldSettleAndSucceedTopUpOnWebhookSuccess() {
            // Arrange
            PaymentWebhookRequest webhook = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", new BigDecimal("150.00"), "valid-sig");

            when(paymentTransactionRepository.claimIfPending(REFERENCE_ID)).thenReturn(1); // Exclusively claimed

            PaymentTransaction payment = PaymentTransaction.builder()
                    .accountId(ACCOUNT_ID)
                    .referenceId(REFERENCE_ID)
                    .amount(new BigDecimal("150.00"))
                    .type(PaymentTransaction.Type.TOPUP)
                    .status(PaymentTransaction.Status.PROCESSING)
                    .build();

            Account account = Account.builder()
                    .id(ACCOUNT_ID)
                    .userId(USER_ID)
                    .build();

            when(paymentTransactionRepository.findByReferenceId(REFERENCE_ID)).thenReturn(Optional.of(payment));
            when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));
            when(paymentTransactionRepository.save(payment)).thenReturn(payment);

            // Act
            paymentService.processWebhook(webhook);

            // Assert
            assertThat(payment.getStatus()).isEqualTo(PaymentTransaction.Status.SUCCESS);
            
            verify(walletService).creditTopUpFromExternal(
                    eq(USER_ID.toString()),
                    eq(new BigDecimal("150.00")),
                    eq("THB"),
                    eq(REFERENCE_ID),
                    eq("STRIPE"),
                    isNull()
            );
            verify(paymentTransactionRepository).save(payment);
        }

        @Test
        @DisplayName("Should mark payment as FAILED if settlement service throws any exception")
        void shouldMarkFailedWhenSettlementThrowsException() {
            // Arrange
            PaymentWebhookRequest webhook = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", new BigDecimal("150.00"), "valid-sig");

            when(paymentTransactionRepository.claimIfPending(REFERENCE_ID)).thenReturn(1);

            PaymentTransaction payment = PaymentTransaction.builder()
                    .accountId(ACCOUNT_ID)
                    .referenceId(REFERENCE_ID)
                    .amount(new BigDecimal("150.00"))
                    .type(PaymentTransaction.Type.TOPUP)
                    .status(PaymentTransaction.Status.PROCESSING)
                    .build();

            Account account = Account.builder()
                    .id(ACCOUNT_ID)
                    .userId(USER_ID)
                    .build();

            when(paymentTransactionRepository.findByReferenceId(REFERENCE_ID)).thenReturn(Optional.of(payment));
            when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));
            
            // Force credit to throw exception
            doThrow(new RuntimeException("Stripe API down"))
                    .when(walletService).creditTopUpFromExternal(any(), any(), any(), any(), any(), any());

            // Act
            paymentService.processWebhook(webhook);

            // Assert
            assertThat(payment.getStatus()).isEqualTo(PaymentTransaction.Status.FAILED);
            verify(paymentTransactionRepository).save(payment);
        }

        @Test
        @DisplayName("Should mark payment as FAILED if webhook reports non-SUCCESS status")
        void shouldMarkFailedOnWebhookFailure() {
            // Arrange
            PaymentWebhookRequest webhook = new PaymentWebhookRequest(REFERENCE_ID, "FAILED", new BigDecimal("150.00"), "valid-sig");

            when(paymentTransactionRepository.claimIfPending(REFERENCE_ID)).thenReturn(1);

            PaymentTransaction payment = PaymentTransaction.builder()
                    .accountId(ACCOUNT_ID)
                    .referenceId(REFERENCE_ID)
                    .amount(new BigDecimal("150.00"))
                    .type(PaymentTransaction.Type.TOPUP)
                    .status(PaymentTransaction.Status.PROCESSING)
                    .build();

            when(paymentTransactionRepository.findByReferenceId(REFERENCE_ID)).thenReturn(Optional.of(payment));

            // Act
            paymentService.processWebhook(webhook);

            // Assert
            assertThat(payment.getStatus()).isEqualTo(PaymentTransaction.Status.FAILED);
            verifyNoInteractions(walletService);
            verify(paymentTransactionRepository).save(payment);
        }

        @Test
        @DisplayName("Should mark payment as FAILED if type is WITHDRAW (currently unsupported)")
        void shouldMarkFailedForWithdrawalType() {
            // Arrange
            PaymentWebhookRequest webhook = new PaymentWebhookRequest(REFERENCE_ID, "SUCCESS", new BigDecimal("5000.00"), "valid-sig");

            when(paymentTransactionRepository.claimIfPending(REFERENCE_ID)).thenReturn(1);

            PaymentTransaction payment = PaymentTransaction.builder()
                    .accountId(ACCOUNT_ID)
                    .referenceId(REFERENCE_ID)
                    .amount(new BigDecimal("5000.00"))
                    .type(PaymentTransaction.Type.WITHDRAW) // Withdrawal
                    .status(PaymentTransaction.Status.PROCESSING)
                    .build();

            when(paymentTransactionRepository.findByReferenceId(REFERENCE_ID)).thenReturn(Optional.of(payment));

            // Act
            paymentService.processWebhook(webhook);

            // Assert
            assertThat(payment.getStatus()).isEqualTo(PaymentTransaction.Status.FAILED);
            verify(paymentTransactionRepository).save(payment);
        }
    }
}
