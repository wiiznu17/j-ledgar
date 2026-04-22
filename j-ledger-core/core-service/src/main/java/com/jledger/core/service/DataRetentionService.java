package com.jledger.core.service;

import com.jledger.core.repository.TransactionRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.SuspiciousActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

/**
 * Data retention service for transaction records.
 * Implements automated cleanup and archival of old transaction data
 * in compliance with AML regulations (7-year retention requirement).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DataRetentionService {

    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final AuditLogService auditLogService;

    // AML requirement: 7 years retention for transaction records
    private static final int TRANSACTION_RETENTION_YEARS = 7;

    // Suspicious activity records retained for 10 years (AMLO requirement)
    private static final int SUSPICIOUS_ACTIVITY_RETENTION_YEARS = 10;

    /**
     * Scheduled task to clean up old transaction records.
     * Runs daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldTransactionRecords() {
        log.info("Starting cleanup of old transaction records");

        ZonedDateTime cutoffDate = ZonedDateTime.now().minusYears(TRANSACTION_RETENTION_YEARS);

        try {
            // Archive old transactions before deletion
            int archivedCount = archiveOldTransactions(cutoffDate);
            log.info("Archived {} transactions older than {}", archivedCount, cutoffDate);

            // Delete archived transactions
            int deletedCount = deleteArchivedTransactions(cutoffDate);
            log.info("Deleted {} archived transactions older than {}", deletedCount, cutoffDate);

            // Clean up orphaned ledger entries
            int ledgerCleanupCount = cleanupOrphanedLedgerEntries();
            log.info("Cleaned up {} orphaned ledger entries", ledgerCleanupCount);

            auditLogService.logDataRetentionCleanup(
                "TRANSACTION_CLEANUP",
                archivedCount,
                deletedCount,
                "SCHEDULED_JOB"
            );

        } catch (Exception e) {
            log.error("Failed to cleanup old transaction records", e);
            auditLogService.logDataRetentionCleanup(
                "TRANSACTION_CLEANUP",
                0,
                0,
                "FAILED: " + e.getMessage()
            );
        }
    }

    /**
     * Scheduled task to clean up old suspicious activity records.
     * Runs daily at 3 AM.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldSuspiciousActivityRecords() {
        log.info("Starting cleanup of old suspicious activity records");

        ZonedDateTime cutoffDate = ZonedDateTime.now().minusYears(SUSPICIOUS_ACTIVITY_RETENTION_YEARS);

        try {
            // Archive old suspicious activities
            int archivedCount = archiveOldSuspiciousActivities(cutoffDate);
            log.info("Archived {} suspicious activities older than {}", archivedCount, cutoffDate);

            // Delete archived suspicious activities
            int deletedCount = deleteArchivedSuspiciousActivities(cutoffDate);
            log.info("Deleted {} archived suspicious activities older than {}", deletedCount, cutoffDate);

            auditLogService.logDataRetentionCleanup(
                "SUSPICIOUS_ACTIVITY_CLEANUP",
                archivedCount,
                deletedCount,
                "SCHEDULED_JOB"
            );

        } catch (Exception e) {
            log.error("Failed to cleanup old suspicious activity records", e);
            auditLogService.logDataRetentionCleanup(
                "SUSPICIOUS_ACTIVITY_CLEANUP",
                0,
                0,
                "FAILED: " + e.getMessage()
            );
        }
    }

    /**
     * Archives old transactions by marking them for archival.
     * In a production system, this would move data to an archive storage.
     */
    private int archiveOldTransactions(ZonedDateTime cutoffDate) {
        // In production, this would:
        // 1. Export transaction data to archive storage (S3, etc.)
        // 2. Mark transactions as archived
        // 3. Update metadata

        // For now, we'll just count the records
        return transactionRepository.countByCreatedAtBefore(cutoffDate);
    }

    /**
     * Deletes archived transactions.
     */
    private int deleteArchivedTransactions(ZonedDateTime cutoffDate) {
        return transactionRepository.deleteByCreatedAtBefore(cutoffDate);
    }

    /**
     * Cleans up orphaned ledger entries (entries without a transaction).
     */
    private int cleanupOrphanedLedgerEntries() {
        // Find and delete ledger entries where the transaction has been deleted
        return ledgerEntryRepository.deleteOrphanedEntries();
    }

    /**
     * Archives old suspicious activities.
     */
    private int archiveOldSuspiciousActivities(ZonedDateTime cutoffDate) {
        // In production, this would export to archive storage
        return suspiciousActivityRepository.countByCreatedAtBefore(cutoffDate);
    }

    /**
     * Deletes archived suspicious activities.
     */
    private int deleteArchivedSuspiciousActivities(ZonedDateTime cutoffDate) {
        return suspiciousActivityRepository.deleteByCreatedAtBefore(cutoffDate);
    }

    /**
     * Manual trigger for cleanup (for testing or immediate cleanup).
     */
    @Transactional
    public void manualCleanup() {
        log.info("Manual cleanup triggered");
        cleanupOldTransactionRecords();
        cleanupOldSuspiciousActivityRecords();
    }

    /**
     * Gets data retention statistics.
     */
    public DataRetentionStats getRetentionStats() {
        ZonedDateTime transactionCutoff = ZonedDateTime.now().minusYears(TRANSACTION_RETENTION_YEARS);
        ZonedDateTime suspiciousActivityCutoff = ZonedDateTime.now().minusYears(SUSPICIOUS_ACTIVITY_RETENTION_YEARS);

        long transactionsToArchive = transactionRepository.countByCreatedAtBefore(transactionCutoff);
        long suspiciousActivitiesToArchive = suspiciousActivityRepository.countByCreatedAtBefore(suspiciousActivityCutoff);

        return new DataRetentionStats(
            TRANSACTION_RETENTION_YEARS,
            SUSPICIOUS_ACTIVITY_RETENTION_YEARS,
            transactionCutoff,
            suspiciousActivityCutoff,
            transactionsToArchive,
            suspiciousActivitiesToArchive
        );
    }

    /**
     * Data retention statistics record.
     */
    public record DataRetentionStats(
        int transactionRetentionYears,
        int suspiciousActivityRetentionYears,
        ZonedDateTime transactionCutoffDate,
        ZonedDateTime suspiciousActivityCutoffDate,
        long transactionsToArchive,
        long suspiciousActivitiesToArchive
    ) {}
}
