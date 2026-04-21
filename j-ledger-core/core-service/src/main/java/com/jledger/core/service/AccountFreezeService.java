package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Account freeze/unfreeze service.
 * Provides administrative controls to freeze and unfreeze accounts for security reasons.
 * 
 * Account freezing can be triggered by:
 * - Suspicious activity detected by AML monitoring
 * - KYC compliance failures
 * - Fraud investigations
 * - Regulatory requirements
 * - Customer requests
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AccountFreezeService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FROZEN_STATUS = "FROZEN";
    private static final String CLOSED_STATUS = "CLOSED";

    private final AccountRepository accountRepository;
    private final AmlMonitoringService amlMonitoringService;

    /**
     * Freezes an account, preventing all transactions.
     *
     * @param accountId the account ID to freeze
     * @param reason the reason for freezing
     * @param frozenBy the user or system that initiated the freeze
     * @return the updated account
     */
    @Transactional
    public Account freezeAccount(UUID accountId, String reason, String frozenBy) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (CLOSED_STATUS.equals(account.getStatus())) {
            throw new IllegalStateException("Cannot freeze a closed account");
        }

        if (FROZEN_STATUS.equals(account.getStatus())) {
            log.warn("Account {} is already frozen", accountId);
            return account;
        }

        account.setStatus(FROZEN_STATUS);
        accountRepository.save(account);

        log.warn("Account {} frozen by {} for reason: {}", accountId, frozenBy, reason);

        // Record the freeze action in AML monitoring for audit trail
        amlMonitoringService.recordSuspiciousActivity(
                accountId,
                "ACCOUNT_FROZEN",
                "Account frozen by " + frozenBy + ": " + reason,
                null
        );

        return account;
    }

    /**
     * Unfreezes an account, allowing transactions to proceed.
     *
     * @param accountId the account ID to unfreeze
     * @param reason the reason for unfreezing
     * @param unfrozenBy the user or system that initiated the unfreeze
     * @return the updated account
     */
    @Transactional
    public Account unfreezeAccount(UUID accountId, String reason, String unfrozenBy) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (CLOSED_STATUS.equals(account.getStatus())) {
            throw new IllegalStateException("Cannot unfreeze a closed account");
        }

        if (ACTIVE_STATUS.equals(account.getStatus())) {
            log.warn("Account {} is already active", accountId);
            return account;
        }

        account.setStatus(ACTIVE_STATUS);
        accountRepository.save(account);

        log.info("Account {} unfrozen by {} for reason: {}", accountId, unfrozenBy, reason);

        return account;
    }

    /**
     * Checks if an account is frozen.
     *
     * @param accountId the account ID to check
     * @return true if the account is frozen, false otherwise
     */
    public boolean isAccountFrozen(UUID accountId) {
        return accountRepository.findById(accountId)
                .map(account -> FROZEN_STATUS.equals(account.getStatus()))
                .orElse(false);
    }

    /**
     * Freezes an account due to suspicious activity detected by AML monitoring.
     * This is an automated freeze triggered by the AML system.
     *
     * @param accountId the account ID to freeze
     * @param suspiciousActivityId the ID of the suspicious activity that triggered the freeze
     * @return the updated account
     */
    @Transactional
    public Account freezeAccountDueToSuspiciousActivity(UUID accountId, String suspiciousActivityId) {
        String reason = "Suspicious activity detected (ID: " + suspiciousActivityId + ")";
        return freezeAccount(accountId, reason, "AML_SYSTEM");
    }

    /**
     * Unfreezes an account after AML investigation clears the suspicious activity.
     * This is typically called after manual review or automated clearance.
     *
     * @param accountId the account ID to unfreeze
     * @param clearedBy the user or system that cleared the account
     * @return the updated account
     */
    @Transactional
    public Account unfreezeAccountAfterInvestigation(UUID accountId, String clearedBy) {
        String reason = "Suspicious activity investigation completed and cleared";
        return unfreezeAccount(accountId, reason, clearedBy);
    }
}
