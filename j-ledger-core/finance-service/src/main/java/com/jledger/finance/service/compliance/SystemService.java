package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.SystemSettings;
import com.jledger.finance.dto.ReconciliationSummary;

import java.util.Map;
import java.util.UUID;

public interface SystemService {
    ReconciliationSummary reconcile();
    SystemSettings getSystemSettings();
    SystemSettings updateSystemSettings(SystemSettings settings);
    Map<String, Object> getFeeConfiguration();
    Map<String, Object> updateFeeConfiguration(Map<String, Object> fees);
    Map<String, Object> getLimitConfiguration();
    Map<String, Object> updateLimitConfiguration(Map<String, Object> limits);
    void retryOutboxEvent(UUID id);
}
