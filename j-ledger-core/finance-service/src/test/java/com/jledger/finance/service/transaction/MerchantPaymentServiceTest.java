package com.jledger.finance.service.transaction;

import com.jledger.finance.service.transaction.impl.MerchantPaymentServiceImpl;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.dto.MerchantMultiPayRequest;
import com.jledger.finance.dto.MerchantPayLeg;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.service.system.RedisIdempotencyService;
import com.jledger.finance.service.wallet.WalletService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MerchantPaymentService Unit Tests")
class MerchantPaymentServiceTest {

    @Mock
    private WalletService walletService;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RedisIdempotencyService redisIdempotencyService;

    @InjectMocks
    private MerchantPaymentServiceImpl merchantPaymentService;

    private static final String SENDER_WALLET_ID = "W11111";
    private static final String MERCHANT_WALLET_ID = "W88888";
    private static final String DRIVER_WALLET_ID = "W99999";
    private static final String USER_ID = "sender-user-uuid";
    private static final String IDEMPOTENCY_KEY = "payment-idempotency-XYZ";

    @Nested
    @DisplayName("processMerchantPayment Method Tests")
    class ProcessMerchantPaymentTests {

        @Test
        @DisplayName("Should successfully process single leg merchant payment")
        void shouldProcessSingleLegPayment() {
            // Arrange
            MerchantPayRequest request = new MerchantPayRequest(
                    SENDER_WALLET_ID,
                    MERCHANT_WALLET_ID,
                    new BigDecimal("150.00"),
                    "THB",
                    new HashMap<>()
            );

            Wallet senderWallet = new Wallet();
            senderWallet.setId(5005L);
            senderWallet.setUserId(USER_ID);

            // Mocks for Resolve Wallet
            when(walletRepository.findByWalletId(SENDER_WALLET_ID)).thenReturn(Optional.of(senderWallet));
            
            // Mock Idempotency check returns empty
            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.empty());

            // Mock WalletService wallet transfer
            Transaction mockTx = new Transaction();
            mockTx.setTransactionId("TXN-PAY-001");
            mockTx.setAmount(new BigDecimal("150.00"));
            when(walletService.transferWalletToAccount(eq(USER_ID), eq(MERCHANT_WALLET_ID), eq(new BigDecimal("150.00")), any()))
                    .thenReturn(mockTx);

