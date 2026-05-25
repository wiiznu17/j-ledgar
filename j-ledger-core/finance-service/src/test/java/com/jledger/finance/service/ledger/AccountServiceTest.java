package com.jledger.finance.service.ledger;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.enums.AccountType;
import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.repository.ledger.AccountRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccountService Unit Tests")
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountService accountService;

    private static final UUID ACCOUNT_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    @Nested
    @DisplayName("updateAccountStatus Method Tests")
    class UpdateAccountStatusTests {

        @Test
        @DisplayName("Should successfully update account status to specified value when account exists")
        void shouldUpdateStatusSuccessfully() {
            // Arrange
            Account account = Account.builder()
                    .id(ACCOUNT_ID)
                    .status("ACTIVE")
                    .build();

            when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));
            when(accountRepository.save(account)).thenReturn(account);

            // Act
            Account result = accountService.updateAccountStatus(ACCOUNT_ID, "SUSPENDED");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo("SUSPENDED");
            verify(accountRepository).findById(ACCOUNT_ID);
            verify(accountRepository).save(account);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when the account is not found by ID")
        void shouldThrowExceptionWhenAccountNotFound() {
            // Arrange
            when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> accountService.updateAccountStatus(ACCOUNT_ID, "INACTIVE"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Account not found");

            verify(accountRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("createAccount Method Tests")
    class CreateAccountTests {

        @Test
        @DisplayName("Should successfully create and persist a new ACTIVE account with default balance and currency")
        void shouldCreateAccountSuccessfully() {
            // Arrange
            when(accountRepository.save(any(Account.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Act
            Account result = accountService.createAccount(
                    USER_ID,
                    "Investment Account",
                    "THB",
                    AccountType.WALLET
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(USER_ID);
            assertThat(result.getAccountName()).isEqualTo("Investment Account");
            assertThat(result.getAccountType()).isEqualTo(AccountType.WALLET);
            assertThat(result.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getCurrency()).isEqualTo("THB");
            assertThat(result.getStatus()).isEqualTo("ACTIVE");

            verify(accountRepository).save(any(Account.class));
        }

        @Test
        @DisplayName("Should fallback to default THB currency if currency argument is null")
        void shouldCreateAccountWithDefaultCurrencyWhenNull() {
            // Arrange
            when(accountRepository.save(any(Account.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Act
            Account result = accountService.createAccount(
                    USER_ID,
                    "General Wallet",
                    null, // null currency
                    AccountType.WALLET
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getCurrency()).isEqualTo("THB");
            verify(accountRepository).save(any(Account.class));
        }
    }
}
