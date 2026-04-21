package com.jledger.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Account takeover detection service.
 * Detects patterns indicative of account takeover attempts.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AccountTakeoverDetectionService {

    private final AmlMonitoringService amlMonitoringService;
    private final AccountFreezeService accountFreezeService;
    private final ObjectMapper objectMapper;

    private static final int RAPID_TRANSFER_THRESHOLD = 5;
    private static final int RAPID_TRANSFER_WINDOW_MINUTES = 10;
    private static final int UNUSUAL_LOCATION_THRESHOLD = 3;
    private static final BigDecimal UNUSUAL_AMOUNT_THRESHOLD = new BigDecimal("50000");

    /**
     * Detects account takeover patterns based on transaction behavior.
     *
     * @param accountId the account ID
     * @param transactionCount the number of recent transactions
     * @param totalAmount the total amount of recent transactions
     * @param location the location of the transaction (if available)
     */
    public void detectAccountTakeover(
            UUID accountId,
            int transactionCount,
            BigDecimal totalAmount,
            String location
    ) {
        // Pattern 1: Rapid transfer activity
        if (transactionCount >= RAPID_TRANSFER_THRESHOLD) {
            log.warn("Account takeover pattern detected: Rapid transfers for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "RAPID_TRANSFER_ACTIVITY",
                    String.format("%d transactions in %d minutes", transactionCount, RAPID_TRANSFER_WINDOW_MINUTES),
                    null
            );
            
            // Auto-freeze account for suspicious rapid activity
            if (transactionCount >= RAPID_TRANSFER_THRESHOLD * 2) {
                accountFreezeService.freezeAccountDueToSuspiciousActivity(accountId, "RAPID_TRANSFER_DETECTED");
            }
        }

        // Pattern 2: Unusual transaction amounts
        if (totalAmount.compareTo(UNUSUAL_AMOUNT_THRESHOLD) > 0) {
            log.warn("Account takeover pattern detected: Unusual large amounts for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "UNUSUAL_TRANSACTION_AMOUNT",
                    String.format("Total amount %s exceeds threshold %s", totalAmount, UNUSUAL_AMOUNT_THRESHOLD),
                    null
            );
        }

        // Pattern 3: Unusual location (if location tracking is enabled)
        if (location != null && isUnusualLocation(accountId, location)) {
            log.warn("Account takeover pattern detected: Unusual location for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "UNUSUAL_LOCATION",
                    "Transaction from unusual location: " + location,
                    null
            );
        }
    }

    /**
     * Detects suspicious login patterns.
     *
     * @param accountId the account ID
     * @param failedAttempts the number of failed login attempts
     * @param ipAddress the IP address of the login attempt
     * @param userAgent the user agent string
     */
    public void detectSuspiciousLogin(
            UUID accountId,
            int failedAttempts,
            String ipAddress,
            String userAgent
    ) {
        // Pattern: Multiple failed login attempts
        if (failedAttempts >= 5) {
            log.warn("Account takeover pattern detected: Multiple failed logins for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "MULTIPLE_FAILED_LOGINS",
                    String.format("%d failed login attempts", failedAttempts),
                    null
            );
        }

        // Pattern: Login from unusual IP (if we have historical data)
        if (ipAddress != null && isUnusualIpAddress(accountId, ipAddress)) {
            log.warn("Account takeover pattern detected: Unusual IP address for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "UNUSUAL_IP_ADDRESS",
                    "Login from unusual IP: " + ipAddress,
                    null
            );
        }
    }

    /**
     * Detects suspicious account changes.
     *
     * @param accountId the account ID
     * @param changeType the type of change (password, email, phone, etc.)
     * @param oldValue the old value (masked)
     * @param newValue the new value (masked)
     */
    public void detectSuspiciousAccountChange(
            UUID accountId,
            String changeType,
            String oldValue,
            String newValue
    ) {
        // Pattern: Rapid multiple account changes
        if (isRapidAccountChange(accountId, changeType)) {
            log.warn("Account takeover pattern detected: Rapid account changes for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "RAPID_ACCOUNT_CHANGES",
                    "Multiple account changes in short period",
                    null
            );
        }

        // Pattern: Sensitive account changes (password, email, phone)
        if (isSensitiveChange(changeType)) {
            log.warn("Account takeover pattern detected: Sensitive account change for account {}", accountId);
            amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    "SENSITIVE_ACCOUNT_CHANGE",
                    "Sensitive account change: " + changeType,
                    null
            );
        }
    }

    /**
     * Checks if a location is unusual for the account.
     * This would require historical location data.
     */
    private boolean isUnusualLocation(UUID accountId, String location) {
        // In production, this would compare against historical location data
        // For now, return false as placeholder
        return false;
    }

    /**
     * Checks if an IP address is unusual for the account.
     * This would require historical IP data.
     */
    private boolean isUnusualIpAddress(UUID accountId, String ipAddress) {
        // In production, this would compare against historical IP data
        // For now, return false as placeholder
        return false;
    }

    /**
     * Checks if there are rapid account changes.
     * This would require tracking recent changes.
     */
    private boolean isRapidAccountChange(UUID accountId, String changeType) {
        // In production, this would check recent change history
        // For now, return false as placeholder
        return false;
    }

    /**
     * Checks if the change type is sensitive.
     */
    private boolean isSensitiveChange(String changeType) {
        return List.of("password", "email", "phone", "security_question", "pin")
                .contains(changeType.toLowerCase());
    }

    /**
     * Gets account takeover risk score.
     *
     * @param accountId the account ID
     * @return the risk score (0-100)
     */
    public int getAccountTakeoverRiskScore(UUID accountId) {
        // In production, this would calculate based on various factors
        // For now, return a placeholder score
        return 0;
    }
}
