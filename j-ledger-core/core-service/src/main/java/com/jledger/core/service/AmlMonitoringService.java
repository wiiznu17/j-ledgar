package com.jledger.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.core.domain.SuspiciousActivity;
import com.jledger.core.domain.SuspiciousActivityStatus;
import com.jledger.core.domain.SuspiciousActivityType;
import com.jledger.core.repository.TransactionRepository;
import com.jledger.core.repository.SuspiciousActivityRepository;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmlMonitoringService {

    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    private static final BigDecimal LARGE_TRANSACTION_THRESHOLD = new BigDecimal("100000");
    private static final int HIGH_FREQUENCY_THRESHOLD = 10;
    private static final int MULTIPLE_RECIPIENTS_THRESHOLD = 5;

    @Transactional
    public void checkTransactionForSuspiciousActivity(
        UUID userId,
        BigDecimal amount,
        UUID transferId,
        UUID toAccountId
    ) {
        List<SuspiciousActivityDetection> detections = detectSuspiciousActivities(
            userId,
            amount,
            toAccountId
        );

        if (!detections.isEmpty()) {
            for (SuspiciousActivityDetection detection : detections) {
                SuspiciousActivity activity = SuspiciousActivity.builder()
                    .userId(userId)
                    .transferId(transferId)
                    .activityType(detection.type)
                    .status(SuspiciousActivityStatus.FLAGGED)
                    .amount(amount)
                    .description(detection.description)
                    .riskScore(detection.riskScore)
                    .metadata(buildMetadata(detection, transferId, toAccountId))
                    .build();

                suspiciousActivityRepository.save(activity);
                log.warn("Suspicious activity detected: userId={}, type={}, riskScore={}",
                    userId, detection.type, detection.riskScore);
            }
        }
    }

    private List<SuspiciousActivityDetection> detectSuspiciousActivities(
        UUID userId,
        BigDecimal amount,
        UUID toAccountId
    ) {
        List<SuspiciousActivityDetection> detections = new java.util.ArrayList<>();

        // Rule 1: Large transaction alert (> 100,000 THB)
        if (amount.compareTo(LARGE_TRANSACTION_THRESHOLD) > 0) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.LARGE_TRANSACTION,
                String.format("Transaction amount %s THB exceeds 100,000 THB threshold", amount),
                60
            ));
        }

        // Rule 2: High-frequency check (> 10 transactions in 1 hour)
        ZonedDateTime oneHourAgo = ZonedDateTime.now().minusHours(1);
        long recentTransfers = transactionRepository.countByFromAccountIdAndCreatedAtAfter(
            userId,
            oneHourAgo
        );

        if (recentTransfers > HIGH_FREQUENCY_THRESHOLD) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.HIGH_FREQUENCY,
                String.format("%d transactions in the last hour (potential smurfing)", recentTransfers),
                70
            ));
        }

        // Rule 3: Round number check (e.g., 50,000, 100,000)
        if (isRoundNumber(amount) && amount.compareTo(new BigDecimal("50000")) >= 0) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.ROUND_NUMBER,
                String.format("Round number transaction %s THB (potential structuring)", amount),
                40
            ));
        }

        // Rule 4: Multiple recipients check (> 5 different recipients in 1 day)
        ZonedDateTime oneDayAgo = ZonedDateTime.now().minusDays(1);
        List<UUID> uniqueRecipients = transactionRepository.findDistinctToAccountIdsByFromAccountIdAndCreatedAtAfter(
            userId,
            oneDayAgo
        );

        if (uniqueRecipients.size() > MULTIPLE_RECIPIENTS_THRESHOLD) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.MULTIPLE_RECIPIENTS,
                String.format("%d different recipients in the last day", uniqueRecipients.size()),
                50
            ));
        }

        return detections;
    }

    private boolean isRoundNumber(BigDecimal amount) {
        return amount.remainder(new BigDecimal("10000")).compareTo(BigDecimal.ZERO) == 0;
    }

    private String buildMetadata(
        SuspiciousActivityDetection detection,
        UUID transferId,
        UUID toAccountId
    ) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("transferId", transferId.toString());
            metadata.put("toAccountId", toAccountId.toString());
            metadata.put("detectedAt", ZonedDateTime.now().toString());
            metadata.put("activityType", detection.type.toString());
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.error("Failed to build metadata", e);
            return "{}";
        }
    }

    @Transactional
    public String reportSuspiciousActivityToAmlo(UUID activityId, String reviewedBy) {
        SuspiciousActivity activity = suspiciousActivityRepository.findById(activityId)
            .orElseThrow(() -> new IllegalArgumentException("Suspicious activity not found"));

        // Generate AMLO reference
        String amloReference = String.format("STR-%d-%s", System.currentTimeMillis(),
            activity.getUserId().toString().substring(0, 8));

        activity.setStatus(SuspiciousActivityStatus.REPORTED_TO_AMLO);
        activity.setReviewedAt(ZonedDateTime.now());
        activity.setReviewedBy(reviewedBy);
        activity.setReportedToAmloAt(ZonedDateTime.now());
        activity.setAmloReference(amloReference);

        suspiciousActivityRepository.save(activity);

        log.info("Suspicious activity reported to AMLO: activityId={}, amloReference={}",
            activityId, amloReference);

        return amloReference;
    }

    public List<SuspiciousActivity> getSuspiciousActivities(UUID userId) {
        return suspiciousActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Records suspicious activity for account takeover detection.
     *
     * @param userId the user ID
     * @param activityType the activity type
     * @param description the description
     * @param transferId the transfer ID (if applicable)
     */
    public void recordSuspiciousActivity(
            UUID userId,
            String activityType,
            String description,
            UUID transferId
    ) {
        SuspiciousActivity activity = SuspiciousActivity.builder()
                .userId(userId)
                .transferId(transferId)
                .activityType(SuspiciousActivityType.valueOf(activityType))
                .status(SuspiciousActivityStatus.FLAGGED)
                .description(description)
                .riskScore(50) // Default risk score for account takeover patterns
                .metadata(buildMetadataForAccountTakeover(activityType, description, transferId))
                .build();

        suspiciousActivityRepository.save(activity);
        log.warn("Suspicious activity recorded for account takeover detection: userId={}, type={}", userId, activityType);
    }

    private String buildMetadataForAccountTakeover(String activityType, String description, UUID transferId) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("activityType", activityType);
            metadata.put("description", description);
            metadata.put("transferId", transferId != null ? transferId.toString() : null);
            metadata.put("detectedAt", ZonedDateTime.now().toString());
            metadata.put("detectionSource", "ACCOUNT_TAKEOVER_DETECTION");
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.error("Failed to build metadata for account takeover detection", e);
            return "{}";
        }
    }

    private static class SuspiciousActivityDetection {
        SuspiciousActivityType type;
        String description;
        int riskScore;

        SuspiciousActivityDetection(SuspiciousActivityType type, String description, int riskScore) {
            this.type = type;
            this.description = description;
            this.riskScore = riskScore;
        }
    }
}
