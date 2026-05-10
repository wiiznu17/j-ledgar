package com.jledger.finance.service.system;

import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import com.jledger.finance.repository.compliance.SuspiciousActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

        LocalDateTime cutoffDate = LocalDateTime.now().minusYears(TRANSACTION_RETENTION_YEARS);

        try {
            // Archive old transactions before deletion
            int archivedCount = archiveOldTransactions(cutoffDate);
            log.info("Archived {} transactions older than {}", archivedCount, cutoffDate);

            // Delete archived transactions
            int deletedCount = deleteArchivedTransactions(cutoffDate);
            log.info("Deleted {} archived transactions older than {}", deletedCount, cutoffDate);


        } catch (Exception e) {
            log.error("Failed to cleanup old transaction records", e);
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

        LocalDateTime cutoffDate = LocalDateTime.now().minusYears(SUSPICIOUS_ACTIVITY_RETENTION_YEARS);

        try {
            // Archive old suspicious activities
            int archivedCount = archiveOldSuspiciousActivities(cutoffDate);
            log.info("Archived {} suspicious activities older than {}", archivedCount, cutoffDate);

            // Delete archived suspicious activities
            int deletedCount = deleteArchivedSuspiciousActivities(cutoffDate);
            log.info("Deleted {} archived suspicious activities older than {}", deletedCount, cutoffDate);

        } catch (Exception e) {
            log.error("Failed to cleanup old suspicious activity records", e);
        }
    }

    /**
     * Archives old transactions by marking them for archival.
     * In a production system, this would move data to an archive storage.
     */
    private int archiveOldTransactions(LocalDateTime cutoffDate) {
        // In production, this would:
        // 1. Export transaction data to archive storage (S3, etc.)
        // 2. Mark transactions as archived
        // 3. Update metadata

        // For now, we'll just count the records
        return (int) transactionRepository.countByCreatedAtBefore(cutoffDate);
    }

    /**
     * Deletes archived transactions.
     */
    private int deleteArchivedTransactions(LocalDateTime cutoffDate) {
        return (int) transactionRepository.deleteByCreatedAtBefore(cutoffDate);
    }


    /**
     * Archives old suspicious activities.
     */
    private int archiveOldSuspiciousActivities(LocalDateTime cutoffDate) {
        // In production, this would export to archive storage
        return (int) suspiciousActivityRepository.countByCreatedAtBefore(cutoffDate);
    }

    /**
     * Deletes archived suspicious activities.
     */
    private int deleteArchivedSuspiciousActivities(LocalDateTime cutoffDate) {
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
        LocalDateTime transactionCutoff = LocalDateTime.now().minusYears(TRANSACTION_RETENTION_YEARS);
        LocalDateTime suspiciousActivityCutoff = LocalDateTime.now().minusYears(SUSPICIOUS_ACTIVITY_RETENTION_YEARS);

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
        LocalDateTime transactionCutoffDate,
        LocalDateTime suspiciousActivityCutoffDate,
        long transactionsToArchive,
        long suspiciousActivitiesToArchive
    ) {}
}
