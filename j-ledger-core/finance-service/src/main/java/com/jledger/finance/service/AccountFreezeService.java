package com.jledger.finance.service;

import com.jledger.finance.domain.Wallet;
import com.jledger.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final WalletRepository walletRepository;
    // private final AmlMonitoringService amlMonitoringService; // TODO: Uncomment after AML service refactor

    /**
     * Freezes an account, preventing all transactions.
     *
     * @param walletId the wallet ID to freeze
     * @param reason the reason for freezing
     * @param frozenBy the user or system that initiated the freeze
     * @return the updated wallet
     */
    @Transactional
    public Wallet freezeAccount(Long walletId, String reason, String frozenBy) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (CLOSED_STATUS.equals(wallet.getStatus())) {
            throw new IllegalStateException("Cannot freeze a closed wallet");
        }

        if (FROZEN_STATUS.equals(wallet.getStatus())) {
            log.warn("Wallet {} is already frozen", walletId);
            return wallet;
        }

        wallet.setStatus(FROZEN_STATUS);
        walletRepository.save(wallet);

        log.warn("Wallet {} frozen by {} for reason: {}", walletId, frozenBy, reason);

        // Record the freeze action in AML monitoring for audit trail
        // TODO: Uncomment after AML service refactor
        // amlMonitoringService.recordSuspiciousActivity(
        //         wallet.getUserId(),
        //         "ACCOUNT_FROZEN",
        //         "Account frozen by " + frozenBy + ": " + reason,
        //         null
        // );

        return wallet;
    }

    /**
     * Unfreezes an account, allowing transactions to proceed.
     *
     * @param walletId the wallet ID to unfreeze
     * @param reason the reason for unfreezing
     * @param unfrozenBy the user or system that initiated the unfreeze
     * @return the updated wallet
     */
    @Transactional
    public Wallet unfreezeAccount(Long walletId, String reason, String unfrozenBy) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (CLOSED_STATUS.equals(wallet.getStatus())) {
            throw new IllegalStateException("Cannot unfreeze a closed wallet");
        }

        if (ACTIVE_STATUS.equals(wallet.getStatus())) {
            log.warn("Wallet {} is already active", walletId);
            return wallet;
        }

        wallet.setStatus(ACTIVE_STATUS);
        walletRepository.save(wallet);

        log.info("Wallet {} unfrozen by {} for reason: {}", walletId, unfrozenBy, reason);

        return wallet;
    }

    /**
     * Checks if an account is frozen.
     *
     * @param walletId the wallet ID to check
     * @return true if the wallet is frozen, false otherwise
     */
    public boolean isAccountFrozen(Long walletId) {
        return walletRepository.findById(walletId)
                .map(wallet -> FROZEN_STATUS.equals(wallet.getStatus()))
                .orElse(false);
    }

    /**
     * Freezes an account due to suspicious activity detected by AML monitoring.
     * This is an automated freeze triggered by the AML system.
     *
     * @param walletId the wallet ID to freeze
     * @param suspiciousActivityId the ID of the suspicious activity that triggered the freeze
     * @return the updated wallet
     */
    @Transactional
    public Wallet freezeAccountDueToSuspiciousActivity(Long walletId, String suspiciousActivityId) {
        String reason = "Suspicious activity detected (ID: " + suspiciousActivityId + ")";
        return freezeAccount(walletId, reason, "AML_SYSTEM");
    }

    /**
     * Unfreezes an account after AML investigation clears the suspicious activity.
     * This is typically called after manual review or automated clearance.
     *
     * @param walletId the wallet ID to unfreeze
     * @param clearedBy the user or system that cleared the account
     * @return the updated wallet
     */
    @Transactional
    public Wallet unfreezeAccountAfterInvestigation(Long walletId, String clearedBy) {
        String reason = "Suspicious activity investigation completed and cleared";
        return unfreezeAccount(walletId, reason, clearedBy);
    }
}
