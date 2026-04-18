package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.ReconciliationReport;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.ReconciliationReportRepository;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ReconciliationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReconciliationService.class);
    private static final UUID SYSTEM_BANK_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String STATUS_MATCHED = "MATCHED";
    private static final String STATUS_DISCREPANCY = "DISCREPANCY";

    /**
     * Distributed lock key — ensures only one pod runs the nightly reconciliation
     * even when multiple instances of the service are deployed (multi-pod).
     */
    private static final String RECONCILIATION_LOCK_KEY = "reconciliation:nightly_lock";

    private final AccountRepository accountRepository;
    private final ReconciliationReportRepository reconciliationReportRepository;
    private final RedissonClient redissonClient;

    /**
     * Nightly reconciliation job runs daily at midnight.
     * A Redisson distributed lock ensures that only one pod executes this
     * in a multi-instance deployment. If another pod already holds the lock,
     * this invocation skips silently to avoid duplicate reports and DB conflicts
     * on the UNIQUE constraint of report_date.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void runNightlyReconciliation() {
        LocalDate reportDate = LocalDate.now().minusDays(1);
        RLock lock = redissonClient.getLock(RECONCILIATION_LOCK_KEY);

        boolean acquired = false;
        try {
            // Try to acquire lock immediately (0 wait). If another pod owns it, skip.
            acquired = lock.tryLock(0, 60, TimeUnit.SECONDS);
            if (!acquired) {
                LOGGER.info("Nightly reconciliation for {} skipped — another pod is already running it.", reportDate);
                return;
            }
            LOGGER.info("Nightly reconciliation lock acquired. Starting for date: {}", reportDate);
            executeReconciliation(reportDate);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Nightly reconciliation interrupted for date: {}", reportDate, ex);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * Executes the mathematical reconciliation logic.
     *
     * <p>Double-entry invariant: System Assets + User Liabilities = 0.
     * The System Bank Account balance is stored as a positive number representing
     * the bank's real cash assets. User account balances are also positive,
     * representing liabilities the system owes to users.
     * In a perfectly balanced ledger: systemAssets = sum(userBalances),
     * so systemAssets - sum(userBalances) = 0. Any deviation is a discrepancy.
     */
    @Transactional
    public ReconciliationReport executeReconciliation(LocalDate reportDate) {
        BigDecimal systemAssets = accountRepository.findById(SYSTEM_BANK_ACCOUNT_ID)
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);

        BigDecimal userLiabilities = accountRepository.getSumOfBalancesExcluding(SYSTEM_BANK_ACCOUNT_ID);

        // Discrepancy = Assets - Liabilities (should be zero in a balanced double-entry ledger)
        BigDecimal discrepancy = systemAssets.subtract(userLiabilities);
        String status = discrepancy.compareTo(BigDecimal.ZERO) == 0 ? STATUS_MATCHED : STATUS_DISCREPANCY;

        ReconciliationReport report = reconciliationReportRepository.findByReportDate(reportDate)
                .orElse(ReconciliationReport.builder().reportDate(reportDate).build());

        report.setTotalSystemAssets(systemAssets);
        report.setTotalUserLiabilities(userLiabilities);
        report.setDiscrepancy(discrepancy);
        report.setStatus(status);

        ReconciliationReport savedReport = reconciliationReportRepository.save(report);

        if (STATUS_DISCREPANCY.equals(status)) {
            LOGGER.error("CRITICAL: Reconciliation DISCREPANCY detected for {}: systemAssets={}, userLiabilities={}, discrepancy={}",
                    reportDate, systemAssets, userLiabilities, discrepancy);
        } else {
            LOGGER.info("Reconciliation MATCHED for {}: Assets={}, Liabilities={}",
                    reportDate, systemAssets, userLiabilities);
        }

        return savedReport;
    }

    public List<ReconciliationReport> getAllReports() {
        return reconciliationReportRepository.findAll();
    }
}
