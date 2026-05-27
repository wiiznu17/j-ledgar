package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.WalletStatus;
import com.jledger.finance.repository.wallet.WalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccountFreezeService Unit Tests")
class AccountFreezeServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @InjectMocks
    private AccountFreezeService accountFreezeService;

    private static final Long WALLET_ID = 1001L;
    private static final String REASON = "Suspicious behavior detected";
    private static final String ACTOR = "SECURITY_ADMIN";

    @Nested
    @DisplayName("freezeAccount Method Tests")
    class FreezeAccountTests {

        @Test
        @DisplayName("Should successfully freeze an active wallet and transition its status to FROZEN")
        void shouldSuccessfullyFreezeActiveWallet() {
            // Arrange
            Wallet wallet = new Wallet();
            wallet.setId(WALLET_ID);
            wallet.setStatus(WalletStatus.ACTIVE);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(wallet));
            when(walletRepository.save(wallet)).thenReturn(wallet);

            // Act
            Wallet result = accountFreezeService.freezeAccount(WALLET_ID, REASON, ACTOR);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.FROZEN);
            verify(walletRepository).findById(WALLET_ID);
            verify(walletRepository).save(wallet);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException if the wallet is not found by ID")
        void shouldThrowExceptionIfWalletNotFound() {
            // Arrange
            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> accountFreezeService.freezeAccount(WALLET_ID, REASON, ACTOR))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Wallet not found");

            verify(walletRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException if the wallet is already CLOSED")
        void shouldThrowExceptionWhenWalletIsClosed() {
            // Arrange
            Wallet closedWallet = new Wallet();
            closedWallet.setId(WALLET_ID);
            closedWallet.setStatus(WalletStatus.CLOSED);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(closedWallet));

            // Act & Assert
            assertThatThrownBy(() -> accountFreezeService.freezeAccount(WALLET_ID, REASON, ACTOR))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot freeze a closed wallet");

            verify(walletRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should skip saving and return wallet immediately if it is already FROZEN")
        void shouldDoNothingIfWalletIsAlreadyFrozen() {
            // Arrange
            Wallet alreadyFrozenWallet = new Wallet();
            alreadyFrozenWallet.setId(WALLET_ID);
            alreadyFrozenWallet.setStatus(WalletStatus.FROZEN);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(alreadyFrozenWallet));

            // Act
            Wallet result = accountFreezeService.freezeAccount(WALLET_ID, REASON, ACTOR);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.FROZEN);
            verify(walletRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("unfreezeAccount Method Tests")
    class UnfreezeAccountTests {

        @Test
        @DisplayName("Should successfully unfreeze a frozen wallet and transition status back to ACTIVE")
        void shouldSuccessfullyUnfreezeFrozenWallet() {
            // Arrange
            Wallet frozenWallet = new Wallet();
            frozenWallet.setId(WALLET_ID);
            frozenWallet.setStatus(WalletStatus.FROZEN);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(frozenWallet));
            when(walletRepository.save(frozenWallet)).thenReturn(frozenWallet);

            // Act
            Wallet result = accountFreezeService.unfreezeAccount(WALLET_ID, "Cleared after KYC", ACTOR);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.ACTIVE);
            verify(walletRepository).findById(WALLET_ID);
            verify(walletRepository).save(frozenWallet);
        }

        @Test
        @DisplayName("Should throw IllegalStateException when trying to unfreeze a CLOSED wallet")
        void shouldThrowExceptionWhenUnfreezingClosedWallet() {
            // Arrange
            Wallet closedWallet = new Wallet();
            closedWallet.setId(WALLET_ID);
            closedWallet.setStatus(WalletStatus.CLOSED);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(closedWallet));

            // Act & Assert
            assertThatThrownBy(() -> accountFreezeService.unfreezeAccount(WALLET_ID, "Clear", ACTOR))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot unfreeze a closed wallet");

            verify(walletRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should do nothing and return active wallet if it is already ACTIVE")
        void shouldDoNothingIfWalletIsAlreadyActive() {
            // Arrange
            Wallet activeWallet = new Wallet();
            activeWallet.setId(WALLET_ID);
            activeWallet.setStatus(WalletStatus.ACTIVE);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(activeWallet));

            // Act
            Wallet result = accountFreezeService.unfreezeAccount(WALLET_ID, "Check", ACTOR);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.ACTIVE);
            verify(walletRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("isAccountFrozen Method Tests")
    class IsAccountFrozenTests {

        @Test
        @DisplayName("Should return true if wallet exists and is FROZEN")
        void shouldReturnTrueIfWalletIsFrozen() {
            Wallet frozenWallet = new Wallet();
            frozenWallet.setStatus(WalletStatus.FROZEN);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(frozenWallet));

            boolean result = accountFreezeService.isAccountFrozen(WALLET_ID);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false if wallet exists and is ACTIVE")
        void shouldReturnFalseIfWalletIsActive() {
            Wallet activeWallet = new Wallet();
            activeWallet.setStatus(WalletStatus.ACTIVE);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(activeWallet));

            boolean result = accountFreezeService.isAccountFrozen(WALLET_ID);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false if wallet does not exist")
        void shouldReturnFalseIfWalletDoesNotExist() {
            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.empty());

            boolean result = accountFreezeService.isAccountFrozen(WALLET_ID);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("Automated AML Freeze / Unfreeze Tests")
    class AutomatedAmlTests {

        @Test
        @DisplayName("Should successfully freeze account with AML_SYSTEM as actor and reason containing suspicious activity ID")
        void shouldFreezeAccountDueToSuspiciousActivity() {
            // Arrange
            Wallet wallet = new Wallet();
            wallet.setId(WALLET_ID);
            wallet.setStatus(WalletStatus.ACTIVE);
            String activityId = "AML-999-XYZ";

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(wallet));
            when(walletRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Wallet result = accountFreezeService.freezeAccountDueToSuspiciousActivity(WALLET_ID, activityId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.FROZEN);
            verify(walletRepository).save(argThat(w -> 
                WalletStatus.FROZEN == w.getStatus() && WALLET_ID.equals(w.getId())
            ));
        }

        @Test
        @DisplayName("Should successfully unfreeze account after investigation clears suspicious activity")
        void shouldUnfreezeAccountAfterInvestigation() {
            // Arrange
            Wallet wallet = new Wallet();
            wallet.setId(WALLET_ID);
            wallet.setStatus(WalletStatus.FROZEN);

            when(walletRepository.findById(WALLET_ID)).thenReturn(Optional.of(wallet));
            when(walletRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Wallet result = accountFreezeService.unfreezeAccountAfterInvestigation(WALLET_ID, "INVESTIGATOR_JOHN");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(WalletStatus.ACTIVE);
            verify(walletRepository).save(argThat(w ->
                WalletStatus.ACTIVE == w.getStatus() && WALLET_ID.equals(w.getId())
            ));
        }
    }
}
