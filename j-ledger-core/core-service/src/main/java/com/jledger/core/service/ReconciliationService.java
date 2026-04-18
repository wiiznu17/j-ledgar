package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.ReconciliationReport;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.ReconciliationReportRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReconciliationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReconciliationService.class);
    private static final UUID SYSTEM_BANK_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String STATUS_MATCHED = "MATCHED";
    private static final String STATUS_DISCREPANCY = "DISCREPANCY";

    private final AccountRepository accountRepository;
    private final ReconciliationReportRepository reconciliationReportRepository;

    /**
     * Nightly reconciliation job runs daily at midnight.
     * Reconciles data for the previous day.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void runNightlyReconciliation() {
        LocalDate reportDate = LocalDate.now().minusDays(1);
        LOGGER.info("Starting nightly reconciliation for date: {}", reportDate);
        executeReconciliation(reportDate);
    }

    /**
     * Executes the mathematical reconciliation logic:
     * System Assets (System Account Balance) + User Liabilities (Sum of all other accounts) = 0
     */
    @Transactional
    public ReconciliationReport executeReconciliation(LocalDate reportDate) {
        BigDecimal systemAssets = accountRepository.findById(SYSTEM_BANK_ACCOUNT_ID)
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);

        BigDecimal userLiabilities = accountRepository.getSumOfBalancesExcluding(SYSTEM_BANK_ACCOUNT_ID);
        
        // Discrepancy = Assets + Liabilities (Should be zero in a double-entry system)
        BigDecimal totalSum = systemAssets.add(userLiabilities);
        String status = totalSum.compareTo(BigDecimal.ZERO) == 0 ? STATUS_MATCHED : STATUS_DISCREPANCY;

        ReconciliationReport report = reconciliationReportRepository.findByReportDate(reportDate)
                .orElse(ReconciliationReport.builder().reportDate(reportDate).build());

        report.setTotalSystemAssets(systemAssets);
        report.setTotalUserLiabilities(userLiabilities);
        report.setDiscrepancy(totalSum);
        report.setStatus(status);

        ReconciliationReport savedReport = reconciliationReportRepository.save(report);
        
        if (STATUS_DISCREPANCY.equals(status)) {
            LOGGER.error("CRITICAL: Reconciliation DISCREPANCY detected for {}: Discrepancy={}", reportDate, totalSum);
        } else {
            LOGGER.info("Reconciliation MATCHED for {}: Assets={}, Liabilities={}", reportDate, systemAssets, userLiabilities);
        }
        
        return savedReport;
    }

    public List<ReconciliationReport> getAllReports() {
        return reconciliationReportRepository.findAll();
    }
}
