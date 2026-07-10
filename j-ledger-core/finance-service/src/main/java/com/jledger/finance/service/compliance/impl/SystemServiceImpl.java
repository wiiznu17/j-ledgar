package com.jledger.finance.service.compliance.impl;

import com.jledger.finance.domain.entity.IntegrationOutbox;
import com.jledger.finance.domain.entity.SystemSettings;
import com.jledger.finance.dto.ReconciliationSummary;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import com.jledger.finance.repository.system.SystemSettingsRepository;
import com.jledger.finance.repository.system.IntegrationOutboxRepository;
import com.jledger.finance.service.compliance.SystemService;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RedissonClient;
import org.redisson.api.RBucket;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemServiceImpl implements SystemService {

    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final IntegrationOutboxRepository outboxRepository;
    private final RedissonClient redissonClient;

    private static final String SETTINGS_CACHE_KEY = "system:settings";
    private static final long CACHE_TTL_HOURS = 24;

    @PostConstruct
    public void init() {
        loadSettingsToCache();
    }

    private void loadSettingsToCache() {
        if (systemSettingsRepository.count() == 0) {
            SystemSettings defaultSettings = SystemSettings.builder().build();
            SystemSettings saved = systemSettingsRepository.save(defaultSettings);
            cacheSettings(saved);
        } else {
            SystemSettings settings = systemSettingsRepository.findAll().get(0);
            cacheSettings(settings);
        }
    }

    private void cacheSettings(SystemSettings settings) {
        RBucket<SystemSettings> bucket = redissonClient.getBucket(SETTINGS_CACHE_KEY);
        bucket.set(settings, CACHE_TTL_HOURS, TimeUnit.HOURS);
    }

    private SystemSettings getCachedSettings() {
        RBucket<SystemSettings> bucket = redissonClient.getBucket(SETTINGS_CACHE_KEY);
        SystemSettings settings = bucket.get();
        if (settings == null) {
            loadSettingsToCache();
            settings = bucket.get();
        }
        return settings;
    }

    private void invalidateCache() {
        RBucket<SystemSettings> bucket = redissonClient.getBucket(SETTINGS_CACHE_KEY);
        bucket.delete();
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationSummary reconcile() {
        BigDecimal totalAccountBalances = accountRepository.getSumOfAllBalances();
        BigDecimal totalCredits = ledgerEntryRepository.sumAmountByEntryType("CREDIT");
        BigDecimal totalDebits = ledgerEntryRepository.sumAmountByEntryType("DEBIT");

        return ReconciliationSummary.builder()
                .totalAccountBalances(totalAccountBalances)
                .totalCredits(totalCredits)
                .totalDebits(totalDebits)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettings getSystemSettings() {
        return getCachedSettings();
    }

    @Override
    @Transactional
    public SystemSettings updateSystemSettings(SystemSettings settings) {
        SystemSettings existing = getCachedSettings();
        if (settings.getSystemName() != null) existing.setSystemName(settings.getSystemName());
        if (settings.getCompanyName() != null) existing.setCompanyName(settings.getCompanyName());
        if (settings.getSupportEmail() != null) existing.setSupportEmail(settings.getSupportEmail());
        if (settings.getSupportPhone() != null) existing.setSupportPhone(settings.getSupportPhone());
        if (settings.getDefaultCurrency() != null) existing.setDefaultCurrency(settings.getDefaultCurrency());
        if (settings.getBusinessHoursStart() != null) existing.setBusinessHoursStart(settings.getBusinessHoursStart());
        if (settings.getBusinessHoursEnd() != null) existing.setBusinessHoursEnd(settings.getBusinessHoursEnd());
        if (settings.getEmailNotificationsEnabled() != null) existing.setEmailNotificationsEnabled(settings.getEmailNotificationsEnabled());
        if (settings.getSmsNotificationsEnabled() != null) existing.setSmsNotificationsEnabled(settings.getSmsNotificationsEnabled());
        if (settings.getKycRequired() != null) existing.setKycRequired(settings.getKycRequired());
        if (settings.getTwoFactorAuthRequired() != null) existing.setTwoFactorAuthRequired(settings.getTwoFactorAuthRequired());
        if (settings.getDefaultLanguage() != null) existing.setDefaultLanguage(settings.getDefaultLanguage());
        if (settings.getTimezone() != null) existing.setTimezone(settings.getTimezone());
        if (settings.getSessionTimeoutMinutes() != null) existing.setSessionTimeoutMinutes(settings.getSessionTimeoutMinutes());
        if (settings.getRegistrationMode() != null) existing.setRegistrationMode(settings.getRegistrationMode());
        if (settings.getMerchantFeeRate() != null) existing.setMerchantFeeRate(settings.getMerchantFeeRate());
        if (settings.getVatRate() != null) existing.setVatRate(settings.getVatRate());
        if (settings.getMinMerchantPayment() != null) existing.setMinMerchantPayment(settings.getMinMerchantPayment());
        if (settings.getMinP2pTransfer() != null) existing.setMinP2pTransfer(settings.getMinP2pTransfer());
        
        if (settings.getTransferFeeFixed() != null) existing.setTransferFeeFixed(settings.getTransferFeeFixed());
        if (settings.getTransferFeePercentage() != null) existing.setTransferFeePercentage(settings.getTransferFeePercentage());
        if (settings.getWithdrawalFeeFixed() != null) existing.setWithdrawalFeeFixed(settings.getWithdrawalFeeFixed());
        if (settings.getWithdrawalFeePercentage() != null) existing.setWithdrawalFeePercentage(settings.getWithdrawalFeePercentage());
        if (settings.getBillPaymentFeeFixed() != null) existing.setBillPaymentFeeFixed(settings.getBillPaymentFeeFixed());
        if (settings.getBillPaymentFeePercentage() != null) existing.setBillPaymentFeePercentage(settings.getBillPaymentFeePercentage());
        
        if (settings.getDailyTransactionLimit() != null) existing.setDailyTransactionLimit(settings.getDailyTransactionLimit());
        if (settings.getMonthlyTransactionLimit() != null) existing.setMonthlyTransactionLimit(settings.getMonthlyTransactionLimit());
        if (settings.getPerTransactionLimit() != null) existing.setPerTransactionLimit(settings.getPerTransactionLimit());
        if (settings.getWalletBalanceLimit() != null) existing.setWalletBalanceLimit(settings.getWalletBalanceLimit());
        if (settings.getDailyTopUpLimit() != null) existing.setDailyTopUpLimit(settings.getDailyTopUpLimit());

        SystemSettings updated = systemSettingsRepository.save(existing);
        invalidateCache();
        cacheSettings(updated);
        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFeeConfiguration() {
        SystemSettings cachedSettings = getCachedSettings();
        Map<String, Object> fees = new HashMap<>();
        fees.put("transfer", Map.of(
            "fixed", cachedSettings.getTransferFeeFixed(),
            "percentage", cachedSettings.getTransferFeePercentage()
        ));
        fees.put("topUp", Map.of(
            "fixed", cachedSettings.getTopUpFeeFixed(),
            "percentage", cachedSettings.getTopUpFeePercentage()
        ));
        fees.put("billPayment", Map.of(
            "fixed", cachedSettings.getBillPaymentFeeFixed(),
            "percentage", cachedSettings.getBillPaymentFeePercentage()
        ));
        fees.put("withdrawal", Map.of(
            "fixed", cachedSettings.getWithdrawalFeeFixed(),
            "percentage", cachedSettings.getWithdrawalFeePercentage()
        ));
        fees.put("merchantFeeRate", cachedSettings.getMerchantFeeRate());
        fees.put("vatRate", cachedSettings.getVatRate());
        fees.put("minimumFee", cachedSettings.getMinimumFee());
        return fees;
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> updateFeeConfiguration(Map<String, Object> fees) {
        SystemSettings cachedSettings = getCachedSettings();
        if (fees.containsKey("transfer")) {
            Map<String, Object> transfer = (Map<String, Object>) fees.get("transfer");
            if (transfer.containsKey("fixed")) cachedSettings.setTransferFeeFixed(new BigDecimal(transfer.get("fixed").toString()));
            if (transfer.containsKey("percentage")) cachedSettings.setTransferFeePercentage(new BigDecimal(transfer.get("percentage").toString()));
        }
        if (fees.containsKey("topUp")) {
            Map<String, Object> topUp = (Map<String, Object>) fees.get("topUp");
            if (topUp.containsKey("fixed")) cachedSettings.setTopUpFeeFixed(new BigDecimal(topUp.get("fixed").toString()));
            if (topUp.containsKey("percentage")) cachedSettings.setTopUpFeePercentage(new BigDecimal(topUp.get("percentage").toString()));
        }
        if (fees.containsKey("billPayment")) {
            Map<String, Object> billPayment = (Map<String, Object>) fees.get("billPayment");
            if (billPayment.containsKey("fixed")) cachedSettings.setBillPaymentFeeFixed(new BigDecimal(billPayment.get("fixed").toString()));
            if (billPayment.containsKey("percentage")) cachedSettings.setBillPaymentFeePercentage(new BigDecimal(billPayment.get("percentage").toString()));
        }
        if (fees.containsKey("withdrawal")) {
            Map<String, Object> withdrawal = (Map<String, Object>) fees.get("withdrawal");
            if (withdrawal.containsKey("fixed")) cachedSettings.setWithdrawalFeeFixed(new BigDecimal(withdrawal.get("fixed").toString()));
            if (withdrawal.containsKey("percentage")) cachedSettings.setWithdrawalFeePercentage(new BigDecimal(withdrawal.get("percentage").toString()));
        }
        if (fees.containsKey("minimumFee")) cachedSettings.setMinimumFee(new BigDecimal(fees.get("minimumFee").toString()));

        SystemSettings updated = systemSettingsRepository.save(cachedSettings);
        invalidateCache();
        cacheSettings(updated);
        return getFeeConfiguration();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getLimitConfiguration() {
        SystemSettings cachedSettings = getCachedSettings();
        Map<String, Object> limits = new HashMap<>();
        limits.put("dailyTransactionLimit", cachedSettings.getDailyTransactionLimit());
        limits.put("monthlyTransactionLimit", cachedSettings.getMonthlyTransactionLimit());
        limits.put("perTransactionLimit", cachedSettings.getPerTransactionLimit());
        limits.put("walletBalanceLimit", cachedSettings.getWalletBalanceLimit());
        limits.put("dailyTopUpLimit", cachedSettings.getDailyTopUpLimit());
        return limits;
    }

    @Override
    @Transactional
    public Map<String, Object> updateLimitConfiguration(Map<String, Object> limits) {
        SystemSettings cachedSettings = getCachedSettings();
        if (limits.containsKey("dailyTransactionLimit")) cachedSettings.setDailyTransactionLimit(new BigDecimal(limits.get("dailyTransactionLimit").toString()));
        if (limits.containsKey("monthlyTransactionLimit")) cachedSettings.setMonthlyTransactionLimit(new BigDecimal(limits.get("monthlyTransactionLimit").toString()));
        if (limits.containsKey("perTransactionLimit")) cachedSettings.setPerTransactionLimit(new BigDecimal(limits.get("perTransactionLimit").toString()));
        if (limits.containsKey("walletBalanceLimit")) cachedSettings.setWalletBalanceLimit(new BigDecimal(limits.get("walletBalanceLimit").toString()));
        if (limits.containsKey("dailyTopUpLimit")) cachedSettings.setDailyTopUpLimit(new BigDecimal(limits.get("dailyTopUpLimit").toString()));

        SystemSettings updated = systemSettingsRepository.save(cachedSettings);
        invalidateCache();
        cacheSettings(updated);
        return getLimitConfiguration();
    }

    @Override
    @Transactional
    public void retryOutboxEvent(java.util.UUID id) {
        IntegrationOutbox event = outboxRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outbox event not found"));
        
        event.setStatus("PENDING");
        event.setRetryCount(event.getRetryCount() + 1);
        event.setLastError(null);
        event.setUpdatedAt(java.time.ZonedDateTime.now());
        
        outboxRepository.save(event);
    }
}
