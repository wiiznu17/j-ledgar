package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.TransactionLimit;
import com.jledger.finance.domain.enums.TransactionLimitType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TransactionLimitService {
    void checkTransactionLimits(UUID accountId, BigDecimal amount);
    void recordTransaction(UUID accountId, BigDecimal amount);
    TransactionLimit updateLimit(UUID accountId, TransactionLimitType limitType, BigDecimal newLimit);
    List<TransactionLimit> getAccountLimits(UUID accountId);
}
