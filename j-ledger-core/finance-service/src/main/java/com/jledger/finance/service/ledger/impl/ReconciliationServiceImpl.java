package com.jledger.finance.service.ledger.impl;

import com.jledger.finance.config.JLedgerProperties;
import com.jledger.finance.service.ledger.ReconciliationService;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.ReconciliationReport;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.ReconciliationReportRepository;
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
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ReconciliationServiceImpl implements ReconciliationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReconciliationServiceImpl.class);
    private static final String STATUS_MATCHED = "MATCHED";
    private static final String STATUS_DISCREPANCY = "DISCREPANCY";
    private static final String RECONCILIATION_LOCK_KEY = "reconciliation:nightly_lock";

    private final AccountRepository accountRepository;
    private final ReconciliationReportRepository reconciliationReportRepository;
    private final RedissonClient redissonClient;
    private final JLedgerProperties jLedgerProperties;

    @Override
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Bangkok")
    public void runNightlyReconciliation() {
        LocalDate reportDate = LocalDate.now(ZoneId.of("Asia/Bangkok")).minusDays(1);
        runLockedReconciliation(reportDate, "Nightly");
    }

    @Override
    public ReconciliationReport runManualReconciliation(LocalDate reportDate) {
        return runLockedReconciliation(reportDate, "Manual");
    }

    private ReconciliationReport runLockedReconciliation(LocalDate reportDate, String triggerSource) {
        RLock lock = redissonClient.getLock(RECONCILIATION_LOCK_KEY);
        boolean acquired = false;
        try {
            acquired = lock.tryLock(0, 60, TimeUnit.SECONDS);
            if (!acquired) {
                LOGGER.info("{} reconciliation for {} skipped — another process is already running it.", triggerSource, reportDate);
                if ("Manual".equals(triggerSource)) {
                    throw new IllegalStateException("A reconciliation process is already in progress.");
                }
                return null;
            }
            LOGGER.info("{} reconciliation lock acquired. Starting for date: {}", triggerSource, reportDate);
            return executeReconciliation(reportDate);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            LOGGER.warn("{} reconciliation interrupted for date: {}", triggerSource, reportDate, ex);
            throw new RuntimeException("Reconciliation interrupted", ex);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    @Transactional
    public ReconciliationReport executeReconciliation(LocalDate reportDate) {
        BigDecimal systemAssets = accountRepository.findById(jLedgerProperties.getSystem().getAccountId())
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);

        BigDecimal userLiabilities = accountRepository.getSumOfBalancesExcluding(jLedgerProperties.getSystem().getAccountId());

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

    @Override
    public List<ReconciliationReport> getAllReports() {
        return reconciliationReportRepository.findAllOrderByDateDesc();
    }
}
