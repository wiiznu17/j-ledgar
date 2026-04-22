package com.jledger.core.service;

import com.jledger.core.domain.TransactionLimit;
import com.jledger.core.domain.TransactionLimitType;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.repository.TransactionLimitRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionLimitService {

    private final TransactionLimitRepository transactionLimitRepository;
    private final TransactionRepository transactionRepository;

    private static final BigDecimal DEFAULT_PER_TRANSACTION_LIMIT = new BigDecimal("500000");
    private static final BigDecimal DEFAULT_DAILY_LIMIT = new BigDecimal("1000000");
    private static final BigDecimal DEFAULT_MONTHLY_LIMIT = new BigDecimal("5000000");

    @Transactional
    public void checkTransactionLimits(UUID accountId, BigDecimal amount) {
        // Check per-transaction limit
        TransactionLimit perTransactionLimit = getOrCreateLimit(accountId, TransactionLimitType.PER_TRANSACTION);
        if (amount.compareTo(perTransactionLimit.getLimitAmount()) > 0) {
            throw new ConflictException(String.format(
                "Transaction amount %s exceeds per-transaction limit %s",
                amount, perTransactionLimit.getLimitAmount()
            ));
        }

        // Check daily limit
        TransactionLimit dailyLimit = getOrCreateLimit(accountId, TransactionLimitType.DAILY);
        if (dailyLimit.getResetDate() != null && ZonedDateTime.now().isAfter(dailyLimit.getResetDate())) {
            // Reset daily limit
            dailyLimit.setCurrentAmount(BigDecimal.ZERO);
            dailyLimit.setResetDate(calculateResetDate(TransactionLimitType.DAILY));
            transactionLimitRepository.save(dailyLimit);
        }

        BigDecimal dailyTotal = dailyLimit.getCurrentAmount() != null ? dailyLimit.getCurrentAmount() : BigDecimal.ZERO;
        if (dailyTotal.add(amount).compareTo(dailyLimit.getLimitAmount()) > 0) {
            throw new ConflictException(String.format(
                "Transaction would exceed daily limit %s (current: %s, attempting: %s)",
                dailyLimit.getLimitAmount(), dailyTotal, amount
            ));
        }

        // Check monthly limit
        TransactionLimit monthlyLimit = getOrCreateLimit(accountId, TransactionLimitType.MONTHLY);
        if (monthlyLimit.getResetDate() != null && ZonedDateTime.now().isAfter(monthlyLimit.getResetDate())) {
            // Reset monthly limit
            monthlyLimit.setCurrentAmount(BigDecimal.ZERO);
            monthlyLimit.setResetDate(calculateResetDate(TransactionLimitType.MONTHLY));
            transactionLimitRepository.save(monthlyLimit);
        }

        BigDecimal monthlyTotal = monthlyLimit.getCurrentAmount() != null ? monthlyLimit.getCurrentAmount() : BigDecimal.ZERO;
        if (monthlyTotal.add(amount).compareTo(monthlyLimit.getLimitAmount()) > 0) {
            throw new ConflictException(String.format(
                "Transaction would exceed monthly limit %s (current: %s, attempting: %s)",
                monthlyLimit.getLimitAmount(), monthlyTotal, amount
            ));
        }
    }

    @Transactional
    public void recordTransaction(UUID accountId, BigDecimal amount) {
        // Update daily limit
        TransactionLimit dailyLimit = getOrCreateLimit(accountId, TransactionLimitType.DAILY);
        BigDecimal dailyCurrent = dailyLimit.getCurrentAmount() != null ? dailyLimit.getCurrentAmount() : BigDecimal.ZERO;
        dailyLimit.setCurrentAmount(dailyCurrent.add(amount));
        transactionLimitRepository.save(dailyLimit);

        // Update monthly limit
        TransactionLimit monthlyLimit = getOrCreateLimit(accountId, TransactionLimitType.MONTHLY);
        BigDecimal monthlyCurrent = monthlyLimit.getCurrentAmount() != null ? monthlyLimit.getCurrentAmount() : BigDecimal.ZERO;
        monthlyLimit.setCurrentAmount(monthlyCurrent.add(amount));
        transactionLimitRepository.save(monthlyLimit);
    }

    private TransactionLimit getOrCreateLimit(UUID accountId, TransactionLimitType limitType) {
        return transactionLimitRepository.findByAccountIdAndLimitType(accountId, limitType)
            .orElseGet(() -> {
                TransactionLimit limit = TransactionLimit.builder()
                    .accountId(accountId)
                    .limitType(limitType)
                    .limitAmount(getDefaultLimit(limitType))
                    .currentAmount(BigDecimal.ZERO)
                    .resetDate(calculateResetDate(limitType))
                    .isActive(true)
                    .build();
                return transactionLimitRepository.save(limit);
            });
    }

    private BigDecimal getDefaultLimit(TransactionLimitType limitType) {
        return switch (limitType) {
            case PER_TRANSACTION -> DEFAULT_PER_TRANSACTION_LIMIT;
            case DAILY -> DEFAULT_DAILY_LIMIT;
            case MONTHLY -> DEFAULT_MONTHLY_LIMIT;
        };
    }

    private ZonedDateTime calculateResetDate(TransactionLimitType limitType) {
        ZonedDateTime now = ZonedDateTime.now();
        return switch (limitType) {
            case DAILY -> now.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            case MONTHLY -> now.plusMonths(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            default -> null;
        };
    }

    @Transactional
    public TransactionLimit updateLimit(UUID accountId, TransactionLimitType limitType, BigDecimal newLimit) {
        TransactionLimit limit = getOrCreateLimit(accountId, limitType);
        limit.setLimitAmount(newLimit);
        return transactionLimitRepository.save(limit);
    }

    public List<TransactionLimit> getAccountLimits(UUID accountId) {
        return transactionLimitRepository.findActiveLimitsByAccountId(accountId);
    }
}
