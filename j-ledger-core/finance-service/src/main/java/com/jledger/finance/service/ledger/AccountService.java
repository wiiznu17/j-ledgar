package com.jledger.finance.service.ledger;

import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.repository.ledger.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;

    @Transactional
    public Account updateAccountStatus(UUID id, String status) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        account.setStatus(status);
        Account updated = accountRepository.save(account);
        
        log.info("Account status updated: id={}, status={}", id, status);
        return updated;
    }

    @Transactional
    public Account createAccount(UUID userId, String accountName, String currency, com.jledger.finance.domain.enums.AccountType accountType) {
        log.info("Creating new account for user: {}, name: {}, type: {}", userId, accountName, accountType);
        
        Account account = Account.builder()
                .userId(userId)
                .accountName(accountName)
                .accountType(accountType)
                .balance(java.math.BigDecimal.ZERO)
                .currency(currency != null ? currency : "THB")
                .status("ACTIVE")
                .build();
        
        return accountRepository.save(account);
    }
}
