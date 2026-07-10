package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.SuspiciousActivity;
import com.jledger.finance.domain.enums.SuspiciousActivityStatus;
import com.jledger.finance.domain.enums.SuspiciousActivityType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AmlMonitoringService {
    void checkTransactionForSuspiciousActivity(Long walletId, BigDecimal amount, UUID transferId, Long toWalletId);
    String reportSuspiciousActivityToAmlo(UUID activityId, String reviewedBy);
    List<SuspiciousActivity> getSuspiciousActivities(UUID userId);
    org.springframework.data.domain.Page<SuspiciousActivity> getAllSuspiciousActivities(org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<SuspiciousActivity> getAllSuspiciousActivitiesWithFilters(
        SuspiciousActivityStatus status,
        UUID userId,
        SuspiciousActivityType activityType,
        Integer minRiskScore,
        Integer maxRiskScore,
        org.springframework.data.domain.Pageable pageable
    );
    void updateSuspiciousActivityStatus(UUID activityId, SuspiciousActivityStatus status, String reviewedBy, String description);
    void recordSuspiciousActivity(UUID userId, String activityType, String description, UUID transferId);
}