            // Act
            Transaction result = merchantPaymentService.processMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTransactionId()).isEqualTo("TXN-PAY-001");
            verify(redisIdempotencyService).cacheResponse(IDEMPOTENCY_KEY, mockTx);
        }
    }

    @Nested
    @DisplayName("processMultiLegMerchantPayment Method Tests")
    class ProcessMultiLegMerchantPaymentTests {

        @Test
        @DisplayName("Should successfully process food delivery app multi-leg payment split (merchant and driver)")
        void shouldProcessMultiLegSplit() {
            // Arrange
            List<MerchantPayLeg> legs = Arrays.asList(
                    new MerchantPayLeg(MERCHANT_WALLET_ID, new BigDecimal("120.00"), "Food Leg", new HashMap<>()),
                    new MerchantPayLeg(DRIVER_WALLET_ID, new BigDecimal("30.00"), "Delivery Leg", new HashMap<>())
            );
            MerchantMultiPayRequest request = new MerchantMultiPayRequest(SENDER_WALLET_ID, "THB", legs);

            Wallet senderWallet = new Wallet();
            senderWallet.setId(5005L);
            senderWallet.setUserId(USER_ID);

            when(walletRepository.findByWalletId(SENDER_WALLET_ID)).thenReturn(Optional.of(senderWallet));
            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.empty());

            // Mock Leg Transfers
            Transaction primaryTx = new Transaction();
            primaryTx.setTransactionId("TXN-LEG-001");
            primaryTx.setAmount(new BigDecimal("120.00"));

            Transaction driverTx = new Transaction();
            driverTx.setTransactionId("TXN-LEG-002");
            driverTx.setAmount(new BigDecimal("30.00"));

            when(walletService.transferWalletToAccount(USER_ID, MERCHANT_WALLET_ID, new BigDecimal("120.00"), request.legs().get(0).metadata()))
                    .thenReturn(primaryTx);
            when(walletService.transferWalletToAccount(USER_ID, DRIVER_WALLET_ID, new BigDecimal("30.00"), request.legs().get(1).metadata()))
                    .thenReturn(driverTx);

            // Act
            Transaction result = merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTransactionId()).isEqualTo("TXN-LEG-001"); // returns primary/first leg transaction
            verify(walletService).transferWalletToAccount(USER_ID, MERCHANT_WALLET_ID, new BigDecimal("120.00"), request.legs().get(0).metadata());
            verify(walletService).transferWalletToAccount(USER_ID, DRIVER_WALLET_ID, new BigDecimal("30.00"), request.legs().get(1).metadata());
            verify(redisIdempotencyService).cacheResponse(IDEMPOTENCY_KEY, primaryTx);
        }

        @Test
        @DisplayName("Should return cached response on idempotency hit")
        void shouldReturnCachedTransactionOnIdempotencyHit() {
            // Arrange
            List<MerchantPayLeg> legs = Collections.singletonList(
                    new MerchantPayLeg(MERCHANT_WALLET_ID, new BigDecimal("100.00"), "Leg", null)
            );
            MerchantMultiPayRequest request = new MerchantMultiPayRequest(SENDER_WALLET_ID, "THB", legs);

            Transaction cachedTx = new Transaction();
            cachedTx.setTransactionId("TXN-CACHED-99");
            cachedTx.setAmount(new BigDecimal("100.00"));

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.of(cachedTx));

            // Act
            Transaction result = merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTransactionId()).isEqualTo("TXN-CACHED-99");
            verify(walletRepository, never()).findByWalletId(anyString());
            verify(walletService, never()).transferWalletToAccount(anyString(), anyString(), any(), any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException if payment legs list is empty")
        void shouldThrowIfLegsListIsEmpty() {
            // Arrange
            MerchantMultiPayRequest request = new MerchantMultiPayRequest(SENDER_WALLET_ID, "THB", Collections.emptyList());

            // Act & Assert
            assertThatThrownBy(() -> merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Payment must have at least one leg");
        }
    }

    @Nested
    @DisplayName("resolveWallet Private Mapping Tests")
    class ResolveWalletTests {

        @Test
        @DisplayName("Should resolve wallet using Wallet ID (prefix W)")
        void shouldResolveByWalletId() {
            // Arrange
            List<MerchantPayLeg> legs = Collections.singletonList(
                    new MerchantPayLeg(MERCHANT_WALLET_ID, new BigDecimal("100.00"), "Leg", null)
            );
            // Sender wallet starts with "W"
            MerchantMultiPayRequest request = new MerchantMultiPayRequest(SENDER_WALLET_ID, "THB", legs);

            Wallet wallet = new Wallet();
            wallet.setId(5005L);
            wallet.setUserId(USER_ID);

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.empty());
            when(walletRepository.findByWalletId(SENDER_WALLET_ID)).thenReturn(Optional.of(wallet));
            when(walletService.transferWalletToAccount(anyString(), anyString(), any(), any()))
                    .thenReturn(new Transaction());

            // Act
            merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            verify(walletRepository).findByWalletId(SENDER_WALLET_ID);
        }

        @Test
        @DisplayName("Should resolve wallet using database Primary Key Long ID")
        void shouldResolveByDbPrimaryKey() {
            // Arrange
            List<MerchantPayLeg> legs = Collections.singletonList(
                    new MerchantPayLeg(MERCHANT_WALLET_ID, new BigDecimal("100.00"), "Leg", null)
            );
            // Sender wallet ID is numeric string
            MerchantMultiPayRequest request = new MerchantMultiPayRequest("12345", "THB", legs);

            Wallet wallet = new Wallet();
            wallet.setId(12345L);
            wallet.setUserId(USER_ID);

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.empty());
            when(walletRepository.findById(12345L)).thenReturn(Optional.of(wallet));
            when(walletService.transferWalletToAccount(anyString(), anyString(), any(), any()))
                    .thenReturn(new Transaction());

            // Act
            merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            verify(walletRepository).findById(12345L);
        }

        @Test
        @DisplayName("Should resolve wallet using User ID fallback")
        void shouldResolveByUserUuidFallback() {
            // Arrange
            List<MerchantPayLeg> legs = Collections.singletonList(
                    new MerchantPayLeg(MERCHANT_WALLET_ID, new BigDecimal("100.00"), "Leg", null)
            );
            // Sender wallet ID is UUID fallback (neither W-prefixed nor purely numeric)
            String uuidStr = "aaa-bbb-ccc";
            MerchantMultiPayRequest request = new MerchantMultiPayRequest(uuidStr, "THB", legs);

            Wallet wallet = new Wallet();
            wallet.setId(5005L);
            wallet.setUserId(uuidStr);

            when(redisIdempotencyService.getIfProcessed(IDEMPOTENCY_KEY)).thenReturn(Optional.empty());
            when(walletRepository.findByUserId(uuidStr)).thenReturn(Optional.of(wallet));
            when(walletService.transferWalletToAccount(anyString(), anyString(), any(), any()))
                    .thenReturn(new Transaction());

            // Act
            merchantPaymentService.processMultiLegMerchantPayment(IDEMPOTENCY_KEY, request);

            // Assert
            verify(walletRepository).findByUserId(uuidStr);
        }
    }
}
