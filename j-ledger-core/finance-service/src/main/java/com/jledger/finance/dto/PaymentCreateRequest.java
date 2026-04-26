package com.jledger.finance.dto;

import com.jledger.finance.domain.PaymentTransaction;
import java.math.BigDecimal;
import java.util.UUID;

public record PaymentCreateRequest(
    UUID accountId,
    String referenceId,
    BigDecimal amount,
    PaymentTransaction.Type type
) {}
