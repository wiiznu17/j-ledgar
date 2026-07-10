package com.jledger.finance.service.ledger;

import com.jledger.finance.domain.entity.Account;
import java.util.UUID;

public interface AccountService {
    Account updateAccountStatus(UUID id, String status);
    Account createAccount(UUID userId, String accountName, String currency, com.jledger.finance.domain.enums.AccountType accountType);
}
