package com.jledger.finance.service.compliance.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.SuspiciousActivity;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.SuspiciousActivityStatus;
import com.jledger.finance.domain.enums.SuspiciousActivityType;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.compliance.SuspiciousActivityRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.service.compliance.AmlMonitoringService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
public class AmlMonitoringServiceImpl implements AmlMonitoringService {

    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final ObjectMapper objectMapper;

    private static final BigDecimal LARGE_TRANSACTION_THRESHOLD = new BigDecimal("100000");
    private static final int HIGH_FREQUENCY_THRESHOLD = 10;
    private static final int MULTIPLE_RECIPIENTS_THRESHOLD = 5;

    @Override
    @Transactional
    public void checkTransactionForSuspiciousActivity(
        Long walletId,
        BigDecimal amount,
        UUID transferId,
        Long toWalletId
    ) {
        List<SuspiciousActivityDetection> detections = detectSuspiciousActivities(
            walletId,
            amount,
            toWalletId
        );

        if (!detections.isEmpty()) {
            UUID userId = UUID.randomUUID();
            try {
                Wallet wallet = walletRepository.findById(walletId).orElse(null);
                if (wallet != null && wallet.getUserId() != null) {
                    userId = UUID.fromString(wallet.getUserId());
                }
            } catch (Exception e) {
                log.error("Failed to map walletId={} to userId for AML check", walletId, e);
            }

            for (SuspiciousActivityDetection detection : detections) {
                SuspiciousActivity activity = SuspiciousActivity.builder()
                    .userId(userId)
                    .transferId(transferId)
                    .activityType(detection.type)
                    .status(SuspiciousActivityStatus.FLAGGED)
                    .amount(amount)
                    .description(detection.description)
                    .riskScore(detection.riskScore)
                    .metadata(buildMetadata(detection, transferId, toWalletId))
                    .build();

                suspiciousActivityRepository.save(activity);
                log.warn("Suspicious activity detected: walletId={}, type={}, riskScore={}",
                    walletId, detection.type, detection.riskScore);
            }
        }
    }

    private List<SuspiciousActivityDetection> detectSuspiciousActivities(
        Long walletId,
        BigDecimal amount,
        Long toWalletId
    ) {
        List<SuspiciousActivityDetection> detections = new java.util.ArrayList<>();

        if (amount.compareTo(LARGE_TRANSACTION_THRESHOLD) > 0) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.LARGE_TRANSACTION,
                String.format("Transaction amount %s THB exceeds 100,000 THB threshold", amount),
                60
            ));
        }

        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentTransfers = transactionRepository.countByFromWalletIdAndCreatedAtAfter(
            walletId,
            oneHourAgo
        );

        if (recentTransfers > HIGH_FREQUENCY_THRESHOLD) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.HIGH_FREQUENCY,
                String.format("%d transactions in the last hour (potential smurfing)", recentTransfers),
                70
            ));
        }

        if (isRoundNumber(amount) && amount.compareTo(new BigDecimal("50000")) >= 0) {
            detections.add(new SuspiciousActivityDetection(
                SuspiciousActivityType.ROUND_NUMBER,
                String.format("Round number transaction %s THB (potential structuring)", amount),
                40
            ));
        }

        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        List<Long> uniqueRecipients = transactionRepository.findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(
            walletId,
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
        Long toWalletId
    ) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("transferId", transferId != null ? transferId.toString() : null);
            metadata.put("toWalletId", toWalletId != null ? toWalletId.toString() : null);
            metadata.put("detectedAt", LocalDateTime.now().toString());
            metadata.put("activityType", detection.type.toString());
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.error("Failed to build metadata", e);
            return "{}";
        }
    }

    @Override
    @Transactional
    public String reportSuspiciousActivityToAmlo(UUID activityId, String reviewedBy) {
        SuspiciousActivity activity = suspiciousActivityRepository.findById(activityId)
            .orElseThrow(() -> new IllegalArgumentException("Suspicious activity not found"));

        String amloReference = String.format("STR-%d-%s", System.currentTimeMillis(),
            activity.getUserId().toString().substring(0, 8));

        activity.setStatus(SuspiciousActivityStatus.REPORTED_TO_AMLO);
        activity.setReviewedAt(LocalDateTime.now());
        activity.setReviewedBy(reviewedBy);
        activity.setReportedToAmloAt(LocalDateTime.now());
        activity.setAmloReference(amloReference);

        suspiciousActivityRepository.save(activity);

        log.info("Suspicious activity reported to AMLO: activityId={}, amloReference={}",
            activityId, amloReference);

        return amloReference;
    }

    @Override
    public List<SuspiciousActivity> getSuspiciousActivities(UUID userId) {
        return suspiciousActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public org.springframework.data.domain.Page<SuspiciousActivity> getAllSuspiciousActivities(org.springframework.data.domain.Pageable pageable) {
        return suspiciousActivityRepository.findAll(pageable);
    }

    @Override
    public org.springframework.data.domain.Page<SuspiciousActivity> getAllSuspiciousActivitiesWithFilters(
        SuspiciousActivityStatus status,
        UUID userId,
        SuspiciousActivityType activityType,
        Integer minRiskScore,
        Integer maxRiskScore,
        org.springframework.data.domain.Pageable pageable
    ) {
        return suspiciousActivityRepository.findAllWithFilters(
            status,
            userId,
            activityType,
            minRiskScore,
            maxRiskScore,
            pageable
        );
    }

    @Override
    @Transactional
    public void updateSuspiciousActivityStatus(UUID activityId, SuspiciousActivityStatus status, String reviewedBy, String description) {
        SuspiciousActivity activity = suspiciousActivityRepository.findById(activityId)
            .orElseThrow(() -> new IllegalArgumentException("Suspicious activity not found"));

        activity.setStatus(status);
        activity.setReviewedAt(LocalDateTime.now());
        activity.setReviewedBy(reviewedBy);
        if (description != null) {
            activity.setDescription(activity.getDescription() + " | Review: " + description);
        }

        suspiciousActivityRepository.save(activity);
        log.info("Suspicious activity status updated: activityId={}, status={}", activityId, status);
    }

    @Override
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
                .riskScore(50)
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
            metadata.put("detectedAt", LocalDateTime.now().toString());
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
