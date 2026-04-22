package com.jledger.core.service;

import com.jledger.core.domain.SuspiciousActivity;
import com.jledger.core.domain.SuspiciousActivityStatus;
import com.jledger.core.domain.SuspiciousActivityType;
import com.jledger.core.domain.Transaction;
import com.jledger.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Fraud pattern detection service.
 * Detects sophisticated fraud patterns beyond basic AML rules.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FraudPatternDetectionService {

    private final TransactionRepository transactionRepository;
    private final AmlMonitoringService amlMonitoringService;

    private static final int STRUCTURING_THRESHOLD = 5;
    private static final BigDecimal STRUCTURING_AMOUNT_MAX = new BigDecimal("99000");
    private static final int LAYERING_THRESHOLD = 3;
    private static final int INTEGRATION_THRESHOLD = 2;
    private static final int CASH_OUT_THRESHOLD = 3;

    /**
     * Detects structuring patterns (smurfing).
     * Multiple transactions just below reporting thresholds.
     *
     * @param accountId the account ID
     * @return list of detected structuring patterns
     */
    public List<FraudPattern> detectStructuring(UUID accountId) {
        List<FraudPattern> patterns = new ArrayList<>();

        ZonedDateTime oneDayAgo = ZonedDateTime.now().minusDays(1);
        List<Transaction> recentTransactions =
            transactionRepository.findByFromAccountIdAndCreatedAtAfter(accountId, oneDayAgo);

        // Check for transactions just below 100,000 THB threshold
        List<Transaction> nearThresholdTransactions = recentTransactions.stream()
            .filter(t -> t.getAmount().compareTo(STRUCTURING_AMOUNT_MAX) <= 0)
            .filter(t -> t.getAmount().compareTo(STRUCTURING_AMOUNT_MAX.subtract(new BigDecimal("5000"))) >= 0)
            .toList();

        if (nearThresholdTransactions.size() >= STRUCTURING_THRESHOLD) {
            BigDecimal totalAmount = nearThresholdTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            patterns.add(new FraudPattern(
                "STRUCTURING",
                String.format("Potential structuring: %d transactions near 100,000 THB threshold, total: %s",
                    nearThresholdTransactions.size(), totalAmount),
                70,
                Map.of("transactionCount", nearThresholdTransactions.size(), "totalAmount", totalAmount.toString())
            ));
        }

        return patterns;
    }

    /**
     * Detects layering patterns.
     * Multiple transfers between accounts to obscure the source.
     *
     * @param accountId the account ID
     * @return list of detected layering patterns
     */
    public List<FraudPattern> detectLayering(UUID accountId) {
        List<FraudPattern> patterns = new ArrayList<>();

        ZonedDateTime oneDayAgo = ZonedDateTime.now().minusDays(1);
        List<Transaction> recentTransactions =
            transactionRepository.findByFromAccountIdAndCreatedAtAfter(accountId, oneDayAgo);

        // Check for transfers to multiple different accounts
        List<UUID> uniqueRecipients = recentTransactions.stream()
            .map(Transaction::getToAccountId)
            .distinct()
            .toList();

        if (uniqueRecipients.size() >= LAYERING_THRESHOLD) {
            patterns.add(new FraudPattern(
                "LAYERING",
                String.format("Potential layering: Transfers to %d different accounts", uniqueRecipients.size()),
                60,
                Map.of("uniqueRecipients", uniqueRecipients.size())
            ));
        }

        return patterns;
    }

    /**
     * Detects integration patterns.
     * Moving funds to seemingly legitimate accounts.
     *
     * @param accountId the account ID
     * @return list of detected integration patterns
     */
    public List<FraudPattern> detectIntegration(UUID accountId) {
        List<FraudPattern> patterns = new ArrayList<>();

        ZonedDateTime oneWeekAgo = ZonedDateTime.now().minusDays(7);
        List<Transaction> recentTransactions =
            transactionRepository.findByFromAccountIdAndCreatedAtAfter(accountId, oneWeekAgo);

        // Check for large transfers followed by inactivity
        // This is a simplified pattern - production would be more sophisticated
        if (recentTransactions.size() >= INTEGRATION_THRESHOLD) {
            patterns.add(new FraudPattern(
                "INTEGRATION",
                "Potential integration pattern detected",
                50,
                Map.of("transactionCount", recentTransactions.size())
            ));
        }

        return patterns;
    }

    /**
     * Detects cash-out patterns.
     * Rapid withdrawal of funds after deposit.
     *
     * @param accountId the account ID
     * @return list of detected cash-out patterns
     */
    public List<FraudPattern> detectCashOut(UUID accountId) {
        List<FraudPattern> patterns = new ArrayList<>();

        ZonedDateTime oneDayAgo = ZonedDateTime.now().minusDays(1);
        List<Transaction> recentTransactions =
            transactionRepository.findByFromAccountIdAndCreatedAtAfter(accountId, oneDayAgo);

        // Check for rapid outflow
        if (recentTransactions.size() >= CASH_OUT_THRESHOLD) {
            BigDecimal totalOutflow = recentTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            patterns.add(new FraudPattern(
                "CASH_OUT",
                String.format("Potential cash-out: %s transferred in one day", totalOutflow),
                55,
                Map.of("totalOutflow", totalOutflow.toString())
            ));
        }

        return patterns;
    }

    /**
     * Runs all fraud pattern detection.
     *
     * @param accountId the account ID
     * @return list of all detected fraud patterns
     */
    public List<FraudPattern> detectAllPatterns(UUID accountId) {
        List<FraudPattern> allPatterns = new ArrayList<>();
        
        allPatterns.addAll(detectStructuring(accountId));
        allPatterns.addAll(detectLayering(accountId));
        allPatterns.addAll(detectIntegration(accountId));
        allPatterns.addAll(detectCashOut(accountId));
        
        // Report high-risk patterns to AML
        allPatterns.stream()
            .filter(p -> p.riskScore >= 60)
            .forEach(pattern -> {
                amlMonitoringService.recordSuspiciousActivity(
                    accountId,
                    pattern.type,
                    pattern.description,
                    null
                );
            });
        
        return allPatterns;
    }

    /**
     * Fraud pattern record.
     */
    public record FraudPattern(
        String type,
        String description,
        int riskScore,
        Map<String, Object> metadata
    ) {}
}
