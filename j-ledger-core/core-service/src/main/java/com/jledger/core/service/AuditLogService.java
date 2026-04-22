package com.jledger.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Audit logging service for all financial operations.
 * Provides comprehensive audit trail for compliance and security monitoring.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuditLogService {

    private final ObjectMapper objectMapper;

    /**
     * Logs a transfer operation.
     *
     * @param transactionId the transaction ID
     * @param fromAccountId the sender account ID
     * @param toAccountId the receiver account ID
     * @param amount the transfer amount
     * @param currency the currency code
     * @param status the transaction status
     * @param performedBy the user or system that performed the operation
     */
    public void logTransferOperation(
            UUID transactionId,
            UUID fromAccountId,
            UUID toAccountId,
            BigDecimal amount,
            String currency,
            String status,
            String performedBy
    ) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "TRANSFER");
        auditData.put("transactionId", transactionId.toString());
        auditData.put("fromAccountId", fromAccountId.toString());
        auditData.put("toAccountId", toAccountId.toString());
        auditData.put("amount", amount.toString());
        auditData.put("currency", currency);
        auditData.put("status", status);
        auditData.put("performedBy", performedBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.info("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs an account freeze operation.
     *
     * @param accountId the account ID
     * @param reason the reason for freezing
     * @param frozenBy the user or system that froze the account
     */
    public void logAccountFreeze(UUID accountId, String reason, String frozenBy) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "ACCOUNT_FREEZE");
        auditData.put("accountId", accountId.toString());
        auditData.put("reason", reason);
        auditData.put("frozenBy", frozenBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.warn("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs an account unfreeze operation.
     *
     * @param accountId the account ID
     * @param reason the reason for unfreezing
     * @param unfrozenBy the user or system that unfroze the account
     */
    public void logAccountUnfreeze(UUID accountId, String reason, String unfrozenBy) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "ACCOUNT_UNFREEZE");
        auditData.put("accountId", accountId.toString());
        auditData.put("reason", reason);
        auditData.put("unfrozenBy", unfrozenBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.info("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs a transaction limit update.
     *
     * @param accountId the account ID
     * @param limitType the limit type
     * @param oldLimit the old limit amount
     * @param newLimit the new limit amount
     * @param updatedBy the user or system that updated the limit
     */
    public void logTransactionLimitUpdate(
            UUID accountId,
            String limitType,
            BigDecimal oldLimit,
            BigDecimal newLimit,
            String updatedBy
    ) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "TRANSACTION_LIMIT_UPDATE");
        auditData.put("accountId", accountId.toString());
        auditData.put("limitType", limitType);
        auditData.put("oldLimit", oldLimit.toString());
        auditData.put("newLimit", newLimit.toString());
        auditData.put("updatedBy", updatedBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.info("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs a KYC status change.
     *
     * @param accountId the account ID
     * @param oldStatus the old KYC status
     * @param newStatus the new KYC status
     * @param changedBy the user or system that changed the status
     */
    public void logKycStatusChange(
            UUID accountId,
            String oldStatus,
            String newStatus,
            String changedBy
    ) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "KYC_STATUS_CHANGE");
        auditData.put("accountId", accountId.toString());
        auditData.put("oldStatus", oldStatus);
        auditData.put("newStatus", newStatus);
        auditData.put("changedBy", changedBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.info("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs suspicious activity reporting to AMLO.
     *
     * @param activityId the suspicious activity ID
     * @param amloReference the AMLO reference number
     * @param reportedBy the user or system that reported the activity
     */
    public void logAmloReport(UUID activityId, String amloReference, String reportedBy) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "AMLO_REPORT");
        auditData.put("activityId", activityId.toString());
        auditData.put("amloReference", amloReference);
        auditData.put("reportedBy", reportedBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.warn("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs a failed transaction attempt.
     *
     * @param transactionId the transaction ID
     * @param fromAccountId the sender account ID
     * @param toAccountId the receiver account ID
     * @param amount the attempted amount
     * @param failureReason the reason for failure
     */
    public void logFailedTransaction(
            UUID transactionId,
            UUID fromAccountId,
            UUID toAccountId,
            BigDecimal amount,
            String failureReason
    ) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "FAILED_TRANSACTION");
        auditData.put("transactionId", transactionId.toString());
        auditData.put("fromAccountId", fromAccountId.toString());
        auditData.put("toAccountId", toAccountId.toString());
        auditData.put("amount", amount.toString());
        auditData.put("failureReason", failureReason);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.warn("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs a rate limit violation.
     *
     * @param accountId the account ID
     * @param violationType the type of rate limit violation
     * @param details additional details about the violation
     */
    public void logRateLimitViolation(UUID accountId, String violationType, String details) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "RATE_LIMIT_VIOLATION");
        auditData.put("accountId", accountId.toString());
        auditData.put("violationType", violationType);
        auditData.put("details", details);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.warn("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }

    /**
     * Logs a data retention cleanup operation.
     *
     * @param cleanupType the type of cleanup (TRANSACTION_CLEANUP, SUSPICIOUS_ACTIVITY_CLEANUP)
     * @param archivedCount the number of records archived
     * @param deletedCount the number of records deleted
     * @param performedBy the user or system that performed the cleanup
     */
    public void logDataRetentionCleanup(
            String cleanupType,
            int archivedCount,
            int deletedCount,
            String performedBy
    ) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("operation", "DATA_RETENTION_CLEANUP");
        auditData.put("cleanupType", cleanupType);
        auditData.put("archivedCount", archivedCount);
        auditData.put("deletedCount", deletedCount);
        auditData.put("performedBy", performedBy);
        auditData.put("timestamp", ZonedDateTime.now().toString());

        try {
            String auditJson = objectMapper.writeValueAsString(auditData);
            log.info("[AUDIT] {}", auditJson);
        } catch (Exception e) {
            log.error("Failed to serialize audit log", e);
        }
    }
}
